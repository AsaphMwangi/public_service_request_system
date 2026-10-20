import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params
    
    const docRef = doc(db, 'requests', id)
    await updateDoc(docRef, { status: body.status })
    
    const updatedDoc = await getDoc(docRef)
    
    if (!updatedDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    const requestData = updatedDoc.data()

    const subject = body.status === 'Resolved' 
      ? 'Resolved: Muranga County Service Request' 
      : `Update: Muranga County Request is now ${body.status}`
      
    const text = body.status === 'Resolved'
      ? `Good news! Your service request for the ${requestData.category} issue at ${requestData.location} has been successfully resolved. Thank you for engaging with the Muranga County Government.`
      : `Your service request for the ${requestData.category} issue at ${requestData.location} has been updated. The current status is now: ${body.status}.`

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
                Email: requestData.userEmail
              }
            ],
            Subject: subject,
            TextPart: text
          }
        ]
      })
    })

    if (!emailRes.ok) {
      const errorData = await emailRes.json()
      console.error(errorData)
    }

    return NextResponse.json({ success: true, data: { _id: id, ...requestData } }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}