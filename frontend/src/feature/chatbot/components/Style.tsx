import type React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import { Center, ColorInput, SegmentedControl, Switch } from '@mantine/core'
import { Moon, Sun } from 'lucide-react'

export const Style: React.FC = () => {
  const { control } = useFormContext<ChatbotFormValues>()

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
      <div className="py-6 border-b border-border-week"></div>
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
