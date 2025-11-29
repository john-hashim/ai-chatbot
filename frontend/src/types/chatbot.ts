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
}

export interface ApiResponse<T = unknown> {
  status: ApiStatus
  data?: T
  message: string
  error?: string
}

export const ApiStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const

export type ApiStatus = (typeof ApiStatus)[keyof typeof ApiStatus]
