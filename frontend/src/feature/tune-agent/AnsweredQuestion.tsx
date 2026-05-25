import { ChevronDown, Pencil, Trash2 } from 'lucide-react'

interface AnsweredQuestionProps {
  q: string
  a: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * Collapsible "pill" card for an answered question — the question on a single
 * line, expanding to reveal the full answer with Edit / Remove actions.
 */
export const AnsweredQuestion: React.FC<AnsweredQuestionProps> = ({
  q,
  a,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border-week bg-white transition-colors hover:border-border-strong">
      <div
        className="flex cursor-pointer select-none items-center gap-3 px-4 py-3"
        onClick={onToggle}
      >
        <span
          title={q}
          className="min-w-0 flex-1 truncate text-[13.5px] font-medium tracking-[-0.005em] text-text"
        >
          {q}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-weak transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      <div className={`tune-collapse ${expanded ? 'expanded' : ''}`}>
        <div>
          <p className="m-0 whitespace-pre-wrap px-4 pb-2.5 text-[13px] leading-[1.55] text-text-weak">
            {a}
          </p>
          <div className="flex gap-1 px-3 pb-2.5">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-2 py-1 text-[11.5px] text-text-weak transition-colors hover:bg-background-dark-week hover:text-text"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-2 py-1 text-[11.5px] text-text-weak transition-colors hover:bg-background-dark-week hover:text-text"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
