// src/api/services/auth.ts
import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { Chatbot, ChatbotFormData, UploadDocumentResponse } from '@/types/chatbot'
import type { ApiResponse } from '@/types/api'

interface PresignedUrlData {
  uploadUrl: string
  fileUrl: string
  key: string
}

export const chatbotService = {
  /**
   * Create Chatbot from frist step
   * @param data - chatbot payload
   * @returns Promise with chatbot data
   */
  createChatbot: (data: ChatbotFormData): Promise<AxiosResponse<ApiResponse<Chatbot>>> => {
    return apiClient.post(ENDPOINTS.CHATBOT.CREATE, data)
  },
  /**
   * Get Chatbots list
   * @returns Promise with chatbot data
   */
  getChabots: (): Promise<AxiosResponse<ApiResponse<Chatbot[]>>> => {
    return apiClient.get(ENDPOINTS.CHATBOT.GET_ALL)
  },
  /**
   * Get presigned URL for uploading profile picture to R2
   * @param fileName - name of the file
   * @param fileType - MIME type of the file
   * @returns Promise with presigned URL data
   */
  getPresignedUploadUrl: (
    fileName: string,
    fileType: string,
    directory: string
  ): Promise<AxiosResponse<ApiResponse<PresignedUrlData>>> => {
    return apiClient.post(ENDPOINTS.CHATBOT.UPLOAD_URL, { fileName, fileType, directory })
  },
  /**
   * Upload documents (PDF, DOC, DOCX, TXT) to backend for processing
   * @param files - Array of files to upload
   * @returns Promise with upload response
   */
  uploadDocuments: (
    files: File[]
  ): Promise<AxiosResponse<ApiResponse<UploadDocumentResponse[]>>> => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('documents', file)
    })

    return apiClient.post(ENDPOINTS.CHATBOT.UPLOAD_DOCUMENT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
