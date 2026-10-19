import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import RequestModel from '@/models/Request'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params
    await connectToDatabase()
    
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      id, 
      { status: body.status }, 
      { returnDocument: 'after' }
    )

    if (!updatedRequest) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: updatedRequest.userEmail,
        subject: `Update: Your Muranga County Request is now ${body.status}`,
        text: `Your service request for ${updatedRequest.category} at ${updatedRequest.location} has been updated. The current status is now: ${body.status}.`
      }
      await transporter.sendMail(mailOptions)
    } catch (emailError) {
      console.error(emailError)
    }

    return NextResponse.json({ success: true, data: updatedRequest }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}