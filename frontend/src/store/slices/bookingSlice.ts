import { bookingsService } from '@/api/services/bookings'
import type {
  AvailabilitySchedule,
  CreateAvailabilityRequest,
  UpdateTimeSlotsRequest,
} from '@/types/bookings'
import type { StateCreator } from 'zustand'

export interface BookingSlice {
  // State
  duration: number
  timezone: string
  availabilities: AvailabilitySchedule[]

  // Actions
  fetchBookingData: (chatbotId: string) => Promise<void>
  updateDuration: (chatbotId: string, duration: number) => Promise<void>
  updateTimezone: (chatbotId: string, timezone: string) => Promise<void>
  createAvailability: (chatbotId: string, data: CreateAvailabilityRequest) => Promise<void>
  updateAvailability: (
    chatbotId: string,
    slotId: string,
    data: UpdateTimeSlotsRequest
  ) => Promise<void>
  deleteAvailability: (chatbotId: string, slotId: string) => Promise<void>

}

export const createBookingSlice: StateCreator<
  BookingSlice,
  [['zustand/devtools', never]],
  []
> = set => ({
  duration: 30,
  timezone: 'UTC',
  availabilities: [],

  fetchBookingData: async (chatbotId: string) => {
    const [configRes, availabilityRes] = await Promise.all([
      bookingsService.getBookingConfig(chatbotId),
      bookingsService.getAvailability(chatbotId),
    ])
    const config = configRes.data.data
    const availabilities = availabilityRes.data.data ?? []
    set(
      {
        duration: config?.appointmentDuration ?? 30,
        timezone: config?.timezone ?? 'UTC',
        availabilities,
      },
      undefined,
      '[Booking] Fetch Booking Data'
    )
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

  createAvailability: async (chatbotId: string, data: CreateAvailabilityRequest) => {
    const response = await bookingsService.createAvailability(chatbotId, data)
    const schedule = response.data.data
    if (!schedule) throw new Error('Failed to create availability')
    set(
      state => ({
        availabilities: [...state.availabilities, schedule],
      }),
      undefined,
      '[Booking] Create Availability'
    )
  },

  updateAvailability: async (chatbotId: string, slotId: string, data: UpdateTimeSlotsRequest) => {
    const response = await bookingsService.updateTimeSlots(chatbotId, slotId, data)
    const updated = response.data.data
    if (!updated) throw new Error('Failed to update availability')
    set(
      state => ({
        availabilities: state.availabilities.map(a => (a.id === slotId ? updated : a)),
      }),
      undefined,
      '[Booking] Update Availability'
    )
  },

  deleteAvailability: async (chatbotId: string, slotId: string) => {
    await bookingsService.deleteSlot(chatbotId, slotId)
    set(
      state => ({
        availabilities: state.availabilities.filter(a => a.id !== slotId),
      }),
      undefined,
      '[Booking] Delete Availability'
    )
  },
})
