import { chatbotService } from '@/api/services/chatbot'
import { documentService } from '@/api/services/document'
import { chatService } from '@/api/services/chat'
import type { Chatbot, ChatMessage, ChatSession } from '@/types/chatbot'
import type { DocumentFilters } from '@/types/document'
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  // Chatbot state
  chatbots: Chatbot[]
  currentChatbot: Chatbot | null
  isLoadingChatbot: boolean

  // Chat session state
  chatSessions: ChatSession[]
  isLoadingSessions: boolean
  isLoadingSessionDetails: boolean

  // Document state
  documentFilters: DocumentFilters

  // Chatbot actions
  getChatbots: () => Promise<void>
  getChatbot: (chatbotId?: string) => Promise<void>
  setCurrentChatbot: (chatbotId: string) => void
  clearCurrentChatbot: () => void
  updateChatbot: (data: Partial<Chatbot>) => Promise<Chatbot>
  upsertChatbot: (chatbot: Chatbot) => void
  deleteChatbot: (id: string) => void
  clearChatbots: () => void

  // Chat session actions
  getChatSessions: (chatbotId: string) => Promise<void>
  setChatSessions: (sessions: ChatSession[]) => void
  getSessionDetails: (chatbotId: string, sessionId: string) => Promise<void>
  updateSessionMessages: (sessionId: string, messages: ChatMessage[]) => void
  clearChatSessions: () => void

  // Document actions
  addDocument: () => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  deleteMultipleDocuments: (documentIds: string[]) => Promise<number>
  setDocumentFilters: (filters: Partial<DocumentFilters>) => void
  resetDocumentFilters: () => void

  // Global
  clearChatbotState: () => void
}

const defaultFilters: DocumentFilters = {
  searchParam: '',
  sortBy: 'Newest',
}

export const createChatbotSlice: StateCreator<ChatbotSlice> = (set, get) => ({
  // Chatbot state
  chatbots: [],
  currentChatbot: null,
  isLoadingChatbot: false,

  // Chat session state
  chatSessions: [],
  isLoadingSessions: false,
  isLoadingSessionDetails: false,

  // Document state
  documentFilters: defaultFilters,

  // Chatbot actions

  getChatbots: async () => {
    const response = await chatbotService.getChabots()
    if (!response.data.data) {
      throw new Error('No data received from server')
    }
    set({ chatbots: response.data.data })
  },

  getChatbot: async (chatbotId?: string) => {
    const state = get()
    const id = chatbotId || state.currentChatbot?.id

    if (!id) {
      throw new Error('No chatbot ID provided and no current chatbot set')
    }

    set({ isLoadingChatbot: true })
    try {
      const filters = state.documentFilters
      const response = await chatbotService.getChatbot(id, filters)
      const chatbot = response.data.data

      if (!chatbot) {
        throw new Error('Chatbot not found')
      }
      set({ currentChatbot: chatbot })
    } finally {
      set({ isLoadingChatbot: false })
    }
  },

  setCurrentChatbot: (chatbotId: string) => {
    set(state => {
      const currentChatbot = state.chatbots.find(chatbot => chatbot.id === chatbotId)
      return { currentChatbot }
    })
  },

  clearCurrentChatbot: () => set({ currentChatbot: null }),

  updateChatbot: async (data: Partial<Chatbot>) => {
    const state = get()
    const id = state.currentChatbot?.id

    if (!id) {
      throw new Error('No current chatbot set')
    }

    const response = await chatbotService.updateChatbot(id, data)
    const updatedChatbot = response.data.data

    if (!updatedChatbot) {
      throw new Error('Failed to update chatbot')
    }

    set(state => ({
      currentChatbot: updatedChatbot,
      chatbots: state.chatbots.map(bot => (bot.id === id ? updatedChatbot : bot)),
    }))

    return updatedChatbot
  },

  upsertChatbot: chatbot =>
    set(state => {
      const existingIndex = state.chatbots.findIndex(bot => bot.id === chatbot.id)
      if (existingIndex >= 0) {
        const updatedChatbots = [...state.chatbots]
        updatedChatbots[existingIndex] = chatbot
        return { chatbots: updatedChatbots }
      } else {
        return { chatbots: [chatbot, ...state.chatbots] }
      }
    }),

  deleteChatbot: id => set(state => ({ chatbots: state.chatbots.filter(bot => bot.id !== id) })),

  clearChatbots: () => set({ chatbots: [] }),

  // Chat session actions

  getChatSessions: async (chatbotId: string) => {
    set({ isLoadingSessions: true })
    try {
      const response = await chatService.getChatSessions(chatbotId)
      if (!response.data.data) {
        throw new Error('No data received from server')
      }
      set({ chatSessions: response.data.data, isLoadingSessions: false })
    } finally {
      set({ isLoadingSessions: false })
      console.log('Sessions fetch completed')
    }
  },

  setChatSessions: (sessions: ChatSession[]) => set({ chatSessions: sessions }),

  getSessionDetails: async (chatbotId: string, sessionId: string) => {
    set({ isLoadingSessionDetails: true })
    try {
      const response = await chatService.getChatSession(chatbotId, sessionId)
      const chatSession = response.data.data?.chatSession
      if (!chatSession) {
        throw new Error('Chat session not found')
      }
      get().updateSessionMessages(sessionId, chatSession.messages || [])
    } finally {
      set({ isLoadingSessionDetails: false })
    }
  },

  updateSessionMessages: (sessionId: string, messages: ChatMessage[]) =>
    set(state => ({
      chatSessions: state.chatSessions.map(session =>
        session.id === sessionId ? { ...session, messages } : session
      ),
    })),

  clearChatSessions: () => set({ chatSessions: [] }),

  // Document actions

  addDocument: async () => {
    const state = get()
    if (!state.currentChatbot) return

    await state.getChatbot()
  },

  deleteDocument: async (documentId: string) => {
    const state = get()
    if (!state.currentChatbot) return

    await documentService.deleteDocument(documentId)
    await state.getChatbot()
  },

  deleteMultipleDocuments: async (documentIds: string[]) => {
    const state = get()
    if (!state.currentChatbot) return 0

    const response = await documentService.deleteMultipleDocuments(documentIds)
    const deletedCount = response.data.data?.deletedCount || 0
    await state.getChatbot()

    return deletedCount
  },

  setDocumentFilters: filter =>
    set(state => ({ documentFilters: { ...state.documentFilters, ...filter } })),

  resetDocumentFilters: () => set({ documentFilters: defaultFilters }),

  // Global

  clearChatbotState: () =>
    set({
      chatbots: [],
      currentChatbot: null,
      documentFilters: defaultFilters,
      chatSessions: [],
      isLoadingSessionDetails: false,
      isLoadingChatbot: false,
    }),
})
