import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Select, Skeleton } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { rawTimeZones } from '@vvo/tzdb'
import { Check, Pencil, X } from 'lucide-react'
import { useBookingStore } from '@/store'

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
]

const aliasToCanonical = new Map<string, string>()
for (const tz of rawTimeZones) {
  for (const alias of tz.group) aliasToCanonical.set(alias, tz.name)
}

const TIMEZONE_OPTIONS = rawTimeZones.map(tz => {
  const abbr = /^GMT[+-]/.test(tz.abbreviation) ? '' : ` — ${tz.abbreviation}`
  const city = tz.mainCities[0] ?? tz.name
  return { value: tz.name, label: `${tz.alternativeName}${abbr} (${city})` }
})

const formatterCache = new Map<string, Intl.DateTimeFormat>()
function getCurrentTime(tz: string): string {
  try {
    let fmt = formatterCache.get(tz)
    if (!fmt) {
      fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz })
      formatterCache.set(tz, fmt)
    }
    return fmt.format(new Date())
  } catch {
    return ''
  }
}

function renderTimezoneOption({ option }: { option: { value: string; label: string } }) {
  return (
    <div className="flex justify-between items-center w-full gap-4">
      <span>{option.label}</span>
      <span className="text-xs text-text-weak shrink-0">{getCurrentTime(option.value)}</span>
    </div>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const BookingSettings: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const {
    duration,
    timezone,
    notificationEmail,
    fetchingAvailabilities,
    updateDuration,
    updateTimezone,
    updateNotificationEmail,
  } = useBookingStore()

  const [localDuration, setLocalDuration] = useState<string>(String(duration))
  const [localTimezone, setLocalTimezone] = useState<string>(timezone)
  const [updatingDuration, setUpdatingDuration] = useState(false)
  const [updatingTimezone, setUpdatingTimezone] = useState(false)

  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [draftEmail, setDraftEmail] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [savingEmail, setSavingEmail] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocalDuration(String(duration)) }, [duration])
  useEffect(() => { setLocalTimezone(timezone) }, [timezone])

  const handleDurationChange = async (val: string | null) => {
    if (!val || !chatbotId || updatingDuration) return
    const prev = localDuration
    setLocalDuration(val)
    setUpdatingDuration(true)
    try {
      await updateDuration(chatbotId, Number(val))
    } catch {
      setLocalDuration(prev)
    } finally {
      setUpdatingDuration(false)
    }
  }

  const handleTimezoneChange = async (val: string | null) => {
    if (!val || !chatbotId || updatingTimezone) return
    const prev = localTimezone
    setLocalTimezone(val)
    setUpdatingTimezone(true)
    try {
      await updateTimezone(chatbotId, val)
    } catch {
      setLocalTimezone(prev)
    } finally {
      setUpdatingTimezone(false)
    }
  }

  const openEmailEdit = () => {
    setDraftEmail(notificationEmail ?? '')
    setEmailError('')
    setIsEditingEmail(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancelEmailEdit = () => {
    setIsEditingEmail(false)
    setDraftEmail('')
    setEmailError('')
  }

  const handleEmailChange = (val: string) => {
    setDraftEmail(val)
    if (emailError && EMAIL_RE.test(val)) setEmailError('')
  }

  const handleEmailDone = async () => {
    const trimmed = draftEmail.trim()
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      setEmailError('Please enter a valid email address.')
      inputRef.current?.focus()
      return
    }
    if (!chatbotId) return
    setSavingEmail(true)
    try {
      await updateNotificationEmail(chatbotId, trimmed)
      setIsEditingEmail(false)
      setEmailError('')
    } catch {
      setEmailError('Failed to save. Please try again.')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEmailDone()
    }
    if (e.key === 'Escape') cancelEmailEdit()
  }

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === localDuration)

  return (
    <div>
      <p className="py-2 font-bold text-lg text-text-primary">Settings</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-5 p-6 border border-border-week bg-white rounded-xl text-sm text-text-primary min-h-[calc(100vh-220px)]">

          {fetchingAvailabilities ? (
            <>
              {[150, 320, 320].map((w, i) => (
                <div key={i} className="border-b border-border-week last:border-b-0 pb-6 last:pb-0">
                  <Skeleton height={14} width={100} mb={10} radius="sm" />
                  <Skeleton height={36} width={w} radius="sm" />
                  <Skeleton height={12} width={w * 0.75} mt={8} radius="sm" />
                </div>
              ))}
            </>
          ) : (
            <>
          {/* Schedule Duration */}
          <div className="border-b border-border-week">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Schedule Duration
            </label>
            <Select
              data={DURATION_OPTIONS}
              value={localDuration}
              onChange={handleDurationChange}
              allowDeselect={false}
              checkIconPosition="right"
              disabled={updatingDuration}
              w={150}
            />
            {selectedDuration && (
              <p className="mt-1 mb-6 text-xs text-text-weak">
                Meetings will be scheduled in{' '}
                <span className="font-bold">{selectedDuration.label}</span> slots.
              </p>
            )}
          </div>

          {/* Timezone */}
          <div className="border-b border-border-week">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Timezone</label>
            <Select
              data={TIMEZONE_OPTIONS}
              value={aliasToCanonical.get(localTimezone) ?? localTimezone}
              onChange={handleTimezoneChange}
              allowDeselect={false}
              searchable
              checkIconPosition="right"
              disabled={updatingTimezone}
              w={320}
              comboboxProps={{ width: 380 }}
              renderOption={renderTimezoneOption}
            />
            <p className="mt-1 mb-6 text-xs text-text-weak">
              All availability times will use this timezone.
            </p>
          </div>

          {/* Notification Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Notification Email
            </label>

            {isEditingEmail ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 h-9 rounded-lg border bg-white transition-colors w-72 ${
                      emailError
                        ? 'border-red-400 ring-1 ring-red-300'
                        : 'border-border-strong'
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="email"
                      value={draftEmail}
                      onChange={e => handleEmailChange(e.currentTarget.value)}
                      onKeyDown={handleEmailKeyDown}
                      placeholder="you@example.com"
                      className="flex-1 text-sm bg-transparent outline-none text-text-primary placeholder:text-text-weak"
                    />
                  </div>

                  <button
                    onClick={handleEmailDone}
                    disabled={savingEmail}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors shrink-0"
                    title="Save"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={cancelEmailEdit}
                    disabled={savingEmail}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-week hover:bg-gray-50 disabled:opacity-50 text-text-weak transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <p
                  aria-live="polite"
                  className={`text-xs ${emailError ? 'text-red-500' : 'text-text-weak'}`}
                >
                  {emailError || 'Press Enter to save, Esc to cancel.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 group w-fit">
                  <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-border-week bg-white w-72">
                    <span
                      className={`flex-1 text-sm truncate ${
                        notificationEmail ? 'text-text-primary' : 'text-text-weak'
                      }`}
                    >
                      {notificationEmail || 'Not set'}
                    </span>
                  </div>
                  <button
                    onClick={openEmailEdit}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-week hover:bg-gray-100 text-text-weak hover:text-text-secondary transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="Edit email"
                  >
                    <Pencil size={13} strokeWidth={2} />
                  </button>
                </div>
                <p className="text-xs text-text-weak">
                  A notification will be sent to this email on every new appointment.
                </p>
              </div>
            )}
          </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
