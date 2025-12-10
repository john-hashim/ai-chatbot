import { chatbotService } from '@/api/services/chatbot'
import type { Chatbot } from '@/types/chatbot'
import type { Document } from '@/types/document'
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  chatbots: Chatbot[]
  currentChatbot: Chatbot | null

  getChatbots: () => void
  setCurrentChatbot: (chatbotId: string) => void
  clearCurrentChatbot: () => void
  getChatbotDocuments: (chatbotId: string) => void
  upsertChatbot: (chatbot: Chatbot) => void
  deleteChatbot: (id: string) => void
  clearChatbots: () => void
  addDocument: (documents: Document[]) => void
  deleteDocument: (documentId: string) => Promise<void>
  deleteMultipleDocuments: (documentIds: string[]) => Promise<number>
}

export const createChatbotSlice: StateCreator<ChatbotSlice> = set => ({
  chatbots: [],
  currentChatbot: null,

  getChatbots: async () => {
    const response = await chatbotService.getChabots()
    if (!response.data.data) {
      throw new Error('No data received from server')
    }
    set({ chatbots: response.data.data, currentChatbot: null })
  },
  setCurrentChatbot: (chatbotId: string) => {
    set(state => {
      const currentChatbot = state.chatbots.find(chatbot => chatbot.id === chatbotId)
      return { currentChatbot }
    })
  },
  clearCurrentChatbot: () => set({ currentChatbot: null }),
  addDocument: (documents: Document[]) =>
    set(state => {
      if (!state.currentChatbot) return state
      const currentChatbot = {
        ...state.currentChatbot,
        documents: [...(state.currentChatbot.documents || []), ...documents],
      }
      return { currentChatbot }
    }),
  getChatbotDocuments: async (chatbotId: string) => {
    const response = await chatbotService.getChabotsDocuments(chatbotId)
    const documents = response.data.data || []

    set(state => {
      const chatbot = state.chatbots.find(bot => bot.id === chatbotId)
      if (!chatbot) {
        throw new Error('Chatbot not found')
      }
      return {
        currentChatbot: { ...chatbot, documents },
      }
    })
  },
  deleteDocument: async (documentId: string) => {
    await chatbotService.deleteDocument(documentId)

    set(state => {
      if (!state.currentChatbot) return state

      const updatedDocuments = (state.currentChatbot.documents || []).filter(
        doc => doc.id !== documentId
      )

      return {
        currentChatbot: {
          ...state.currentChatbot,
          documents: updatedDocuments,
        },
      }
    })
  },
  deleteMultipleDocuments: async (documentIds: string[]) => {
    const response = await chatbotService.deleteMultipleDocuments(documentIds)
    const deletedCount = response.data.data?.deletedCount || 0

    set(state => {
      if (!state.currentChatbot) return state

      const updatedDocuments = (state.currentChatbot.documents || []).filter(
        doc => !documentIds.includes(doc.id)
      )

      return {
        currentChatbot: {
          ...state.currentChatbot,
          documents: updatedDocuments,
        },
      }
    })

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
        return { chatbots: [...state.chatbots, chatbot] }
      }
    }),
  deleteChatbot: id => set(state => ({ chatbots: state.chatbots.filter(bot => bot.id !== id) })),
  clearChatbots: () => set({ chatbots: [] }),
})
