import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Button, Group, Stack } from '@mantine/core'
import { getCroppedImg } from '@/utils/cropImage'
import type { CroppedAreaPixels } from '@/utils/cropImage'

interface CropperComponentProps {
  image: File
  onSave: (croppedImage: File) => void
  onCancel: () => void
}

export const CropperComponent = ({ image, onSave, onCancel }: CropperComponentProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image)
    setImageSrc(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [image])

  const onCropComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    try {
      setIsProcessing(true)
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, image.name)
      onSave(croppedImage)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Stack gap="md">
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={isProcessing}>
          Save
        </Button>
      </Group>
    </Stack>
  )
}
