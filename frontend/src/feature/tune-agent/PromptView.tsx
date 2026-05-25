import { useState } from 'react'
import { Button } from '@mantine/core'
import { Check, Pencil } from 'lucide-react'

const LINE_STAGGER = 80 // ms per line

interface PromptViewProps {
  prompt: string
  onPromptChange: (next: string) => void
  onReset: () => void
  onContinue: () => void
}

/**
 * The generated system prompt. Streams in line-by-line on first reveal, scrolls
 * internally so the action buttons stay pinned, and can be hand-edited inline.
 */
export const PromptView: React.FC<PromptViewProps> = ({
  prompt,
  onPromptChange,
  onReset,
  onContinue,
}) => {
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(false)
  const [draft, setDraft] = useState(prompt)

  const lines = prompt.split('\n')
  const lineCount = lines.filter(l => l.trim()).length

  function startEdit() {
    setDraft(prompt)
    setEditing(true)
  }

  function save() {
    onPromptChange(draft)
    setEdited(true)
    setEditing(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-color-primary text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <h3 className="m-0 text-sm font-semibold tracking-[-0.005em] text-text">
          Your agent prompt is ready
        </h3>
        <span className="ml-auto font-mono text-[11px] tracking-[0.04em] text-text-weak">
          {lineCount} lines
        </span>
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="min-h-60 w-full flex-1 resize-none rounded-xl border border-border-strong bg-white px-5 py-[18px] font-mono text-[12.5px] leading-[1.7] text-text outline-none focus:border-color-primary"
        />
      ) : (
        <div
          aria-label="Generated system prompt"
          className="group relative min-h-60 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border-week bg-white px-5 py-[18px] font-mono text-[12.5px] leading-[1.7] text-text-weak"
        >
          <button
            type="button"
            onClick={startEdit}
            className="absolute right-3 top-3 z-10 inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-week bg-white px-2 py-1 text-[11px] font-medium text-text-weak opacity-0 shadow-sm transition-opacity hover:text-text group-hover:opacity-100"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          {lines.map((line, i) => {
            const isHeading = line.startsWith('#')
            const isEmpty = line === ''
            return (
              <span
                key={i}
                style={edited ? undefined : { animationDelay: `${i * LINE_STAGGER}ms` }}
                className={`${edited ? 'block' : 'tune-prompt-line'} ${
                  isEmpty
                    ? 'h-[0.7em]'
                    : isHeading
                      ? 'mt-1.5 font-semibold text-text first:mt-0'
                      : ''
                }`}
              >
                {line || ' '}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex shrink-0 justify-end gap-2.5">
        {editing ? (
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save Prompt</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onReset}>
              Reset
            </Button>
            <Button onClick={onContinue}>Continue to Agent Playground</Button>
          </>
        )}
      </div>
    </div>
  )
}
