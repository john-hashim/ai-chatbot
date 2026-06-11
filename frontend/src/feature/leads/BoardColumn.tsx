import { memo, useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Menu, ActionIcon, TextInput } from '@mantine/core'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import type { KanbanColumn, Lead } from '@/types/leads'
import { LeadCard } from './LeadCard'

interface BoardColumnProps {
  column: KanbanColumn
  leads: Lead[]
  /** Manual-board columns are editable; automated pipeline columns are not. */
  editable: boolean
  onRename: (column: KanbanColumn, name: string) => void
  onDelete: (column: KanbanColumn) => void
  onDeleteLead: (lead: Lead) => void
}

export const BoardColumn: React.FC<BoardColumnProps> = memo(
  ({ column, leads, editable, onRename, onDelete, onDeleteLead }) => {
    const [renaming, setRenaming] = useState(false)
    const [draftName, setDraftName] = useState(column.name)

    const submitRename = () => {
      setRenaming(false)
      const name = draftName.trim()
      if (name && name !== column.name) onRename(column, name)
      else setDraftName(column.name)
    }

    return (
      <div className="w-[284px] shrink-0 flex flex-col max-h-full">
        <div className="flex items-center gap-2 pl-1.5 pr-3 py-[3px] mb-2 rounded-xl bg-background-dark-week group/column">
          {renaming ? (
            <TextInput
              size="xs"
              variant="unstyled"
              styles={{
                input: {
                  height: '1.875rem',
                  minHeight: 0,
                  padding: '0.125rem 0.375rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  fontWeight: 600,
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: '0.375rem',
                },
              }}
              value={draftName}
              onChange={e => setDraftName(e.currentTarget.value)}
              onBlur={submitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') submitRename()
                if (e.key === 'Escape') {
                  setDraftName(column.name)
                  setRenaming(false)
                }
              }}
              autoFocus
              className="flex-1"
            />
          ) : (
            <>
              <p
                className="text-sm font-semibold text-text-primary truncate px-1.5 py-0.5 border border-transparent rounded-md"
                onDoubleClick={() => editable && setRenaming(true)}
              >
                {column.name}
              </p>
              <span className="text-xs text-text-weak font-medium">{leads.length}</span>
              {editable && (
                <Menu position="bottom-start" withinPortal>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      className="ml-auto opacity-0 group-hover/column:opacity-100 transition-opacity"
                    >
                      <Ellipsis size={15} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<Pencil size={14} />} onClick={() => setRenaming(true)}>
                      Rename section
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<Trash2 size={14} />}
                      onClick={() => onDelete(column)}
                    >
                      Delete section
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </>
          )}
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 min-h-[120px] rounded-xl p-2 overflow-y-auto bg-background-dark-week"
            >
              {leads.map((lead, index) => (
                <LeadCard key={lead.id} lead={lead} index={index} onDelete={onDeleteLead} />
              ))}
              {provided.placeholder}
              {leads.length === 0 && !snapshot.isDraggingOver && (
                <p className="text-xs text-text-weak text-center py-6">No leads</p>
              )}
            </div>
          )}
        </Droppable>
      </div>
    )
  }
)
BoardColumn.displayName = 'BoardColumn'
