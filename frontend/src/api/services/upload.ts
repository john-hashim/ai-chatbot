import { chatbotService } from './chatbot'

/**
 * Uploads an image to Cloudflare R2 using presigned URL
 * @param file - The file to upload
 * @param directory - The directory in R2 to upload to (e.g., 'profile-pictures', 'documents')
 * @returns The URL of the uploaded file
 */
export const uploadImageToR2 = async (file: File, directory: string): Promise<string> => {
  const presignedResponse = await chatbotService.getPresignedUploadUrl(
    file.name,
    file.type,
    directory
  )

  if (!presignedResponse.data.data) {
    throw new Error('Failed to get presigned URL')
  }

  const { uploadUrl, fileUrl } = presignedResponse.data.data

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!uploadResponse.ok) {
    throw new Error('Upload failed')
  }

  return fileUrl
}

/**
 * Deletes an image from Cloudflare R2
 * @param fileUrl - The URL of the file to delete
 */
export const deleteImageFromR2 = async (fileUrl: string): Promise<void> => {
  await chatbotService.deleteFile(fileUrl)
}
