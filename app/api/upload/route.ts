import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, BUCKET_NAME } from '@/lib/r2'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawFilename = searchParams.get('filename') || `issue_${Date.now()}.jpg`
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileKey = `uploads/${Date.now()}_${cleanFilename}`

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: request.headers.get('content-type') || 'image/jpeg',
    })

    await r2Client.send(uploadCommand)

    return NextResponse.json({ success: true, url: fileKey }, { status: 200 })
  } catch (error: any) {
    console.error('R2 Upload Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}