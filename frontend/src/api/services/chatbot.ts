// src/api/services/auth.ts
import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { Chatbot, ChatbotFormData } from '@/types/chatbot'
import type { ApiResponse } from '@/types/api'
import type { Document, DocumentFilters } from '@/types/document'

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
   * Get single chatbot by ID with complete details including documents
   * @param chatbotId - ID of the chatbot to retrieve
   * @param filter - Optional filter parameters for documents
   * @returns Promise with complete chatbot data
   */
  getChatbot: (
    chatbotId: string,
    filter: DocumentFilters
  ): Promise<AxiosResponse<ApiResponse<Chatbot>>> => {
    return apiClient.post(ENDPOINTS.CHATBOT.GET_BY_ID.replace(':chatbotId', chatbotId), filter)
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
    files: File[],
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<Document[]>>> => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('documents', file)
    })

    return apiClient.post(
      ENDPOINTS.CHATBOT.UPLOAD_DOCUMENT.replace(':chatbotId', chatbotId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
  },
  /**
   * Delete a single document
   * @param documentId - ID of the document to delete
   * @returns Promise with delete response
   */
  deleteDocument: (documentId: string): Promise<AxiosResponse<ApiResponse<null>>> => {
    return apiClient.delete(ENDPOINTS.CHATBOT.DELETE_DOCUMENT.replace(':documentId', documentId))
  },
  /**
   * Delete multiple documents
   * @param documentIds - Array of document IDs to delete
   * @returns Promise with delete response containing count of deleted documents
   */
  deleteMultipleDocuments: (
    documentIds: string[]
  ): Promise<AxiosResponse<ApiResponse<{ deletedCount: number }>>> => {
    return apiClient.post(ENDPOINTS.CHATBOT.DELETE_MULTIPLE_DOCUMENTS, { documentIds })
  },
}
