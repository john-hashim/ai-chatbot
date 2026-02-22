import type React from 'react'
import type { ChatSession } from '@/types/chatbot'
import { Ellipsis, Gauge, ThumbsDown, ThumbsUp, Trash } from 'lucide-react'
import { Button, Menu, Tooltip } from '@mantine/core'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

const REMARK_PLUGINS = [remarkGfm]
const REHYPE_PLUGINS = [rehypeRaw]

export interface ChatDetailsInterface {
  session: ChatSession | null
  handleSessionDelete: (id: string) => void
  loading?: boolean
}

export const ChatDetails: React.FC<ChatDetailsInterface> = ({ session, handleSessionDelete, loading }) => {
  return (
    <div className="h-full">
      {session && (
        <div className="h-full flex flex-col">
          <div className="flex px-10 py-6 border-b border-border-week justify-between">
            <p>{session?.source}</p>
            <Menu shadow="md" width={180}>
              <Menu.Target>
                <Tooltip label="Delete">
                  <Button variant="secondary" size="compact-sm" radius="md">
                    <Ellipsis size={16} strokeWidth={1.5} />
                  </Button>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<Trash size={14} />}
                  onClick={() => handleSessionDelete(session?.id)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
          <div className="p-6 space-y-8 flex-1 overflow-y-auto">
            {loading && (
              <>
                <div className="max-w-[70%] w-[60%] h-16 rounded-3xl bg-gray-200 animate-pulse" />
                <div className="max-w-[70%] w-[40%] h-12 rounded-3xl bg-gray-200 animate-pulse ml-auto" />
                <div className="max-w-[70%] w-[55%] h-20 rounded-3xl bg-gray-200 animate-pulse" />
                <div className="max-w-[70%] w-[35%] h-12 rounded-3xl bg-gray-200 animate-pulse ml-auto" />
                <div className="max-w-[70%] w-[50%] h-16 rounded-3xl bg-gray-200 animate-pulse" />
              </>
            )}
            {!loading && session.messages?.map(message => (
              <div
                key={message.id}
                className={`max-w-[70%] w-fit px-4 py-3 rounded-3xl ${
                  message.role === 'user' ? 'ml-auto bg-black text-white' : 'bg-gray-100'
                }`}
              >
                <div className="text-sm leading-6">
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
                    {message.content || 'dummy content'}
                  </ReactMarkdown>
                </div>
                {message.role === 'assistant' && (
                  <div className="flex gap-1.5 mt-2">
                    {message.confidenceScore !== null && (
                      <Tooltip label={`Confidence score`}>
                        <span className="flex items-center border border-border-week gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-white">
                          <Gauge size={12} />
                          {parseFloat(message.confidenceScore.toFixed(3))}%
                        </span>
                      </Tooltip>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border-week bg-white/80 text-text-secondary">
                      {formatRelativeDate(message.createdAt)}
                    </span>
                    {message.feedback === 'like' && (
                      <span className="flex items-center text-xs px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-600">
                        <ThumbsUp size={12} fill="currentColor" />
                      </span>
                    )}
                    {message.feedback === 'dislike' && (
                      <span className="flex items-center text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-500">
                        <ThumbsDown size={12} fill="currentColor" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
