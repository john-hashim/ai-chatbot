import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export interface PresignedUrlResponse {
  uploadUrl: string
  fileUrl: string
  key: string
}

export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  directory: string
): Promise<PresignedUrlResponse> => {
  const fileExtension = fileName.split('.').pop()
  const uniqueFileName = `${directory}/${crypto.randomUUID()}.${fileExtension}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: uniqueFileName,
    ContentType: fileType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 3600,
  })

  const fileUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`

  return {
    uploadUrl,
    fileUrl,
    key: uniqueFileName,
  }
}
