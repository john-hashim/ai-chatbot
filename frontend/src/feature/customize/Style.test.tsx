import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { Style } from './Style'
import type { ChatbotFormValues } from './Customize'

// --- Mocks ---

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

type CropperProps = {
  onSave: (file: File) => void | Promise<void>
  onCancel: () => void
}
let lastCropper: CropperProps | null = null
vi.mock('@/components/common/Cropper', () => ({
  CropperComponent: (props: CropperProps) => {
    lastCropper = props
    return <div data-testid="cropper" />
  },
}))

type ModalArgs = { title: string; children: React.ReactNode }
let lastModal: ModalArgs | null = null
const modalsCloseAllMock = vi.fn()
vi.mock('@mantine/modals', () => ({
  modals: {
    open: (args: ModalArgs) => {
      lastModal = args
    },
    closeAll: (...a: unknown[]) => modalsCloseAllMock(...a),
  },
}))

const uploadProfileMock = vi.fn()
const removeProfileMock = vi.fn()
const uploadChatIconMock = vi.fn()
const removeChatIconMock = vi.fn()
let profileUploadingFlag = false
let chatIconUploadingFlag = false

vi.mock('@/hooks/useChatbotImageUpload', () => ({
  useChatbotImageUpload: ({ field }: { field: 'profilePicture' | 'chatIcon' }) => {
    if (field === 'profilePicture') {
      return {
        isUploading: profileUploadingFlag,
        upload: uploadProfileMock,
        remove: removeProfileMock,
      }
    }
    return {
      isUploading: chatIconUploadingFlag,
      upload: uploadChatIconMock,
      remove: removeChatIconMock,
    }
  },
}))

// --- Harness ---

const defaults: ChatbotFormValues = {
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

const Harness: React.FC<{ values?: Partial<ChatbotFormValues> }> = ({ values }) => {
  const methods = useForm<ChatbotFormValues>({ defaultValues: { ...defaults, ...values } })
  return (
    <FormProvider {...methods}>
      <Style />
    </FormProvider>
  )
}

const renderStyle = (values?: Partial<ChatbotFormValues>) =>
  render(
    <MantineProvider>
      <Harness values={values} />
    </MantineProvider>
  )

const makeFile = (sizeBytes: number, name = 'a.png') => {
  const file = new File([new Uint8Array(sizeBytes)], name, { type: 'image/png' })
  return file
}

beforeEach(() => {
  vi.clearAllMocks()
  lastCropper = null
  lastModal = null
  profileUploadingFlag = false
  chatIconUploadingFlag = false
})

describe('Style', () => {
  describe('rendering', () => {
    it('renders the appearance segmented control and color inputs', () => {
      renderStyle()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByText('Primary Color')).toBeInTheDocument()
      expect(screen.getByText('Chat bubble button color')).toBeInTheDocument()
    })

    it('shows upload buttons when no images are set', () => {
      renderStyle()
      expect(screen.getAllByRole('button', { name: /Upload image/i })).toHaveLength(2)
    })

    it('shows the preview image and remove tooltip when profilePicture is set', () => {
      renderStyle({ profilePicture: 'https://example.com/p.png' })
      const img = screen.getByAltText('Profile preview') as HTMLImageElement
      expect(img.src).toBe('https://example.com/p.png')
    })

    it('shows a spinner when profile picture is uploading', () => {
      profileUploadingFlag = true
      const { container } = renderStyle()
      expect(container.querySelector('svg.animate-spin')).toBeTruthy()
    })
  })

  describe('profile picture upload flow', () => {
    it('rejects files larger than 1MB and toasts an error', async () => {
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      const big = makeFile(2 * 1024 * 1024)
      await userEvent.upload(inputs[0], big)
      expect(showNotificationMock).toHaveBeenCalledWith('error', 'Image size larger than 1MB')
      expect(lastModal).toBeNull()
      expect(uploadProfileMock).not.toHaveBeenCalled()
    })

    it('opens the cropper modal for an acceptable file', async () => {
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      const ok = makeFile(1024)
      await userEvent.upload(inputs[0], ok)
      expect(lastModal?.title).toBe('Crop Profile Picture')
      expect(showNotificationMock).not.toHaveBeenCalled()
    })

    it('calls upload after the cropper saves and closes the modal', async () => {
      uploadProfileMock.mockResolvedValueOnce(undefined)
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      await userEvent.upload(inputs[0], makeFile(1024))
      render(<MantineProvider>{lastModal!.children}</MantineProvider>)
      await lastCropper!.onSave(makeFile(512, 'cropped.png'))
      expect(modalsCloseAllMock).toHaveBeenCalled()
      await waitFor(() => expect(uploadProfileMock).toHaveBeenCalled())
    })

    it('swallows upload rejection (hook owns the toast)', async () => {
      uploadProfileMock.mockRejectedValueOnce(new Error('boom'))
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      await userEvent.upload(inputs[0], makeFile(1024))
      render(<MantineProvider>{lastModal!.children}</MantineProvider>)
      await lastCropper!.onSave(makeFile(512))
      // hook is responsible for the error notification; component must not toast
      expect(showNotificationMock).not.toHaveBeenCalled()
    })

    it('cancelling the cropper closes the modal and does not upload', async () => {
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      await userEvent.upload(inputs[0], makeFile(1024))
      render(<MantineProvider>{lastModal!.children}</MantineProvider>)
      lastCropper!.onCancel()
      expect(modalsCloseAllMock).toHaveBeenCalled()
      expect(uploadProfileMock).not.toHaveBeenCalled()
    })
  })

  describe('profile picture remove flow', () => {
    const findRemoveButton = (img: HTMLElement) => {
      const wrapper = img.parentElement!
      return wrapper.querySelector('button') as HTMLButtonElement
    }

    it('calls remove when the X button is clicked', async () => {
      removeProfileMock.mockResolvedValueOnce(undefined)
      renderStyle({ profilePicture: 'https://example.com/p.png' })
      const img = screen.getByAltText('Profile preview')
      await userEvent.click(findRemoveButton(img))
      await waitFor(() => expect(removeProfileMock).toHaveBeenCalled())
    })

    it('swallows remove rejection (hook owns the toast)', async () => {
      removeProfileMock.mockRejectedValueOnce(new Error('boom'))
      renderStyle({ profilePicture: 'https://example.com/p.png' })
      const img = screen.getByAltText('Profile preview')
      await userEvent.click(findRemoveButton(img))
      await waitFor(() => expect(removeProfileMock).toHaveBeenCalled())
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('chat icon flows', () => {
    it('rejects oversize chat icon files', async () => {
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      // second file input is the chat-icon one
      await userEvent.upload(inputs[1], makeFile(2 * 1024 * 1024))
      expect(showNotificationMock).toHaveBeenCalledWith('error', 'Image size larger than 1MB')
      expect(uploadChatIconMock).not.toHaveBeenCalled()
    })

    it('opens the chat-icon cropper and uploads on save', async () => {
      uploadChatIconMock.mockResolvedValueOnce(undefined)
      renderStyle()
      const inputs = document.querySelectorAll(
        'input[type="file"]'
      ) as NodeListOf<HTMLInputElement>
      await userEvent.upload(inputs[1], makeFile(1024))
      expect(lastModal?.title).toBe('Crop Chat Icon')
      render(<MantineProvider>{lastModal!.children}</MantineProvider>)
      await lastCropper!.onSave(makeFile(512))
      await waitFor(() => expect(uploadChatIconMock).toHaveBeenCalled())
    })

    it('removes the chat icon', async () => {
      removeChatIconMock.mockResolvedValueOnce(undefined)
      renderStyle({ chatIcon: 'https://example.com/icon.png' })
      const img = screen.getByAltText('Chat icon preview')
      const btn = img.parentElement!.querySelector('button') as HTMLButtonElement
      await userEvent.click(btn)
      await waitFor(() => expect(removeChatIconMock).toHaveBeenCalled())
    })
  })
})
