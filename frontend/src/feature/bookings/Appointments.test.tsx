import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Appointments } from './Appointments'
import type { Appointment } from '@/types/bookings'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ chatbotId: 'cb1' }),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
  showLoadingNotification: vi.fn(),
}))

type ConfirmModalArgs = {
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
}
let lastConfirmModal: ConfirmModalArgs | null = null
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: (args: ConfirmModalArgs) => {
      lastConfirmModal = args
    },
    closeAll: vi.fn(),
    close: vi.fn(),
  },
}))

const fetchAppointmentsMock = vi.fn()
const exportAppointmentsAsPDFMock = vi.fn()
const cancelAppointmentMock = vi.fn()

let bookingState: {
  appointments: Appointment[]
  fetchingAppointments: boolean
  appointmentsError: string | null
  cancellingAppointmentId: string | null
  exportingAppointmentsPdf: boolean
}

vi.mock('@/store', () => ({
  useBookingStore: () => ({
    appointments: bookingState.appointments,
    fetchingAppointments: bookingState.fetchingAppointments,
    appointmentsError: bookingState.appointmentsError,
    fetchAppointments: fetchAppointmentsMock,
    exportAppointmentsAsPDF: exportAppointmentsAsPDFMock,
    exportingAppointmentsPdf: bookingState.exportingAppointmentsPdf,
    cancelAppointment: cancelAppointmentMock,
    cancellingAppointmentId: bookingState.cancellingAppointmentId,
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

const sampleAppointment: Appointment = {
  id: 'a1',
  chatbotId: 'cb1',
  sessionId: 's1',
  email: 'foo@bar.com',
  name: 'Foo Bar',
  phone: null,
  date: '2099-01-01',
  timeslot: '10:00',
  duration: 30,
  status: 'UPCOMING',
  locationType: 'GOOGLE_MEET',
  locationAddress: null,
  locationPhone: null,
  meetLink: 'https://meet.example/abc',
  timezone: 'UTC',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const renderAppointments = () =>
  render(
    <MantineProvider>
      <Appointments />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  lastConfirmModal = null
  bookingState = {
    appointments: [],
    fetchingAppointments: false,
    appointmentsError: null,
    cancellingAppointmentId: null,
    exportingAppointmentsPdf: false,
  }
  fetchAppointmentsMock.mockResolvedValue(undefined)
  exportAppointmentsAsPDFMock.mockResolvedValue(new Blob(['pdf']))
  cancelAppointmentMock.mockResolvedValue(undefined)
  // Mock URL methods used by export flow
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:1')
  globalThis.URL.revokeObjectURL = vi.fn()
})

describe('Appointments', () => {
  describe('rendering', () => {
    it('shows loader while fetching', () => {
      bookingState.fetchingAppointments = true
      const { container } = renderAppointments()
      expect(container.querySelector('.mantine-Loader-root')).toBeTruthy()
    })

    it('shows empty state with no appointments', () => {
      renderAppointments()
      expect(screen.getByText(/No appointments/i)).toBeInTheDocument()
    })

    it('renders the list view with appointments', () => {
      bookingState.appointments = [sampleAppointment]
      renderAppointments()
      expect(screen.getByText('Foo Bar')).toBeInTheDocument()
      expect(screen.getByText('foo@bar.com')).toBeInTheDocument()
    })

    it('fetches appointments on mount', () => {
      renderAppointments()
      expect(fetchAppointmentsMock).toHaveBeenCalled()
    })
  })

  describe('fetchAppointments error handling', () => {
    it('toasts on 4xx', async () => {
      fetchAppointmentsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderAppointments()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load appointments. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      fetchAppointmentsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderAppointments()
      await waitFor(() => expect(fetchAppointmentsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('exportPDF', () => {
    const clickExport = async () => {
      bookingState.appointments = [sampleAppointment]
      renderAppointments()
      // Locate the export button — the only one with tooltip via Download icon.
      // It's the last button in the toolbar.
      const buttons = screen.getAllByRole('button')
      // export button has the Download icon as only child and no text
      const exportBtn = buttons.find(b => b.querySelector('.lucide-download')) || buttons.at(-1)!
      await userEvent.click(exportBtn)
    }

    it('shows success and downloads on success', async () => {
      await clickExport()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Appointments exported.')
      )
    })

    it('shows "no longer exists" on 404', async () => {
      exportAppointmentsAsPDFMock.mockRejectedValueOnce(makeAxiosError(404))
      await clickExport()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('shows generic on other 4xx', async () => {
      exportAppointmentsAsPDFMock.mockRejectedValueOnce(makeAxiosError(400))
      await clickExport()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not export appointments. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      exportAppointmentsAsPDFMock.mockRejectedValueOnce(makeAxiosError(500))
      await clickExport()
      await new Promise(r => setTimeout(r, 0))
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('cancelAppointment', () => {
    const triggerCancel = async () => {
      bookingState.appointments = [sampleAppointment]
      renderAppointments()
      const cancelBtns = screen.getAllByRole('button', { name: /^Cancel$/i })
      await userEvent.click(cancelBtns[0]!)
      expect(lastConfirmModal).not.toBeNull()
      await lastConfirmModal!.onConfirm()
    }

    it('shows success toast on success', async () => {
      await triggerCancel()
      expect(showNotificationMock).toHaveBeenCalledWith('success', 'Appointment cancelled.')
    })

    it('shows "no longer exists" on 404', async () => {
      cancelAppointmentMock.mockRejectedValueOnce(makeAxiosError(404))
      await triggerCancel()
      expect(showNotificationMock).toHaveBeenCalledWith(
        'error',
        'This appointment no longer exists.'
      )
    })

    it('shows already-cancelled on 400', async () => {
      cancelAppointmentMock.mockRejectedValueOnce(makeAxiosError(400))
      await triggerCancel()
      expect(showNotificationMock).toHaveBeenCalledWith(
        'error',
        'This appointment is already cancelled.'
      )
    })

    it('stays silent on 5xx', async () => {
      cancelAppointmentMock.mockRejectedValueOnce(makeAxiosError(500))
      await triggerCancel()
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })
})
