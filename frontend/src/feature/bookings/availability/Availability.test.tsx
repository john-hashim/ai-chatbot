import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Availability } from './Availability'

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { open: vi.fn(), close: vi.fn(), closeAll: vi.fn() },
}))

vi.mock('./WeeklyAvailability', () => ({
  WeeklyAvailability: ({
    createWeeklyAvailablity,
  }: {
    createWeeklyAvailablity: (dayOfWeek: number) => void
  }) => (
    <button data-testid="create-weekly" onClick={() => createWeeklyAvailablity(1)}>
      Create Weekly Monday
    </button>
  ),
}))

vi.mock('./DateSpecificHours', () => ({
  DateSpecificHours: ({
    createDateSpecificAvailability,
  }: {
    createDateSpecificAvailability: (dates: string[], s: string, e: string) => void
  }) => (
    <button
      data-testid="create-specific"
      onClick={() => createDateSpecificAvailability(['2099-01-01'], '09:00', '17:00')}
    >
      Create Specific
    </button>
  ),
}))

const createAvailabilityMock = vi.fn()

vi.mock('@/store', () => ({
  useBookingStore: () => ({
    timezone: 'UTC',
    createAvailability: createAvailabilityMock,
    fetchingAvailabilities: false,
    availabilities: [],
  }),
  useChatbotStore: () => ({
    currentChatbot: { id: 'cb1' },
  }),
}))

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
      data: {},
    }
  )
}

const renderAvailability = () =>
  render(
    <MantineProvider>
      <Availability />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  createAvailabilityMock.mockResolvedValue(undefined)
})

describe('Availability', () => {
  it('renders header and child components', () => {
    renderAvailability()
    expect(screen.getByText('Availability')).toBeInTheDocument()
    // The two child mocks are rendered twice (desktop+mobile flex layouts).
    expect(screen.getAllByTestId('create-weekly').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('create-specific').length).toBeGreaterThan(0)
  })

  describe('createWeeklyAvailablity', () => {
    const trigger = async () => {
      renderAvailability()
      await userEvent.click(screen.getAllByTestId('create-weekly')[0]!)
    }

    it('shows success on success', async () => {
      await trigger()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Availability added.')
      )
    })

    it('shows generic on 4xx', async () => {
      createAvailabilityMock.mockRejectedValueOnce(makeAxiosError(400))
      await trigger()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not add availability. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      createAvailabilityMock.mockRejectedValueOnce(makeAxiosError(500))
      await trigger()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('createDateSpecificAvailability', () => {
    const trigger = async () => {
      renderAvailability()
      await userEvent.click(screen.getAllByTestId('create-specific')[0]!)
    }

    it('shows success on success', async () => {
      await trigger()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Availability added.')
      )
    })

    it('shows generic on 4xx', async () => {
      createAvailabilityMock.mockRejectedValueOnce(makeAxiosError(400))
      await trigger()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not add availability. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      createAvailabilityMock.mockRejectedValueOnce(makeAxiosError(500))
      await trigger()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })
})
