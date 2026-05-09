import { useState } from 'react'
import { uploadImageToR2, deleteImageFromR2 } from '@/api/services/upload'
import { useUserStore } from '@/store'
import { authService } from '@/api/services/auth'
import { showNotification } from '@/utils/notifications'

interface UseUserAvatarUploadReturn {
  isUploading: boolean
  upload: (file: File) => Promise<void>
  remove: () => Promise<void>
}

export const useUserAvatarUpload = (): UseUserAvatarUploadReturn => {
  const [isUploading, setIsUploading] = useState(false)
  const { user, updateUser } = useUserStore()

  const upload = async (file: File) => {
    setIsUploading(true)
    try {
      // Delete old avatar from R2 if exists
      if (user?.avatar) {
        try {
          await deleteImageFromR2(user.avatar)
        } catch (error) {
          console.error('Error deleting old avatar from R2:', error)
        }
      }

      const uploadedUrl = await uploadImageToR2(file, 'user-avatars')
      const res = await authService.updateAvatar(uploadedUrl)
      if (res.data.data) updateUser(res.data.data)
      showNotification('success', 'Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showNotification('error', 'Failed to upload avatar. Please try again.')
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const remove = async () => {
    setIsUploading(true)
    try {
      if (user?.avatar) {
        try {
          await deleteImageFromR2(user.avatar)
        } catch (error) {
          console.error('Error deleting avatar from R2:', error)
        }
      }

      const res = await authService.updateAvatar(null)
      if (res.data.data) updateUser(res.data.data)
      showNotification('success', 'Avatar removed successfully')
    } catch (error) {
      console.error('Error removing avatar:', error)
      showNotification('error', 'Failed to remove avatar. Please try again.')
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return { isUploading, upload, remove }
}
