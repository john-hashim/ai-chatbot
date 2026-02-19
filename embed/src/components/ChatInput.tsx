import { useState } from 'preact/hooks'

interface Props {
  appearance: string
  messagePlaceholder: string | null
  dismissibleNotice: string | null
  footer: string | null
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
}

export function ChatInput({
  appearance,
  messagePlaceholder,
  dismissibleNotice,
  footer,
  value,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const isDark = appearance === 'dark'

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="cbw-input-area">
      {dismissibleNotice && !noticeDismissed && (
        <div className={`cbw-notice ${isDark ? 'cbw-notice--dark' : ''}`}>
          <div
            className="cbw-notice-text"
            dangerouslySetInnerHTML={{ __html: dismissibleNotice }}
          />
          <button
            onClick={() => setNoticeDismissed(true)}
            className={`cbw-notice-close ${isDark ? 'cbw-notice-close--dark' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className={`cbw-input-box ${isDark ? 'cbw-input-box--dark' : ''}`}>
        <textarea
          className={`cbw-textarea ${isDark ? 'cbw-textarea--dark' : ''}`}
          dir="auto"
          maxLength={8000}
          rows={1}
          placeholder={messagePlaceholder || 'Type message here..'}
          value={value}
          onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className={`cbw-send-btn ${isDark ? 'cbw-send-btn--dark' : ''}`}
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      {footer && (
        <div
          className={`cbw-footer ${isDark ? 'cbw-footer--dark' : ''}`}
          dangerouslySetInnerHTML={{ __html: footer }}
        />
      )}
    </div>
  )
}
