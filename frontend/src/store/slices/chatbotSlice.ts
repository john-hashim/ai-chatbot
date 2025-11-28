import type { Chatbot } from '@/types/chatbot'
import type { StateCreator } from 'zustand'

export interface ChatbotSlice {
  chatbots: Chatbot[]
  upsertChatbot: (chatbot: Chatbot) => void
  deleteChatbot: (id: string) => void
  clearChatbots: () => void
}

export const createChatbotSlice: StateCreator<ChatbotSlice> = set => ({
  chatbots: [],
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
