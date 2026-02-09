import { prisma } from '../prisma/client.js'

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

interface MessageStats {
  total_messages: bigint
  avg_confidence: number | null
  thumbs_down: bigint
}

export async function getAnalytics(
  chatbotId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsData> {
  const [
    totalConversations,
    messageStats,
    conversationsOverTime,
    countryBreakdown,
  ] = await Promise.all([
    // 1. Total conversations
    prisma.chatSession.count({
      where: { chatbotId, createdAt: { gte: startDate, lte: endDate } },
    }),

    // 2. Message stats in a single query (total, avg confidence, thumbs down)
    prisma.$queryRaw<MessageStats[]>`
      SELECT
        COUNT(*)::bigint AS total_messages,
        AVG(CASE WHEN cm."role" = 'assistant' AND cm."confidenceScore" IS NOT NULL
            THEN cm."confidenceScore" END) AS avg_confidence,
        COUNT(CASE WHEN cm."feedback" = 'dislike' THEN 1 END)::bigint AS thumbs_down
      FROM "chat_messages" cm
      JOIN "chat_sessions" cs ON cm."sessionId" = cs."id"
      WHERE cs."chatbotId" = ${chatbotId}
        AND cs."createdAt" >= ${startDate}
        AND cs."createdAt" <= ${endDate}
    `,

    // 3. Conversations over time
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(cs."createdAt") as date, COUNT(*)::bigint as count
      FROM "chat_sessions" cs
      WHERE cs."chatbotId" = ${chatbotId}
        AND cs."createdAt" >= ${startDate}
        AND cs."createdAt" <= ${endDate}
      GROUP BY DATE(cs."createdAt")
      ORDER BY date ASC
    `,

    // 4. Country breakdown
    prisma.$queryRaw<{ country: string; countryCode: string; count: bigint }[]>`
      SELECT cs."country", cs."countryCode", COUNT(*)::bigint as count
      FROM "chat_sessions" cs
      WHERE cs."chatbotId" = ${chatbotId}
        AND cs."createdAt" >= ${startDate}
        AND cs."createdAt" <= ${endDate}
        AND cs."country" IS NOT NULL
      GROUP BY cs."country", cs."countryCode"
      ORDER BY count DESC
    `,
  ])

  const stats = messageStats[0]!
  const totalMessages = Number(stats.total_messages)
  const avgMessagesPerSession =
    totalConversations > 0
      ? Math.round((totalMessages / totalConversations) * 10) / 10
      : 0

  return {
    summary: {
      totalConversations,
      totalMessages,
      avgMessagesPerSession,
      avgConfidenceScore: stats.avg_confidence,
      thumbsDownCount: Number(stats.thumbs_down),
    },
    conversationsOverTime: conversationsOverTime.map(row => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split('T')[0]!
          : String(row.date),
      count: Number(row.count),
    })),
    countryBreakdown: countryBreakdown.map(row => ({
      country: row.country,
      countryCode: row.countryCode,
      count: Number(row.count),
    })),
  }
}
