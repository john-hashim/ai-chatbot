import { useContrastColor } from '@/hooks/useContrastColor'
import { useState } from 'react'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import type { ChatbotWidgetProps } from './types'

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  name,
  profilePicture,
  appearance = 'light',
  brandColor = '#000000',
  brandColorForHeader = false,
  initialMessages = [],
  suggestedMessages = [],
  showSuggestedAfterFirst = false,
  messagePlaceholder,
  dismissibleNotice,
  footer,
  messages = [],
  readOnly = false,
  onSendMessage,
  onFeedback,
  onCopy,
  onReset,
  onActionSelect,
  onActionCancel,
  generating,
}) => {
  const [inputValue, setInputValue] = useState('')
  const headerContrast = useContrastColor(brandColor)

  const isDark = appearance === 'dark'

  const headerTextColor = brandColorForHeader
    ? headerContrast.contrastHex
    : isDark
      ? '#ffffff'
      : '#18181b'

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    onSendMessage?.(inputValue)
    setInputValue('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!suggestion.trim()) return
    onSendMessage?.(suggestion)
    setInputValue('')
  }

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content)
    onCopy?.(messageId, content)
  }

  return (
    <div className={`flex h-full flex-col ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
      <ChatHeader
        name={name}
        profilePicture={profilePicture}
        appearance={appearance}
        brandColor={brandColor}
        brandColorForHeader={brandColorForHeader}
        headerTextColor={headerTextColor}
        onReset={onReset}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatMessages
          name={name}
          profilePicture={profilePicture}
          appearance={appearance}
          brandColor={brandColor}
          initialMessages={initialMessages}
          suggestedMessages={suggestedMessages}
          showSuggestedAfterFirst={showSuggestedAfterFirst}
          messages={messages}
          contrastColor={headerContrast.contrastHex}
          onSuggestionClick={handleSuggestionClick}
          onFeedback={onFeedback}
          onCopy={handleCopy}
          onActionSelect={onActionSelect}
          onActionCancel={onActionCancel}
          generating={generating}
        />

        <ChatInput
          appearance={appearance}
          messagePlaceholder={messagePlaceholder}
          dismissibleNotice={dismissibleNotice}
          footer={footer}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          readOnly={readOnly}
          disabled={
            messages[messages.length - 1]?.actionType === 'booking' ||
            messages[messages.length - 1]?.actionType === 'booking_step2'
          }
        />
      </div>
    </div>
  )
}
