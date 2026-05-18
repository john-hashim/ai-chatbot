import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AxiosError, AxiosHeaders } from 'axios'
import { Deploy } from './Deploy'
import type { EmbedConfig } from '@/api/services/embed'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { openConfirmModal: vi.fn(), close: vi.fn(), updateModal: vi.fn() },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const fetchEmbedConfigMock = vi.fn()
const createEmbedConfigMock = vi.fn()
const updateEmbedConfigMock = vi.fn()

let chatbotState: { currentChatbot: { id: string; name: string } | null }
let embedState: {
  embedConfig: EmbedConfig | null
  isLoadingEmbedConfig: boolean
  isMutatingEmbedConfig: boolean
}

vi.mock('@/store', () => ({
  useChatbotStore: () => ({ currentChatbot: chatbotState.currentChatbot }),
  useEmbedStore: () => ({
    embedConfig: embedState.embedConfig,
    isLoadingEmbedConfig: embedState.isLoadingEmbedConfig,
    isMutatingEmbedConfig: embedState.isMutatingEmbedConfig,
    fetchEmbedConfig: fetchEmbedConfigMock,
    createEmbedConfig: createEmbedConfigMock,
    updateEmbedConfig: updateEmbedConfigMock,
    clearEmbedConfig: vi.fn(),
  }),
}))

const renderDeploy = () =>
  render(
    <MantineProvider>
      <Deploy />
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

const sampleEmbedConfig: EmbedConfig = {
  id: 'ec1',
  chatbotId: 'cb1',
  embedKey: 'ek_test123',
  isActive: true,
  allowedDomains: ['example.com'],
  rateLimitPerMin: 60,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  chatbotState = { currentChatbot: { id: 'cb1', name: 'Bot One' } }
  embedState = {
    embedConfig: null,
    isLoadingEmbedConfig: false,
    isMutatingEmbedConfig: false,
  }
  fetchEmbedConfigMock.mockResolvedValue(undefined)
  createEmbedConfigMock.mockResolvedValue(undefined)
  updateEmbedConfigMock.mockResolvedValue(undefined)
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

describe('Deploy', () => {
  describe('rendering', () => {
    it('shows skeletons while loading', () => {
      embedState.isLoadingEmbedConfig = true
      renderDeploy()
      expect(screen.getByText('Deploy')).toBeInTheDocument()
      expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })

    it('shows generate-key empty state when there is no embed config', () => {
      renderDeploy()
      expect(screen.getByText('No embed key generated yet')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Generate Embed Key/i })
      ).toBeInTheDocument()
    })

    it('renders the full configuration when an embed config exists', () => {
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      expect(screen.getByText('Bot One')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('ek_test123')).toBeInTheDocument()
      expect(screen.getByDisplayValue('example.com')).toBeInTheDocument()
    })
  })

  describe('fetchEmbedConfig (mount)', () => {
    it('calls fetchEmbedConfig with the chatbot id', async () => {
      renderDeploy()
      await waitFor(() => expect(fetchEmbedConfigMock).toHaveBeenCalledWith('cb1'))
    })

    it('does not fetch when there is no current chatbot', async () => {
      chatbotState.currentChatbot = null
      renderDeploy()
      await new Promise(r => setTimeout(r, 0))
      expect(fetchEmbedConfigMock).not.toHaveBeenCalled()
    })

    it('toasts on 4xx (not 404)', async () => {
      fetchEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(400))
      renderDeploy()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not load embed configuration. Please refresh.'
        )
      )
    })

    it('toasts "Chatbot not found." on 404', async () => {
      fetchEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(404))
      renderDeploy()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('error', 'Chatbot not found.')
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      fetchEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(500))
      renderDeploy()
      await waitFor(() => expect(fetchEmbedConfigMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('Generate embed key', () => {
    const click = async () =>
      userEvent.click(screen.getByRole('button', { name: /Generate Embed Key/i }))

    it('toasts success on success', async () => {
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'success',
          'Embed key generated successfully'
        )
      )
    })

    it('toasts not-found on 404', async () => {
      createEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(404))
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('error', 'Chatbot not found.')
      )
    })

    it('toasts "already exists" on 409', async () => {
      createEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(409))
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'An embed key already exists for this chatbot.'
        )
      )
    })

    it('toasts generic on other 4xx', async () => {
      createEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(400))
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not generate embed key. Please try again.'
        )
      )
    })

    it('stays silent on 5xx (interceptor handles it)', async () => {
      createEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(500))
      renderDeploy()
      await click()
      await waitFor(() => expect(createEmbedConfigMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('Toggle active', () => {
    const setup = () => {
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      return screen.getByRole('switch')
    }

    it('toasts deactivated on success when toggled off', async () => {
      const sw = setup()
      await userEvent.click(sw)
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Embed deactivated')
      )
    })

    it('toasts not-found on 404', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(404))
      const sw = setup()
      await userEvent.click(sw)
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Embed configuration no longer exists.'
        )
      )
    })

    it('toasts generic on other 4xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(400))
      const sw = setup()
      await userEvent.click(sw)
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not update embed status. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(500))
      const sw = setup()
      await userEvent.click(sw)
      await waitFor(() => expect(updateEmbedConfigMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('Save domains', () => {
    const click = async () =>
      userEvent.click(screen.getByRole('button', { name: /Save Domains/i }))

    it('toasts success on success', async () => {
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith('success', 'Domain restrictions updated')
      )
      expect(updateEmbedConfigMock).toHaveBeenCalledWith('cb1', {
        allowedDomains: ['example.com'],
      })
    })

    it('toasts not-found on 404', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(404))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Embed configuration no longer exists.'
        )
      )
    })

    it('toasts generic on other 4xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(400))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not update domain restrictions. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(500))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() => expect(updateEmbedConfigMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })

  describe('Regenerate key', () => {
    const click = async () =>
      userEvent.click(screen.getByRole('button', { name: /Regenerate Key/i }))

    it('toasts success on success', async () => {
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'success',
          'Embed key regenerated. Old key is now invalid.'
        )
      )
      expect(updateEmbedConfigMock).toHaveBeenCalledWith('cb1', { regenerateKey: true })
    })

    it('toasts not-found on 404', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(404))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Embed configuration no longer exists.'
        )
      )
    })

    it('toasts generic on other 4xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(400))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() =>
        expect(showNotificationMock).toHaveBeenCalledWith(
          'error',
          'Could not regenerate embed key. Please try again.'
        )
      )
    })

    it('stays silent on 5xx', async () => {
      updateEmbedConfigMock.mockRejectedValueOnce(makeAxiosError(500))
      embedState.embedConfig = sampleEmbedConfig
      renderDeploy()
      await click()
      await waitFor(() => expect(updateEmbedConfigMock).toHaveBeenCalled())
      await new Promise(r => setTimeout(r, 0))
      expect(showNotificationMock).not.toHaveBeenCalled()
    })
  })
})
