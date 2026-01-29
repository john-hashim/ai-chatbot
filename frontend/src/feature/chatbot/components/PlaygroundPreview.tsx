import { useContrastColor } from '@/hooks/useContrastColor'
import { useStore } from '@/store'
import { Tooltip } from '@mantine/core'
import { ArrowUp, Copy, RefreshCw, RotateCcw, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  model: string | null
  temperature: number | null
  tokensUsed: number | null
  responseTime: number | null
  sources: string[] | null
  feedback: 'like' | 'dislike' | null
}

const dummyChats: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you help me understand how your pricing works?',
    createdAt: new Date('2024-01-28T10:01:00'),
    model: null,
    temperature: null,
    tokensUsed: null,
    responseTime: null,
    sources: null,
    feedback: null,
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'Of course! We offer three pricing tiers:\n\n• **Starter** - $9/month\n• **Pro** - $29/month\n• **Enterprise** - Custom pricing\n\nWould you like more details on any specific plan?',
    createdAt: new Date('2024-01-28T10:01:15'),
    model: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 58,
    responseTime: 1200,
    sources: ['doc-pricing-001', 'doc-faq-003'],
    feedback: 'like',
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you help me understand how your pricing works?',
    createdAt: new Date('2024-01-28T10:01:00'),
    model: null,
    temperature: null,
    tokensUsed: null,
    responseTime: null,
    sources: null,
    feedback: null,
  },
  {
    id: '4',
    role: 'assistant',
    content:
      'Of course! We offer three pricing tiers:\n\n• **Starter** - $9/month\n• **Pro** - $29/month\n• **Enterprise** - Custom pricing\n\nWould you like more details on any specific plan?',
    createdAt: new Date('2024-01-28T10:01:15'),
    model: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 58,
    responseTime: 1200,
    sources: ['doc-pricing-001', 'doc-faq-003'],
    feedback: 'like',
  },
]

export const PlaygroundPreview: React.FC = () => {
  const { currentChatbot } = useStore()
  const [message, setMessage] = useState('')
  const primaryColor = currentChatbot?.brandColor ?? '#000000'
  const headerContrast = useContrastColor(primaryColor)

  const headerTextColor = currentChatbot?.brandColorForHeader
    ? headerContrast.contrastHex
    : currentChatbot?.appearance === 'dark'
      ? '#ffffff'
      : '#18181b'

  return (
    <div className="h-full flex items-center p-6">
      <div className="h-full mx-auto max-h-180 border-border-week border w-full max-w-102 overflow-hidden rounded-[20px rounded-[20px]">
        <div
          className={`${currentChatbot?.appearance === 'dark' ? 'bg-zinc-900' : 'bg-white'} flex h-full flex-col`}
        >
          <header
            className="flex items-center justify-between px-5"
            style={{
              background: currentChatbot?.brandColorForHeader
                ? `linear-gradient(0deg, rgba(255, 255, 255, 0) 29.14%, rgba(255, 255, 255, 0.16) 100%), ${currentChatbot.brandColor}`
                : '',
            }}
          >
            <div className="flex my-4 h-10 items-center gap-3">
              {currentChatbot?.profilePicture && (
                <img
                  src={currentChatbot.profilePicture}
                  alt="Chatbot"
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col justify-center">
                <h1
                  className="font-medium text-sm tracking-tight"
                  style={{ color: headerTextColor }}
                >
                  {currentChatbot?.name || 'Chatbot'}
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md p-1.5 opacity-70 hover:opacity-85"
                title="Reset conversation"
                style={{ color: headerTextColor }}
              >
                <RefreshCw className="h-5 w-5 transition-transform duration-700 ease-in-out hover:rotate-180" />
              </button>
            </div>
          </header>
          <div
            className={`relative flex-1 overflow-y-auto px-5 pt-5 ${
              currentChatbot?.appearance == 'dark'
                ? 'shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.3)]'
                : 'shadow-inner'
            }`}
            style={{
              scrollbarColor: currentChatbot?.appearance ? '#52525b #27272a' : undefined,
              scrollbarWidth: 'thin',
            }}
          >
            {currentChatbot?.initialMessages && currentChatbot.initialMessages.length > 0 && (
              <div className="flex flex-col gap-1">
                {currentChatbot.initialMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`relative flex w-fit max-w-[85%] flex-col items-start gap-2 px-4 py-3 text-sm leading-normal tracking-tight ${
                      currentChatbot?.appearance === 'dark'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'bg-zinc-100 text-zinc-900'
                    } ${
                      index === 0
                        ? 'rounded-[20px] rounded-bl'
                        : index === currentChatbot.initialMessages.length - 1
                          ? 'rounded-[20px] rounded-tl'
                          : 'rounded-r-[20px] rounded-l'
                    }`}
                  >
                    {index === 0 && (
                      <div className="flex items-center gap-2">
                        {currentChatbot?.profilePicture && (
                          <img
                            src={currentChatbot?.profilePicture}
                            alt="Chatbot Avatar"
                            className="h-6 w-6 shrink-0 rounded-full object-cover"
                          />
                        )}
                        <span
                          className={`font-medium text-sm leading-normal tracking-tight ${
                            currentChatbot?.appearance === 'dark'
                              ? 'text-zinc-100'
                              : 'text-zinc-900'
                          }`}
                        >
                          {currentChatbot?.name || 'Chatbot'}
                        </span>
                      </div>
                    )}
                    <div className="prose h-full w-full max-w-none text-sm leading-normal tracking-tight">
                      {message}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dummyChats.length > 0 && (
              <div className="mt-5 flex flex-col gap-5">
                {dummyChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative flex w-fit max-w-[85%] flex-col items-start gap-2 rounded-[20px] px-4 py-3 text-sm leading-normal tracking-tight ${
                        chat.role === 'assistant'
                          ? currentChatbot?.appearance === 'dark'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'bg-zinc-100 text-zinc-900'
                          : ''
                      }`}
                      style={
                        chat.role === 'user'
                          ? {
                              backgroundColor: primaryColor,
                              color: headerContrast.contrastHex,
                            }
                          : undefined
                      }
                    >
                      <div className="prose flex h-full w-full max-w-none flex-col gap-2 text-sm leading-normal tracking-tight">
                        {chat.role === 'assistant' && (
                          <div className="flex items-center gap-2">
                            {currentChatbot?.profilePicture && (
                              <img
                                src={currentChatbot?.profilePicture}
                                alt="Chatbot Avatar"
                                className="h-6 w-6 shrink-0 rounded-full object-cover"
                              />
                            )}
                            <span
                              className={`font-medium text-sm leading-normal tracking-tight ${
                                currentChatbot?.appearance === 'dark'
                                  ? 'text-zinc-100'
                                  : 'text-zinc-900'
                              }`}
                            >
                              {currentChatbot?.name || 'Chatbot'}
                            </span>
                          </div>
                        )}
                        <div>{chat.content}</div>
                      </div>
                    </div>
                    {chat.role === 'assistant' && (
                      <div className="relative z-10 ml-6 mt-1 flex flex-row flex-nowrap items-center gap-1">
                        <Tooltip label="Copy" position="top">
                          <button
                            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition-all duration-300 ${
                              currentChatbot?.appearance === 'dark'
                                ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                            }`}
                            title="Copy"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </Tooltip>

                        <Tooltip label="Good responce" position="top">
                          <button
                            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition-all duration-300 ${
                              currentChatbot?.appearance === 'dark'
                                ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                            }`}
                            title="Like"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Bad responce" position="top">
                          <button
                            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition-all duration-300 ${
                              currentChatbot?.appearance === 'dark'
                                ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                            }`}
                            title="Dislike"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Retry" position="top">
                          <button
                            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition-all duration-300 ${
                              currentChatbot?.appearance === 'dark'
                                ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                            }`}
                            title="Regenerate"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className={`flex flex-row items-center gap-1 overflow-clip rounded-3xl border p-2 shadow-input-box mx-4 mb-4 transition-colors bg-transparent ${
              currentChatbot?.appearance === 'dark'
                ? 'border-zinc-700 focus-within:border-zinc-500'
                : 'border-border-week focus-within:border-border-strong'
            }`}
          >
            <div className="flex flex-1 flex-col">
              <textarea
                className={`field-sizing-content flex w-full rounded-md px-2 transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 min-h-0 flex-1 resize-none border-0 outline-none bg-transparent text-sm max-h-40 overflow-y-auto py-1 ${
                  currentChatbot?.appearance === 'dark'
                    ? 'placeholder:text-zinc-500 text-zinc-100'
                    : 'placeholder:text-zinc-400 text-zinc-900'
                }`}
                id="message"
                name="message"
                dir="auto"
                maxLength={8000}
                rows={1}
                tabIndex={0}
                placeholder={currentChatbot?.messagePlaceholder || 'Type message here..'}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <button
              className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 p-1.5 h-7 w-7 rounded-full shadow-none"
              style={{
                backgroundColor: message.trim() ? primaryColor : `${primaryColor}40`,
              }}
              type="submit"
              disabled={!message.trim()}
            >
              <ArrowUp className="h-4 w-4" style={{ color: headerContrast.contrastHex }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
