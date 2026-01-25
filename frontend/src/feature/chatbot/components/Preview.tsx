import type React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import { RefreshCw, Send, X } from 'lucide-react'
import { ChatBubbleIcon } from '@/components/common/ChatBubbleIcon'
import { useContrastColor } from '@/hooks/useContrastColor'

export const Preview: React.FC = () => {
  const { control } = useFormContext<ChatbotFormValues>()

  const name = useWatch({ control, name: 'name' })
  const appearance = useWatch({ control, name: 'appearance' })
  const brandColor = useWatch({ control, name: 'brandColor' })
  const brandColorForHeader = useWatch({ control, name: 'brandColorForHeader' })
  const initialMessages = useWatch({ control, name: 'initialMessages' })
  const suggestedMessages = useWatch({ control, name: 'suggestedMessages' })
  const messagePlaceholder = useWatch({ control, name: 'messagePlaceholder' })
  const dismissibleNotice = useWatch({ control, name: 'dismissibleNotice' })
  const footer = useWatch({ control, name: 'footer' })
  const profilePicture = useWatch({ control, name: 'profilePicture' })
  const chatIcon = useWatch({ control, name: 'chatIcon' })
  const chatBubbleButtonColor = useWatch({ control, name: 'chatBubbleButtonColor' })
  const chatBubbleButtonPosition = useWatch({ control, name: 'chatBubbleButtonPosition' })

  const isDark = appearance === 'dark'
  const headerBgColor = brandColorForHeader ? brandColor : isDark ? '#18181b' : '#ffffff'

  // Contrast colors based on background luminance
  const brandColorContrast = useContrastColor(brandColor || '#2563eb')
  const chatBubbleContrast = useContrastColor(chatBubbleButtonColor || '#000000')
  const headerContrast = useContrastColor(headerBgColor)

  // Header text color: use contrast when brandColorForHeader, otherwise theme-based
  const headerTextColor = brandColorForHeader
    ? headerContrast.contrastHex
    : isDark
      ? '#ffffff'
      : '#18181b'

  const filteredInitialMessages = initialMessages?.filter(msg => msg?.trim()) || []
  const filteredSuggestedMessages = suggestedMessages?.filter(msg => msg?.trim()) || []

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="relative mx-auto flex h-full max-h-180 w-full max-w-102 flex-1 flex-col">
        {/* Chat Window */}
        <div className="flex flex-1 shrink-0 flex-col overflow-hidden rounded-[20px] border border-zinc-200 dark:border-zinc-800">
          <main
            className={`relative flex h-full flex-col overflow-visible rounded-[20px] shadow-lg ${
              isDark ? 'bg-zinc-900' : 'bg-white'
            }`}
            data-theme={appearance}
          >
            {/* Header */}
            <header
              className="relative flex items-center justify-between px-5"
              style={{
                background: brandColorForHeader
                  ? `linear-gradient(0deg, rgba(255, 255, 255, 0) 29.14%, rgba(255, 255, 255, 0.16) 100%), ${headerBgColor}`
                  : headerBgColor,
              }}
            >
              <div className="my-4 flex h-10 items-center gap-3">
                {profilePicture && (
                  <img
                    src={profilePicture}
                    alt="Chatbot"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col justify-center">
                  <h1
                    className="font-medium text-sm tracking-tight"
                    style={{ color: headerTextColor }}
                  >
                    {name || 'Chatbot'}
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

            {/* Messages Container */}
            <div
              className={`relative flex-1 overflow-y-auto px-5 pt-5 ${
                isDark ? 'shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.3)]' : 'shadow-inner'
              }`}
            >
              <div className="flex flex-col gap-5">
                {/* Initial Messages (Bot) */}
                {filteredInitialMessages.length > 0 && (
                  <div className="flex w-full">
                    <div className="flex w-full flex-col items-start gap-1">
                      {filteredInitialMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`relative flex w-fit max-w-[85%] flex-col items-start gap-2 px-4 py-3 text-sm leading-normal tracking-tight ${
                            isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
                          } ${
                            index === 0
                              ? 'rounded-[20px] rounded-bl'
                              : index === filteredInitialMessages.length - 1
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
                                className={`font-medium text-sm leading-normal tracking-tight ${
                                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                                }`}
                              >
                                {name || 'Chatbot'}
                              </span>
                            </div>
                          )}
                          <div className="prose h-full w-full max-w-none text-sm leading-normal tracking-tight">
                            {message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample User Message */}
                <div className="relative flex w-full flex-col items-end gap-2">
                  <div
                    className="ml-auto max-w-[min(calc(100%-40px),65ch)] rounded-[20px] px-4 py-3 text-sm leading-normal"
                    style={{
                      backgroundColor: brandColor,
                      color: brandColorContrast.contrastHex,
                    }}
                  >
                    Hello
                  </div>
                </div>

                {/* Suggested Messages */}
                {filteredSuggestedMessages.length > 0 && (
                  <div className="relative mt-auto w-full pt-2">
                    <div className="flex w-full flex-wrap justify-end gap-2">
                      {filteredSuggestedMessages.map((message, index) => (
                        <button
                          key={index}
                          className={`h-auto min-h-10 max-w-[40ch] rounded-[30px] border px-4 py-2 text-sm font-medium shadow-none transition-colors hyphens-auto wrap-break-word ${
                            isDark
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                          }`}
                          style={
                            {
                              '--hover-bg': brandColor,
                              '--hover-text': '#ffffff',
                            } as React.CSSProperties
                          }
                        >
                          {message}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-4 w-full shrink-0" />
            </div>

            {/* Input Area */}
            <div className="relative z-10 flex shrink-0 flex-col justify-end">
              {/* Dismissible Notice */}
              {dismissibleNotice && (
                <div
                  className={`-mb-4 z-10 mx-4 flex items-center gap-2 rounded-t-lg px-3 pt-3 pb-7 ${
                    isDark ? 'bg-zinc-800' : 'bg-zinc-100'
                  }`}
                >
                  <div
                    className={`no-animate flex-1 overflow-x-hidden whitespace-pre-wrap wrap-break-word text-xs font-medium leading-5 ${
                      isDark ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                    dangerouslySetInnerHTML={{ __html: dismissibleNotice }}
                  />
                  <button
                    className={`flex hover:opacity-70 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input Box */}
              <div
                className={`relative z-20 mx-4 mb-4 flex min-h-13 items-center rounded-2xl border-[1.5px] px-3 py-2.5 shadow-[0_4px_16px_#0000000a,0_2px_2px_#00000005] ${
                  isDark ? 'border-zinc-700 bg-zinc-800' : 'border-border-week bg-white'
                }`}
              >
                <input
                  type="text"
                  className={`flex-1 border-0 bg-transparent px-2 py-0 text-sm outline-none placeholder:text-zinc-400 ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                  placeholder={messagePlaceholder || 'Type your message...'}
                  disabled
                />
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded-md p-1.5 ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                  disabled
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              {/* Footer */}
              {footer && (
                <footer
                  className={`no-animate flex min-h-10 w-full max-w-full shrink-0 items-center justify-center overflow-hidden px-4 pb-4 text-xs font-medium leading-[1.4] ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  <div
                    className="w-full overflow-x-hidden whitespace-pre-wrap wrap-break-word text-center"
                    dangerouslySetInnerHTML={{ __html: footer }}
                  />
                </footer>
              )}
            </div>
          </main>
        </div>

        {/* Chat Bubble Button */}
        <div
          className={`mt-2 flex ${chatBubbleButtonPosition === 'left' ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-lg"
            style={{ backgroundColor: chatBubbleButtonColor }}
          >
            {chatIcon ? (
              <img src={chatIcon} alt="Chat" className="h-full w-full object-cover" />
            ) : (
              <ChatBubbleIcon color={chatBubbleContrast.contrastColor} className="h-14 w-14" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
