import type React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import {
  Button,
  Center,
  ColorInput,
  FileButton,
  Group,
  SegmentedControl,
  Switch,
  Tooltip,
  Radio,
} from '@mantine/core'
import { ImageUp, Loader2, Moon, Sun, X } from 'lucide-react'
import { useRef } from 'react'
import { showNotification } from '@/utils/notifications'
import { modals } from '@mantine/modals'
import { CropperComponent } from '@/components/common/Cropper'
import { useChatbotImageUpload } from '@/hooks/useChatbotImageUpload'

export const Style: React.FC = () => {
  const { control } = useFormContext<ChatbotFormValues>()

  const profilePictureResetRef = useRef<() => void>(null)
  const chatIconResetRef = useRef<() => void>(null)

  const profilePictureUrl = useWatch({ name: 'profilePicture', control })
  const chatIconUrl = useWatch({ name: 'chatIcon', control })

  const {
    isUploading: isUploadingProfilePicture,
    upload: uploadProfilePicture,
    remove: removeProfilePicture,
  } = useChatbotImageUpload({ field: 'profilePicture', directory: 'profile-pictures' })

  const {
    isUploading: isUploadingChatIcon,
    upload: uploadChatIcon,
    remove: removeChatIcon,
  } = useChatbotImageUpload({ field: 'chatIcon', directory: 'chat-icons' })

  const handleProfilePictureChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (selectedFile.size > maxSizeInBytes) {
        showNotification('error', 'Image size larger than 1MB')
        profilePictureResetRef.current?.()
        return
      }
      openProfilePictureCropperModal(selectedFile)
    }
  }

  const openProfilePictureCropperModal = (imageFile: File) => {
    modals.open({
      title: 'Crop Profile Picture',
      size: 'lg',
      children: (
        <CropperComponent
          image={imageFile}
          onSave={handleProfilePictureCropped}
          onCancel={() => {
            modals.closeAll()
            profilePictureResetRef.current?.()
          }}
        />
      ),
    })
  }

  const handleProfilePictureCropped = async (croppedFile: File) => {
    modals.closeAll()
    try {
      await uploadProfilePicture(croppedFile)
    } catch {
      profilePictureResetRef.current?.()
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      await removeProfilePicture()
    } catch {
      // Error already handled in hook
    }
    profilePictureResetRef.current?.()
  }

  // Chat Icon handlers
  const handleChatIconChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (selectedFile.size > maxSizeInBytes) {
        showNotification('error', 'Image size larger than 1MB')
        chatIconResetRef.current?.()
        return
      }
      openChatIconCropperModal(selectedFile)
    }
  }

  const openChatIconCropperModal = (imageFile: File) => {
    modals.open({
      title: 'Crop Chat Icon',
      size: 'lg',
      children: (
        <CropperComponent
          image={imageFile}
          onSave={handleChatIconCropped}
          onCancel={() => {
            modals.closeAll()
            chatIconResetRef.current?.()
          }}
        />
      ),
    })
  }

  const handleChatIconCropped = async (croppedFile: File) => {
    modals.closeAll()
    try {
      await uploadChatIcon(croppedFile)
    } catch {
      chatIconResetRef.current?.()
    }
  }

  const handleRemoveChatIcon = async () => {
    try {
      await removeChatIcon()
    } catch {
      // Error already handled in hook
    }
    chatIconResetRef.current?.()
  }

  return (
    <div className="p-6 pb-28">
      <div className="flex justify-between items-center pb-6 border-b border-border-week">
        <p className="text-text-secondary font-medium text-sm">Appearance</p>
        <Controller
          name="appearance"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              {...field}
              data={[
                {
                  value: 'light',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <Sun size={16} />
                    </Center>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <Moon size={16} />
                    </Center>
                  ),
                },
              ]}
            />
          )}
        />
      </div>
      <div className="py-6 border-b border-border-week">
        <div>
          <p className="text-text-secondary font-medium text-sm">Profile Picture</p>
          <div className="flex justify-between items-center mt-4">
            <p className="text-text-weak text-[12px]">JPG, PNG, and SVG up to 1MB</p>
            <div>
              {isUploadingProfilePicture ? (
                <div className="flex items-center gap-2 w-9 h-9">
                  <Loader2 className="h-6 w-6 animate-spin text-text-weak" />
                </div>
              ) : profilePictureUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={profilePictureUrl}
                    alt="Profile preview"
                    className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  />
                  <Tooltip label="Remove Profile Picture" position="bottom">
                    <button
                      className="border-0 bg-transparent p-0 cursor-pointer"
                      onClick={handleRemoveProfilePicture}
                    >
                      <X className="h-5 w-5 text-text-weak hover:text-icon-hover shrink-0" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <Group justify="center">
                  <FileButton
                    onChange={handleProfilePictureChange}
                    accept="image/png,image/jpeg"
                    resetRef={profilePictureResetRef}
                  >
                    {props => (
                      <Button {...props} variant="secondary" leftSection={<ImageUp size={14} />}>
                        Upload image
                      </Button>
                    )}
                  </FileButton>
                </Group>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-text-secondary font-medium text-sm">Chat Icon</p>
          <div className="flex justify-between items-center mt-4">
            <p className="text-text-weak text-[12px]">JPG, PNG, and SVG up to 1MB</p>
            <div>
              {isUploadingChatIcon ? (
                <div className="flex items-center gap-2 w-9 h-9">
                  <Loader2 className="h-6 w-6 animate-spin text-text-weak" />
                </div>
              ) : chatIconUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={chatIconUrl}
                    alt="Chat icon preview"
                    className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  />
                  <Tooltip label="Remove Chat Icon" position="bottom">
                    <button
                      className="border-0 bg-transparent p-0 cursor-pointer"
                      onClick={handleRemoveChatIcon}
                    >
                      <X className="h-5 w-5 text-text-weak hover:text-icon-hover shrink-0" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <Group justify="center">
                  <FileButton
                    onChange={handleChatIconChange}
                    accept="image/png,image/jpeg"
                    resetRef={chatIconResetRef}
                  >
                    {props => (
                      <Button {...props} variant="secondary" leftSection={<ImageUp size={14} />}>
                        Upload image
                      </Button>
                    )}
                  </FileButton>
                </Group>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="py-6 border-b border-border-week">
        <div className="flex justify-between items-center">
          <p className="text-text-secondary text-sm font-medium">Primary Color</p>
          <div className="w-1/3">
            <Controller
              name="brandColor"
              control={control}
              render={({ field }) => (
                <ColorInput
                  {...field}
                  swatchesPerRow={5}
                  closeOnColorSwatchClick
                  withEyeDropper={false}
                  swatches={['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#5B083A']}
                />
              )}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center p-4 bg-background-dark-week rounded-xl mt-4">
            <p className="text-text-secondary text-sm font-medium">Use brand color for header</p>
            <div>
              <Controller
                name="brandColorForHeader"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch
                    checked={value}
                    onChange={event => onChange(event.currentTarget.checked)}
                    color="teal"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <p className="text-text-secondary text-sm font-medium">Chat bubble button color</p>
          <div className="w-1/3">
            <Controller
              name="chatBubbleButtonColor"
              control={control}
              render={({ field }) => (
                <ColorInput
                  {...field}
                  swatchesPerRow={5}
                  closeOnColorSwatchClick
                  withEyeDropper={false}
                  swatches={[
                    '#000000',
                    '#2563eb',
                    '#7c3aed',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#5B083A',
                  ]}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="py-6">
        <Controller
          name="chatBubbleButtonPosition"
          control={control}
          render={({ field }) => (
            <Radio.Group {...field} name="chatButtonBubble" label="Align chat button bubble">
              <Group mt="xs">
                <Radio value="left" label="Left" color="dark.8" className="mt-2" />
                <Radio value="right" label="Right" color="dark.8" className="mt-2" />
              </Group>
            </Radio.Group>
          )}
        />
      </div>
    </div>
  )
}
