import { memo } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Menu, ActionIcon } from '@mantine/core'
import {
  Mail,
  Phone,
  Ellipsis,
  Trash2,
  Globe,
  MessageCircle,
  Instagram,
  CalendarCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import dayjs from 'dayjs'
import type { Lead } from '@/types/leads'

const SOURCE_META: Record<string, { label: string; icon: React.ElementType }> = {
  widget: { label: 'Widget', icon: Globe },
  iframe: { label: 'Iframe', icon: Globe },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  instagram: { label: 'Instagram', icon: Instagram },
  playground: { label: 'Playground', icon: Globe },
  dashboard: { label: 'Manual entry', icon: UserRound },
}

const TYPE_META: Record<
  Lead['type'],
  { label: string; icon: React.ElementType; className: string }
> = {
  BOOKING: {
    label: 'Booking',
    icon: CalendarCheck,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  AUTOMATED: {
    label: 'Auto',
    icon: Sparkles,
    className: 'bg-purple-week text-purple-700 border-purple-strong',
  },
  MANUAL: {
    label: 'Manual',
    icon: UserRound,
    className: 'bg-background-dark-week text-text-weak border-border-week',
  },
}

interface LeadCardProps {
  lead: Lead
  index: number
  onDelete: (lead: Lead) => void
}

export const LeadCard: React.FC<LeadCardProps> = memo(({ lead, index, onDelete }) => {
  const source = SOURCE_META[lead.source] ?? { label: lead.source, icon: Globe }
  const type = TYPE_META[lead.type]
  const title = lead.name || lead.email || lead.phone || 'Unnamed lead'

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white rounded-lg border p-3 mb-2 select-none transition-shadow duration-150 ${
            snapshot.isDragging
              ? 'shadow-xl border-color-primary rotate-2'
              : 'border-border-week shadow-sm hover:shadow-md hover:border-border-strong'
          }`}
          style={provided.draggableProps.style}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-text-primary leading-snug wrap-break-word min-w-0">
              {title}
            </p>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Ellipsis size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<Trash2 size={14} />}
                  onClick={() => onDelete(lead)}
                >
                  Delete lead
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>

          {(lead.email || lead.phone) && (
            <div className="mt-1.5 space-y-0.5">
              {lead.email && lead.name && (
                <p className="flex items-center gap-1.5 text-xs text-text-weak truncate">
                  <Mail size={12} className="shrink-0" /> {lead.email}
                </p>
              )}
              {lead.phone && (
                <p className="flex items-center gap-1.5 text-xs text-text-weak truncate">
                  <Phone size={12} className="shrink-0" /> {lead.phone}
                </p>
              )}
            </div>
          )}

          {typeof lead.meta?.summary === 'string' && (
            <p className="mt-1.5 text-xs text-text-weak line-clamp-2">{lead.meta.summary}</p>
          )}

          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${type.className}`}
            >
              <type.icon size={11} />
              {type.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md border bg-background-dark-week text-text-weak border-border-week">
              <source.icon size={11} />
              {source.label}
            </span>
            <span className="ml-auto text-[11px] text-text-weak">
              {dayjs(lead.createdAt).format('D MMM')}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  )
})
LeadCard.displayName = 'LeadCard'
