import { chatbotService } from '@/api/services/chatbot'
import type { Chatbot } from '@/types/chatbot'
import type { DocumentFilters } from '@/types/document'
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  chatbots: Chatbot[]
  currentChatbot: Chatbot | null
  documentFilters: DocumentFilters

  getChatbots: () => Promise<void>

  setCurrentChatbot: (chatbotId: string) => void
  clearCurrentChatbot: () => void
  getChatbot: (chatbotId?: string) => Promise<void>
  updateChatbot: (data: Partial<Chatbot>) => Promise<Chatbot>

  upsertChatbot: (chatbot: Chatbot) => void
  deleteChatbot: (id: string) => void
  clearChatbots: () => void

  addDocument: () => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  deleteMultipleDocuments: (documentIds: string[]) => Promise<number>

  setDocumentFilters: (filters: Partial<DocumentFilters>) => void
  resetDocumentFilters: () => void

  clearChatbotState: () => void
}

const defaultFilters: DocumentFilters = {
  searchParam: '',
  sortBy: 'Newest',
}

export const createChatbotSlice: StateCreator<ChatbotSlice> = (set, get) => ({
  chatbots: [],
  currentChatbot: null,
  documentFilters: defaultFilters,

  getChatbots: async () => {
    const response = await chatbotService.getChabots()
    if (!response.data.data) {
      throw new Error('No data received from server')
    }
    set({ chatbots: response.data.data })
  },
  setCurrentChatbot: (chatbotId: string) => {
    set(state => {
      const currentChatbot = state.chatbots.find(chatbot => chatbot.id === chatbotId)
      return { currentChatbot }
    })
  },
  clearCurrentChatbot: () => set({ currentChatbot: null }),
  getChatbot: async (chatbotId?: string) => {
    const state = get()
    const id = chatbotId || state.currentChatbot?.id

    if (!id) {
      throw new Error('No chatbot ID provided and no current chatbot set')
    }

    const filters = state.documentFilters
    const response = await chatbotService.getChatbot(id, filters)
    const chatbot = response.data.data

    if (!chatbot) {
      throw new Error('Chatbot not found')
    }
    set({ currentChatbot: chatbot })
  },
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
  addDocument: async () => {
    const state = get()
    if (!state.currentChatbot) return

    await state.getChatbot()
  },
  deleteDocument: async (documentId: string) => {
    const state = get()
    if (!state.currentChatbot) return

    await chatbotService.deleteDocument(documentId)
    await state.getChatbot()
  },
  deleteMultipleDocuments: async (documentIds: string[]) => {
    const state = get()
    if (!state.currentChatbot) return 0

    const response = await chatbotService.deleteMultipleDocuments(documentIds)
    const deletedCount = response.data.data?.deletedCount || 0
    await state.getChatbot()

    return deletedCount
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

  setDocumentFilters: filter =>
    set(state => ({ documentFilters: { ...state.documentFilters, ...filter } })),

  resetDocumentFilters: () => set({ documentFilters: defaultFilters }),

  clearChatbotState: () =>
    set({ chatbots: [], currentChatbot: null, documentFilters: defaultFilters }),
})
