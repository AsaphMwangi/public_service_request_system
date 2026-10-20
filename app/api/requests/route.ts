import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'

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

    const authString = Buffer.from(
      `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
    ).toString('base64')

    const emailRes = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Muranga County eCitizen'
            },
            To: [
              {
                Email: body.userEmail
              }
            ],
            Subject: 'Received: Muranga County Service Request',
            TextPart: `We have officially received your service request regarding the ${body.category} issue at ${body.location}. The issue has been recorded in our system and the current status is Pending. We will notify you as progress is made.`
          }
        ]
      })
    })

    if (!emailRes.ok) {
      const errorData = await emailRes.json()
      console.error(errorData)
    }

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    const querySnapshot = await getDocs(collection(db, 'requests'))
    let requests: any[] = []
    
    querySnapshot.forEach((doc) => {
      requests.push({ _id: doc.id, ...doc.data() })
    })

    if (userId) {
      requests = requests.filter(r => r.userId === userId)
    }

    requests.sort((a, b) => b.createdAt - a.createdAt)
    
    return NextResponse.json({ success: true, data: requests }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}