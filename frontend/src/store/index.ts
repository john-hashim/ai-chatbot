import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { createUserSlice, type UserSlice } from './slices/userSlice'
import { createChatbotSlice, type ChatbotSlice } from './slices/chatbotSlice'
import { createBookingSlice, type BookingSlice } from './slices/bookingSlice'

type StoreState = UserSlice & ChatbotSlice & BookingSlice

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createChatbotSlice(...a),
        ...createBookingSlice(...a),
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

export const useBookingStore = () =>
  useStore(
    useShallow(state => ({
      duration: state.duration,
      timezone: state.timezone,
      availabilities: state.availabilities,
      fetchBookingData: state.fetchBookingData,
      updateDuration: state.updateDuration,
      updateTimezone: state.updateTimezone,
      createAvailability: state.createAvailability,
      updateAvailability: state.updateAvailability,
      deleteAvailability: state.deleteAvailability,
    }))
  )

export const useChatbotStore = () =>
  useStore(
    useShallow(state => ({
      chatbots: state.chatbots,
      currentChatbot: state.currentChatbot,
      documentFilters: state.documentFilters,
      chatSessions: state.chatSession,
      isLoadingSessions: state.isLoadingSessions,
      isLoadingChatbot: state.isLoadingChatbot,
      getChatbots: state.getChatbots,
      updateChatbot: state.updateChatbot,
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
      resetDocumentFilters: state.resetDocumentFilters,
      clearChatbotState: state.clearChatbotState,
      getChatSessions: state.getChatSessions,
      setChatSessions: state.setChatSessions,
      updateSessionMessages: state.updateSessionMessages,
      getSessionDetails: state.getSessionDetails,
      clearChatSessions: state.clearChatSessions,
    }))
  )
