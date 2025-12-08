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

export interface UploadDocumentResponse {
  name: string
  type: string
  size: number
}
