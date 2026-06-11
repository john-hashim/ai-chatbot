/**
 * Kanban service
 *
 * Each chatbot has two boards, discriminated by KanbanColumn.board:
 *  - MANUAL: fully user-managed. Default columns are seeded lazily on first
 *    access; new leads always land in the first (lowest position) column.
 *  - AUTOMATED: pipeline stages generated from the Tune Agent interview.
 *    Replaced wholesale whenever the custom instruction is regenerated —
 *    existing leads keep their row but lose their automated column (SetNull),
 *    re-entering the pipeline on their next classification.
 */

import { KanbanBoardType, type KanbanColumn } from '@prisma/client'
import { prisma } from '../prisma/client.js'

export const DEFAULT_MANUAL_COLUMNS = [
  'Leads',
  'In Progress',
  'In Talking',
  'Lead Captured',
  'Lead Abandoned',
]

/** Max stages the automated pipeline can have (guards LLM output). */
export const MAX_PIPELINE_STAGES = 6

const byPosition = { position: 'asc' as const }

/**
 * Seed the default manual columns if the chatbot has none yet, then return
 * the manual board ordered by position.
 */
export async function ensureManualColumns(chatbotId: string): Promise<KanbanColumn[]> {
  const existing = await prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.MANUAL },
    orderBy: byPosition,
  })
  if (existing.length > 0) return existing

  await prisma.kanbanColumn.createMany({
    data: DEFAULT_MANUAL_COLUMNS.map((name, position) => ({
      chatbotId,
      board: KanbanBoardType.MANUAL,
      name,
      position,
    })),
    // Two concurrent first-hits can both try to seed; the second batch is
    // harmless duplicates only if it wins a race — re-read below settles it.
    skipDuplicates: true,
  })

  return prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.MANUAL },
    orderBy: byPosition,
  })
}

export async function getBoards(chatbotId: string) {
  const manual = await ensureManualColumns(chatbotId)
  const automated = await prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.AUTOMATED },
    orderBy: byPosition,
  })
  return { manual, automated }
}

/** Append a new column to the end of the manual board. */
export async function createManualColumn(chatbotId: string, name: string): Promise<KanbanColumn> {
  const columns = await ensureManualColumns(chatbotId)
  const lastPosition = columns[columns.length - 1]?.position ?? -1
  return prisma.kanbanColumn.create({
    data: { chatbotId, board: KanbanBoardType.MANUAL, name, position: lastPosition + 1 },
  })
}

export async function renameColumn(
  chatbotId: string,
  columnId: string,
  name: string
): Promise<KanbanColumn | null> {
  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, chatbotId, board: KanbanBoardType.MANUAL },
  })
  if (!column) return null
  return prisma.kanbanColumn.update({ where: { id: columnId }, data: { name } })
}

/**
 * Reorder the manual board. `orderedIds` must contain exactly the chatbot's
 * manual column ids; returns null if it doesn't match.
 */
export async function reorderManualColumns(
  chatbotId: string,
  orderedIds: string[]
): Promise<KanbanColumn[] | null> {
  const columns = await prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.MANUAL },
    select: { id: true },
  })
  const validIds = new Set(columns.map(c => c.id))
  if (
    orderedIds.length !== validIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    !orderedIds.every(id => validIds.has(id))
  ) {
    return null
  }

  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.kanbanColumn.update({ where: { id }, data: { position } })
    )
  )

  return prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.MANUAL },
    orderBy: byPosition,
  })
}

export type DeleteColumnResult = 'deleted' | 'not_found' | 'last_column'

/**
 * Delete a manual column. Its leads are moved to the first remaining column
 * so they never disappear from the board. The last column cannot be deleted.
 */
export async function deleteManualColumn(
  chatbotId: string,
  columnId: string
): Promise<DeleteColumnResult> {
  const columns = await prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.MANUAL },
    orderBy: byPosition,
  })
  const target = columns.find(c => c.id === columnId)
  if (!target) return 'not_found'
  if (columns.length === 1) return 'last_column'

  const fallback = columns.find(c => c.id !== columnId)!
  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { manualColumnId: columnId },
      data: { manualColumnId: fallback.id },
    }),
    prisma.kanbanColumn.delete({ where: { id: columnId } }),
  ])
  return 'deleted'
}

/**
 * Replace the automated pipeline with freshly generated stage names.
 * Called when the Tune Agent regenerates the custom instruction. Leads
 * pointing at old stages get automatedColumnId = null (relation SetNull)
 * and re-enter the pipeline on their next classification.
 */
export async function replaceAutomatedColumns(
  chatbotId: string,
  stageNames: string[]
): Promise<KanbanColumn[]> {
  const names = stageNames
    .map(n => n.trim())
    .filter(Boolean)
    .slice(0, MAX_PIPELINE_STAGES)

  await prisma.$transaction(async tx => {
    await tx.lead.updateMany({
      where: { chatbotId, automatedColumn: { board: KanbanBoardType.AUTOMATED } },
      data: { automatedColumnId: null },
    })
    await tx.kanbanColumn.deleteMany({
      where: { chatbotId, board: KanbanBoardType.AUTOMATED },
    })
    if (names.length > 0) {
      await tx.kanbanColumn.createMany({
        data: names.map((name, position) => ({
          chatbotId,
          board: KanbanBoardType.AUTOMATED,
          name,
          position,
        })),
      })
    }
  })

  return prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.AUTOMATED },
    orderBy: byPosition,
  })
}

/** Case-insensitive stage-name lookup on the automated board. */
export async function findAutomatedColumnByStage(
  chatbotId: string,
  stage: string
): Promise<KanbanColumn | null> {
  return prisma.kanbanColumn.findFirst({
    where: {
      chatbotId,
      board: KanbanBoardType.AUTOMATED,
      name: { equals: stage.trim(), mode: 'insensitive' },
    },
  })
}
