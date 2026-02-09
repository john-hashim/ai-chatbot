import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { AnalyticsData, AnalyticsPeriod } from '@/types/analytics'
import type { ApiResponse } from '@/types/api'

export const analyticsService = {
  getAnalytics: (
    chatbotId: string,
    period: AnalyticsPeriod = '30d'
  ): Promise<AxiosResponse<ApiResponse<AnalyticsData>>> => {
    return apiClient.get(
      ENDPOINTS.ANALYTICS.GET.replace(':chatbotId', chatbotId),
      { params: { period } }
    )
  },
}
