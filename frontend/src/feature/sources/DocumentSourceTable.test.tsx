import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { DocumentSourceTable } from './DocumentSourceTable'

vi.mock('@/hooks/useFormats', () => ({
  useFormat: () => ({ formatFileSize: (n: number) => `${n}B` }),
}))

vi.mock('@/components/common/tag', () => ({
  TagComponent: ({ text }: { text: string }) => <span>{text}</span>,
}))

const showNotificationMock = vi.fn()
const loadingSuccessMock = vi.fn()
const loadingErrorMock = vi.fn()
const loadingUpdateMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
  showLoadingNotification: () => ({
    success: loadingSuccessMock,
    error: loadingErrorMock,
    update: loadingUpdateMock,
  }),
}))

type ConfirmModalArgs = {
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
  title: string
}
let lastConfirmModal: ConfirmModalArgs | null = null
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: (args: ConfirmModalArgs) => {
      lastConfirmModal = args
    },
  },
}))

const deleteDocumentMock = vi.fn()
const deleteMultipleDocumentsMock = vi.fn()
const getChatbotMock = vi.fn()
const setDocumentFiltersMock = vi.fn()

interface Doc {
  id: string
  name: string
  size: number
  type: string
  status: string
}
let storeState: {
  currentChatbot: { documents: Doc[] } | null
  documentFilters: { searchParam: string; sortBy: string }
  isLoadingChatbot: boolean
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot: storeState.currentChatbot,
    deleteDocument: deleteDocumentMock,
    deleteMultipleDocuments: deleteMultipleDocumentsMock,
    setDocumentFilters: setDocumentFiltersMock,
    documentFilters: storeState.documentFilters,
    getChatbot: getChatbotMock,
    isLoadingChatbot: storeState.isLoadingChatbot,
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

const sampleDocs: Doc[] = [
  { id: 'd1', name: 'Doc One', size: 100, type: 'document', status: 'trained' },
  { id: 'd2', name: 'Doc Two', size: 200, type: 'document', status: 'untrained' },
]

const renderTable = () =>
  render(
    <MantineProvider>
      <DocumentSourceTable documentType="document" title="File sources" />
    </MantineProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  lastConfirmModal = null
  storeState = {
    currentChatbot: { documents: sampleDocs },
    documentFilters: { searchParam: '', sortBy: 'Default' },
    isLoadingChatbot: false,
  }
  getChatbotMock.mockResolvedValue(undefined)
  deleteDocumentMock.mockResolvedValue(undefined)
  deleteMultipleDocumentsMock.mockResolvedValue(0)
})

describe('DocumentSourceTable', () => {
  describe('rendering', () => {
    it('shows the loader while loading', () => {
      storeState.isLoadingChatbot = true
      renderTable()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no documents match', () => {
      storeState.currentChatbot = { documents: [] }
      renderTable()
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('renders document rows', () => {
      renderTable()
      expect(screen.getByText('Doc One')).toBeInTheDocument()
      expect(screen.getByText('Doc Two')).toBeInTheDocument()
    })
  })

  describe('delete single', () => {
    const triggerSingleDelete = async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderTable()
      const menuTriggers = document.querySelectorAll('.lucide-ellipsis')
      await user.click(menuTriggers[0] as Element)
      const deleteItem = await screen.findByText('Delete')
      await user.click(deleteItem)
      expect(lastConfirmModal).not.toBeNull()
      await lastConfirmModal!.onConfirm()
    }

    it('shows success on success', async () => {
      await triggerSingleDelete()
      expect(loadingSuccessMock).toHaveBeenCalledWith('Source deleted successfully')
    })

    it('shows "no longer exists" on 404', async () => {
      deleteDocumentMock.mockRejectedValueOnce(makeAxiosError(404))
      await triggerSingleDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('This source no longer exists.')
    })

    it('shows 400 message', async () => {
      deleteDocumentMock.mockRejectedValueOnce(makeAxiosError(400))
      await triggerSingleDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('Invalid request. Please refresh and try again.')
    })

    it('shows generic on other 4xx', async () => {
      deleteDocumentMock.mockRejectedValueOnce(makeAxiosError(409))
      await triggerSingleDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('Could not delete source. Please try again.')
    })

    it('stays silent on 5xx', async () => {
      deleteDocumentMock.mockRejectedValueOnce(makeAxiosError(500))
      await triggerSingleDelete()
      expect(loadingUpdateMock).toHaveBeenCalled()
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })
  })

  describe('delete multiple', () => {
    const triggerMultiDelete = async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderTable()
      // Click "Select All" then click delete-selected button
      const selectAll = screen.getByLabelText('Select All')
      await user.click(selectAll)
      const deleteBtn = await screen.findByRole('button', { name: /Delete Selected/i })
      await user.click(deleteBtn)
      expect(lastConfirmModal).not.toBeNull()
      await lastConfirmModal!.onConfirm()
    }

    it('shows success', async () => {
      deleteMultipleDocumentsMock.mockResolvedValueOnce(2)
      await triggerMultiDelete()
      expect(loadingSuccessMock).toHaveBeenCalledWith('Successfully deleted 2 source(s)')
    })

    it('shows 400 message', async () => {
      deleteMultipleDocumentsMock.mockRejectedValueOnce(makeAxiosError(400))
      await triggerMultiDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('Invalid request. Please refresh and try again.')
    })

    it('shows "no longer exist" on 404', async () => {
      deleteMultipleDocumentsMock.mockRejectedValueOnce(makeAxiosError(404))
      await triggerMultiDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('Those sources no longer exist.')
    })

    it('shows generic on other 4xx', async () => {
      deleteMultipleDocumentsMock.mockRejectedValueOnce(makeAxiosError(409))
      await triggerMultiDelete()
      expect(loadingErrorMock).toHaveBeenCalledWith('Could not delete sources. Please try again.')
    })

    it('stays silent on 5xx', async () => {
      deleteMultipleDocumentsMock.mockRejectedValueOnce(makeAxiosError(500))
      await triggerMultiDelete()
      expect(loadingUpdateMock).toHaveBeenCalled()
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })
  })

  describe('search refresh (fire-and-forget)', () => {
    it('toasts on 404', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(404))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderTable()
      await user.type(screen.getByPlaceholderText('Search'), 'q')
      vi.advanceTimersByTime(400)
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('error', 'This chatbot no longer exists.')
      )
    })

    it('toasts generic on other 4xx', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderTable()
      await user.type(screen.getByPlaceholderText('Search'), 'q')
      vi.advanceTimersByTime(400)
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not refresh sources. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      getChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderTable()
      await user.type(screen.getByPlaceholderText('Search'), 'q')
      vi.advanceTimersByTime(400)
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })
})
