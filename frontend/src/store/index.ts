import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
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

export const useUserStore = () =>
  useStore(
    useShallow(state => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      error: state.error,
      googleSignIn: state.googleSignIn,
      logout: state.logout,
    }))
  )

export const useChatbotStore = () =>
  useStore(
    useShallow(state => ({
      chatbots: state.chatbots,
      currentChatbot: state.currentChatbot,
      documentFilters: state.documentFilters,
      getChatbots: state.getChatbots,
      setCurrentChatbot: state.setCurrentChatbot,
      clearCurrentChatbot: state.clearCurrentChatbot,
      getChatbot: state.getChatbot,
      addDocument: state.addDocument,
      deleteDocument: state.deleteDocument,
      deleteMultipleDocuments: state.deleteMultipleDocuments,
      upsertChatbot: state.upsertChatbot,
      deleteChatbot: state.deleteChatbot,
      clearChatbots: state.clearChatbots,
      setDocumentFilters: state.setDocumentFilters,
    }))
  )
