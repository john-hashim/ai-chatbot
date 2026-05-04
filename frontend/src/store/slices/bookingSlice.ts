import { bookingsService } from '@/api/services/bookings'
import { calendarService } from '@/api/services/calendar'
import type {
  Appointment,
  AvailabilitySchedule,
  CalendarIntegration,
  CreateAvailabilityRequest,
  LocationType,
  UpdateBookingConfigRequest,
  UpdateTimeSlotsRequest,
} from '@/types/bookings'
import type { StateCreator } from 'zustand'

export interface BookingSlice {
  // State
  duration: number
  timezone: string
  notificationEmail: string | null
  locationType: LocationType | null
  locationAddress: string | null
  locationPhone: string | null
  availabilities: AvailabilitySchedule[]
  appointments: Appointment[]
  calendarIntegration: CalendarIntegration | null

  // Loading states
  fetchingAvailabilities: boolean
  fetchingAppointments: boolean
  creatingDayId: number | null
  updatingSlotId: string | null
  deletingSlotId: string | null
  connectingCalendar: boolean
  disconnectingCalendar: boolean

  // Actions
  fetchBookingData: (chatbotId: string) => Promise<void>
  refreshAvailabilities: (chatbotId: string) => Promise<void>
  clearAvailabilities: () => void
  updateDuration: (chatbotId: string, duration: number) => Promise<void>
  updateTimezone: (chatbotId: string, timezone: string) => Promise<void>
  updateNotificationEmail: (chatbotId: string, email: string) => Promise<void>
  updateLocation: (chatbotId: string, data: UpdateBookingConfigRequest) => Promise<void>
  createAvailability: (chatbotId: string, data: CreateAvailabilityRequest) => Promise<void>
  updateAvailability: (
    chatbotId: string,
    slotId: string,
    data: UpdateTimeSlotsRequest
  ) => Promise<void>
  deleteAvailability: (chatbotId: string, slotId: string) => Promise<void>
  fetchAppointments: (chatbotId: string) => Promise<void>
  clearAppointments: () => void
  connectGoogleCalendar: (chatbotId: string) => Promise<void>
  disconnectCalendar: (chatbotId: string) => Promise<void>
}

export const createBookingSlice: StateCreator<
  BookingSlice,
  [['zustand/devtools', never]],
  []
> = (set, get) => ({
  duration: 30,
  timezone: 'UTC',
  notificationEmail: null,
  locationType: null,
  locationAddress: null,
  locationPhone: null,
  availabilities: [],
  appointments: [],
  calendarIntegration: null,
  fetchingAvailabilities: false,
  fetchingAppointments: false,
  creatingDayId: null,
  updatingSlotId: null,
  deletingSlotId: null,
  connectingCalendar: false,
  disconnectingCalendar: false,

  clearAvailabilities: () => {
    set(
      {
        availabilities: [],
        duration: 30,
        timezone: 'UTC',
        notificationEmail: null,
        locationType: null,
        locationAddress: null,
        locationPhone: null,
        calendarIntegration: null,
      },
      undefined,
      '[Booking] Clear Availabilities'
    )
  },

  clearAppointments: () => {
    set({ appointments: [] }, undefined, '[Booking] Clear Appointments')
  },

  fetchAppointments: async (chatbotId: string) => {
    set({ fetchingAppointments: true }, undefined, '[Booking] Fetching Appointments')
    try {
      const res = await bookingsService.getAppointments(chatbotId)
      set(
        { appointments: res.data.data ?? [] },
        undefined,
        '[Booking] Fetch Appointments'
      )
    } finally {
      set({ fetchingAppointments: false }, undefined, '[Booking] Fetching Appointments Done')
    }
  },

  refreshAvailabilities: async (chatbotId: string) => {
    const res = await bookingsService.getAvailability(chatbotId)
    set({ availabilities: res.data.data ?? [] }, undefined, '[Booking] Refresh Availabilities')
  },

  fetchBookingData: async (chatbotId: string) => {
    set({ fetchingAvailabilities: true }, undefined, '[Booking] Fetching Booking Data')
    try {
      // Calendar status is non-critical — failure here must not block booking config/availability.
      const calendarPromise = calendarService.getStatus(chatbotId).catch(err => {
        console.error('[Booking] calendar status fetch failed:', err)
        return null
      })
      const [configRes, availabilityRes, calendarRes] = await Promise.all([
        bookingsService.getBookingConfig(chatbotId),
        bookingsService.getAvailability(chatbotId),
        calendarPromise,
      ])
      const config = configRes.data.data
      const availabilities = availabilityRes.data.data ?? []
      const calendarIntegration = calendarRes ? calendarRes.data.data?.integration ?? null : null
      set(
        {
          duration: config?.appointmentDuration ?? 30,
          timezone: config?.timezone ?? 'UTC',
          notificationEmail: config?.notificationEmail ?? null,
          locationType: config?.locationType ?? null,
          locationAddress: config?.locationAddress ?? null,
          locationPhone: config?.locationPhone ?? null,
          availabilities,
          calendarIntegration,
        },
        undefined,
        '[Booking] Fetch Booking Data'
      )
    } finally {
      set({ fetchingAvailabilities: false }, undefined, '[Booking] Fetching Booking Data Done')
    }
  },

  updateDuration: async (chatbotId: string, duration: number) => {
    const response = await bookingsService.updateBookingConfig(chatbotId, {
      appointmentDuration: duration,
    })
    const config = response.data.data
    if (!config) throw new Error('Failed to update duration')
    set({ duration: config.appointmentDuration }, undefined, '[Booking] Update Duration')
  },

  updateTimezone: async (chatbotId: string, timezone: string) => {
    const response = await bookingsService.updateBookingConfig(chatbotId, { timezone })
    const config = response.data.data
    if (!config) throw new Error('Failed to update timezone')
    set({ timezone: config.timezone }, undefined, '[Booking] Update Timezone')
  },

  updateNotificationEmail: async (chatbotId: string, email: string) => {
    const response = await bookingsService.updateBookingConfig(chatbotId, {
      notificationEmail: email,
    })
    const config = response.data.data
    if (!config) throw new Error('Failed to update notification email')
    set(
      { notificationEmail: config.notificationEmail || null },
      undefined,
      '[Booking] Update Notification Email'
    )
  },

  updateLocation: async (chatbotId: string, data: UpdateBookingConfigRequest) => {
    const response = await bookingsService.updateBookingConfig(chatbotId, data)
    const config = response.data.data
    if (!config) throw new Error('Failed to update location')
    set(
      {
        locationType: config.locationType ?? null,
        locationAddress: config.locationAddress ?? null,
        locationPhone: config.locationPhone ?? null,
      },
      undefined,
      '[Booking] Update Location'
    )
  },

  createAvailability: async (chatbotId: string, data: CreateAvailabilityRequest) => {
    const dayId = data.scheduleType === 'WEEKLY' ? data.dayOfWeek : -1
    set({ creatingDayId: dayId }, undefined, '[Booking] Creating Availability')
    try {
      await bookingsService.createAvailability(chatbotId, data)
      await get().refreshAvailabilities(chatbotId)
    } finally {
      set({ creatingDayId: null }, undefined, '[Booking] Creating Availability Done')
    }
  },

  updateAvailability: async (chatbotId: string, slotId: string, data: UpdateTimeSlotsRequest) => {
    set(
      state => ({
        updatingSlotId: slotId,
        availabilities: state.availabilities.map(a =>
          a.id === slotId ? { ...a, timeSlots: data.timeSlots } : a
        ),
      }),
      undefined,
      '[Booking] Update Availability Optimistic'
    )
    try {
      await bookingsService.updateTimeSlots(chatbotId, slotId, data)
      await get().refreshAvailabilities(chatbotId)
    } finally {
      set({ updatingSlotId: null }, undefined, '[Booking] Updating Availability Done')
    }
  },

  deleteAvailability: async (chatbotId: string, slotId: string) => {
    set(
      state => ({
        deletingSlotId: slotId,
        availabilities: state.availabilities.filter(a => a.id !== slotId),
      }),
      undefined,
      '[Booking] Delete Availability Optimistic'
    )
    try {
      await bookingsService.deleteSlot(chatbotId, slotId)
      await get().refreshAvailabilities(chatbotId)
    } finally {
      set({ deletingSlotId: null }, undefined, '[Booking] Deleting Availability Done')
    }
  },

  connectGoogleCalendar: async (chatbotId: string) => {
    // Open the popup synchronously so the browser counts it as user-initiated.
    // It loads about:blank first, then we navigate it once we have the URL.
    const w = 500
    const h = 650
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2
    const popup = window.open(
      'about:blank',
      'pulsechat-calendar-connect',
      `width=${w},height=${h},left=${left},top=${top},popup=yes`
    )
    if (!popup) throw new Error('popup_blocked')

    set({ connectingCalendar: true }, undefined, '[Booking] Connecting Calendar')
    let onMessage: ((e: MessageEvent) => void) | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let settled = false

    try {
      const res = await calendarService.getGoogleAuthorizeUrl(chatbotId)
      const url = res.data.data?.url
      if (!url) throw new Error('no_authorize_url')

      try {
        popup.location.href = url
      } catch {
        // Some browsers block cross-origin location writes; fall back to opener replace.
        popup.location.replace(url)
      }

      let apiOrigin: string | null = null
      try {
        apiOrigin = new URL(import.meta.env.VITE_API_URL ?? '', window.location.origin).origin
      } catch {
        apiOrigin = null
      }

      await new Promise<void>((resolve, reject) => {
        const safeResolve = () => {
          if (settled) return
          settled = true
          resolve()
        }
        const safeReject = (err: Error) => {
          if (settled) return
          settled = true
          reject(err)
        }

        onMessage = (event: MessageEvent) => {
          if (apiOrigin && event.origin !== apiOrigin) return
          const data = event.data as { type?: string; success?: boolean; error?: string } | null
          if (!data || data.type !== 'calendar-connect') return
          if (data.success) safeResolve()
          else safeReject(new Error(String(data.error || 'connect_failed')))
        }
        window.addEventListener('message', onMessage)

        // Fallback: when the popup closes without us having heard a message
        // (firewall, blocked postMessage, mismatched origins), poll the status
        // endpoint — if the integration exists, treat it as success.
        pollTimer = setInterval(async () => {
          if (settled || !popup.closed) return
          if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
          }
          try {
            const status = await calendarService.getStatus(chatbotId)
            if (status.data.data?.integration) {
              safeResolve()
              return
            }
          } catch {
            // ignore — fall through to popup_closed
          }
          safeReject(new Error('popup_closed'))
        }, 500)
      })

      // Refresh the integration in state. If this status call itself fails,
      // we still treat the connect as a success — the next page load will hydrate it.
      try {
        const status = await calendarService.getStatus(chatbotId)
        set(
          { calendarIntegration: status.data.data?.integration ?? null },
          undefined,
          '[Booking] Calendar Connected'
        )
      } catch (err) {
        console.error('[Booking] post-connect status fetch failed:', err)
      }
    } finally {
      if (onMessage) window.removeEventListener('message', onMessage)
      if (pollTimer) clearInterval(pollTimer)
      try {
        if (!popup.closed) popup.close()
      } catch {
        /* ignore */
      }
      set({ connectingCalendar: false }, undefined, '[Booking] Connecting Calendar Done')
    }
  },

  disconnectCalendar: async (chatbotId: string) => {
    set({ disconnectingCalendar: true }, undefined, '[Booking] Disconnecting Calendar')
    try {
      await calendarService.disconnect(chatbotId)
      set(
        { calendarIntegration: null },
        undefined,
        '[Booking] Calendar Disconnected'
      )
    } catch (err) {
      console.error('[Booking] disconnect failed:', err)
      throw err
    } finally {
      set({ disconnectingCalendar: false }, undefined, '[Booking] Disconnecting Calendar Done')
    }
  },
})
