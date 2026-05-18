import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Chats } from './Chats'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useRelativeDate', () => ({
  formatRelativeDate: () => 'just now',
}))

vi.mock('./ChatsList', () => ({
  ChatsList: ({
    chatSessions,
    loading,
    onSelectSession,
  }: {
    chatSessions: Array<{ id: string }> | null
    loading: boolean
    onSelectSession: (id: string) => void
  }) => (
    <div data-testid="chats-list">
      {loading && <div data-testid="chats-list-loading" />}
      {!loading && chatSessions && chatSessions.length === 0 && (
        <div data-testid="chats-list-empty" />
      )}
      {chatSessions?.map(s => (
        <button key={s.id} data-testid={`session-${s.id}`} onClick={() => onSelectSession(s.id)}>
          {s.id}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('./ChatDetails', () => ({
  ChatDetails: ({
    session,
    handleSessionDelete,
    loading,
  }: {
    session: { id: string } | null
    handleSessionDelete: (id: string) => void
    loading?: boolean
  }) => (
    <div data-testid="chat-details">
      {loading && <div data-testid="chat-details-loading" />}
      {session && (
        <button data-testid="open-delete-modal" onClick={() => handleSessionDelete(session.id)}>
          delete-{session.id}
        </button>
      )}
    </div>
  ),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn(),
    close: vi.fn(),
    updateModal: vi.fn(),
  },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// --- Store mock ---
const getChatSessionsMock = vi.fn()
const getSessionDetailsMock = vi.fn()
const setChatSessionFiltersMock = vi.fn()
const deleteChatSessionMock = vi.fn()
const exportChatsMock = vi.fn()

type StoreState = {
  currentChatbot: { id: string } | null
  chatSession: {
    chatSessions: Array<{ id: string; messages?: unknown[] }>
    filters: { searchParam: string; sortBy: string }
  }
  isLoadingSessions: boolean
  isLoadingSessionDetails: boolean
}

let storeState: StoreState

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot: storeState.currentChatbot,
    chatSession: storeState.chatSession,
    isLoadingSessions: storeState.isLoadingSessions,
    isLoadingSessionDetails: storeState.isLoadingSessionDetails,
    getChatSessions: getChatSessionsMock,
    getSessionDetails: getSessionDetailsMock,
    setChatSessionFilters: setChatSessionFiltersMock,
    deleteChatSession: deleteChatSessionMock,
    exportChats: exportChatsMock,
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

const renderChats = () =>
  render(
    <MantineProvider>
      <Chats />
    </MantineProvider>
  )

const sampleSession = { id: 's1', messages: [] }

beforeEach(() => {
  vi.clearAllMocks()
  storeState = {
    currentChatbot: { id: 'cb1' },
    chatSession: {
      chatSessions: [],
      filters: { searchParam: '', sortBy: 'Newest' },
    },
    isLoadingSessions: false,
    isLoadingSessionDetails: false,
  }
  getChatSessionsMock.mockResolvedValue(undefined)
  getSessionDetailsMock.mockResolvedValue(undefined)
  deleteChatSessionMock.mockResolvedValue(undefined)
  exportChatsMock.mockResolvedValue(new Blob(['x']))

  // Stub URL.createObjectURL / revokeObjectURL for export download
  ;(URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(() => 'blob:url')
  ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn()
  // JSDOM lacks scrollIntoView; Mantine Combobox calls it on selection.
  Element.prototype.scrollIntoView = vi.fn()
  // Anchor click is JSDOM-default; nothing extra needed.
})

describe('Chats', () => {
  describe('rendering branches', () => {
    it('shows loading state in chats list when isLoadingSessions is true', () => {
      storeState.isLoadingSessions = true
      renderChats()
      expect(screen.getAllByTestId('chats-list-loading').length).toBeGreaterThan(0)
    })

    it('shows empty list when there are no sessions', () => {
      renderChats()
      expect(screen.getAllByTestId('chats-list-empty').length).toBeGreaterThan(0)
    })

    it('renders sessions and selects the first one', async () => {
      storeState.chatSession.chatSessions = [sampleSession, { id: 's2' }]
      renderChats()
      expect(screen.getByTestId('session-s1')).toBeInTheDocument()
      await waitFor(() =>
        expect(getSessionDetailsMock).toHaveBeenCalledWith('cb1', 's1')
      )
    })

    it('does not fetch sessions when there is no current chatbot', () => {
      storeState.currentChatbot = null
      renderChats()
      expect(getChatSessionsMock).not.toHaveBeenCalled()
    })
  })

  describe('initial getChatSessions fetch', () => {
    it('calls getChatSessions on mount with the current chatbot id', async () => {
      renderChats()
      await waitFor(() => expect(getChatSessionsMock).toHaveBeenCalledWith('cb1'))
    })

    it('toasts on 4xx fetch error', async () => {
      getChatSessionsMock.mockRejectedValueOnce(makeAxiosError(400))
      renderChats()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load chat sessions. Please try again.'
        )
      )
    })

    it('stays silent on 5xx fetch error (interceptor owns it)', async () => {
      getChatSessionsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderChats()
      await waitFor(() => expect(getChatSessionsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('getSessionDetails fetch', () => {
    it('toasts on 4xx', async () => {
      storeState.chatSession.chatSessions = [sampleSession]
      getSessionDetailsMock.mockRejectedValueOnce(makeAxiosError(404))
      renderChats()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load conversation details.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      storeState.chatSession.chatSessions = [sampleSession]
      getSessionDetailsMock.mockRejectedValueOnce(makeAxiosError(500))
      renderChats()
      await waitFor(() => expect(getSessionDetailsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('deleteChatSession flow', () => {
    const openModalAndConfirm = async () => {
      storeState.chatSession.chatSessions = [sampleSession]
      renderChats()
      // Two ChatDetails (mobile + desktop). Use the first delete trigger.
      const triggers = await screen.findAllByTestId('open-delete-modal')
      await userEvent.click(triggers[0])
      const confirm = await screen.findByRole('button', { name: 'Delete' })
      await userEvent.click(confirm)
    }

    it('shows a success toast on success', async () => {
      await openModalAndConfirm()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'success',
          'Conversation deleted successfully.'
        )
      )
    })

    it('shows "no longer exists" on 404', async () => {
      deleteChatSessionMock.mockRejectedValueOnce(makeAxiosError(404))
      await openModalAndConfirm()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'This conversation no longer exists.'
        )
      )
    })

    it('shows generic toast on other 4xx', async () => {
      deleteChatSessionMock.mockRejectedValueOnce(makeAxiosError(400))
      await openModalAndConfirm()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not delete conversation. Please try again.'
        )
      )
    })

    it('stays silent on 5xx (interceptor owns it)', async () => {
      deleteChatSessionMock.mockRejectedValueOnce(makeAxiosError(500))
      await openModalAndConfirm()
      await waitFor(() => expect(deleteChatSessionMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      const calls = showNotificationMock.mock.calls.filter(c => c[0] === 'success' || c[0] === 'error')
      expect(calls).toHaveLength(0)
    })
  })

  describe('export flow', () => {
    const openExportMenu = async () => {
      storeState.chatSession.chatSessions = [sampleSession]
      renderChats()
      // The export button is the icon-only Menu trigger; identify it by its
      // lucide Download SVG.
      const icon = await waitFor(() => {
        const el = document.querySelector('svg.lucide-download')
        if (!el) throw new Error('Export icon not in DOM yet')
        return el
      })
      const trigger = icon.closest('button')
      await userEvent.click(trigger as HTMLElement)
    }

    it('downloads the blob and toasts success', async () => {
      await openExportMenu()
      await userEvent.click(await screen.findByText('Export as JSON'))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Chats exported as JSON.')
      )
      expect(URL.createObjectURL).toHaveBeenCalled()
    })

    it('toasts "no chats available" on 404', async () => {
      exportChatsMock.mockRejectedValueOnce(makeAxiosError(404))
      await openExportMenu()
      await userEvent.click(await screen.findByText('Export as CSV'))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'No chats available to export.'
        )
      )
    })

    it('toasts generic on other 4xx', async () => {
      exportChatsMock.mockRejectedValueOnce(makeAxiosError(400))
      await openExportMenu()
      await userEvent.click(await screen.findByText('Export as PDF'))
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not export chats as PDF.'
        )
      )
    })

    it('stays silent on 5xx (interceptor owns it)', async () => {
      exportChatsMock.mockRejectedValueOnce(makeAxiosError(500))
      await openExportMenu()
      await userEvent.click(await screen.findByText('Export as JSON'))
      await waitFor(() => expect(exportChatsMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      const calls = showNotificationMock.mock.calls.filter(c => c[0] === 'success' || c[0] === 'error')
      expect(calls).toHaveLength(0)
    })
  })

  describe('sort change', () => {
    it('updates filters and refetches when a sort option is chosen', async () => {
      renderChats()
      await waitFor(() => expect(getChatSessionsMock).toHaveBeenCalledTimes(1))
      const sortInput = screen.getByPlaceholderText('Sort')
      await userEvent.click(sortInput)
      await userEvent.click(await screen.findByText('Oldest'))
      expect(setChatSessionFiltersMock).toHaveBeenCalledWith({
        searchParam: '',
        sortBy: 'Oldest',
      })
      await waitFor(() => expect(getChatSessionsMock).toHaveBeenCalledTimes(2))
    })
  })
})
