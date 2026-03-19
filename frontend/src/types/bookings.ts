export type ScheduleType = 'WEEKLY' | 'SPECIFIC_DATE'

export interface TimeSlot {
  startTime: string
  endTime: string
}

export interface AvailabilitySchedule {
  id: string
  chatbotId: string
  timezone: string
  scheduleType: ScheduleType
  dayOfWeek?: number
  specificDate?: string
  timeSlots: TimeSlot[]
  createdAt: string
  updatedAt: string
}

export interface CreateWeeklyAvailabilityRequest {
  timezone: string
  scheduleType: 'WEEKLY'
  dayOfWeek: number
  timeSlots: TimeSlot[]
}

export interface CreateSpecificDateAvailabilityRequest {
  timezone: string
  scheduleType: 'SPECIFIC_DATE'
  specificDates: string[]
  timeSlots: TimeSlot[]
}

export type CreateAvailabilityRequest =
  | CreateWeeklyAvailabilityRequest
  | CreateSpecificDateAvailabilityRequest

export interface UpdateTimeSlotsRequest {
  timeSlots: TimeSlot[]
  specificDate?: string
}

export interface BookingConfig {
  id: string
  chatbotId: string
  isEnabled: boolean
  timezone: string
  appointmentDuration: number
  confirmationMessage?: string | null
  notificationEmail?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateBookingConfigRequest {
  isEnabled?: boolean
  timezone?: string
  appointmentDuration?: number
}
