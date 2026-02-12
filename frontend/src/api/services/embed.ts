import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'

export interface EmbedConfig {
  id: string
  chatbotId: string
  embedKey: string
  isActive: boolean
  allowedDomains: string[]
  rateLimitPerMin: number
  createdAt: string
  updatedAt: string
}

export interface UpdateEmbedConfigPayload {
  isActive?: boolean
  allowedDomains?: string[]
  rateLimitPerMin?: number
  regenerateKey?: boolean
}

export const embedService = {
  createEmbedConfig: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<EmbedConfig>>> => {
    return apiClient.post(ENDPOINTS.EMBED.CREATE.replace(':chatbotId', chatbotId))
  },

  getEmbedConfig: (
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<EmbedConfig>>> => {
    return apiClient.get(ENDPOINTS.EMBED.GET.replace(':chatbotId', chatbotId))
  },

  updateEmbedConfig: (
    chatbotId: string,
    data: UpdateEmbedConfigPayload
  ): Promise<AxiosResponse<ApiResponse<EmbedConfig>>> => {
    return apiClient.patch(ENDPOINTS.EMBED.UPDATE.replace(':chatbotId', chatbotId), data)
  },
}
