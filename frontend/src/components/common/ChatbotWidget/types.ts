export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  model?: string | null
  temperature?: number | null
  tokensUsed?: number | null
  responseTime?: number | null
  sources?: string[] | null
  feedback?: 'like' | 'dislike' | null
}

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

  // Behavior
  readOnly?: boolean

  // Callbacks
  onSendMessage?: (message: string) => void
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void
  onRetry?: (messageId: string) => void
  onCopy?: (messageId: string, content: string) => void
  onReset?: () => void
}

export interface ChatHeaderProps {
  name: string
  profilePicture?: string | null
  appearance: 'light' | 'dark'
  brandColor: string
  brandColorForHeader: boolean
  headerTextColor: string
  onReset?: () => void
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
  onRetry?: (messageId: string) => void
  onCopy?: (messageId: string, content: string) => void
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
}
