import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createUserSlice, type UserSlice } from './slices/userSlice'
import { createChatbotSlice, type ChatbotSlice } from './slices/chatbotSlice'

type StoreState = UserSlice & ChatbotSlice

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createChatbotSlice(...a),
      }),
      {
        name: 'app-storage',
      }
    ),
    {
      name: 'AppStore',
    }
  )
)

// Export convenience selectors
export const useUserStore = () =>
  useStore(state => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    setUser: state.setUser,
    setToken: state.setToken,
    logout: state.logout,
  }))

export const useChatbotStore = () =>
  useStore(state => ({
    chatbots: state.chatbots,
    setChatbots: state.setChatbots,
    upsertChatbot: state.upsertChatbot,
    deleteChatbot: state.deleteChatbot,
    clearChatbots: state.clearChatbots,
  }))
