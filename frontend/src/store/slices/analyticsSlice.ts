import { analyticsService } from '@/api/services/analytics'
import type { AnalyticsData, AnalyticsPeriod } from '@/types/analytics'
import type { StateCreator } from 'zustand'

export interface AnalyticsSlice {
  analytics: AnalyticsData | null
  isLoadingAnalytics: boolean
  fetchAnalytics: (chatbotId: string, period: AnalyticsPeriod) => Promise<void>
  clearAnalytics: () => void
}

const initialAnalyticsState = {
  analytics: null as AnalyticsData | null,
  isLoadingAnalytics: false,
}

export const createAnalyticsSlice: StateCreator<
  AnalyticsSlice,
  [['zustand/devtools', never]],
  []
> = set => ({
  ...initialAnalyticsState,

  fetchAnalytics: async (chatbotId, period) => {
    set({ isLoadingAnalytics: true }, undefined, '[Analytics] Loading')
    try {
      const response = await analyticsService.getAnalytics(chatbotId, period)
      set(
        { analytics: response.data.data ?? null },
        undefined,
        '[Analytics] Set Data'
      )
    } finally {
      set({ isLoadingAnalytics: false }, undefined, '[Analytics] Loading Done')
    }
  },

  clearAnalytics: () => set(initialAnalyticsState, undefined, '[Analytics] Clear'),
})
