import { ArrowUp, X } from 'lucide-react'
import { useState } from 'react'
import type { ChatInputProps } from './types'

export const ChatInput: React.FC<ChatInputProps> = ({
  appearance,
  messagePlaceholder,
  dismissibleNotice,
  footer,
  value,
  onChange,
  onSubmit,
  readOnly = false,
}) => {
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const isDark = appearance === 'dark'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4">
      {dismissibleNotice && !noticeDismissed && (
        <div
          className={`-mb-5 flex flex-row items-start justify-between rounded-t-[20px] px-3 pb-7 pt-3 ${
            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <div
            className="flex-1 text-xs font-medium [&_.ql-align-center]:text-center [&_.ql-align-justify]:text-justify [&_.ql-align-left]:text-left [&_.ql-align-right]:text-right [&_a]:text-inherit [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: dismissibleNotice }}
          />
          <button
            onClick={() => setNoticeDismissed(true)}
            className={`ml-2 shrink-0 ${
              isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className={`flex flex-row items-center gap-1 rounded-3xl border p-2 shadow-input-box ${
          isDark
            ? 'border-zinc-700 bg-zinc-800 text-zinc-100 focus-within:border-zinc-500'
            : 'border-border-week bg-white focus-within:border-border-strong'
        }`}
      >
        <div className="flex flex-1 flex-col text-sm">
          {readOnly ? (
            <input
              type="text"
              className={`flex w-full rounded-md border-0 bg-transparent px-2 py-1 text-sm outline-none ${
                isDark
                  ? 'text-zinc-100 placeholder:text-zinc-500'
                  : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
              placeholder={messagePlaceholder || 'Type your message...'}
              readOnly
            />
          ) : (
            <textarea
              className={`field-sizing-content flex max-h-40 min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-md border-0 bg-transparent px-2 py-1 outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'text-zinc-100 placeholder:text-zinc-500'
                  : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
              id="message"
              name="message"
              dir="auto"
              maxLength={8000}
              rows={1}
              tabIndex={0}
              placeholder={messagePlaceholder || 'Type message here..'}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
        </div>
        <button
          className={`flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-full p-1.5 text-sm font-medium shadow-none outline-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${
            readOnly
              ? isDark
                ? 'bg-zinc-600 text-zinc-400'
                : 'bg-zinc-300 text-zinc-500'
              : isDark
                ? 'bg-white text-zinc-900 disabled:bg-zinc-600'
                : 'bg-zinc-900 text-white disabled:bg-zinc-300'
          }`}
          type="button"
          onClick={onSubmit}
          disabled={readOnly || !value.trim()}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {footer && (
        <div
          className={`px-3 pt-4 text-xs font-medium [&_.ql-align-center]:text-center [&_.ql-align-justify]:text-justify [&_.ql-align-left]:text-left [&_.ql-align-right]:text-right [&_a]:text-inherit [&_a]:underline ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
          dangerouslySetInnerHTML={{ __html: footer }}
        />
      )}
    </div>
  )
}
