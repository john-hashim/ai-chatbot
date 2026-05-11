import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type { ModelsResponse } from '@/types/chatbot'

export const modelsService = {
  /**
   * List curated chat models grouped by tier (free/standard/premium).
   */
  list: (): Promise<AxiosResponse<ApiResponse<ModelsResponse>>> => {
    return apiClient.get(ENDPOINTS.MODELS.GET_ALL)
  },
}
