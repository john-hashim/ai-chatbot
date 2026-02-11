import { useEffect, useState } from 'react'
import { Select, Skeleton } from '@mantine/core'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  MessageSquare,
  MessagesSquare,
  BarChart3,
  ThumbsDown,
  TrendingUp,
  Globe,
} from 'lucide-react'
import { useChatbotStore } from '@/store'
import { useApi } from '@/hooks/useApi'
import { analyticsService } from '@/api/services/analytics'
import type { AnalyticsData, AnalyticsPeriod } from '@/types/analytics'
import type { ApiResponse } from '@/types/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  loading?: boolean
}

const StatCard = ({ title, value, icon, loading }: StatCardProps) => (
  <div className="px-4 py-4 border border-border-week bg-white rounded-lg">
    <div className="flex items-center gap-1.5 text-text-secondary mb-2">
      {icon}
      <span className="text-xs">{title}</span>
    </div>
    {loading ? (
      <Skeleton height={28} width={60} mt={4} />
    ) : (
      <p className="text-2xl font-semibold">{value}</p>
    )}
  </div>
)

export const Analytics = () => {
  const { currentChatbot } = useChatbotStore()
  const { execute: fetchAnalytics, data, loading } = useApi<
    ApiResponse<AnalyticsData>,
    [string, AnalyticsPeriod]
  >(analyticsService.getAnalytics)
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')

  useEffect(() => {
    if (currentChatbot?.id) {
      fetchAnalytics(currentChatbot.id, period).catch(() => {})
    }
  }, [currentChatbot?.id, period, fetchAnalytics])

  const analytics = data?.data
  const summary = analytics?.summary

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <p className="text-sm text-text-secondary mt-1">
            Monitor your chatbot performance
          </p>
        </div>
        <Select
          value={period}
          onChange={(val) => setPeriod((val as AnalyticsPeriod) || '30d')}
          data={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
            { value: 'all', label: 'All time' },
          ]}
          w={160}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          title="Total Conversations"
          value={summary?.totalConversations ?? 0}
          icon={<MessagesSquare size={14} strokeWidth={1.5} />}
          loading={loading}
        />
        <StatCard
          title="Total Messages"
          value={summary?.totalMessages ?? 0}
          icon={<MessageSquare size={14} strokeWidth={1.5} />}
          loading={loading}
        />
        <StatCard
          title="Avg Messages / Session"
          value={summary?.avgMessagesPerSession ?? 0}
          icon={<BarChart3 size={14} strokeWidth={1.5} />}
          loading={loading}
        />
        <StatCard
          title="Avg Confidence"
          value={
            summary?.avgConfidenceScore != null
              ? `${(summary.avgConfidenceScore * 100).toFixed(1)}%`
              : 'N/A'
          }
          icon={<TrendingUp size={14} strokeWidth={1.5} />}
          loading={loading}
        />
        <StatCard
          title="Thumbs Down"
          value={summary?.thumbsDownCount ?? 0}
          icon={<ThumbsDown size={14} strokeWidth={1.5} />}
          loading={loading}
        />
      </div>

      {/* Chart: Conversations Over Time */}
      <div className="border border-border-week bg-white rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-4">Conversations Over Time</h3>
        {loading ? (
          <Skeleton height={300} radius="sm" />
        ) : analytics?.conversationsOverTime && analytics.conversationsOverTime.length > 0 ? (
          <ResponsiveContainer width="99%" height={300}>
            <AreaChart data={analytics.conversationsOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fe5e51" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#fe5e51" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={formatDateLabel}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(label) => formatDateLabel(String(label))}
                contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Conversations"
                stroke="#fe5e51"
                fill="url(#colorCount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
            No conversation data for this period
          </div>
        )}
      </div>

      {/* Country Breakdown */}
      <div className="border border-border-week bg-white rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} strokeWidth={1.5} className="text-text-secondary" />
          <h3 className="text-sm font-medium">Users by Country</h3>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton height={20} />
            <Skeleton height={20} width="70%" />
          </div>
        ) : analytics?.countryBreakdown && analytics.countryBreakdown.length > 0 ? (
          <div className="space-y-1">
            {analytics.countryBreakdown.map((item) => (
              <div
                key={item.countryCode}
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 text-sm"
              >
                <span>{item.country}</span>
                <span className="text-text-secondary font-medium">
                  {item.count} {item.count === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-text-secondary text-sm">
            No country data available yet
          </div>
        )}
      </div>
    </div>
  )
}
