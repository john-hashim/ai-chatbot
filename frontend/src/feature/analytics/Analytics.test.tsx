import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Analytics } from './Analytics'
import type { AnalyticsData } from '@/types/analytics'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { openConfirmModal: vi.fn(), close: vi.fn(), updateModal: vi.fn() },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const fetchAnalyticsMock = vi.fn()

let chatbotState: { currentChatbot: { id: string } | null }
let analyticsState: {
  analytics: AnalyticsData | null
  isLoadingAnalytics: boolean
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({ currentChatbot: chatbotState.currentChatbot }),
  useAnalyticsStore: () => ({
    analytics: analyticsState.analytics,
    isLoadingAnalytics: analyticsState.isLoadingAnalytics,
    fetchAnalytics: fetchAnalyticsMock,
    clearAnalytics: vi.fn(),
  }),
}))

const renderAnalytics = () =>
  render(
    <MantineProvider>
      <Analytics />
    </MantineProvider>
  )

const makeAxiosError = (status: number): AxiosError => {
  const headers = new AxiosHeaders()
  return new AxiosError(
    `Request failed with status ${status}`,
    String(status),
    { headers } as never,
    null,
    {
      status,
      statusText: '',
      headers: {},
      config: { headers } as never,
      data: { message: 'backend message' },
    }
  )
}

const sampleAnalytics: AnalyticsData = {
  summary: {
    totalConversations: 12,
    totalMessages: 88,
    avgMessagesPerSession: 7.3,
    avgConfidenceScore: 0.825,
    thumbsDownCount: 2,
  },
  conversationsOverTime: [
    { date: '2026-05-01', count: 3 },
    { date: '2026-05-02', count: 5 },
  ],
  countryBreakdown: [
    { country: 'India', countryCode: 'IN', count: 4 },
    { country: 'United States', countryCode: 'US', count: 1 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  chatbotState = { currentChatbot: { id: 'cb1' } }
  analyticsState = { analytics: null, isLoadingAnalytics: false }
  fetchAnalyticsMock.mockResolvedValue(undefined)
  // jsdom lacks scrollIntoView, which Mantine Combobox calls on highlight
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Analytics', () => {
  describe('rendering', () => {
    it('shows skeletons while loading', () => {
      analyticsState.isLoadingAnalytics = true
      renderAnalytics()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })

    it('shows zero-values + empty placeholders when no data yet', () => {
      renderAnalytics()
      expect(screen.getByText('Total Conversations')).toBeInTheDocument()
      expect(screen.getByText('No conversation data for this period')).toBeInTheDocument()
      expect(screen.getByText('No country data available yet')).toBeInTheDocument()
    })

    it('renders summary, chart, and country list when populated', () => {
      analyticsState.analytics = sampleAnalytics
      renderAnalytics()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('88')).toBeInTheDocument()
      expect(screen.getByText('82.5%')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      expect(screen.getByText('India')).toBeInTheDocument()
      expect(screen.getByText('1 session')).toBeInTheDocument()
      expect(screen.getByText('4 sessions')).toBeInTheDocument()
    })

    it('shows N/A for avg confidence when null', () => {
      analyticsState.analytics = {
        ...sampleAnalytics,
        summary: { ...sampleAnalytics.summary, avgConfidenceScore: null },
      }
      renderAnalytics()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('fetch behavior', () => {
    it('calls fetchAnalytics with the current chatbot id and default 30d period', async () => {
      renderAnalytics()
      await waitFor(() =>
        expect(fetchAnalyticsMock).toHaveBeenCalledWith('cb1', '30d')
      )
    })

    it('does not fetch when no current chatbot', async () => {
      chatbotState.currentChatbot = null
      renderAnalytics()
      await new Promise(r => setTimeout(r, 0))
      expect(fetchAnalyticsMock).not.toHaveBeenCalled()
    })

    it('refetches when the period select changes', async () => {
      renderAnalytics()
      await waitFor(() => expect(fetchAnalyticsMock).toHaveBeenCalledTimes(1))

      await userEvent.click(screen.getByRole('textbox'))
      await userEvent.click(await screen.findByText('Last 7 days'))

      await waitFor(() => expect(fetchAnalyticsMock).toHaveBeenCalledWith('cb1', '7d'))
    })
  })

  describe('error handling', () => {
    it('toasts "Chatbot not found." on 404', async () => {
      fetchAnalyticsMock.mockRejectedValueOnce(makeAxiosError(404))
      renderAnalytics()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('error', 'Chatbot not found.')
      )
    })

    it('toasts generic message on other 4xx', async () => {
      fetchAnalyticsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderAnalytics()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load analytics. Please try again.'
        )
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      fetchAnalyticsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderAnalytics()
      await waitFor(() => expect(fetchAnalyticsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })

    it('stays silent on non-axios errors', async () => {
      fetchAnalyticsMock.mockRejectedValueOnce(new Error('boom'))
      renderAnalytics()
      await waitFor(() => expect(fetchAnalyticsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })
})
