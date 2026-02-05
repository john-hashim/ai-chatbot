import type { Document } from './document'

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  model: string | null
  temperature: number | null
  tokensUsed: number | null
  responseTime: number | null
  sources: string[]
  feedback: 'like' | 'dislike' | null
  createdAt: string
}

export interface ChatSession {
  id: string
  chatbotId: string
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
  _count?: {
    messages: number
  }
}

export interface ChatbotFormData {
  name: string
  appearance: 'light' | 'dark'
  brandColor: string
  brandColorForHeader: boolean
  profilePicture: string | null
}

export interface Chatbot extends ChatbotFormData {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  documents: Document[]
  documentsCount?: number
  fileCount?: number
  linkCount?: number
  textCount?: number
  QandACount?: number
  totalSize: number
  lastTrained: Date | null
  initialMessages: string[]
  suggestedMessages: string[]
  showSuggestedAfterFirst: boolean
  messagePlaceholder: string | null
  dismissibleNotice: string | null
  footer: string | null
  autoshowDelaySeconds: number
  autoshowInitialPopup: boolean
  chatIcon: string | null
  chatBubbleButtonColor: string
  chatBubbleButtonPosition: 'left' | 'right'
  instructionType: string
  customInstruction?: string
}
