import type { ChatMessage, ChatSession } from '@/types/chatbot'

export type { ChatMessage, ChatSession }

export interface ChatbotWidgetProps {
  // Appearance
  name: string
  profilePicture?: string | null
  appearance?: 'light' | 'dark'
  brandColor?: string
  brandColorForHeader?: boolean

  // Content
  initialMessages?: string[]
  suggestedMessages?: string[]
  showSuggestedAfterFirst?: boolean
  messagePlaceholder?: string
  dismissibleNotice?: string | null
  footer?: string | null

  // Chat state
  messages?: ChatMessage[]
  generating: boolean
  chatSessions?: ChatSession[] | null
  chatSessionsLoading?: boolean
  messagesLoading?: boolean

  // Behavior
  readOnly?: boolean
  chatView?: 'recent' | 'session'

  // Callbacks
  onSendMessage?: (message: string) => void
  onFeedback?: (messageId: string, type: string) => void
  onCopy?: (messageId: string, content: string) => void
  onReset?: () => void
  onDownloadChat?: () => void
  onActionSelect?: (actionType: string, value: string) => void
  onActionCancel?: (actionType: string) => void
  onHandleView?: () => void
  onSelectChatSession?: (sessionId: string) => void
  onBack?: () => void
}

export interface ChatHeaderProps {
  name: string
  profilePicture?: string | null
  appearance: 'light' | 'dark'
  brandColor: string
  brandColorForHeader: boolean
  headerTextColor: string
  canDownload: boolean
  chatView?: 'recent' | 'session'
  onReset?: () => void
  onDownloadChat?: () => void
  onHandleView?: () => void
  onBack?: () => void
}

export interface ChatMessagesProps {
  name: string
  profilePicture?: string | null
  appearance: 'light' | 'dark'
  brandColor: string
  initialMessages?: string[]
  suggestedMessages?: string[]
  showSuggestedAfterFirst?: boolean
  messages: ChatMessage[]
  contrastColor: string
  onSuggestionClick?: (suggestion: string) => void
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void
  onCopy?: (messageId: string, content: string) => void
  onActionSelect?: (actionType: string, value: string) => void
  onActionCancel?: (actionType: string) => void
  generating: boolean
}

export interface ChatInputProps {
  appearance: 'light' | 'dark'
  messagePlaceholder?: string
  dismissibleNotice?: string | null
  footer?: string | null
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  readOnly?: boolean
  disabled: boolean
}
