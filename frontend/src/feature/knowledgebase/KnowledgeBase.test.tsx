import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { KnowledgeBase } from './KnowledgeBase'

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

// Heavy child components — only need to know they rendered.
vi.mock('../sources/File', () => ({
  UploadFile: () => <div data-testid="upload-file" />,
}))
vi.mock('../sources/QandA', () => ({
  UploadQandA: () => <div data-testid="upload-qanda" />,
}))
vi.mock('../sources/Text', () => ({
  UploadText: () => <div data-testid="upload-text" />,
}))
vi.mock('../sources/Links', () => ({
  UploadLinks: () => <div data-testid="upload-links" />,
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

// --- Store mock ---
const getChatbotMock = vi.fn()
const trainChatbotDocumentsMock = vi.fn()

type Doc = { type: string; size: number; status: string }
type CurrentChatbot = {
  id: string
  fileCount: number
  QandACount: number
  textCount: number
  linkCount: number
  totalSize: number
  lastTrained: Date | null
  documents: Doc[]
} | null

const chatbotStoreState: { currentChatbot: CurrentChatbot } = {
  currentChatbot: null,
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot: chatbotStoreState.currentChatbot,
    getChatbot: getChatbotMock,
    trainChatbotDocuments: trainChatbotDocumentsMock,
  }),
}))

// jsdom doesn't implement matchMedia; useMediaQuery needs it (large-screen path).
const setLargeScreen = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

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

const sampleChatbot = (overrides: Partial<NonNullable<CurrentChatbot>> = {}): NonNullable<
  CurrentChatbot
> => ({
  id: 'cb1',
  fileCount: 2,
  QandACount: 1,
  textCount: 0,
  linkCount: 3,
  totalSize: 4096,
  lastTrained: new Date('2025-01-01T00:00:00Z'),
  documents: [
    { type: 'document', size: 1024, status: 'trained' },
    { type: 'document', size: 1024, status: 'untrained' },
    { type: 'q&a', size: 512, status: 'trained' },
    { type: 'website', size: 1536, status: 'trained' },
  ],
  ...overrides,
})

const renderPage = () =>
  render(
    <MantineProvider>
      <KnowledgeBase />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  chatbotStoreState.currentChatbot = sampleChatbot()
  setLargeScreen(true)
  getChatbotMock.mockResolvedValue(undefined)
})

describe('KnowledgeBase', () => {
  describe('render', () => {
    it('renders the heading and the default Files tab content', () => {
      renderPage()
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
      expect(screen.getByTestId('upload-file')).toBeInTheDocument()
    })

    it('shows the data sources side panel on large screens', () => {
      renderPage()
      expect(screen.getByText(/Total Size/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retrain Agent/i })).toBeInTheDocument()
    })

    it('hides the side panel and exposes a Details tab on small screens', () => {
      setLargeScreen(false)
      renderPage()
      expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument()
    })

    it('renders gracefully when there is no current chatbot', () => {
      chatbotStoreState.currentChatbot = null
      renderPage()
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retrain Agent/i })).toBeInTheDocument()
    })
  })

  describe('tab navigation', () => {
    it('switches to the Q&A panel', async () => {
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /Q&A/i }))
      expect(screen.getByTestId('upload-qanda')).toBeInTheDocument()
    })

    it('switches to the Text panel', async () => {
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /^Text$/i }))
      expect(screen.getByTestId('upload-text')).toBeInTheDocument()
    })

    it('switches to the Links panel', async () => {
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /Links/i }))
      expect(screen.getByTestId('upload-links')).toBeInTheDocument()
    })

    it('renders the details panel on small screens when Details is selected', async () => {
      setLargeScreen(false)
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /Details/i }))
      expect(screen.getAllByRole('button', { name: /Retrain Agent/i }).length).toBeGreaterThan(0)
    })
  })

  describe('retrain flow', () => {
    const clickRetrain = async () => {
      await userEvent.click(screen.getByRole('button', { name: /Retrain Agent/i }))
    }

    it('shows the success toast and refreshes the chatbot', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 3,
        chunksCreated: 12,
      })
      renderPage()
      await clickRetrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Training complete.')
      )
      expect(getChatbotMock).toHaveBeenCalledWith('cb1')
    })

    it('shows the success toast even when nothing was processed', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 0,
        chunksCreated: 0,
      })
      renderPage()
      await clickRetrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Training complete.')
      )
    })

    it('shows "no longer exists" on 404', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await clickRetrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This chatbot no longer exists.'
        )
      )
    })

    it('shows the generic training-failed message on other 4xx', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await clickRetrain()

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
      await clickRetrain()

      await waitFor(() => expect(trainChatbotDocumentsMock).toHaveBeenCalled())
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })

    it('stays silent on non-axios errors', async () => {
      trainChatbotDocumentsMock.mockRejectedValueOnce(new Error('boom'))
      renderPage()
      await clickRetrain()

      await waitFor(() => expect(trainChatbotDocumentsMock).toHaveBeenCalled())
      const noisy = showNotificationMock.mock.calls.filter(
        c => c[0] === 'success' || c[0] === 'error'
      )
      expect(noisy).toHaveLength(0)
    })

    it('toasts when the post-train refresh fails with a 4xx', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 1,
        chunksCreated: 4,
      })
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await clickRetrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not refresh chatbot. Please try again.'
        )
      )
    })

    it('stays silent when the post-train refresh fails with a 5xx', async () => {
      trainChatbotDocumentsMock.mockResolvedValueOnce({
        documentsProcessed: 1,
        chunksCreated: 4,
      })
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await clickRetrain()

      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'success',
          expect.stringContaining('Training complete')
        )
      )
      const errors = showNotificationMock.mock.calls.filter(c => c[0] === 'error')
      expect(errors).toHaveLength(0)
    })
  })
})
