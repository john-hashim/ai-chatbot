import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Customize } from './Customize'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock heavy siblings; keep Content real so we can dirty the form by typing.
vi.mock('./Style', () => ({
  Style: () => <div data-testid="style" />,
}))
vi.mock('./Preview', () => ({
  Preview: () => <div data-testid="preview" />,
}))
vi.mock('@/components/common/TextEditor', () => ({
  TextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="text-editor"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  ),
}))

vi.mock('@mantine/modals', () => ({
  modals: { open: vi.fn(), closeAll: vi.fn() },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const showNotificationMock = vi.fn()
const loadingSuccessMock = vi.fn()
const loadingErrorMock = vi.fn()
const loadingUpdateMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
  showLoadingNotification: () => ({
    success: (...a: unknown[]) => loadingSuccessMock(...a),
    error: (...a: unknown[]) => loadingErrorMock(...a),
    update: (...a: unknown[]) => loadingUpdateMock(...a),
  }),
}))

const updateChatbotMock = vi.fn()
const baseChatbot = {
  id: 'cb1',
  name: 'Bot',
  brandColor: '#2563eb',
  initialMessages: ['Hi!'],
  suggestedMessages: [],
  showSuggestedAfterFirst: false,
  messagePlaceholder: '',
  dismissibleNotice: '',
  footer: '',
  autoshowDelaySeconds: 0,
  autoshowInitialPopup: false,
  appearance: 'light',
  brandColorForHeader: true,
  chatBubbleButtonColor: '#000000',
  profilePicture: null,
  chatIcon: null,
  chatBubbleButtonPosition: 'left',
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({
    currentChatbot: baseChatbot,
    updateChatbot: updateChatbotMock,
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

const renderCustomize = () =>
  render(
    <MantineProvider>
      <Customize />
    </MantineProvider>
  )

const dirtyAndSave = async () => {
  const nameInput = screen.getByPlaceholderText('Luna AI') as HTMLInputElement
  await userEvent.type(nameInput, 'X')
  const saveBtn = await screen.findByRole('button', { name: 'Save' })
  await userEvent.click(saveBtn)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Customize', () => {
  describe('rendering', () => {
    it('renders the content tab by default', () => {
      renderCustomize()
      expect(screen.getByText('Customize your chatbot')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Luna AI')).toBeInTheDocument()
    })

    it('switches to the style tab', async () => {
      renderCustomize()
      await userEvent.click(screen.getByRole('button', { name: 'Style' }))
      expect(screen.getByTestId('style')).toBeInTheDocument()
    })

    it('does not show the unsaved-changes bar when pristine', () => {
      renderCustomize()
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
    })

    it('shows the unsaved-changes bar after the form is edited', async () => {
      renderCustomize()
      await userEvent.type(screen.getByPlaceholderText('Luna AI'), 'X')
      expect(await screen.findByText(/unsaved changes/i)).toBeInTheDocument()
    })
  })

  describe('save', () => {
    it('calls updateChatbot and shows success notification', async () => {
      updateChatbotMock.mockResolvedValueOnce({})
      renderCustomize()
      await dirtyAndSave()
      await waitFor(() => expect(updateChatbotMock).toHaveBeenCalled())
      await waitFor(() =>
        expect(loadingSuccessMock).toHaveBeenCalledWith('Chatbot saved successfully')
      )
    })

    it('404 → contextual error notification', async () => {
      updateChatbotMock.mockRejectedValueOnce(makeAxiosError(404))
      renderCustomize()
      await dirtyAndSave()
      await waitFor(() => expect(loadingErrorMock).toHaveBeenCalledWith('Chatbot not found.'))
    })

    it('other 4xx → generic error notification', async () => {
      updateChatbotMock.mockRejectedValueOnce(makeAxiosError(400))
      renderCustomize()
      await dirtyAndSave()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Failed to save chatbot. Please try again.'
        )
      )
    })

    it('5xx → silent (no error notif; loading dismissed)', async () => {
      updateChatbotMock.mockRejectedValueOnce(makeAxiosError(500))
      renderCustomize()
      await dirtyAndSave()
      await waitFor(() => expect(loadingUpdateMock).toHaveBeenCalled())
      expect(loadingErrorMock).not.toHaveBeenCalled()
    })

    it('non-axios error → generic error notification', async () => {
      updateChatbotMock.mockRejectedValueOnce(new Error('boom'))
      renderCustomize()
      await dirtyAndSave()
      await waitFor(() =>
        expect(loadingErrorMock).toHaveBeenCalledWith(
          'Failed to save chatbot. Please try again.'
        )
      )
    })

    it('cancel resets the form and hides the unsaved bar', async () => {
      renderCustomize()
      await userEvent.type(screen.getByPlaceholderText('Luna AI'), 'X')
      const cancelBtn = await screen.findByRole('button', { name: 'Cancel' })
      await userEvent.click(cancelBtn)
      await waitFor(() =>
        expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
      )
    })
  })

  it('does not call showNotification (interceptor-owned statuses)', async () => {
    renderCustomize()
    await waitFor(() => expect(showNotificationMock).not.toHaveBeenCalled())
  })
})
