import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Bookings } from './Bookings'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ chatbotId: 'cb1' }),
}))

vi.mock('./availability/Availability', () => ({
  Availability: () => <div data-testid="availability" />,
}))
vi.mock('./Appointments', () => ({
  Appointments: () => <div data-testid="appointments" />,
}))
vi.mock('./BookingSettings', () => ({
  BookingSettings: () => <div data-testid="settings" />,
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { open: vi.fn(), close: vi.fn(), closeAll: vi.fn() },
}))

const fetchBookingDataMock = vi.fn()
const updateAppointmentIsEnabledMock = vi.fn()
let bookingStoreState: { appointmentIsEnabled: boolean }

vi.mock('@/store', () => ({
  useBookingStore: () => ({
    fetchBookingData: fetchBookingDataMock,
    updateAppointmentIsEnabled: updateAppointmentIsEnabledMock,
    appointmentIsEnabled: bookingStoreState.appointmentIsEnabled,
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

const renderBookings = () =>
  render(
    <MantineProvider>
      <Bookings />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  bookingStoreState = { appointmentIsEnabled: true }
  fetchBookingDataMock.mockResolvedValue(undefined)
  updateAppointmentIsEnabledMock.mockResolvedValue(undefined)
})

describe('Bookings', () => {
  describe('rendering & navigation', () => {
    it('renders appointments tab by default', () => {
      renderBookings()
      expect(screen.getByTestId('appointments')).toBeInTheDocument()
    })

    it('switches to availability tab', async () => {
      renderBookings()
      await userEvent.click(screen.getByRole('button', { name: 'Availability' }))
      expect(screen.getByTestId('availability')).toBeInTheDocument()
    })

    it('fetches booking data on mount with chatbotId', () => {
      renderBookings()
      expect(fetchBookingDataMock).toHaveBeenCalledWith('cb1')
    })
  })

  describe('fetchBookingData error handling', () => {
    it('toasts on 4xx', async () => {
      fetchBookingDataMock.mockRejectedValueOnce(makeAxiosError(400))
      renderBookings()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load booking settings. Please refresh.'
        )
      )
    })

    it('stays silent on 5xx (interceptor handles)', async () => {
      fetchBookingDataMock.mockRejectedValueOnce(makeAxiosError(500))
      renderBookings()
      await waitFor(() => expect(fetchBookingDataMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('toggleAppointmentFeature', () => {
    const toggle = async () => {
      renderBookings()
      const switchEl = screen.getAllByRole('switch')[0]!
      await userEvent.click(switchEl)
    }

    it('shows success on toggle', async () => {
      await toggle()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', expect.any(String))
      )
    })

    it('shows "no longer exists" on 404', async () => {
      updateAppointmentIsEnabledMock.mockRejectedValueOnce(makeAxiosError(404))
      await toggle()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('shows generic on other 4xx', async () => {
      updateAppointmentIsEnabledMock.mockRejectedValueOnce(makeAxiosError(400))
      await toggle()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not update appointments setting. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateAppointmentIsEnabledMock.mockRejectedValueOnce(makeAxiosError(500))
      await toggle()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })
})
