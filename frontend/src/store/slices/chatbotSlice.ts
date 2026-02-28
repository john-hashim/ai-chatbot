import { chatbotService } from '@/api/services/chatbot'
import { documentService } from '@/api/services/document'
import { chatService } from '@/api/services/chat'
import type { Chatbot, ChatMessage, ChatSession, ChatSessionState } from '@/types/chatbot'
import type {  ChatSessionSortOption, Filter } from "@/types/common"
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  // Chatbot state
  chatbots: Chatbot[]
  currentChatbot: Chatbot | null
  isLoadingChatbot: boolean

  // Chat session state
  chatSession: ChatSessionState
  isLoadingSessions: boolean
  isLoadingSessionDetails: boolean

  // Document state
  documentFilters: Filter

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
  setChatSessionFilters: (filter: Filter<ChatSessionSortOption>) => void;
  resetChatSessionFilters: () => void

  // Document actions
  addDocument: () => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  deleteMultipleDocuments: (documentIds: string[]) => Promise<number>
  setDocumentFilters: (filters: Partial<Filter>) => void
  resetDocumentFilters: () => void

  // Global
  clearChatbotState: () => void
}

// TODO: Can be resued across the app.
const defaultFilters: Filter = {
  searchParam: '',
  sortBy: 'Newest',
}

const defaultChatSessionFilters: Filter<ChatSessionSortOption> = {
  searchParam: '',
  sortBy: 'Newest',
}

export const createChatbotSlice: StateCreator<
  ChatbotSlice,
  [['zustand/devtools', never]],
  []
> = (set, get) => ({
  // Chatbot state
  chatbots: [],
  currentChatbot: null,
  isLoadingChatbot: false,

  // Chat session state
  chatSession: {
    chatSessions: [],
    filters: defaultChatSessionFilters
  },
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
    set({ chatbots: response.data.data }, undefined, '[Chat Bot] Set Chat Bots')
  },

  getChatbot: async (chatbotId?: string) => {
    const state = get()
    const id = chatbotId || state.currentChatbot?.id

    if (!id) {
      throw new Error('No chatbot ID provided and no current chatbot set')
    }

    set({ isLoadingChatbot: true }, undefined, '[Chat Bot] Set Chat Bot Loading')
    try {
      const filters = state.documentFilters
      const response = await chatbotService.getChatbot(id, filters)
      const chatbot = response.data.data

      if (!chatbot) {
        throw new Error('Chatbot not found')
      }
      set({ currentChatbot: chatbot }, undefined, '[Chat Bot] Set Current Chat Bot')
    } finally {
      set({ isLoadingChatbot: false }, undefined, '[Chat Bot] Set Chat Bot Loading')
    }
  },

  setCurrentChatbot: (chatbotId: string) => {
    set(state => {
      const currentChatbot = state.chatbots.find(chatbot => chatbot.id === chatbotId)
      return { currentChatbot }
    }, undefined, '[Chat Bot] Set Current Chat')
  },

  clearCurrentChatbot: () => set({ currentChatbot: null }, undefined, '[Chat Bot] Clear Current Chat Bot'),

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
    }), undefined, '[Chat Bot] Update Chat Bot')

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
    }, undefined, '[Chat Bot] Clear Current Chat Bot'),

  deleteChatbot: id => set(state => ({ chatbots: state.chatbots.filter(bot => bot.id !== id) }), undefined, '[Chat Bot] Delete Chat Bot'),

  clearChatbots: () => set({ chatbots: [] }, undefined, '[Chat Bot] Clear Chat Bots'),

  // Chat session actions

  getChatSessions: async (chatbotId: string) => {
    set({ isLoadingSessions: true }, undefined, '[Chat Bot] Set isLoading Session True')
    try {
      const filter = get().chatSession.filters;
      const response = await chatService.getChatSessions(chatbotId, filter)
      if (!response.data.data) {
        throw new Error('No data received from server')
      }
      set((state: ChatbotSlice): Partial<ChatbotSlice> => ({
        chatSession: { chatSessions: response.data?.data ?? [], filters: state.chatSession.filters }
      }), undefined, '[Chat Bot] Set Chat Session')
    } finally {
      set({ isLoadingSessions: false }, undefined, '[Chat Bot] Set isLoading Session False')
      console.log('Sessions fetch completed')
    }
  },

  setChatSessions: (chatSessions: ChatSession[]) => set((state: ChatbotSlice): Partial<ChatbotSlice> => ({
    chatSession: { ...state.chatSession, chatSessions }
  }), undefined, '[Chat Bot] Set Chat Sessions'),

  getSessionDetails: async (chatbotId: string, sessionId: string) => {
    set({ isLoadingSessionDetails: true }, undefined, '[Chat Bot] Set isLoading Session Details True')
    try {
      const response = await chatService.getChatSession(chatbotId, sessionId)
      const chatSession = response.data.data?.chatSession
      if (!chatSession) {
        throw new Error('Chat session not found')
      }
      get().updateSessionMessages(sessionId, chatSession.messages || [])
    } finally {
      set({ isLoadingSessionDetails: false }, undefined, '[Chat Bot] Set isLoading Session Details False')
    }
  },

  updateSessionMessages: (sessionId: string, messages: ChatMessage[]) =>
    set((state: ChatbotSlice): Partial<ChatbotSlice> => ({
      chatSession: {
        ...state.chatSession,
        chatSessions: state.chatSession.chatSessions.map(session =>
          session.id === sessionId ? { ...session, messages } : session
        )
      }
    }), undefined, '[Chat Bot] Update Session Messages'),

  clearChatSessions: () => set({ chatSession: { chatSessions: [], filters: defaultChatSessionFilters } }, undefined, '[Chat Bot] Clear Chat Sessions'),

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
    set(state => ({ documentFilters: { ...state.documentFilters, ...filter } }), undefined, '[Chat Bot] Set Document Filters'),

  resetDocumentFilters: () => set({ documentFilters: defaultFilters }, undefined, '[Chat Bot] Reset Document Filters'),

  setChatSessionFilters: (filter: Filter<ChatSessionSortOption>) => set((state: ChatbotSlice): Partial<ChatbotSlice> => ({
    chatSession: {
      ...state.chatSession,
      filters: filter
    }
  }), undefined, '[Chat Bot] Set Chat Session Filters'),

  resetChatSessionFilters: () => set((state: ChatbotSlice): Partial<ChatbotSlice> => ({
    chatSession: {
      ...state.chatSession,
      filters: defaultChatSessionFilters
    }
  }), undefined, '[Chat Bot] Reset Chat Session Filters'),

  // Global

  clearChatbotState: () =>
    set({
      chatbots: [],
      currentChatbot: null,
      documentFilters: defaultFilters,
      chatSession: {
        chatSessions: [],
        filters: defaultChatSessionFilters
      },
      isLoadingSessionDetails: false,
      isLoadingChatbot: false,
    }, undefined, '[Chat Bot] Clear Chat Bot State'),
})
