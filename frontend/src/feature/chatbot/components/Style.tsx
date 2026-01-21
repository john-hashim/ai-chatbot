import type React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import { ColorInput } from '@mantine/core'

export const Style: React.FC = () => {
  const { control } = useFormContext<ChatbotFormValues>()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <p className="text-text-secondary text-sm">Primary Color</p>
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
    </div>
  )
}
