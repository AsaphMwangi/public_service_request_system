import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, BUCKET_NAME } from '@/lib/r2'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename') || `issue_${Date.now()}.jpg`
    const fileKey = `mpsrs/${Date.now()}_${filename}`

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: request.headers.get('content-type') || 'image/jpeg',
    })

    await r2Client.send(uploadCommand)

    // If your R2 bucket has public access enabled or a custom domain mapped, construct the public URL.
    // Alternatively, you can use your custom public bucket domain or construct the endpoint URL:
    const fileUrl = `${process.env.R2_ENDPOINT}/${fileKey}`

    return NextResponse.json({ success: true, url: fileUrl }, { status: 200 })
  } catch (error: any) {
    console.error('R2 Upload Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}