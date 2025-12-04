import { chatbotService } from '@/api/services/chatbot'
import type { Chatbot } from '@/types/chatbot'
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  chatbots: Chatbot[]

  getChatbots: () => void
  upsertChatbot: (chatbot: Chatbot) => void
  deleteChatbot: (id: string) => void
  clearChatbots: () => void
}

export const createChatbotSlice: StateCreator<ChatbotSlice> = set => ({
  chatbots: [],

  getChatbots: async () => {
    const response = await chatbotService.getChabots()
    if (!response.data.data) {
      throw new Error('No data received from server')
    }
    set({ chatbots: response.data.data })
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
