export type KanbanBoardType = 'MANUAL' | 'AUTOMATED'

export type LeadType = 'BOOKING' | 'AUTOMATED' | 'MANUAL'

export interface KanbanColumn {
  id: string
  chatbotId: string
  board: KanbanBoardType
  name: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  chatbotId: string
  sessionId: string | null
  name: string | null
  email: string | null
  phone: string | null
  source: string
  type: LeadType
  trigger: string | null
  meta: Record<string, unknown> | null
  manualColumnId: string
  automatedColumnId: string | null
  createdAt: string
  updatedAt: string
  manualColumn?: { id: string; name: string }
  automatedColumn?: { id: string; name: string } | null
}

export interface KanbanBoards {
  manual: KanbanColumn[]
  automated: KanbanColumn[]
}

export interface MoveLeadRequest {
  board: KanbanBoardType
  columnId: string
}

export interface CreateLeadRequest {
  name?: string
  email?: string
  phone?: string
}
