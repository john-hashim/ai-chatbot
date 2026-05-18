import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { BookingSettings } from './BookingSettings'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ chatbotId: 'cb1' }),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { open: vi.fn(), close: vi.fn(), closeAll: vi.fn() },
}))

const updateDurationMock = vi.fn()
const updateTimezoneMock = vi.fn()
const updateNotificationEmailMock = vi.fn()
const updateLocationMock = vi.fn()
const connectGoogleCalendarMock = vi.fn()
const disconnectCalendarMock = vi.fn()

vi.mock('@/store', () => ({
  useBookingStore: () => ({
    duration: 30,
    timezone: 'UTC',
    notificationEmail: 'test@example.com',
    locationType: null,
    locationAddress: null,
    locationPhone: null,
    calendarIntegration: null,
    connectingCalendar: false,
    disconnectingCalendar: false,
    fetchingAvailabilities: false,
    updateDuration: updateDurationMock,
    updateTimezone: updateTimezoneMock,
    updateNotificationEmail: updateNotificationEmailMock,
    updateLocation: updateLocationMock,
    connectGoogleCalendar: connectGoogleCalendarMock,
    disconnectCalendar: disconnectCalendarMock,
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
      data: { message: 'backend message' },
    }
  )
}

const renderSettings = () =>
  render(
    <MantineProvider>
      <BookingSettings />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  updateDurationMock.mockResolvedValue(undefined)
  updateTimezoneMock.mockResolvedValue(undefined)
  updateNotificationEmailMock.mockResolvedValue(undefined)
  updateLocationMock.mockResolvedValue(undefined)
  connectGoogleCalendarMock.mockResolvedValue(undefined)
  disconnectCalendarMock.mockResolvedValue(undefined)
})

describe('BookingSettings', () => {
  it('renders the settings form', () => {
    renderSettings()
    expect(screen.getByText('Timezone')).toBeInTheDocument()
    expect(screen.getByText('Schedule Duration')).toBeInTheDocument()
    expect(screen.getByText('Notification Email')).toBeInTheDocument()
  })

  describe('email save', () => {
    const openAndSave = async (email = 'new@example.com') => {
      renderSettings()
      await userEvent.click(screen.getByTitle('Edit email'))
      const input = screen.getByPlaceholderText('you@example.com')
      await userEvent.clear(input)
      await userEvent.type(input, email)
      await userEvent.click(screen.getByTitle('Save'))
    }

    it('shows success toast on save', async () => {
      await openAndSave()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Notification email saved.')
      )
    })

    it('shows "no longer exists" on 404', async () => {
      updateNotificationEmailMock.mockRejectedValueOnce(makeAxiosError(404))
      await openAndSave()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('shows generic on other 4xx', async () => {
      updateNotificationEmailMock.mockRejectedValueOnce(makeAxiosError(400))
      await openAndSave()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not save notification email. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateNotificationEmailMock.mockRejectedValueOnce(makeAxiosError(500))
      await openAndSave()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('location select', () => {
    const clickInPerson = async () => {
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /In person/i }))
    }

    it('shows success on update', async () => {
      await clickInPerson()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Location updated.')
      )
    })

    it('shows generic on 4xx', async () => {
      updateLocationMock.mockRejectedValueOnce(makeAxiosError(400))
      await clickInPerson()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not update location. Please try again.'
        )
      )
    })

    it('shows "no longer exists" on 404', async () => {
      updateLocationMock.mockRejectedValueOnce(makeAxiosError(404))
      await clickInPerson()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateLocationMock.mockRejectedValueOnce(makeAxiosError(500))
      await clickInPerson()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('connect/disconnect calendar', () => {
    it('shows success when connect resolves', async () => {
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /Connect/i }))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Calendar connected.')
      )
    })

    it('shows popup_blocked message on non-axios error', async () => {
      connectGoogleCalendarMock.mockRejectedValueOnce(new Error('popup_blocked'))
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /Connect/i }))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Pop-up blocked. Please allow pop-ups for this site and try again.'
        )
      )
    })

    it('stays silent on popup_closed', async () => {
      connectGoogleCalendarMock.mockRejectedValueOnce(new Error('popup_closed'))
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /Connect/i }))
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })

    it('shows generic on 4xx during connect', async () => {
      connectGoogleCalendarMock.mockRejectedValueOnce(makeAxiosError(400))
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /Connect/i }))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not connect calendar. Please try again.'
        )
      )
    })

    it('stays silent on 5xx during connect', async () => {
      connectGoogleCalendarMock.mockRejectedValueOnce(makeAxiosError(500))
      renderSettings()
      await userEvent.click(screen.getByRole('button', { name: /Connect/i }))
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })
})
