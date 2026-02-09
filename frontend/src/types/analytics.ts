export interface AnalyticsSummary {
  totalConversations: number
  totalMessages: number
  avgMessagesPerSession: number
  avgConfidenceScore: number | null
  thumbsDownCount: number
}

export interface DailyConversation {
  date: string
  count: number
}

export interface CountryBreakdown {
  country: string
  countryCode: string
  count: number
}

export interface AnalyticsData {
  summary: AnalyticsSummary
  conversationsOverTime: DailyConversation[]
  countryBreakdown: CountryBreakdown[]
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all'
