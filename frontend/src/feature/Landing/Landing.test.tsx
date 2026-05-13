import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Landing } from './Landing'

const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('@/hooks/useRelativeDate', () => ({
  formatRelativeDate: () => 'just now',
}))

vi.mock('@/components/common/ChatbotSkeleton', () => ({
  ChatbotSkeleton: () => <div data-testid="chatbot-skeleton" />,
}))

vi.mock('@/components/layout/Outline', () => ({
  Outline: () => <div data-testid="outline" />,
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

type ConfirmModalArgs = {
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
}
let lastConfirmModal: ConfirmModalArgs | null = null
const modalsCloseMock = vi.fn()
const modalsUpdateMock = vi.fn()
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: (args: ConfirmModalArgs) => {
      lastConfirmModal = args
    },
    updateModal: (...args: unknown[]) => modalsUpdateMock(...args),
    close: (...args: unknown[]) => modalsCloseMock(...args),
  },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// --- Store mocks ---
const getChatbotsMock = vi.fn()
const setCurrentChatbotMock = vi.fn()
const deleteChatbotMock = vi.fn()
const clearChatbotStateMock = vi.fn()
const clearAvailabilitiesMock = vi.fn()
const clearAppointmentsMock = vi.fn()
const clearModelsMock = vi.fn()

let chatbotStoreState: {
  chatbots: Array<{
    id: string
    name: string
    brandColor: string
    brandColorForHeader: boolean
    profilePicture: string | null
    appearance: string
    lastTrained: string | null
  }>
  isLoadingChatbot: boolean
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    getChatbots: getChatbotsMock,
    setCurrentChatbot: setCurrentChatbotMock,
    chatbots: chatbotStoreState.chatbots,
    deleteChatbot: deleteChatbotMock,
    clearChatbotState: clearChatbotStateMock,
    isLoadingChatbot: chatbotStoreState.isLoadingChatbot,
  }),
  useBookingStore: () => ({
    clearAvailabilities: clearAvailabilitiesMock,
    clearAppointments: clearAppointmentsMock,
  }),
  useModelsStore: () => ({
    clearModels: clearModelsMock,
  }),
  useUserStore: () => ({
    user: { name: 'jane doe', email: 'jane@example.com' },
  }),
}))

// --- Helpers ---
const renderLanding = () =>
  render(
    <MantineProvider>
      <Landing />
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

const sampleChatbot = {
  id: 'cb1',
  name: 'Bot One',
  brandColor: '#ff0000',
  brandColorForHeader: false,
  profilePicture: null,
  appearance: 'light',
  lastTrained: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  lastConfirmModal = null
  chatbotStoreState = { chatbots: [], isLoadingChatbot: false }
  getChatbotsMock.mockResolvedValue(undefined)
})

describe('Landing', () => {
  describe('rendering', () => {
    it('shows the loading skeleton when isLoadingChatbot is true', () => {
      chatbotStoreState.isLoadingChatbot = true
      renderLanding()
      expect(screen.getByText('Chatbots')).toBeInTheDocument()
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('shows the empty state with greeting when there are no chatbots', () => {
      renderLanding()
      expect(screen.getByText(/Build your first AI chatbot/i)).toBeInTheDocument()
      expect(screen.getByText(/Good (morning|afternoon|evening), Jane/)).toBeInTheDocument()
    })

    it('renders chatbot cards when chatbots are present', () => {
      chatbotStoreState.chatbots = [sampleChatbot]
      renderLanding()
      expect(screen.getByText('Bot One')).toBeInTheDocument()
      expect(screen.getByText('Not Trained Yet')).toBeInTheDocument()
    })

    it('navigates to /chatbot/new when "New AI Chatbot" is clicked', async () => {
      chatbotStoreState.chatbots = [sampleChatbot]
      renderLanding()
      await userEvent.click(screen.getByRole('button', { name: /New AI Chatbot/i }))
      expect(navigateMock).toHaveBeenCalledWith('/chatbot/new')
    })

    it('opens the chatbot when its card is clicked', async () => {
      chatbotStoreState.chatbots = [sampleChatbot]
      renderLanding()
      await userEvent.click(screen.getByRole('heading', { name: 'Bot One' }))
      expect(setCurrentChatbotMock).toHaveBeenCalledWith('cb1')
      expect(navigateMock).toHaveBeenCalledWith('/chatbot/cb1/playground')
    })
  })

  describe('getChatbots error handling', () => {
    it('stays silent on 5xx (interceptor handles it)', async () => {
      getChatbotsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderLanding()
      await waitFor(() => expect(getChatbotsMock).toHaveBeenCalled())
      // Give the rejection time to settle
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })

    it('shows a toast on unexpected 4xx', async () => {
      getChatbotsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderLanding()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load chatbots. Please refresh.'
        )
      )
    })

    it('stays silent on non-axios errors', async () => {
      getChatbotsMock.mockRejectedValueOnce(new Error('boom'))
      renderLanding()
      await waitFor(() => expect(getChatbotsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('deleteChatbot flow', () => {
    const triggerDeleteConfirm = async () => {
      chatbotStoreState.chatbots = [sampleChatbot]
      renderLanding()

      // The card has one unnamed icon-button (the menu trigger). The only named
      // button is "New AI Chatbot". Pick the unnamed one.
      const menuTrigger = screen
        .getAllByRole('button')
        .find(btn => !btn.textContent?.trim())
      await userEvent.click(menuTrigger!)

      const deleteItem = await screen.findByText('Delete')
      await userEvent.click(deleteItem)

      expect(lastConfirmModal).not.toBeNull()
      await lastConfirmModal!.onConfirm()
    }

    it('shows success toast and closes the modal on success', async () => {
      deleteChatbotMock.mockResolvedValueOnce(undefined)
      await triggerDeleteConfirm()
      expect(showNotificationMock).toHaveBeenCalledWith('success', '"Bot One" was deleted.')
      expect(modalsCloseMock).toHaveBeenCalled()
    })

    it('shows "no longer exists" on 404', async () => {
      deleteChatbotMock.mockRejectedValueOnce(makeAxiosError(404))
      await triggerDeleteConfirm()
      expect(showNotificationMock).toHaveBeenCalledWith(
        'error',
        'This chatbot no longer exists.'
      )
      expect(modalsCloseMock).toHaveBeenCalled()
    })

    it('shows the generic message on other 4xx', async () => {
      deleteChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      await triggerDeleteConfirm()
      expect(showNotificationMock).toHaveBeenCalledWith(
        'error',
        'Could not delete chatbot. Please try again.'
      )
    })

    it('stays silent on 5xx (interceptor already toasted)', async () => {
      deleteChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      await triggerDeleteConfirm()
      const successOrErrorCalls = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(successOrErrorCalls).toHaveLength(0)
      expect(modalsCloseMock).toHaveBeenCalled()
    })
  })
})
