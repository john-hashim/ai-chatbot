import type { Request, Response, NextFunction } from 'express'
import { KanbanBoardType, LeadType } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as kanbanService from '../services/kanban.service.js'
import * as leadService from '../services/lead.service.js'

const MAX_COLUMN_NAME_LENGTH = 60

async function findOwnedChatbot(chatbotId: string | undefined, userId: string) {
  if (!chatbotId) return null
  return prisma.chatbot.findUnique({
    where: { id: chatbotId, userId },
    select: { id: true },
  })
}

const notFound = (res: Response) =>
  res.status(404).json({
    status: ApiStatus.FAILURE,
    message: 'Chatbot not found or you do not have permission',
  } satisfies ApiResponse)

function parseColumnName(body: unknown): string | null {
  const name = (body as { name?: unknown })?.name
  if (typeof name !== 'string' || !name.trim()) return null
  return name.trim().slice(0, MAX_COLUMN_NAME_LENGTH)
}

// ---------------------------------------------------------------------------
// Boards & columns
// ---------------------------------------------------------------------------

export const getBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const boards = await kanbanService.getBoards(chatbot.id)
    res.json({
      status: ApiStatus.SUCCESS,
      data: boards,
      message: 'Kanban boards retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const createColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const name = parseColumnName(req.body)
    if (!name) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Column name is required',
      } satisfies ApiResponse)
    }

    const column = await kanbanService.createManualColumn(chatbot.id, name)
    res.status(201).json({
      status: ApiStatus.SUCCESS,
      data: column,
      message: 'Column created successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const renameColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const name = parseColumnName(req.body)
    if (!name) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Column name is required',
      } satisfies ApiResponse)
    }

    const column = await kanbanService.renameColumn(chatbot.id, req.params.columnId!, name)
    if (!column) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Column not found',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: column,
      message: 'Column renamed successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const reorderColumns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const orderedIds = (req.body as { orderedIds?: unknown })?.orderedIds
    if (!Array.isArray(orderedIds) || !orderedIds.every(id => typeof id === 'string')) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'orderedIds must be an array of column ids',
      } satisfies ApiResponse)
    }

    const columns = await kanbanService.reorderManualColumns(chatbot.id, orderedIds)
    if (!columns) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'orderedIds must contain exactly the manual board column ids',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: columns,
      message: 'Columns reordered successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const result = await kanbanService.deleteManualColumn(chatbot.id, req.params.columnId!)
    if (result === 'not_found') {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Column not found',
      } satisfies ApiResponse)
    }
    if (result === 'last_column') {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Cannot delete the last column',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: 'Column deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const leads = await leadService.listLeads(chatbot.id)
    res.json({
      status: ApiStatus.SUCCESS,
      data: leads,
      message: 'Leads retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const { name, email, phone } = (req.body ?? {}) as {
      name?: unknown
      email?: unknown
      phone?: unknown
    }
    if (
      [name, email, phone].some(v => v !== undefined && typeof v !== 'string') ||
      ![name, email, phone].some(v => typeof v === 'string' && v.trim())
    ) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'At least one of name, email, or phone is required',
      } satisfies ApiResponse)
    }

    const lead = await leadService.captureLead({
      chatbotId: chatbot.id,
      type: LeadType.MANUAL,
      name: typeof name === 'string' ? name.trim() : null,
      email: typeof email === 'string' ? email.trim() : null,
      phone: typeof phone === 'string' ? phone.trim() : null,
      source: 'dashboard',
    })

    res.status(201).json({
      status: ApiStatus.SUCCESS,
      data: lead,
      message: 'Lead created successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const { name, email, phone } = (req.body ?? {}) as {
      name?: unknown
      email?: unknown
      phone?: unknown
    }
    const data: leadService.UpdateLeadInput = {}
    if (typeof name === 'string') data.name = name.trim() || null
    if (typeof email === 'string') data.email = email.trim() || null
    if (typeof phone === 'string') data.phone = phone.trim() || null

    const lead = await leadService.updateLead(chatbot.id, req.params.leadId!, data)
    if (!lead) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Lead not found',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: lead,
      message: 'Lead updated successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const moveLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const { board, columnId } = (req.body ?? {}) as { board?: unknown; columnId?: unknown }
    if (
      (board !== KanbanBoardType.MANUAL && board !== KanbanBoardType.AUTOMATED) ||
      typeof columnId !== 'string'
    ) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'board (MANUAL | AUTOMATED) and columnId are required',
      } satisfies ApiResponse)
    }

    const result = await leadService.moveLead(chatbot.id, req.params.leadId!, board, columnId)
    if (result === 'lead_not_found') {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Lead not found',
      } satisfies ApiResponse)
    }
    if (result === 'column_not_found') {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Column not found on that board',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: result,
      message: 'Lead moved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) return notFound(res)

    const deleted = await leadService.deleteLead(chatbot.id, req.params.leadId!)
    if (!deleted) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Lead not found',
      } satisfies ApiResponse)
    }

    res.json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: 'Lead deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
