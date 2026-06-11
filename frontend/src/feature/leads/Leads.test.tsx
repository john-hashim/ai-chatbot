import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { Leads } from './Leads'
import type { KanbanBoards, Lead } from '@/types/leads'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ chatbotId: 'bot-1' }),
}))

const showNotificationMock = vi.fn()
vi.mock('@/utils/notifications', () => ({
  showNotification: (...args: unknown[]) => showNotificationMock(...args),
}))

vi.mock('@mantine/modals', () => ({
  modals: { openConfirmModal: vi.fn() },
}))

let currentChatbot: { instructionType: string; customInstruction: string | null }
vi.mock('@/store', () => ({
  useChatbotStore: () => ({ currentChatbot }),
}))

const getBoardsMock = vi.fn()
const getLeadsMock = vi.fn()
const moveLeadMock = vi.fn()
vi.mock('@/api/services/leads', () => ({
  leadsService: {
    getBoards: (...args: unknown[]) => getBoardsMock(...args),
    getLeads: (...args: unknown[]) => getLeadsMock(...args),
    moveLead: (...args: unknown[]) => moveLeadMock(...args),
    createColumn: vi.fn(),
    renameColumn: vi.fn(),
    deleteColumn: vi.fn(),
    deleteLead: vi.fn(),
  },
}))

const column = (id: string, board: 'MANUAL' | 'AUTOMATED', name: string, position: number) => ({
  id,
  chatbotId: 'bot-1',
  board,
  name,
  position,
  createdAt: '2026-06-11T00:00:00Z',
  updatedAt: '2026-06-11T00:00:00Z',
})

const boards: KanbanBoards = {
  manual: [
    column('m1', 'MANUAL', 'Leads', 0),
    column('m2', 'MANUAL', 'In Talking', 1),
    column('m3', 'MANUAL', 'Lead Captured', 2),
    column('m4', 'MANUAL', 'Backlog', 3),
  ],
  automated: [
    column('a1', 'AUTOMATED', 'New Inquiry', 0),
    column('a2', 'AUTOMATED', 'Hot Lead', 1),
  ],
}

const lead: Lead = {
  id: 'lead-1',
  chatbotId: 'bot-1',
  sessionId: 'session-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: null,
  source: 'widget',
  type: 'BOOKING',
  trigger: 'booking',
  meta: null,
  manualColumnId: 'm1',
  automatedColumnId: 'a1',
  createdAt: '2026-06-11T00:00:00Z',
  updatedAt: '2026-06-11T00:00:00Z',
}

const renderLeads = () => render(<Leads />, { wrapper: MantineProvider })

beforeEach(() => {
  vi.clearAllMocks()
  currentChatbot = { instructionType: 'manual', customInstruction: 'You are an agent…' }
  getBoardsMock.mockResolvedValue({ data: { data: boards } })
  getLeadsMock.mockResolvedValue({ data: { data: [lead] } })
})

describe('Leads', () => {
  it('renders the manual board columns with leads in their columns', async () => {
    renderLeads()
    expect(await screen.findByText('Leads', { selector: 'p.font-semibold' })).toBeInTheDocument()
    for (const name of ['In Talking', 'Lead Captured', 'Backlog']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('switches to the automated pipeline board', async () => {
    renderLeads()
    await screen.findByText('In Talking')

    await userEvent.click(screen.getByRole('radio', { name: 'Automated' }))

    expect(await screen.findByText('New Inquiry')).toBeInTheDocument()
    expect(screen.getByText('Hot Lead')).toBeInTheDocument()
    expect(screen.queryByText('In Talking')).not.toBeInTheDocument()
    // Lead appears on this board too, in its automated column.
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('disables the pipeline switch when no custom instruction is generated', async () => {
    currentChatbot = { instructionType: 'base', customInstruction: null }
    getBoardsMock.mockResolvedValue({ data: { data: { ...boards, automated: [] } } })

    renderLeads()
    await screen.findByText('In Talking')

    expect(screen.getByRole('radio', { name: 'Automated' })).toBeDisabled()
  })

  it('shows an error notification when loading fails with a 4xx', async () => {
    const error = Object.assign(new Error('not found'), {
      isAxiosError: true,
      response: { status: 404 },
    })
    getBoardsMock.mockRejectedValue(error)
    getLeadsMock.mockRejectedValue(error)

    renderLeads()

    await waitFor(() =>
      expect(showNotificationMock).toHaveBeenCalledWith(
        'error',
        'Could not load leads. Please refresh.'
      )
    )
  })
})
