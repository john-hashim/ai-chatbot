import { Tooltip } from '@mantine/core'
import { ArrowDown, Copy, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChatMessagesProps } from './types'

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  name,
  profilePicture,
  appearance,
  brandColor,
  initialMessages = [],
  suggestedMessages = [],
  showSuggestedAfterFirst,
  messages,
  contrastColor,
  generating = false,
  onSuggestionClick,
  onFeedback,
  onRetry,
  onCopy,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [loaderContainerHeight, setLoaderContainerHeight] = useState<number>(0)

  const isDark = appearance === 'dark'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setShowScrollButton(!isAtBottom)
  }

  useEffect(() => {
    scrollToBottom()
    const lineHeight =
      (Math.floor(messages[messages.length - 2].content.split('').length / 43) + 1) * 21
    if (scrollContainerRef.current?.clientHeight)
      setLoaderContainerHeight(
        scrollContainerRef.current?.clientHeight - (lineHeight + 24 + 32 + 30)
      )
  }, [messages])

  const ActionButton: React.FC<{
    label: string
    icon: React.ReactNode
    onClick?: () => void
  }> = ({ label, icon, onClick }) => (
    <Tooltip label={label} position="top">
      <button
        className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md transition-all duration-300 ${
          isDark
            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
        }`}
        title={label}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  )

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`absolute inset-0 flex flex-col overflow-y-auto scroll-smooth px-5 pb-4 pt-5 ${
          isDark ? 'shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.3)]' : 'shadow-inner'
        }`}
        style={{
          scrollbarColor: isDark ? '#52525b #27272a' : undefined,
          scrollbarWidth: 'thin',
        }}
      >
        {initialMessages.length > 0 && (
          <div className="flex flex-col gap-1">
            {initialMessages.map((message, index) => (
              <div
                key={index}
                className={`relative flex w-fit max-w-[85%] flex-col items-start gap-2 px-4 py-3 text-sm leading-normal tracking-tight ${
                  isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
                } ${
                  index === 0
                    ? 'rounded-[20px] rounded-bl'
                    : index === initialMessages.length - 1
                      ? 'rounded-[20px] rounded-tl'
                      : 'rounded-r-[20px] rounded-l'
                }`}
              >
                {index === 0 && (
                  <div className="flex items-center gap-2">
                    {profilePicture && (
                      <img
                        src={profilePicture}
                        alt="Chatbot Avatar"
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    )}
                    <span
                      className={`text-sm font-medium leading-normal tracking-tight ${
                        isDark ? 'text-zinc-100' : 'text-zinc-900'
                      }`}
                    >
                      {name}
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

        {messages.length > 0 && (
          <div className="mt-5 flex flex-col gap-5">
            {messages.map((chat, index) => {
              const isGenerating =
                chat.role === 'assistant' && index === messages.length - 1 && generating
              return (
                <div
                  key={chat.id}
                  className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`relative flex w-fit max-w-[85%] flex-col items-start gap-2 rounded-[20px] px-4 py-3 text-sm leading-normal tracking-tight ${
                      chat.role === 'assistant' && !isGenerating
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'bg-zinc-100 text-zinc-900'
                        : ''
                    }`}
                    style={
                      chat.role === 'user'
                        ? {
                            backgroundColor: brandColor,
                            color: contrastColor,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="prose flex h-full w-full max-w-none flex-col gap-2 text-sm leading-normal tracking-tight"
                      style={isGenerating ? { minHeight: `${loaderContainerHeight}px` } : undefined}
                    >
                      {chat.role === 'assistant' && !isGenerating && (
                        <div className="flex items-center gap-2">
                          {profilePicture && (
                            <img
                              src={profilePicture}
                              alt="Chatbot Avatar"
                              className="h-6 w-6 shrink-0 rounded-full object-cover"
                            />
                          )}
                          <span
                            className={`text-sm font-medium leading-normal tracking-tight ${
                              isDark ? 'text-zinc-100' : 'text-zinc-900'
                            }`}
                          >
                            {name}
                          </span>
                        </div>
                      )}
                      {isGenerating && (
                        <div
                          className={`flex items-center gap-1.5 px-4 py-3 rounded-[20px] ${
                            isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
                          }
                    `}
                        >
                          <span className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <span
                                key={i}
                                className={`w-2 h-2 ${isDark ? 'bg-zinc-400' : 'bg-zinc-500'} rounded-full animate-bounce animation-duration-[.6s]`}
                                style={{ animationDelay: `${-0.15 * (2 - i)}s` }}
                              ></span>
                            ))}
                          </span>
                        </div>
                      )}
                      {!isGenerating && <div>{chat.content}</div>}
                    </div>
                  </div>
                  {chat.role === 'assistant' && !isGenerating && (
                    <div className="relative z-10 ml-6 mt-1 flex flex-row flex-nowrap items-center gap-1">
                      <ActionButton
                        label="Copy"
                        icon={<Copy className="h-3 w-3" />}
                        onClick={() => onCopy?.(chat.id, chat.content)}
                      />
                      <ActionButton
                        label="Good response"
                        icon={<ThumbsUp className="h-3 w-3" />}
                        onClick={() => onFeedback?.(chat.id, 'like')}
                      />
                      <ActionButton
                        label="Bad response"
                        icon={<ThumbsDown className="h-3 w-3" />}
                        onClick={() => onFeedback?.(chat.id, 'dislike')}
                      />
                      <ActionButton
                        label="Retry"
                        icon={<RotateCcw className="h-3 w-3" />}
                        onClick={() => onRetry?.(chat.id)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex-1" />

        {suggestedMessages.length > 0 && (showSuggestedAfterFirst || messages.length === 0) && (
          <div className="flex w-full flex-wrap justify-end gap-2 pt-4">
            {suggestedMessages.map((suggestion, index) => (
              <div
                key={index}
                className={`h-auto min-h-10 max-w-[40ch] cursor-pointer rounded-[30px] border px-4 py-2 text-sm font-medium shadow-none transition-colors hover:border-(--hover-bg) hover:bg-(--hover-bg) hover:text-(--hover-text) ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                    : 'border-border-week bg-white text-text-primary'
                }`}
                style={
                  {
                    '--hover-bg': brandColor,
                    '--hover-text': contrastColor,
                  } as React.CSSProperties
                }
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`absolute bottom-4 right-6 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-110 ${
            isDark
              ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
              : 'bg-white text-zinc-600 hover:bg-zinc-100'
          }`}
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
