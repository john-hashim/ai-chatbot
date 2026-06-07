import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { createUserSlice, type UserSlice } from './slices/userSlice'
import { createChatbotSlice, type ChatbotSlice } from './slices/chatbotSlice'
import { createBookingSlice, type BookingSlice } from './slices/bookingSlice'
import { createModelsSlice, type ModelsSlice } from './slices/modelsSlice'
import { createAnalyticsSlice, type AnalyticsSlice } from './slices/analyticsSlice'
import { createEmbedSlice, type EmbedSlice } from './slices/embedSlice'

type StoreState = UserSlice & ChatbotSlice & BookingSlice & ModelsSlice & AnalyticsSlice & EmbedSlice

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createChatbotSlice(...a),
        ...createBookingSlice(...a),
        ...createModelsSlice(...a),
        ...createAnalyticsSlice(...a),
        ...createEmbedSlice(...a),
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
      login: state.login,
      signup: state.signup,
      verifyEmail: state.verifyEmail,
      logout: state.logout,
      updateUser: state.updateUser,
    }))
  )

export const useBookingStore = () =>
  useStore(
    useShallow(state => ({
      appointmentIsEnabled: state.appointmentIsEnabled,
      duration: state.duration,
      timezone: state.timezone,
      notificationEmail: state.notificationEmail,
      locationType: state.locationType,
      locationAddress: state.locationAddress,
      locationPhone: state.locationPhone,
      availabilities: state.availabilities,
      appointments: state.appointments,
      appointmentsError: state.appointmentsError,
      calendarIntegration: state.calendarIntegration,
      fetchingAvailabilities: state.fetchingAvailabilities,
      fetchingAppointments: state.fetchingAppointments,
      creatingDayId: state.creatingDayId,
      updatingSlotId: state.updatingSlotId,
      deletingSlotId: state.deletingSlotId,
      cancellingAppointmentId: state.cancellingAppointmentId,
      connectingCalendar: state.connectingCalendar,
      disconnectingCalendar: state.disconnectingCalendar,
      exportingAppointmentsPdf: state.exportingAppointmentsPdf,
      fetchBookingData: state.fetchBookingData,
      refreshAvailabilities: state.refreshAvailabilities,
      clearAvailabilities: state.clearAvailabilities,
      updateAppointmentIsEnabled: state.updateAppointmentIsEnabled,
      updateDuration: state.updateDuration,
      updateTimezone: state.updateTimezone,
      updateNotificationEmail: state.updateNotificationEmail,
      updateLocation: state.updateLocation,
      createAvailability: state.createAvailability,
      updateAvailability: state.updateAvailability,
      deleteAvailability: state.deleteAvailability,
      fetchAppointments: state.fetchAppointments,
      exportAppointmentsAsPDF: state.exportAppointmentsAsPDF,
      cancelAppointment: state.cancelAppointment,
      clearAppointments: state.clearAppointments,
      connectGoogleCalendar: state.connectGoogleCalendar,
      disconnectCalendar: state.disconnectCalendar,
    }))
  )

export const useChatbotStore = () =>
  useStore(
    useShallow(state => ({
      chatbots: state.chatbots,
      currentChatbot: state.currentChatbot,
      isLoadingChatbot: state.isLoadingChatbot,
      chatSession: state.chatSession,
      chatSessionsByEndUser: state.chatSessionsByEndUser,
      isLoadingSessions: state.isLoadingSessions,
      isLoadingSessionDetails: state.isLoadingSessionDetails,
      isLoadingSessionsByEndUser: state.isLoadingSessionsByEndUser,
      documentFilters: state.documentFilters,
      getChatbots: state.getChatbots,
      getChatbot: state.getChatbot,
      setCurrentChatbot: state.setCurrentChatbot,
      clearCurrentChatbot: state.clearCurrentChatbot,
      createChatbot: state.createChatbot,
      trainChatbotDocuments: state.trainChatbotDocuments,
      updateChatbot: state.updateChatbot,
      upsertChatbot: state.upsertChatbot,
      deleteChatbot: state.deleteChatbot,
      clearChatbots: state.clearChatbots,
      getChatSessions: state.getChatSessions,
      setChatSessions: state.setChatSessions,
      getSessionDetails: state.getSessionDetails,
      updateSessionMessages: state.updateSessionMessages,
      clearChatSessions: state.clearChatSessions,
      setChatSessionFilters: state.setChatSessionFilters,
      resetChatSessionFilters: state.resetChatSessionFilters,
      getChatSessionsByEndUser: state.getChatSessionsByEndUser,
      clearChatSessionsByEndUser: state.clearChatSessionsByEndUser,
      deleteChatSession: state.deleteChatSession,
      exportChats: state.exportChats,
      addDocument: state.addDocument,
      deleteDocument: state.deleteDocument,
      deleteMultipleDocuments: state.deleteMultipleDocuments,
      setDocumentFilters: state.setDocumentFilters,
      resetDocumentFilters: state.resetDocumentFilters,
      clearChatbotState: state.clearChatbotState,
    }))
  )

export const useModelsStore = () =>
  useStore(
    useShallow(state => ({
      models: state.models,
      defaultModelId: state.defaultModelId,
      groupedModels: state.groupedModels,
      isLoadingModels: state.isLoadingModels,
      modelsError: state.modelsError,
      fetchModels: state.fetchModels,
      clearModels: state.clearModels,
    }))
  )

export const useAnalyticsStore = () =>
  useStore(
    useShallow(state => ({
      analytics: state.analytics,
      isLoadingAnalytics: state.isLoadingAnalytics,
      fetchAnalytics: state.fetchAnalytics,
      clearAnalytics: state.clearAnalytics,
    }))
  )

export const useEmbedStore = () =>
  useStore(
    useShallow(state => ({
      embedConfig: state.embedConfig,
      isLoadingEmbedConfig: state.isLoadingEmbedConfig,
      isMutatingEmbedConfig: state.isMutatingEmbedConfig,
      fetchEmbedConfig: state.fetchEmbedConfig,
      createEmbedConfig: state.createEmbedConfig,
      updateEmbedConfig: state.updateEmbedConfig,
      clearEmbedConfig: state.clearEmbedConfig,
    }))
  )
