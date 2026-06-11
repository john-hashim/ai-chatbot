/**
 * Lead service
 *
 * Central capture point for leads regardless of origin (booking flow,
 * automated qualification, manual dashboard entry). Every lead lives on both
 * kanbans: it always gets the manual board's first column, and an automated
 * column when a pipeline stage applies. Repeat captures for the same
 * (session, type) update the existing lead instead of duplicating it.
 */

import { KanbanBoardType, LeadType, Prisma, type Lead } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { ensureManualColumns, findAutomatedColumnByStage } from './kanban.service.js'

export type CaptureLeadInput = {
  chatbotId: string
  sessionId?: string | null
  type: LeadType
  name?: string | null
  email?: string | null
  phone?: string | null
  /** Channel override — defaults to the session's source, or 'playground'. */
  source?: string | null
  /** 'booking' for BOOKING leads; matched stage/condition for AUTOMATED. */
  trigger?: string | null
  /** Automated-board stage name to place the lead in (matched case-insensitively). */
  stage?: string | null
  meta?: Record<string, unknown> | null
}

export async function captureLead(input: CaptureLeadInput): Promise<Lead> {
  const { chatbotId, sessionId, type } = input

  // Resolve channel from the originating session unless explicitly given.
  let source = input.source ?? null
  if (!source && sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { source: true },
    })
    source = session?.source ?? null
  }

  const manualColumns = await ensureManualColumns(chatbotId)
  const firstManualColumnId = manualColumns[0]!.id

  const automatedColumn = input.stage
    ? await findAutomatedColumnByStage(chatbotId, input.stage)
    : null

  const existing = sessionId
    ? await prisma.lead.findUnique({ where: { sessionId_type: { sessionId, type } } })
    : null

  if (existing) {
    // Update capture data but never move the lead on the manual board —
    // that placement belongs to the owner once the lead exists.
    return prisma.lead.update({
      where: { id: existing.id },
      data: {
        name: input.name ?? existing.name,
        email: input.email ?? existing.email,
        phone: input.phone ?? existing.phone,
        trigger: input.trigger ?? existing.trigger,
        ...(automatedColumn ? { automatedColumnId: automatedColumn.id } : {}),
        ...(input.meta != null ? { meta: input.meta as Prisma.InputJsonValue } : {}),
      },
    })
  }

  return prisma.lead.create({
    data: {
      chatbotId,
      sessionId: sessionId ?? null,
      type,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: source ?? 'playground',
      trigger: input.trigger ?? null,
      manualColumnId: firstManualColumnId,
      automatedColumnId: automatedColumn?.id ?? null,
      meta: input.meta != null ? (input.meta as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })
}

export async function listLeads(chatbotId: string) {
  return prisma.lead.findMany({
    where: { chatbotId },
    orderBy: { createdAt: 'desc' },
    include: {
      manualColumn: { select: { id: true, name: true } },
      automatedColumn: { select: { id: true, name: true } },
    },
  })
}

export type MoveLeadResult = Lead | 'lead_not_found' | 'column_not_found'

/**
 * Move a lead to a column on one of the two boards. The column must belong
 * to the same chatbot and to the requested board.
 */
export async function moveLead(
  chatbotId: string,
  leadId: string,
  board: KanbanBoardType,
  columnId: string
): Promise<MoveLeadResult> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, chatbotId } })
  if (!lead) return 'lead_not_found'

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, chatbotId, board },
  })
  if (!column) return 'column_not_found'

  return prisma.lead.update({
    where: { id: leadId },
    data:
      board === KanbanBoardType.MANUAL
        ? { manualColumnId: columnId }
        : { automatedColumnId: columnId },
  })
}

export type UpdateLeadInput = {
  name?: string | null
  email?: string | null
  phone?: string | null
}

export async function updateLead(
  chatbotId: string,
  leadId: string,
  data: UpdateLeadInput
): Promise<Lead | null> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, chatbotId } })
  if (!lead) return null
  return prisma.lead.update({ where: { id: leadId }, data })
}

export async function deleteLead(chatbotId: string, leadId: string): Promise<boolean> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, chatbotId },
    select: { id: true },
  })
  if (!lead) return false
  await prisma.lead.delete({ where: { id: leadId } })
  return true
}
