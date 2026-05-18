import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { ChatbotBasicSetup } from './ChatbotBasicSetup'

const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('@/components/common/logo', () => ({
  Logo: () => <div data-testid="logo" />,
}))

vi.mock('@/components/common/Cropper', () => ({
  CropperComponent: () => <div data-testid="cropper" />,
}))

vi.mock('@/components/layout/Outline', () => ({
  Outline: () => <div data-testid="outline" />,
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: {
    open: vi.fn(),
    closeAll: vi.fn(),
  },
}))

const uploadImageToR2Mock = vi.fn()
vi.mock('@/api/services/upload', () => ({
  uploadImageToR2: (...args: unknown[]) => uploadImageToR2Mock(...args),
}))

const createChatbotMock = vi.fn()
vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    createChatbot: createChatbotMock,
  }),
}))

const renderPage = () =>
  render(
    <MantineProvider>
      <ChatbotBasicSetup />
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

const fillNameAndSubmit = async (name = 'Bot One') => {
  const input = screen.getByPlaceholderText('Luna AI')
  await userEvent.type(input, name)
  await userEvent.click(screen.getByRole('button', { name: /Save And Continue/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChatbotBasicSetup', () => {
  describe('rendering', () => {
    it('renders the form heading and submit button', () => {
      renderPage()
      expect(screen.getByText(/Let's Build Your Chatbot/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Save And Continue/i })
      ).toBeInTheDocument()
    })

    it('navigates to /landing when the back arrow is clicked', async () => {
      renderPage()
      const buttons = screen.getAllByRole('button')
      // First unnamed icon-button is the back arrow.
      await userEvent.click(buttons[0])
      expect(navigateMock).toHaveBeenCalledWith('/landing')
    })

    it('shows a validation error when submitted with no name', async () => {
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /Save And Continue/i }))
      expect(
        await screen.findByText('Please provide your chatbot name')
      ).toBeInTheDocument()
      expect(createChatbotMock).not.toHaveBeenCalled()
    })
  })

  describe('createChatbot flow', () => {
    it('navigates on success', async () => {
      createChatbotMock.mockResolvedValueOnce({ id: 'cb1' })
      renderPage()
      await fillNameAndSubmit()

      await waitFor(() =>
        expect(navigateMock).toHaveBeenCalledWith('/chatbot/cb1/setup-knowledgebase')
      )
    })

    it('shows the duplicate-name message on 409', async () => {
      createChatbotMock.mockRejectedValueOnce(makeAxiosError(409))
      renderPage()
      await fillNameAndSubmit()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'A chatbot with this name already exists. Please choose a different name.'
        )
      )
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('shows the generic message on other 4xx', async () => {
      createChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await fillNameAndSubmit()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Failed to create chatbot. Please try again.'
        )
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      createChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await fillNameAndSubmit()

      await waitFor(() => expect(createChatbotMock).toHaveBeenCalled())
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })

    it('stays silent on non-axios errors', async () => {
      createChatbotMock.mockRejectedValueOnce(new Error('boom'))
      renderPage()
      await fillNameAndSubmit()

      await waitFor(() => expect(createChatbotMock).toHaveBeenCalled())
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })
  })
})
