import { useState } from 'react'
import { uploadImageToR2, deleteImageFromR2 } from '@/api/services/upload'
import { useStore } from '@/store'
import { showNotification } from '@/utils/notifications'

type ChatbotImageField = 'profilePicture' | 'chatIcon'

type R2Directory = 'profile-pictures' | 'chat-icons'

interface UseChatbotImageUploadOptions {
  field: ChatbotImageField
  directory: R2Directory
}

interface UseChatbotImageUploadReturn {
  isUploading: boolean
  upload: (file: File) => Promise<void>
  remove: () => Promise<void>
}

export const useChatbotImageUpload = ({
  field,
  directory,
}: UseChatbotImageUploadOptions): UseChatbotImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false)
  const { updateChatbot, currentChatbot } = useStore()

  const upload = async (file: File) => {
    setIsUploading(true)
    try {
      // Delete old image from R2 if exists
      const currentUrl = currentChatbot?.[field]
      if (currentUrl) {
        try {
          await deleteImageFromR2(currentUrl)
        } catch (error) {
          console.error(`Error deleting old ${field} from R2:`, error)
          // Continue with upload even if delete fails
        }
      }

      const uploadedUrl = await uploadImageToR2(file, directory)
      await updateChatbot({ [field]: uploadedUrl })
      showNotification('success', 'Image updated successfully')
    } catch (error) {
      console.error(`Error uploading ${field}:`, error)
      showNotification('error', 'Failed to upload image. Please try again.')
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const remove = async () => {
    setIsUploading(true)
    try {
      // Delete image from R2
      const currentUrl = currentChatbot?.[field]
      if (currentUrl) {
        try {
          await deleteImageFromR2(currentUrl)
        } catch (error) {
          console.error(`Error deleting ${field} from R2:`, error)
          // Continue with remove even if R2 delete fails
        }
      }

      await updateChatbot({ [field]: null })
      showNotification('success', 'Image removed successfully')
    } catch (error) {
      console.error(`Error removing ${field}:`, error)
      showNotification('error', 'Failed to remove image. Please try again.')
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    isUploading,
    upload,
    remove,
  }
}
