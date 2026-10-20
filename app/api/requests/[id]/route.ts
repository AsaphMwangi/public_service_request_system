import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { sendEnginemailerEmail } from '@/lib/enginemailer'

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
    const adminInbox = process.env.ADMIN_NOTIFICATION_EMAIL || 'asaphmwangi1973@gmail.com'

    const citizenSubject = body.status === 'Resolved' 
      ? 'Resolved: Muranga County Service Request' 
      : `Update: Muranga County Request is now ${body.status}`
      
    const citizenContent = body.status === 'Resolved'
      ? `
        <div style="font-family: sans-serif; color: #14532d;">
          <h2>Issue Resolved</h2>
          <p>Good news! Your service request for the <strong>${requestData.category}</strong> issue at <strong>${requestData.location}</strong> has been resolved.</p>
          <p>Thank you for partnering with the Muranga County Government.</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; color: #14532d;">
          <h2>Status Update</h2>
          <p>Your service request for the <strong>${requestData.category}</strong> issue at <strong>${requestData.location}</strong> has been updated.</p>
          <p>Current Status: <strong>${body.status}</strong></p>
        </div>
      `

    const adminContent = `
      <div style="font-family: sans-serif; color: #14532d;">
        <h2>System Status Update Log</h2>
        <p>The status of an existing request has been updated on the dashboard:</p>
        <ul>
          <li><strong>Request ID:</strong> ${id}</li>
          <li><strong>Category:</strong> ${requestData.category}</li>
          <li><strong>Location:</strong> ${requestData.location}</li>
          <li><strong>Citizen Email:</strong> ${requestData.userEmail}</li>
          <li><strong>New Status:</strong> ${body.status}</li>
        </ul>
      </div>
    `

    await Promise.all([
      sendEnginemailerEmail(
        requestData.userEmail,
        citizenSubject,
        citizenContent
      ),
      sendEnginemailerEmail(
        adminInbox,
        `Status Updated to ${body.status}: ${requestData.category}`,
        adminContent
      )
    ])

    return NextResponse.json({ success: true, data: { _id: id, ...requestData } }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}