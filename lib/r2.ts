import { S3Client } from '@aws-sdk/client-s3'

const rawEndpoint = process.env.R2_ENDPOINT || 'https://5bea7c864f35fa2c61dc21cdc0f5989a.r2.cloudflarestorage.com'
const cleanEndpoint = rawEndpoint.replace(/\/mpsrs\/?$/, '')

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: cleanEndpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mpsrs'