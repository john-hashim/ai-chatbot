import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { Chatbot, ChatbotFormData } from '@/types/chatbot'
import type { ApiResponse } from '@/types/api'
import type { DocumentFilters } from '@/types/document'

export const chatbotService = {
  /**
   * Create Chatbot from frist step
   * @param data - chatbot payload
   * @returns Promise with chatbot data
   */
  createChatbot: (data: ChatbotFormData): Promise<AxiosResponse<ApiResponse<Chatbot>>> => {
    return apiClient.post(ENDPOINTS.CHATBOT.CREATE, {
      ...data,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  },
  /**
   * Update Chatbot (partial update)
   * @param id - chatbot id
   * @param data - partial chatbot data to update
   * @returns Promise with updated chatbot data
   */
  updateChatbot: (
    id: string,
    data: Partial<Chatbot>
  ): Promise<AxiosResponse<ApiResponse<Chatbot>>> => {
    return apiClient.patch(ENDPOINTS.CHATBOT.UPDATE.replace(':chatbotId', id), data)
  },
  /**
   * delete Chatbot
   * @param id - chatbot id
   * @returns Promise with chatbot data
   */
  deleteChatbot: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => {
    return apiClient.delete(ENDPOINTS.CHATBOT.DELETE.replace(':chatbotId', id))
  },

  /**
   * Get Chatbots list
   * @returns Promise with chatbot data
   */
  getChabots: (): Promise<AxiosResponse<ApiResponse<Chatbot[]>>> => {
    return apiClient.get(ENDPOINTS.CHATBOT.GET_ALL)
  },
  /**
   * Get single chatbot by ID with complete details including documents
   * @param chatbotId - ID of the chatbot to retrieve
   * @param filter - Optional filter parameters for documents
   * @returns Promise with complete chatbot data
   */
  getChatbot: (
    chatbotId: string,
    filter?: DocumentFilters
  ): Promise<AxiosResponse<ApiResponse<Chatbot>>> => {
    return apiClient.get(ENDPOINTS.CHATBOT.GET_BY_ID.replace(':chatbotId', chatbotId), {
      params: filter,
    })
  },
}
