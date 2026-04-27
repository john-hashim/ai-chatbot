import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type {
  AvailabilitySchedule,
  CreateAvailabilityRequest,
  UpdateTimeSlotsRequest,
  BookingConfig,
  UpdateBookingConfigRequest,
  GetTimeSlotsRequest,
  GetTimeSlotsResponse,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  CancelBookingResponse,
  Appointment,
} from '@/types/bookings'

export const bookingsService = {
  createAvailability: (
    chatbotId: string,
    data: CreateAvailabilityRequest
  ): Promise<AxiosResponse<ApiResponse<AvailabilitySchedule>>> => {
    return apiClient.post(
      ENDPOINTS.BOOKINGS.CREATE_AVAILABILITY.replace(':chatbotId', chatbotId),
      data
    )
  },

  getAvailability: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<AvailabilitySchedule[]>>> => {
    return apiClient.get(
      ENDPOINTS.BOOKINGS.GET_AVAILABILITY.replace(':chatbotId', chatbotId)
    )
  },

  updateTimeSlots: (
    chatbotId: string,
    slotId: string,
    data: UpdateTimeSlotsRequest
  ): Promise<AxiosResponse<ApiResponse<AvailabilitySchedule>>> => {
    return apiClient.patch(
      ENDPOINTS.BOOKINGS.UPDATE_TIMESLOTS.replace(':chatbotId', chatbotId).replace(':slotId', slotId),
      data
    )
  },

  deleteSlot: (
    chatbotId: string,
    slotId: string
  ): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(
      ENDPOINTS.BOOKINGS.DELETE_SLOT.replace(':chatbotId', chatbotId).replace(':slotId', slotId)
    )
  },

  getBookingConfig: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<BookingConfig | null>>> => {
    return apiClient.get(
      ENDPOINTS.BOOKINGS.GET_CONFIG.replace(':chatbotId', chatbotId)
    )
  },

  updateBookingConfig: (
    chatbotId: string,
    data: UpdateBookingConfigRequest
  ): Promise<AxiosResponse<ApiResponse<BookingConfig>>> => {
    return apiClient.patch(
      ENDPOINTS.BOOKINGS.UPDATE_CONFIG.replace(':chatbotId', chatbotId),
      data
    )
  },

  getTimeSlotsForDate: (
    chatbotId: string,
    data: GetTimeSlotsRequest
  ): Promise<AxiosResponse<ApiResponse<GetTimeSlotsResponse>>> => {
    return apiClient.post(
      ENDPOINTS.BOOKINGS.GET_TIMESLOTS.replace(':chatbotId', chatbotId),
      data
    )
  },

  confirmBooking: (
    chatbotId: string,
    data: ConfirmBookingRequest
  ): Promise<AxiosResponse<ApiResponse<ConfirmBookingResponse>>> => {
    return apiClient.post(
      ENDPOINTS.BOOKINGS.CONFIRM.replace(':chatbotId', chatbotId),
      data
    )
  },

  cancelBookingFlow: (
    chatbotId: string,
    sessionId: string
  ): Promise<AxiosResponse<ApiResponse<CancelBookingResponse>>> => {
    return apiClient.post(
      ENDPOINTS.BOOKINGS.CANCEL.replace(':chatbotId', chatbotId),
      { sessionId }
    )
  },

  getAppointments: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<Appointment[]>>> => {
    return apiClient.get(
      ENDPOINTS.BOOKINGS.GET_APPOINTMENTS.replace(':chatbotId', chatbotId)
    )
  },
}
