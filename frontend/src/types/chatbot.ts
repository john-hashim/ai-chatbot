import type { Document } from './document'

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
}
