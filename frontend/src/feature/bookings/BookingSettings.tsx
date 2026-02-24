import type React from 'react'
import { useState } from 'react'
import { Select } from '@mantine/core'

const DURATION_OPTIONS = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
]

export const BookingSettings: React.FC = () => {
  const [scheduleDuration, setScheduleDuration] = useState<string>('30')

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === scheduleDuration)

  return (
    <div>
      <p className="py-2 font-bold text-lg text-text-primary">Settings</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-5 p-6 border border-border-week bg-white rounded-xl text-sm text-text-primary min-h-[calc(100vh-220px)]">
          <div className="border-b border-border-week">
            <label className="mb-1.5  block text-sm font-medium text-text-secondary">
              Schedule Duration
            </label>
            <Select
              data={DURATION_OPTIONS}
              value={scheduleDuration}
              onChange={val => setScheduleDuration(val ?? '30')}
              allowDeselect={false}
              w={150}
            />
            {selectedDuration && (
              <p className="mt-1  mb-6 text-xs text-text-weak">
                Meetings will be scheduled in{' '}
                <span className="font-bold"> {selectedDuration.label}</span> slots.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
