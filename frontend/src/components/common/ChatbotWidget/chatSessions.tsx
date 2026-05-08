import type { ChatSession } from '@/types/chatbot'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import { SquarePen } from 'lucide-react'

interface Props {
  appearance: string
  chatSessions?: ChatSession[] | null
  loading?: boolean
  brandColor?: string
  buttonTextColor?: string
  onSelectSession?: (sessionId: string) => void
  onStartNewChat?: () => void
}

export function ChatSessions({
  appearance,
  chatSessions,
  loading,
  brandColor,
  buttonTextColor,
  onSelectSession,
  onStartNewChat,
}: Props) {
  const isDark = appearance === 'dark'

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
    >
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pt-3 pb-20">
        {loading || !chatSessions ? (
          <div className="flex flex-1 items-center justify-center">
            <div
              className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${
                isDark ? 'border-white' : 'border-black'
              }`}
            />
          </div>
        ) : chatSessions.length === 0 ? (
          <div
            className={`flex h-full items-center justify-center text-sm ${
              isDark ? 'text-zinc-400' : 'text-gray-500'
            }`}
          >
            No chats recorded
          </div>
        ) : (
          chatSessions.map(chat => (
            <button
              type="button"
              key={chat.id}
              onClick={() => onSelectSession?.(chat.id)}
              className={`outline-0 border-none bg-transparent cursor-pointer px-3 py-2.5 rounded-[10px] text-left transition-all duration-300 ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/4'
              }`}
            >
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-medium truncate max-w-[80%] ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {chat.messages?.find(m => m.role === 'assistant')?.content ?? 'No response yet'}
                </p>
                <span
                  className={`text-[11px] ml-auto shrink-0 ${
                    isDark ? 'text-zinc-400' : 'text-gray-500'
                  }`}
                >
                  {formatRelativeDate(chat.updatedAt)}
                </span>
              </div>
              <p
                className={`text-xs truncate mt-1 max-w-[80%] ${
                  isDark ? 'text-zinc-400' : 'text-gray-500'
                }`}
              >
                {chat.messages?.find(m => m.role === 'user')?.content ?? 'No message'}
              </p>
            </button>
          ))
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center px-3 pb-4 pt-2 pointer-events-none">
        <button
          type="button"
          onClick={() => onStartNewChat?.()}
          className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-medium shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: brandColor, color: buttonTextColor }}
        >
          <SquarePen className="h-3.5 w-3.5" />
          Start new chat
        </button>
      </div>
    </div>
  )
}
