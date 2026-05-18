import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { UploadLinks } from './Links'

vi.mock('./DocumentSourceTable', () => ({
  DocumentSourceTable: () => <div data-testid="document-source-table" />,
}))

const uploadWebsiteUrlMock = vi.fn()
vi.mock('@/api/services/document', () => ({
  documentService: {
    uploadWebsiteUrl: (...args: unknown[]) => uploadWebsiteUrlMock(...args),
  },
}))

const loadingSuccessMock = vi.fn()
const loadingErrorMock = vi.fn()
const loadingUpdateMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showLoadingNotification: () => ({
    success: loadingSuccessMock,
    error: loadingErrorMock,
    update: loadingUpdateMock,
  }),
  showNotification: vi.fn(),
}))

const addDocumentMock = vi.fn()
let currentChatbot: { id: string; linkCount: number } | null = null
vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot,
    addDocument: addDocumentMock,
  }),
}))

const makeAxiosError = (status: number, message = 'backend'): AxiosError => {
  const headers = new AxiosHeaders()
  return new AxiosError(`Request failed with status ${status}`, String(status), { headers } as never, null, {
    status,
    statusText: '',
    headers: {},
    config: { headers } as never,
    data: { message },
  })
}

const renderPage = () =>
  render(
    <MantineProvider>
      <UploadLinks />
    </MantineProvider>
  )

const submitUrl = async () => {
  const input = screen.getByPlaceholderText(/https:\/\/example.com\/pricing/)
  await userEvent.type(input, 'https://foo.com')
  await userEvent.click(screen.getByRole('button', { name: /Fetch data from link/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  currentChatbot = { id: 'cb1', linkCount: 0 }
  addDocumentMock.mockResolvedValue(undefined)
})

describe('UploadLinks', () => {
  describe('rendering', () => {
    it('renders the URL input and submit button', () => {
      renderPage()
      expect(screen.getByPlaceholderText(/https:\/\/example.com\/pricing/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Fetch data from link/i })).toBeInTheDocument()
    })

    it('hides the table when linkCount is 0', () => {
      renderPage()
      expect(screen.queryByTestId('document-source-table')).not.toBeInTheDocument()
    })

    it('renders the table when linkCount > 0', () => {
      currentChatbot = { id: 'cb1', linkCount: 2 }
      renderPage()
      expect(screen.getByTestId('document-source-table')).toBeInTheDocument()
    })

    it('does not call API when URL is empty', async () => {
      renderPage()
      const button = screen.getByRole('button', { name: /Fetch data from link/i })
      await userEvent.click(button)
      expect(uploadWebsiteUrlMock).not.toHaveBeenCalled()
    })
  })

  describe('crawl flow', () => {
    it('shows success on success', async () => {
      uploadWebsiteUrlMock.mockResolvedValueOnce({ data: { status: 'success', data: {} } })
      renderPage()
      await submitUrl()
      await waitFor(() =>
        expect(loadingSuccessMock).toHaveBeenCalledWith('Website content added successfully')
      )
      expect(addDocumentMock).toHaveBeenCalled()
    })

    it('shows backend message on 400', async () => {
      uploadWebsiteUrlMock.mockRejectedValueOnce(makeAxiosError(400, 'Invalid URL format'))
      renderPage()
      await submitUrl()
      await waitFor(() => expect(loadingErrorMock).toHaveBeenCalledWith('Invalid URL format'))
    })

    it('shows "no longer exists" on 404', async () => {
      uploadWebsiteUrlMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await submitUrl()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('This chatbot no longer exists.')
      )
    })

    it('shows generic message on other 4xx', async () => {
      uploadWebsiteUrlMock.mockRejectedValueOnce(makeAxiosError(409))
      renderPage()
      await submitUrl()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Could not fetch website content. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      uploadWebsiteUrlMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await submitUrl()
      await waitFor(() => expect(loadingUpdateMock).toHaveBeenCalled())
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })

    it('shows generic on non-axios errors', async () => {
      uploadWebsiteUrlMock.mockRejectedValueOnce(new Error('boom'))
      renderPage()
      await submitUrl()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Could not fetch website content. Please try again.'
        )
      )
    })
  })
})
