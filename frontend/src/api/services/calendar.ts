import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type { CalendarStatusResponse, CalendarAuthorizeResponse } from '@/types/bookings'

export const calendarService = {
  getStatus: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<CalendarStatusResponse>>> => {
    return apiClient.get(ENDPOINTS.CALENDAR.GET_STATUS.replace(':chatbotId', chatbotId))
  },

  getGoogleAuthorizeUrl: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<CalendarAuthorizeResponse>>> => {
    return apiClient.get(ENDPOINTS.CALENDAR.AUTHORIZE_GOOGLE.replace(':chatbotId', chatbotId))
  },

  disconnect: (chatbotId: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(ENDPOINTS.CALENDAR.DISCONNECT.replace(':chatbotId', chatbotId))
  },
}
