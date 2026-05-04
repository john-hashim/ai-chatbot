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

export type LocationType = 'GOOGLE_MEET' | 'IN_PERSON' | 'ZOOM' | 'PHONE'

export interface BookingConfig {
  id: string
  chatbotId: string
  isEnabled: boolean
  timezone: string
  appointmentDuration: number
  confirmationMessage?: string | null
  notificationEmail?: string | null
  locationType?: LocationType | null
  locationAddress?: string | null
  locationPhone?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateBookingConfigRequest {
  isEnabled?: boolean
  timezone?: string
  appointmentDuration?: number
  notificationEmail?: string
  locationType?: LocationType | null
  locationAddress?: string | null
  locationPhone?: string | null
}

export interface GetTimeSlotsRequest {
  sessionId: string
  date: string
}

export interface GetTimeSlotsResponse {
  date: string
  timeslots: string[]
  message: ChatMessage
}

export interface Appointment {
  id: string
  chatbotId: string
  sessionId: string
  email: string
  name: string | null
  phone: string | null
  date: string
  timeslot: string
  status: 'PENDING' | 'CONFIRMED' | 'UPCOMING' | 'PAST' | 'CANCELLED'
  timezone: string | null
  locationType: LocationType | null
  locationAddress: string | null
  locationPhone: string | null
  createdAt: string
  updatedAt: string
}

export interface CancelBookingResponse {
  message: ChatMessage
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources: string[]
  createdAt: string
}

export interface CalendarIntegration {
  provider: 'google'
  accountEmail: string
}

export interface CalendarStatusResponse {
  integration: CalendarIntegration | null
}

export interface CalendarAuthorizeResponse {
  url: string
}
