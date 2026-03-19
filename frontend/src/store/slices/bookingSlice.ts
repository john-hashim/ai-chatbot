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

  // Loading states
  fetchingAvailabilities: boolean
  creatingDayId: number | null
  updatingSlotId: string | null
  deletingSlotId: string | null

  // Actions
  fetchBookingData: (chatbotId: string) => Promise<void>
  refreshAvailabilities: (chatbotId: string) => Promise<void>
  clearAvailabilities: () => void
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
> = (set, get) => ({
  duration: 30,
  timezone: 'UTC',
  availabilities: [],
  fetchingAvailabilities: false,
  creatingDayId: null,
  updatingSlotId: null,
  deletingSlotId: null,

  clearAvailabilities: () => {
    set({ availabilities: [] }, undefined, '[Booking] Clear Availabilities')
  },

  refreshAvailabilities: async (chatbotId: string) => {
    const res = await bookingsService.getAvailability(chatbotId)
    set({ availabilities: res.data.data ?? [] }, undefined, '[Booking] Refresh Availabilities')
  },

  fetchBookingData: async (chatbotId: string) => {
    set({ fetchingAvailabilities: true }, undefined, '[Booking] Fetching Booking Data')
    try {
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
})
