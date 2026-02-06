import type { ChatSession } from '@/types/chatbot'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import type React from 'react'

export interface ChatListInterface {
  chatSessions: ChatSession[] | null
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
  loading: boolean
}

export const ChatsList: React.FC<ChatListInterface> = ({
  chatSessions,
  selectedSessionId,
  onSelectSession,
  loading,
}) => {
  return (
    <div className="flex flex-col gap-1 h-full px-3 pb-3">
      {loading || !chatSessions ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 w-full h-[60px] rounded-[10px]"
          />
        ))
      ) : chatSessions.length === 0 ? (
        <div className="h-full flex justify-center items-center">No chats recorded</div>
      ) : (
        chatSessions?.map(chat => {
          const isActive = selectedSessionId === chat.id

          return (
            <button
              type="button"
              key={chat.id}
              onClick={() => onSelectSession(chat.id)}
              className={`outline-0 px-3 py-2.5 rounded-[10px] border-none cursor-pointer text-left transition-all duration-400 ${
                isActive
                  ? 'bg-white shadow-[inset_0_0_0_1px_var(--color-border-week)]'
                  : 'bg-transparent shadow-[inset_0_0_0_1px_transparent] hover:bg-black/4'
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate text-text-primary max-w-[80%]">
                  {chat.messages?.find(m => m.role === 'assistant')?.content ?? 'No response yet'}
                </p>
                <span className="text-[11px] text-text-weak ml-auto shrink-0">
                  {formatRelativeDate(chat.updatedAt)}
                </span>
              </div>
              <p className="text-xs truncate text-text-weak mt-1 max-w-[80%]">
                {chat.messages?.find(m => m.role === 'user')?.content ?? 'No message'}
              </p>
            </button>
          )
        })
      )}
    </div>
  )
}
