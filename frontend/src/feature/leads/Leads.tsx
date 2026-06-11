import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { SegmentedControl, Tooltip, Loader, TextInput, Button } from '@mantine/core'
import { modals } from '@mantine/modals'
import { Plus } from 'lucide-react'
import { isAxiosError } from 'axios'
import { leadsService } from '@/api/services/leads'
import { useChatbotStore } from '@/store'
import { showNotification } from '@/utils/notifications'
import type { KanbanBoards, KanbanBoardType, KanbanColumn, Lead } from '@/types/leads'
import { BoardColumn } from './BoardColumn'

export const Leads: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { currentChatbot } = useChatbotStore()

  const [boards, setBoards] = useState<KanbanBoards | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [board, setBoard] = useState<KanbanBoardType>('MANUAL')
  const [loading, setLoading] = useState(true)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  useEffect(() => {
    if (!chatbotId) return
    setLoading(true)
    Promise.all([leadsService.getBoards(chatbotId), leadsService.getLeads(chatbotId)])
      .then(([boardsRes, leadsRes]) => {
        setBoards(boardsRes.data.data ?? { manual: [], automated: [] })
        setLeads(leadsRes.data.data ?? [])
      })
      .catch(err => {
        if (isAxiosError(err) && err.response && err.response.status < 500) {
          showNotification('error', 'Could not load leads. Please refresh.')
        }
      })
      .finally(() => setLoading(false))
  }, [chatbotId])

  // The automated pipeline only exists once a custom instruction is generated.
  const hasCustomInstruction =
    currentChatbot?.instructionType === 'manual' && Boolean(currentChatbot?.customInstruction)
  const hasAutomatedBoard = hasCustomInstruction && (boards?.automated.length ?? 0) > 0

  // Force back to manual if the automated board becomes unavailable.
  useEffect(() => {
    if (board === 'AUTOMATED' && !hasAutomatedBoard) setBoard('MANUAL')
  }, [board, hasAutomatedBoard])

  const columns = useMemo(
    () => (board === 'MANUAL' ? (boards?.manual ?? []) : (boards?.automated ?? [])),
    [board, boards]
  )
  const columnKey = board === 'MANUAL' ? 'manualColumnId' : 'automatedColumnId'

  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    for (const column of columns) grouped[column.id] = []
    for (const lead of leads) {
      const columnId = lead[columnKey]
      if (columnId && grouped[columnId]) grouped[columnId].push(lead)
    }
    return grouped
  }, [columns, leads, columnKey])

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { draggableId, source, destination } = result
      if (!chatbotId || !destination) return
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return
      }

      const previousLeads = leads

      // Optimistic update: reorder locally so the drop lands exactly where it
      // was released. Within-column order is session-local (not persisted).
      setLeads(current => {
        const moved = current.find(l => l.id === draggableId)
        if (!moved) return current
        const without = current.filter(l => l.id !== draggableId)
        const updated = { ...moved, [columnKey]: destination.droppableId }

        const destinationItems = without.filter(l => l[columnKey] === destination.droppableId)
        const anchor = destinationItems[destination.index]
        const insertAt = anchor ? without.indexOf(anchor) : without.length
        return [...without.slice(0, insertAt), updated, ...without.slice(insertAt)]
      })

      if (source.droppableId !== destination.droppableId) {
        leadsService
          .moveLead(chatbotId, draggableId, { board, columnId: destination.droppableId })
          .catch(err => {
            setLeads(previousLeads)
            if (isAxiosError(err) && err.response && err.response.status < 500) {
              showNotification('error', 'Could not move the lead. Please try again.')
            }
          })
      }
    },
    [chatbotId, leads, board, columnKey]
  )

  const submitNewColumn = useCallback(() => {
    const name = newColumnName.trim()
    setAddingColumn(false)
    setNewColumnName('')
    if (!chatbotId || !name) return
    leadsService
      .createColumn(chatbotId, name)
      .then(res => {
        const column = res.data.data
        if (column) {
          setBoards(prev => (prev ? { ...prev, manual: [...prev.manual, column] } : prev))
        }
      })
      .catch(err => {
        if (isAxiosError(err) && err.response && err.response.status < 500) {
          showNotification('error', 'Could not create the section. Please try again.')
        }
      })
  }, [chatbotId, newColumnName])

  const handleRenameColumn = useCallback(
    (column: KanbanColumn, name: string) => {
      if (!chatbotId) return
      setBoards(prev =>
        prev
          ? { ...prev, manual: prev.manual.map(c => (c.id === column.id ? { ...c, name } : c)) }
          : prev
      )
      leadsService.renameColumn(chatbotId, column.id, name).catch(err => {
        setBoards(prev =>
          prev
            ? {
                ...prev,
                manual: prev.manual.map(c =>
                  c.id === column.id ? { ...c, name: column.name } : c
                ),
              }
            : prev
        )
        if (isAxiosError(err) && err.response && err.response.status < 500) {
          showNotification('error', 'Could not rename the section. Please try again.')
        }
      })
    },
    [chatbotId]
  )

  const handleDeleteColumn = useCallback(
    (column: KanbanColumn) => {
      if (!chatbotId) return
      const columnLeads = leads.filter(l => l.manualColumnId === column.id).length
      modals.openConfirmModal({
        title: 'Delete section',
        children: (
          <p className="text-sm text-text-weak">
            Delete <b>{column.name}</b>?
            {columnLeads > 0 && ` Its ${columnLeads} lead(s) will move to the first section.`}
          </p>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          leadsService
            .deleteColumn(chatbotId, column.id)
            .then(() => {
              setBoards(prev => {
                if (!prev) return prev
                const manual = prev.manual.filter(c => c.id !== column.id)
                const fallbackId = manual[0]?.id
                if (fallbackId) {
                  setLeads(current =>
                    current.map(l =>
                      l.manualColumnId === column.id ? { ...l, manualColumnId: fallbackId } : l
                    )
                  )
                }
                return { ...prev, manual }
              })
            })
            .catch(err => {
              if (isAxiosError(err) && err.response && err.response.status < 500) {
                showNotification('error', 'Could not delete the section. Please try again.')
              }
            })
        },
      })
    },
    [chatbotId, leads]
  )

  const handleDeleteLead = useCallback(
    (lead: Lead) => {
      if (!chatbotId) return
      modals.openConfirmModal({
        title: 'Delete lead',
        children: (
          <p className="text-sm text-text-weak">
            Delete <b>{lead.name || lead.email || 'this lead'}</b>? This cannot be undone.
          </p>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          setLeads(current => current.filter(l => l.id !== lead.id))
          leadsService.deleteLead(chatbotId, lead.id).catch(err => {
            setLeads(current => [lead, ...current])
            if (isAxiosError(err) && err.response && err.response.status < 500) {
              showNotification('error', 'Could not delete the lead. Please try again.')
            }
          })
        },
      })
    },
    [chatbotId]
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3 pt-8 pb-4 px-6">
        <div>
          <p className="font-semibold text-2xl">Leads</p>
          <p className="text-text-weak text-[12px] mt-0.5">
            Leads captured by your agent, organized on your board and the generated pipeline.
          </p>
        </div>
        <Tooltip
          label="Generate a custom instruction in Agent Tuning to unlock the automated pipeline"
          disabled={hasAutomatedBoard}
          position="bottom"
        >
          <SegmentedControl
            value={board}
            onChange={value => setBoard(value as KanbanBoardType)}
            data={[
              { label: 'My board', value: 'MANUAL' },
              { label: 'Pipeline', value: 'AUTOMATED', disabled: !hasAutomatedBoard },
            ]}
            size="sm"
            radius="md"
            color="brand"
            styles={{ root: { backgroundColor: 'var(--color-background-dark-week)' } }}
          />
        </Tooltip>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader size="sm" color="brand" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto px-6 pb-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex items-start gap-4 h-full">
              {columns.map(column => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  leads={leadsByColumn[column.id] ?? []}
                  editable={board === 'MANUAL'}
                  onRename={handleRenameColumn}
                  onDelete={handleDeleteColumn}
                  onDeleteLead={handleDeleteLead}
                />
              ))}

              {board === 'MANUAL' && (
                <div className="w-[284px] shrink-0 pt-7">
                  {addingColumn ? (
                    <TextInput
                      size="sm"
                      placeholder="Section name"
                      value={newColumnName}
                      onChange={e => setNewColumnName(e.currentTarget.value)}
                      onBlur={submitNewColumn}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitNewColumn()
                        if (e.key === 'Escape') {
                          setAddingColumn(false)
                          setNewColumnName('')
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <Button
                      variant="subtle"
                      color="gray"
                      size="sm"
                      leftSection={<Plus size={15} />}
                      onClick={() => setAddingColumn(true)}
                      fullWidth
                      justify="flex-start"
                    >
                      Add section
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  )
}
