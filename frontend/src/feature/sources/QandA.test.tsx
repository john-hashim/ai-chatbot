import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { UploadQandA } from './QandA'

vi.mock('./DocumentSourceTable', () => ({
  DocumentSourceTable: () => <div data-testid="document-source-table" />,
}))

vi.mock('@/components/common/TextEditor', () => ({
  TextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="text-editor" value={value} onChange={e => onChange(e.target.value)} />
  ),
}))

vi.mock('@/utils/textFormatting', () => ({
  htmlToPlainText: (s: string) => s,
  calculateTextSize: () => 10,
}))

const uploadTextSnippetMock = vi.fn()
vi.mock('@/api/services/document', () => ({
  documentService: {
    uploadTextSnippet: (...args: unknown[]) => uploadTextSnippetMock(...args),
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
let currentChatbot: { id: string; QandACount: number } | null = null
vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot,
    addDocument: addDocumentMock,
  }),
}))

const makeAxiosError = (status: number): AxiosError => {
  const headers = new AxiosHeaders()
  return new AxiosError(`Request failed with status ${status}`, String(status), { headers } as never, null, {
    status,
    statusText: '',
    headers: {},
    config: { headers } as never,
    data: { message: 'backend' },
  })
}

const renderPage = () =>
  render(
    <MantineProvider>
      <UploadQandA />
    </MantineProvider>
  )

const fillAndSubmit = async () => {
  await userEvent.type(screen.getByPlaceholderText('Pricings Plans'), 'My Title')
  await userEvent.type(
    screen.getByPlaceholderText('What are your pricing plans?'),
    'Question 1'
  )
  await userEvent.type(screen.getByTestId('text-editor'), 'My answer')
  await userEvent.click(screen.getByRole('button', { name: /Save Q&A/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  currentChatbot = { id: 'cb1', QandACount: 0 }
  addDocumentMock.mockResolvedValue(undefined)
})

describe('UploadQandA', () => {
  describe('rendering', () => {
    it('renders form fields and save button', () => {
      renderPage()
      expect(screen.getByPlaceholderText('Pricings Plans')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('What are your pricing plans?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Q&A/i })).toBeInTheDocument()
    })

    it('renders table when QandACount > 0', () => {
      currentChatbot = { id: 'cb1', QandACount: 3 }
      renderPage()
      expect(screen.getByTestId('document-source-table')).toBeInTheDocument()
    })

    it('hides table when QandACount is 0', () => {
      renderPage()
      expect(screen.queryByTestId('document-source-table')).not.toBeInTheDocument()
    })

    it('adds a new question row when "Add Question" is clicked', async () => {
      renderPage()
      await userEvent.click(screen.getByRole('button', { name: /Add Question/i }))
      const inputs = screen.getAllByPlaceholderText('What are your pricing plans?')
      expect(inputs.length).toBe(2)
    })
  })

  describe('save flow', () => {
    it('shows success on success', async () => {
      uploadTextSnippetMock.mockResolvedValueOnce({ data: { status: 'success', data: {} } })
      renderPage()
      await fillAndSubmit()
      await waitFor(() =>
        expect(loadingSuccessMock).toHaveBeenCalledWith('File Uploaded Successfully')
      )
      expect(addDocumentMock).toHaveBeenCalled()
    })

    it('shows 400 message', async () => {
      uploadTextSnippetMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await fillAndSubmit()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Missing or invalid fields. Please check and try again.'
        )
      )
    })

    it('shows "no longer exists" on 404', async () => {
      uploadTextSnippetMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await fillAndSubmit()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('This chatbot no longer exists.')
      )
    })

    it('shows generic on other 4xx', async () => {
      uploadTextSnippetMock.mockRejectedValueOnce(makeAxiosError(409))
      renderPage()
      await fillAndSubmit()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('Could not save Q&A. Please try again.')
      )
    })

    it('stays silent on 5xx', async () => {
      uploadTextSnippetMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await fillAndSubmit()
      await waitFor(() => expect(loadingUpdateMock).toHaveBeenCalled())
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })
  })
})
