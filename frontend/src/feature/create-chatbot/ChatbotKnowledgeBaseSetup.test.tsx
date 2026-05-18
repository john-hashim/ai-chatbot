import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { ChatbotKnowledgeBaseSetup } from './ChatbotKnowledgeBaseSetup'

const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ chatbotId: 'cb1' }),
}))

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('@/hooks/useFormats', () => ({
  useFormat: () => ({ formatFileSize: (n: number) => `${n}B` }),
}))

vi.mock('@/components/common/logo', () => ({
  Logo: () => <div data-testid="logo" />,
}))

vi.mock('../sources/File', () => ({
  UploadFile: () => <div data-testid="upload-file" />,
}))
vi.mock('../sources/Links', () => ({
  UploadLinks: () => <div data-testid="upload-links" />,
}))
vi.mock('../sources/Text', () => ({
  UploadText: () => <div data-testid="upload-text" />,
}))
vi.mock('../sources/QandA', () => ({
  UploadQandA: () => <div data-testid="upload-qa" />,
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

const trainChatbotDocumentsMock = vi.fn()
const getChatbotMock = vi.fn()
let currentChatbot:
  | {
      fileCount: number
      textCount: number
      QandACount: number
      linkCount: number
      totalSize: number
    }
  | null = null

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    getChatbot: getChatbotMock,
    currentChatbot,
    trainChatbotDocuments: trainChatbotDocumentsMock,
  }),
}))

const renderPage = () =>
  render(
    <MantineProvider>
      <ChatbotKnowledgeBaseSetup />
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

const clickTrain = async () =>
  userEvent.click(screen.getByRole('button', { name: /Train & Continue/i }))

beforeEach(() => {
  vi.clearAllMocks()
  currentChatbot = null
  getChatbotMock.mockResolvedValue(undefined)
})

describe('ChatbotKnowledgeBaseSetup', () => {
  describe('rendering', () => {
    it('renders heading, source rows, and the train button', () => {
      renderPage()
      expect(screen.getByText('Train your Agent')).toBeInTheDocument()
      expect(screen.getByText(/File$/)).toBeInTheDocument()
      expect(screen.getByText(/Text$/)).toBeInTheDocument()
      expect(screen.getByText(/Q&A$/)).toBeInTheDocument()
      expect(screen.getByText(/Links$/)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Train & Continue/i })
      ).toBeInTheDocument()
    })

    it('reflects source counts when currentChatbot is loaded', () => {
      currentChatbot = {
        fileCount: 2,
        textCount: 1,
        QandACount: 3,
        linkCount: 0,
        totalSize: 1024,
      }
      renderPage()
      expect(screen.getByText(/2\s+File/)).toBeInTheDocument()
      expect(screen.getByText(/1\s+Text/)).toBeInTheDocument()
      expect(screen.getByText(/3\s+Q&A/)).toBeInTheDocument()
    })

    it('navigates to /landing when back arrow is clicked', async () => {
      renderPage()
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[0])
      expect(navigateMock).toHaveBeenCalledWith('/landing')
    })

    it('opens the matching panel when a source row is clicked', async () => {
      renderPage()
      const allButtons = screen.getAllByRole('button')
      // The first source row's plus-button is right after the back+close+train buttons;
      // simpler — find the row by text then click its nearby unnamed button.
      const fileRow = screen.getByText(/File$/).closest('li')!
      const plus = fileRow.querySelector('button')!
      await userEvent.click(plus)
      expect(screen.getByTestId('upload-file')).toBeInTheDocument()
      expect(allButtons.length).toBeGreaterThan(0)
    })
  })

  describe('initial getChatbot load', () => {
    it('stays silent on 5xx (interceptor handles it)', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await waitFor(() => expect(getChatbotMock).toHaveBeenCalledWith('cb1'))
      await new Promise(r => setTimeout(r, 0))
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })

    it('shows "no longer exists" on 404', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('shows the generic message on other 4xx', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load chatbot. Please try again.'
        )
      )
    })

    it('stays silent on non-axios errors', async () => {
      getChatbotMock.mockRejectedValueOnce(new Error('boom'))
      renderPage()
      await waitFor(() => expect(getChatbotMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })
  })

  describe('train flow', () => {
    it('navigates after a successful train', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 3,
        chunksCreated: 12,
      })
      renderPage()
      await clickTrain()

      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/chatbot/cb1'))
    })

    it('still navigates when nothing was processed', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 0,
        chunksCreated: 0,
      })
      renderPage()
      await clickTrain()

      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/chatbot/cb1'))
    })

    it('shows "no longer exists" on 404', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await clickTrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('shows the generic message on other 4xx', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await clickTrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Training failed. Please try again.'
        )
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await clickTrain()

      await waitFor(() => expect(trainChatbotDocumentsMock).toHaveBeenCalled())
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })
  })
})
