import type { ChatSession } from '@/types/chatbot'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import { useState } from 'react'
import type React from 'react'

export interface ChatListInterface {
  chatSessions: ChatSession[] | null
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
}

export const ChatsList: React.FC<ChatListInterface> = ({
  chatSessions,
  selectedSessionId,
  onSelectSession,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1 px-3 pb-3">
      {chatSessions?.map(chat => {
        const isActive = selectedSessionId === chat.id
        const isHovered = hoveredId === chat.id

        return (
          <button
            type="button"
            key={chat.id}
            onClick={() => onSelectSession(chat.id)}
            onMouseEnter={() => setHoveredId(chat.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="outline-0"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              boxShadow: isActive
                ? 'inset 0 0 0 1px var(--color-border-week)'
                : 'inset 0 0 0 1px transparent',
              backgroundColor: isActive
                ? '#fff'
                : isHovered
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border 500ms ease, background-color 400ms ease',
            }}
          >
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-medium truncate text-text-primary"
                style={{ maxWidth: '80%' }}
              >
                {chat.messages?.find(m => m.role === 'assistant')?.content ?? 'No response yet'}
              </p>
              <span className="text-[11px] text-text-weak ml-auto shrink-0">
                {formatRelativeDate(chat.updatedAt)}
              </span>
            </div>
            <p className="text-xs truncate text-text-weak mt-1" style={{ maxWidth: '80%' }}>
              {chat.messages?.find(m => m.role === 'user')?.content ?? 'No message'}
            </p>
          </button>
        )
      })}
    </div>
  )
}
