import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { sendEnginemailerEmail } from '@/lib/enginemailer'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, BUCKET_NAME } from '@/lib/r2'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const requestData = {
      ...body,
      status: 'Pending',
      createdAt: Date.now()
    }

    const docRef = await addDoc(collection(db, 'requests'), requestData)
    const newRequest = { _id: docRef.id, ...requestData }

    const adminInbox = process.env.ADMIN_NOTIFICATION_EMAIL || 'asaphmwangi1973@gmail.com'

    const citizenContent = `
      <div style="font-family: sans-serif; color: #14532d;">
        <h2>Muranga County eCitizen Portal</h2>
        <p>We have officially received your service request regarding the <strong>${body.category}</strong> issue at <strong>${body.location}</strong>.</p>
        <p>Your current status is: <strong>Pending</strong>.</p>
        <p>We will notify you by email as progress is made.</p>
      </div>
    `

    const adminContent = `
      <div style="font-family: sans-serif; color: #14532d;">
        <h2>New Citizen Service Request</h2>
        <p>A new issue has been reported on the portal:</p>
        <ul>
          <li><strong>Category:</strong> ${body.category}</li>
          <li><strong>Location:</strong> ${body.location}</li>
          <li><strong>Submitted By:</strong> ${body.userEmail}</li>
          <li><strong>Description:</strong> ${body.description || 'N/A'}</li>
          <li><strong>Status:</strong> Pending</li>
        </ul>
      </div>
    `

    try {
      await Promise.all([
        sendEnginemailerEmail(
          body.userEmail,
          'Received: Muranga County Service Request',
          citizenContent
        ),
        sendEnginemailerEmail(
          adminInbox,
          `New Issue Reported: ${body.category} at ${body.location}`,
          adminContent
        )
      ])
    } catch (emailErr) {
      console.error('Email notification error:', emailErr)
    }

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 })
  } catch (error: any) {
    console.error('Request POST Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const querySnapshot = await getDocs(collection(db, 'requests'))
    let requests: any[] = []

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data()
      let signedImageUrl = ''

      if (data.imageUrl) {
        try {
          let objectKey = data.imageUrl

          if (objectKey.startsWith('http')) {
            const urlObj = new URL(objectKey)
            objectKey = urlObj.pathname.replace(/^\/+/, '')
          }

          objectKey = objectKey.replace(/^mpsrs\//, '')

          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
          })

          signedImageUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
        } catch (err) {
          console.error('Error generating signed URL:', err)
        }
      }

      requests.push({
        _id: docSnap.id,
        ...data,
        imageUrl: signedImageUrl
      })
    }

    if (userId) {
      requests = requests.filter(r => r.userId === userId)
    }

    requests.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json({ success: true, data: requests }, { status: 200 })
  } catch (error: any) {
    console.error('Request GET Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}