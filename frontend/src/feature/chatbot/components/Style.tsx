import type React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
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
} from '@mantine/core'
import { ImageUp, Moon, Sun, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { showNotification } from '@/utils/notifications'
import { modals } from '@mantine/modals'
import { CropperComponent } from '@/components/common/Cropper'

export const Style: React.FC = () => {
  const { control, setValue } = useFormContext<ChatbotFormValues>()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const ProfilePictureResetRef = useRef<() => void>(null)

  const clearFile = () => {
    setFile(null)
    setValue('profilePicture', null, { shouldDirty: true })
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    ProfilePictureResetRef.current?.()
  }

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (selectedFile.size > maxSizeInBytes) {
        showNotification('error', 'Image size larger than 1MB')
        ProfilePictureResetRef.current?.()
        return
      }
      openCropperModal(selectedFile)
    }
  }

  const openCropperModal = (imageFile: File) => {
    modals.open({
      title: 'Crop Profile Picture',
      size: 'lg',
      children: (
        <CropperComponent
          image={imageFile}
          onSave={handleCroppedImage}
          onCancel={() => {
            modals.closeAll()
            ProfilePictureResetRef.current?.()
          }}
        />
      ),
    })
  }

  const handleCroppedImage = async (croppedFile: File) => {
    setFile(croppedFile)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreviewUrl = URL.createObjectURL(croppedFile)
    setPreviewUrl(newPreviewUrl)
    setValue('profilePicture', newPreviewUrl, { shouldDirty: true })
    modals.closeAll()
  }

  return (
    <div className="p-6">
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
        <div className="mt-6">
          <p className="text-text-secondary text-sm">Profile Picture</p>
          <div className="flex justify-between items-center mt-4">
            <p className="text-text-weak text-[12px]">JPG, PNG, and SVG up to 1MB</p>
            <div>
              {file && previewUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  />
                  <Tooltip label="Remove Profile Picture" position="bottom">
                    <button
                      className="border-0 bg-transparent p-0 cursor-pointer"
                      onClick={clearFile}
                    >
                      <X className="h-5 w-5 text-text-weak hover:text-icon-hover shrink-0" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <Group justify="center">
                  <FileButton
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg"
                    resetRef={ProfilePictureResetRef}
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
    </div>
  )
}
