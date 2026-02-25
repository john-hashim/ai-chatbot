import type React from 'react'
import { useEffect, useState } from 'react'
import { Select } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { rawTimeZones } from '@vvo/tzdb'
import { useBookingStore } from '@/store'

const DURATION_OPTIONS = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
]

const aliasToCanonical = new Map<string, string>()
for (const tz of rawTimeZones) {
  for (const alias of tz.group) aliasToCanonical.set(alias, tz.name)
}

const TIMEZONE_OPTIONS = rawTimeZones.map(tz => {
  const abbr = /^GMT[+-]/.test(tz.abbreviation) ? '' : ` — ${tz.abbreviation}`
  return { value: tz.name, label: `${tz.alternativeName}${abbr}` }
})

const formatterCache = new Map<string, Intl.DateTimeFormat>()
function getCurrentTime(tz: string): string {
  let fmt = formatterCache.get(tz)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz })
    formatterCache.set(tz, fmt)
  }
  return fmt.format(new Date())
}

function renderTimezoneOption({ option }: { option: { value: string; label: string } }) {
  return (
    <div className="flex justify-between items-center w-full gap-4">
      <span>{option.label}</span>
      <span className="text-xs text-text-weak shrink-0">{getCurrentTime(option.value)}</span>
    </div>
  )
}

export const BookingSettings: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { duration, timezone, updateDuration, updateTimezone } = useBookingStore()

  const [localDuration, setLocalDuration] = useState<string>(String(duration))
  const [localTimezone, setLocalTimezone] = useState<string>(timezone)

  useEffect(() => { setLocalDuration(String(duration)) }, [duration])
  useEffect(() => { setLocalTimezone(timezone) }, [timezone])

  const handleDurationChange = async (val: string | null) => {
    if (!val || !chatbotId) return
    setLocalDuration(val)
    await updateDuration(chatbotId, Number(val))
  }

  const handleTimezoneChange = async (val: string | null) => {
    if (!val || !chatbotId) return
    setLocalTimezone(val)
    await updateTimezone(chatbotId, val)
  }

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === localDuration)

  return (
    <div>
      <p className="py-2 font-bold text-lg text-text-primary">Settings</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-5 p-6 border border-border-week bg-white rounded-xl text-sm text-text-primary min-h-[calc(100vh-220px)]">
          <div className="border-b border-border-week">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Schedule Duration
            </label>
            <Select
              data={DURATION_OPTIONS}
              value={localDuration}
              onChange={handleDurationChange}
              allowDeselect={false}
              w={150}
            />
            {selectedDuration && (
              <p className="mt-1 mb-6 text-xs text-text-weak">
                Meetings will be scheduled in{' '}
                <span className="font-bold">{selectedDuration.label}</span> slots.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Timezone</label>
            <Select
              data={TIMEZONE_OPTIONS}
              value={aliasToCanonical.get(localTimezone) ?? localTimezone}
              onChange={handleTimezoneChange}
              allowDeselect={false}
              searchable
              w={320}
              comboboxProps={{ width: 380 }}
              renderOption={renderTimezoneOption}
            />
            <p className="mt-1 text-xs text-text-weak">
              All availability times will use this timezone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
