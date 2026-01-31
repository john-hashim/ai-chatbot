import type React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import {
  ChatbotWidget,
  ChatBubbleButton,
  type ChatMessage,
} from '@/components/common/ChatbotWidget'

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello',
    createdAt: new Date(),
  },
]

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

  const filteredInitialMessages = initialMessages?.filter(msg => msg?.trim()) || []
  const filteredSuggestedMessages = suggestedMessages?.filter(msg => msg?.trim()) || []

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="relative mx-auto flex h-full max-h-180 w-full max-w-102 flex-1 flex-col">
        <div className="flex flex-1 shrink-0 flex-col overflow-hidden rounded-[20px] border border-zinc-200 shadow-lg dark:border-zinc-800">
          <ChatbotWidget
            name={name || 'Chatbot'}
            profilePicture={profilePicture}
            appearance={appearance}
            brandColor={brandColor}
            brandColorForHeader={brandColorForHeader}
            initialMessages={filteredInitialMessages}
            suggestedMessages={filteredSuggestedMessages}
            showSuggestedAfterFirst
            messagePlaceholder={messagePlaceholder ?? undefined}
            dismissibleNotice={dismissibleNotice}
            footer={footer}
            messages={sampleMessages}
            readOnly
            generating={false}
          />
        </div>

        {/* Chat Bubble Button */}
        <div
          className={`mt-2 flex ${chatBubbleButtonPosition === 'left' ? 'justify-start' : 'justify-end'}`}
        >
          <ChatBubbleButton color={chatBubbleButtonColor} icon={chatIcon} />
        </div>
      </div>
    </div>
  )
}
