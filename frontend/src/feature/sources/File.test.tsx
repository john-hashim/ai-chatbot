import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { UploadFile } from './File'

vi.mock('@/components/common/DropzoneUpload', () => ({
  DropzoneUpload: ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button
      data-testid="dropzone"
      onClick={() => onFilesSelected([new File(['x'], 'a.pdf', { type: 'application/pdf' })])}
    >
      drop
    </button>
  ),
}))

vi.mock('./DocumentSourceTable', () => ({
  DocumentSourceTable: () => <div data-testid="document-source-table" />,
}))

const uploadDocumentsMock = vi.fn()
vi.mock('@/api/services/document', () => ({
  documentService: {
    uploadDocuments: (...args: unknown[]) => uploadDocumentsMock(...args),
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
let currentChatbot: { id: string; fileCount: number } | null = null
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
      <UploadFile />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  currentChatbot = { id: 'cb1', fileCount: 0 }
  addDocumentMock.mockResolvedValue(undefined)
})

describe('UploadFile', () => {
  describe('rendering', () => {
    it('renders header without table when fileCount is 0', () => {
      renderPage()
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.queryByTestId('document-source-table')).not.toBeInTheDocument()
    })

    it('renders the table when fileCount > 0', () => {
      currentChatbot = { id: 'cb1', fileCount: 2 }
      renderPage()
      expect(screen.getByTestId('document-source-table')).toBeInTheDocument()
    })

    it('does nothing on drop when there is no current chatbot', async () => {
      currentChatbot = null
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      expect(uploadDocumentsMock).not.toHaveBeenCalled()
    })
  })

  describe('upload flow', () => {
    it('shows success toast and refreshes documents on success', async () => {
      uploadDocumentsMock.mockResolvedValueOnce({ data: { status: 'success', data: [{}] } })
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() => expect(loadingSuccessMock).toHaveBeenCalledWith('File Uploaded Successfully'))
      expect(addDocumentMock).toHaveBeenCalled()
    })

    it('shows 400 message on validation error', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Invalid file or missing data. Please check and try again.'
        )
      )
    })

    it('shows forbidden message on 403', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(makeAxiosError(403))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'You do not have permission to upload to this chatbot.'
        )
      )
    })

    it('shows "no longer exists" on 404', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(makeAxiosError(404))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('This chatbot no longer exists.')
      )
    })

    it('shows generic message on other 4xx', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(makeAxiosError(409))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('Could not upload file. Please try again.')
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() => expect(loadingUpdateMock).toHaveBeenCalled())
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })

    it('shows generic message on non-axios errors', async () => {
      uploadDocumentsMock.mockRejectedValueOnce(new Error('boom'))
      renderPage()
      await userEvent.click(screen.getByTestId('dropzone'))
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith('Could not upload file. Please try again.')
      )
    })
  })
})
