import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: requestData.userEmail,
      subject,
      text
    })

    if (error) {
      console.error(error)
      return NextResponse.json({ success: true, data: { _id: id, ...requestData }, emailError: error.message }, { status: 200 })
    }

    return NextResponse.json({ success: true, data: { _id: id, ...requestData } }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}