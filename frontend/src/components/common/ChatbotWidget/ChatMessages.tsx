import { Tooltip } from '@mantine/core'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ArrowDown, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
// import { formatRelativeDate } from '@/hooks/useRelativeDate'
import type { ChatMessagesProps } from './types'

dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

const REMARK_PLUGINS = [remarkGfm]
const REHYPE_PLUGINS = [rehypeRaw]

const parseBookingPayload = (
  content: string
): { date?: string; time?: string; name?: string; email?: string } | null => {
  if (!content || content[0] !== '{') return null
  try {
    const parsed = JSON.parse(content)
    const date =
      typeof parsed?.booking_confirm_date === 'string' ? parsed.booking_confirm_date : undefined
    const time =
      typeof parsed?.booking_confirm_time === 'string' ? parsed.booking_confirm_time : undefined
    const name = typeof parsed?.name === 'string' ? parsed.name : undefined
    const email = typeof parsed?.email === 'string' ? parsed.email : undefined
    if (date || time || name || email) return { date, time, name, email }
  } catch {
    /* not JSON */
  }
  return null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ConfirmTimeForm: React.FC<{
  meta: { date: string; timeslot: string } | null
  isLast: boolean
  isDark: boolean
  onSubmit: (payload: string) => void
  onCancel: () => void
  content: string
}> = ({ meta, isLast, isDark, onSubmit, onCancel, content }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const trimmedEmail = email.trim()
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail)
  const canSubmit = !!name.trim() && isEmailValid && !!meta
  const showEmailError = emailTouched && !!trimmedEmail && !isEmailValid

  const handleSubmit = () => {
    if (!canSubmit || !meta) return
    onSubmit(
      JSON.stringify({
        booking_confirm_date: meta.date,
        booking_confirm_time: meta.timeslot,
        name: name.trim(),
        email: trimmedEmail,
      })
    )
  }

  const inputCls = `w-full rounded-lg border px-2.5 py-1 text-[11px] outline-none ${
    isDark
      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-400'
      : 'bg-white border-border-week text-zinc-900 placeholder:text-zinc-400'
  }`

  return (
    <div className={`animate-message-in ${!isLast ? 'pointer-events-none opacity-80' : ''}`}>
      <p className="text-xs mb-2">{content}</p>
      <div className="flex flex-col gap-2">
        <input
          className={inputCls}
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className={`${inputCls} ${showEmailError ? 'border-red-400' : ''}`}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
        />
        {showEmailError && (
          <p className="text-[10px] text-red-500 -mt-1">Please enter a valid email</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`py-1 px-3 rounded-lg text-[11px] border bg-white text-center ${
              canSubmit
                ? 'border-border-week cursor-pointer hover:border-border-strong'
                : 'border-border-week opacity-50 cursor-not-allowed'
            }`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Confirm Appointment
          </button>
          <button
            className="py-1 px-3 rounded-lg text-[11px] border border-red-200 bg-white cursor-pointer text-center text-red-400 hover:border-red-500 hover:text-red-500"
            onClick={onCancel}
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  )
}

const ActionButton: React.FC<{
  label: string
  icon: React.ReactNode
  onClick?: () => void
  isDark: boolean
}> = ({ label, icon, onClick, isDark }) => (
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
  onCopy,
  onActionSelect,
  onActionCancel,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [loaderContainerHeight, setLoaderContainerHeight] = useState<number>(0)

  const isDark = appearance === 'dark'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const rafRef = useRef<number>(0)

  const handleScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
        setShowScrollButton(!isAtBottom)
      }
      rafRef.current = 0
    })
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const messageBubbles = scrollContainerRef.current?.querySelectorAll('[data-message]')
    if (messageBubbles && messageBubbles.length >= 2 && scrollContainerRef.current?.clientHeight) {
      const secondLast = messageBubbles[messageBubbles.length - 2]
      const bubbleHeight = secondLast.getBoundingClientRect().height
      setLoaderContainerHeight(scrollContainerRef.current.clientHeight - (bubbleHeight + 70))
      const timeoutId = setTimeout(() => {
        scrollToBottom()
      })
      return () => clearTimeout(timeoutId)
    }
  }, [messages, scrollToBottom])

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
                className={`relative flex max-w-full flex-col items-start gap-2 px-4 py-3 text-sm leading-normal tracking-tight ${
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
                <div className="prose h-full w-full max-w-none wrap-break-word text-sm leading-normal tracking-tight">
                  {message}
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-5 flex flex-col gap-5">
            {messages.map((chat, index) => {
              const isLast = index === messages.length - 1
              const isGenerating = chat.role === 'assistant' && isLast && generating
              return (
                <div
                  key={index}
                  data-message
                  className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`relative flex flex-col items-start gap-2 rounded-[20px] px-4 py-3 text-sm leading-normal tracking-tight ${chat.role === 'user' ? 'max-w-[85%]' : 'max-w-full'} ${
                      chat.role === 'assistant' && !(isGenerating && !chat.content)
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
                      className="prose flex h-full w-full max-w-none wrap-break-word flex-col gap-2 text-sm leading-normal tracking-tight"
                      style={
                        isGenerating && !chat.content
                          ? { minHeight: `${loaderContainerHeight}px` }
                          : undefined
                      }
                    >
                      {/* profile picture and name of chatbot for generated (assistant) messages - starts  */}
                      {chat.role === 'assistant' && !(isGenerating && !chat.content) && (
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
                      {/* profile picture and name of chatbot for generated (assistant) messages - ends  */}

                      {/* loader -- starts  */}
                      {isGenerating && !chat.content && (
                        <div
                          className={`flex items-center gap-1.5 px-4 py-3 rounded-[20px] ${
                            isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
                          }`}
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
                      {/* loader -- ends  */}

                      {/* Message content - starts */}
                      {!(isGenerating && !chat.content) &&
                        (chat.isAction && chat.actionType === 'booking' ? (
                          <div
                            className={`animate-message-in ${!isLast ? 'pointer-events-none opacity-80' : ''}`}
                          >
                            <p className="text-xs mb-2">
                              Here are the available dates for booking, please select one
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                chat.actionMeta as { dates: { value: string; label: string }[] }
                              )?.dates?.map(date => (
                                <div
                                  key={date.value}
                                  className="py-1 px-3 rounded-lg text-[11px] border border-border-week bg-white cursor-pointer text-center wrap-break-word hover:border-border-strong"
                                  onClick={() =>
                                    onActionSelect?.(
                                      chat.actionType!,
                                      JSON.stringify({ booking_confirm_date: date.value })
                                    )
                                  }
                                >
                                  {date.label}
                                </div>
                              ))}
                              <div
                                className="py-1 px-3 rounded-lg text-xs border border-red-200 bg-white cursor-pointer text-center text-red-400 hover:border-red-500 hover:text-red-500"
                                onClick={() => onActionCancel?.(chat.actionType!)}
                              >
                                Cancel Appointment
                              </div>
                            </div>
                          </div>
                        ) : chat.isAction && chat.actionType === 'confirm_time' ? (
                          <ConfirmTimeForm
                            meta={
                              chat.actionMeta as {
                                date: string
                                timeslot: string
                              } | null
                            }
                            content={chat.content}
                            isLast={isLast}
                            isDark={isDark}
                            onSubmit={payload => onActionSelect?.(chat.actionType!, payload)}
                            onCancel={() => onActionCancel?.(chat.actionType!)}
                          />
                        ) : chat.isAction && chat.actionType === 'booking_step2' ? (
                          <div
                            className={`animate-message-in ${!isLast ? 'pointer-events-none opacity-80' : ''}`}
                          >
                            <p className="text-xs mb-2">
                              Here are the available time slots, please select one
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {(() => {
                                const meta = chat.actionMeta as {
                                  date: string
                                  timeslots: { value: string; label: string }[]
                                } | null
                                return meta?.timeslots?.map(slot => (
                                  <div
                                    key={slot.value}
                                    className="py-1 px-3 rounded-lg text-[11px] border border-border-week bg-white cursor-pointer text-center hover:border-border-strong"
                                    onClick={() =>
                                      onActionSelect?.(
                                        chat.actionType!,
                                        JSON.stringify({
                                          booking_confirm_date: meta.date,
                                          booking_confirm_time: slot.value,
                                        })
                                      )
                                    }
                                  >
                                    {slot.label}
                                  </div>
                                ))
                              })()}
                              <div
                                className="py-1 px-3 rounded-lg text-xs border border-red-200 bg-white cursor-pointer text-center text-red-400 hover:border-red-500 hover:text-red-500"
                                onClick={() => onActionCancel?.(chat.actionType!)}
                              >
                                Cancel Appointment
                              </div>
                            </div>
                          </div>
                        ) : (
                          (() => {
                            if (chat.role === 'user') {
                              const payload = parseBookingPayload(chat.content)
                              if (payload?.name && payload?.email) {
                                return (
                                  <div className="animate-message-in flex flex-col gap-0.5">
                                    <span>Name: {payload.name}</span>
                                    <span>Email: {payload.email}</span>
                                  </div>
                                )
                              }
                              if (payload?.time) {
                                return (
                                  <div className="animate-message-in">
                                    {dayjs(payload.time, 'HH:mm').format('hh:mm A')}
                                  </div>
                                )
                              }
                              if (payload?.date) {
                                return (
                                  <div className="animate-message-in">
                                    {dayjs(payload.date).format('Do MMM YYYY, dddd')}
                                  </div>
                                )
                              }
                            }
                            return (
                              <div className="animate-message-in">
                                <ReactMarkdown
                                  remarkPlugins={REMARK_PLUGINS}
                                  rehypePlugins={REHYPE_PLUGINS}
                                >
                                  {chat.content || 'dummy content'}
                                </ReactMarkdown>
                              </div>
                            )
                          })()
                        ))}
                      {/* Message content - ends */}
                    </div>
                  </div>

                  {/* like and dislike buttons - starts  */}
                  {chat.role === 'assistant' && !isGenerating && (
                    <div className="relative z-10 ml-6 mt-1 flex flex-row flex-nowrap items-center gap-1">
                      <ActionButton
                        isDark={isDark}
                        label="Copy"
                        icon={<Copy className="h-3 w-3" />}
                        onClick={() => onCopy?.(chat.id, chat.content)}
                      />
                      <ActionButton
                        isDark={isDark}
                        label="Good response"
                        icon={
                          <ThumbsUp
                            className="h-3 w-3"
                            {...(chat.feedback === 'like' && { fill: 'currentColor' })}
                          />
                        }
                        onClick={() => onFeedback?.(chat.id, 'like')}
                      />
                      <ActionButton
                        isDark={isDark}
                        label="Bad response"
                        icon={
                          <ThumbsDown
                            className="h-3 w-3"
                            {...(chat.feedback === 'dislike' && { fill: 'currentColor' })}
                          />
                        }
                        onClick={() => onFeedback?.(chat.id, 'dislike')}
                      />
                      {/* <span className={`ml-1 text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {formatRelativeDate(chat.createdAt)}
                      </span> */}
                    </div>
                  )}
                  {/* like and dislike buttons - ends  */}
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
