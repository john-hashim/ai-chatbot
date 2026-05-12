import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button, Loader, Select, Skeleton, Tooltip } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { rawTimeZones } from '@vvo/tzdb'
import { Check, MapPin, Pencil, Phone, X } from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useBookingStore } from '@/store'
import googleCalendarIcon from '@/assets/icons/google-calendar.svg'
import googleMeetIcon from '@/assets/icons/google-meet.svg'
// import zoomIcon from '@/assets/icons/zoom-icon.svg'
import type { LocationType } from '@/types/bookings'

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

const LOCATION_OPTIONS: {
  value: LocationType
  label: string
  icon: React.ReactNode
}[] = [
  {
    value: 'GOOGLE_MEET',
    label: 'Google Meet',
    icon: <img src={googleMeetIcon} alt="" className="w-[18px] h-[18px]" />,
  },
  // {
  //   value: 'ZOOM',
  //   label: 'Zoom',
  //   icon: <img src={zoomIcon} alt="" className="w-[18px] h-[18px]" />,
  // },
  { value: 'IN_PERSON', label: 'In person', icon: <MapPin size={18} /> },
  { value: 'PHONE', label: 'Phone call', icon: <Phone size={18} /> },
]

const AUTOSAVE_DELAY_MS = 600

export const BookingSettings: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const {
    duration,
    timezone,
    notificationEmail,
    locationType,
    locationAddress,
    locationPhone,
    calendarIntegration,
    connectingCalendar,
    disconnectingCalendar,
    fetchingAvailabilities,
    updateDuration,
    updateTimezone,
    updateNotificationEmail,
    updateLocation,
    connectGoogleCalendar,
    disconnectCalendar,
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

  const [draftAddress, setDraftAddress] = useState<string>(locationAddress ?? '')
  const [draftPhone, setDraftPhone] = useState<string>(locationPhone ?? '')
  const [optimisticType, setOptimisticType] = useState<LocationType | null | undefined>(undefined)
  const [autosaving, setAutosaving] = useState(false)
  const effectiveType = optimisticType !== undefined ? optimisticType : locationType

  useEffect(() => setLocalDuration(String(duration)), [duration])
  useEffect(() => setLocalTimezone(timezone), [timezone])
  useEffect(() => setDraftAddress(locationAddress ?? ''), [locationAddress])
  useEffect(() => setDraftPhone(locationPhone ?? ''), [locationPhone])

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

  const handleSelectLocationType = (type: LocationType | null) => {
    if (!chatbotId || type === effectiveType) return
    setOptimisticType(type)
    updateLocation(chatbotId, { locationType: type })
      .catch(() =>
        notifications.show({ message: 'Could not update location.', className: 'error' })
      )
      .finally(() => setOptimisticType(undefined))
  }

  // Debounced auto-save. The equality check skips the no-op write that
  // would otherwise fire after hydration sets the draft from the server.
  useEffect(() => {
    if (!chatbotId) return
    if (draftAddress === (locationAddress ?? '')) return
    const t = setTimeout(() => {
      setAutosaving(true)
      updateLocation(chatbotId, { locationAddress: draftAddress || null })
        .catch(() =>
          notifications.show({ message: 'Could not save address.', className: 'error' })
        )
        .finally(() => setAutosaving(false))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [draftAddress, locationAddress, chatbotId, updateLocation])

  useEffect(() => {
    if (!chatbotId) return
    const trimmed = draftPhone.trim()
    if (trimmed === (locationPhone ?? '')) return
    const t = setTimeout(() => {
      setAutosaving(true)
      updateLocation(chatbotId, { locationPhone: trimmed || null })
        .catch(() =>
          notifications.show({ message: 'Could not save phone number.', className: 'error' })
        )
        .finally(() => setAutosaving(false))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [draftPhone, locationPhone, chatbotId, updateLocation])

  const handleConnectCalendar = async () => {
    if (!chatbotId || connectingCalendar) return
    try {
      await connectGoogleCalendar(chatbotId)
      notifications.show({ message: 'Calendar connected.', className: 'success' })
    } catch (err) {
      console.error('[Calendar connect] failed:', err)
      const reason = err instanceof Error ? err.message : 'connect_failed'
      if (reason === 'popup_closed') return
      const message =
        reason === 'popup_blocked'
          ? 'Pop-up blocked. Please allow pop-ups for this site and try again.'
          : `Could not connect calendar (${reason}).`
      notifications.show({ message, className: 'error' })
    }
  }

  const handleDisconnectCalendar = async () => {
    if (!chatbotId || disconnectingCalendar) return
    try {
      await disconnectCalendar(chatbotId)
      notifications.show({ message: 'Calendar disconnected.', className: 'success' })
    } catch {
      notifications.show({
        message: 'Could not disconnect calendar.',
        className: 'error',
      })
    }
  }

  const selectedDuration = DURATION_OPTIONS.find(opt => opt.value === localDuration)

  return (
    <div className="h-full bg-white border border-border-week rounded-xl overflow-y-auto">
      <div className="flex flex-col gap-5 p-6 text-sm text-text-primary">
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
              {/* Timezone */}
              <div className="border-b border-border-week">
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Timezone
                </label>
                <Select
                  data={TIMEZONE_OPTIONS}
                  value={aliasToCanonical.get(localTimezone) ?? localTimezone}
                  onChange={handleTimezoneChange}
                  allowDeselect={false}
                  searchable
                  checkIconPosition="right"
                  // disabled={updatingTimezone}
                  w={320}
                  comboboxProps={{ width: 380 }}
                  renderOption={renderTimezoneOption}
                />
                <p className="mt-1 mb-6 text-xs text-text-weak">
                  All availability times will use this timezone.
                </p>
              </div>

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
                  // disabled={updatingDuration}
                  w={150}
                />
                {selectedDuration && (
                  <p className="mt-1 mb-6 text-xs text-text-weak">
                    Meetings will be scheduled in{' '}
                    <span className="font-bold">{selectedDuration.label}</span> slots.
                  </p>
                )}
              </div>

              {/* Calendar to add events to */}
              <div className="border-b border-border-week pb-6">
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Calendar to add events to
                </label>
                {calendarIntegration ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border-week bg-white w-96">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={googleCalendarIcon}
                        alt="Google Calendar"
                        className="w-9 h-9 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate">
                          Google Calendar
                        </span>
                        <span className="text-xs text-text-weak truncate">
                          {calendarIntegration.accountEmail}
                        </span>
                      </div>
                    </div>
                    <Tooltip label="Disconnect account" transitionProps={{ duration: 150 }}>
                      <button
                        onClick={handleDisconnectCalendar}
                        disabled={disconnectingCalendar}
                        className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-text-weak hover:text-text-primary transition-colors shrink-0 disabled:opacity-50"
                      >
                        {disconnectingCalendar ? (
                          <Loader size={14} />
                        ) : (
                          <X size={16} strokeWidth={2.5} />
                        )}
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border-week bg-white w-96">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={googleCalendarIcon}
                        alt="Google Calendar"
                        className="w-9 h-9 shrink-0"
                      />
                      <span className="text-sm font-medium text-text-primary">Google Calendar</span>
                    </div>
                    <Button
                      variant="compact"
                      onClick={handleConnectCalendar}
                      loading={connectingCalendar}
                    >
                      Connect
                    </Button>
                  </div>
                )}
                <p className="mt-1 text-xs text-text-weak">
                  Once connected, every new appointment will be added to this calendar
                  automatically.
                </p>
              </div>

              {/* Location */}
              <div className="border-b border-border-week pb-6">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-text-secondary">Location</label>
                  {autosaving && (
                    <span className="flex items-center gap-1.5 text-xs text-text-weak">
                      <Loader size={12} /> Saving…
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-text-weak">
                  Where the meeting will take place. Shared with invitees on confirmation.
                </p>
                {effectiveType ? (
                  (() => {
                    const selectedOpt = LOCATION_OPTIONS.find(o => o.value === effectiveType)
                    if (!selectedOpt) return null
                    return (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border-week bg-white w-96">
                        <div className="flex items-center gap-3 min-w-0">
                          {selectedOpt.icon}
                          <span className="text-sm font-medium text-text-primary truncate">
                            {selectedOpt.label}
                          </span>
                        </div>
                        <Tooltip label="Remove location" transitionProps={{ duration: 150 }}>
                          <button
                            onClick={() => handleSelectLocationType(null)}
                            className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-text-weak hover:text-text-primary transition-colors shrink-0"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </Tooltip>
                      </div>
                    )
                  })()
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
                    {LOCATION_OPTIONS.map(opt => {
                      const disabled = opt.value === 'GOOGLE_MEET' && !calendarIntegration
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectLocationType(opt.value)}
                          disabled={disabled}
                          title={
                            opt.value === 'GOOGLE_MEET' && !calendarIntegration
                              ? 'Connect Google Calendar to enable Meet links.'
                              : undefined
                          }
                          className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-lg border border-border-week bg-white hover:border-border-strong text-text-secondary text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {opt.icon}
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {effectiveType === 'IN_PERSON' && (
                  <div className="mt-4 max-w-2xl">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Address
                    </label>
                    <textarea
                      value={draftAddress}
                      onChange={e => setDraftAddress(e.currentTarget.value)}
                      placeholder="Add the address or any details about the location..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-border-week focus:border-border-strong bg-white outline-none text-sm resize-y transition-colors"
                    />
                  </div>
                )}

                {effectiveType === 'PHONE' && (
                  <div className="mt-4 max-w-2xl">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={draftPhone}
                      onChange={e => setDraftPhone(e.currentTarget.value)}
                      placeholder="555 123 4567"
                      className="px-3 h-9 rounded-lg border border-border-week focus:border-border-strong bg-white outline-none text-sm w-72 transition-colors"
                    />
                  </div>
                )}
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
                          emailError ? 'border-red-400 ring-1 ring-red-300' : 'border-border-strong'
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
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-color-primary hover:bg-color-primary/90 disabled:opacity-50 text-white transition-colors shrink-0"
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
  )
}
