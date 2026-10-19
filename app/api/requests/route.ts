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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await connectToDatabase()
    
    const newRequest = await RequestModel.create(body)

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: body.userEmail,
        subject: 'Muranga County Service Request Update',
        text: `We have received your service request regarding ${body.category} at ${body.location}. The current status is Pending.`
      }
      await transporter.sendMail(mailOptions)
    } catch (emailError) {
      console.error(emailError)
    }

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    const query = userId ? { userId } : {}
    const requests = await RequestModel.find(query).sort({ createdAt: -1 })
    
    return NextResponse.json({ success: true, data: requests }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}