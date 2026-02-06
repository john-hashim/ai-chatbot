import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type { Document, TextDocumentUploadParams } from '@/types/document'

interface PresignedUrlData {
  uploadUrl: string
  fileUrl: string
  key: string
}

export const documentService = {
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
    return apiClient.post(ENDPOINTS.DOCUMENT.UPLOAD_URL, { fileName, fileType, directory })
  },
  /**
   * Delete a file from R2 storage
   * @param fileUrl - URL of the file to delete
   * @returns Promise with delete response
   */
  deleteFile: (fileUrl: string): Promise<AxiosResponse<ApiResponse<null>>> => {
    return apiClient.post(ENDPOINTS.DOCUMENT.DELETE_FILE, { fileUrl })
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
      ENDPOINTS.DOCUMENT.UPLOAD_DOCUMENT.replace(':chatbotId', chatbotId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
  },
  /**
   * Upload documents text snipper to backend for processing
   * @param textData - Text snipper document model values
   * @returns Promise with upload response
   */
  uploadTextSnippet: (
    textData: TextDocumentUploadParams,
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<Document>>> => {
    return apiClient.post(
      ENDPOINTS.DOCUMENT.UPLOAD_TEXT.replace(':chatbotId', chatbotId),
      textData
    )
  },
  /**
   * Crawl website URL and add to knowledge base
   * @param data - URL and subtype (url or sitemap)
   * @param chatbotId - ID of the chatbot
   * @returns Promise with crawled document
   */
  uploadWebsiteUrl: (
    data: { url: string; subtype: 'url' | 'sitemap' },
    chatbotId: string
  ): Promise<AxiosResponse<ApiResponse<Document>>> => {
    return apiClient.post(
      ENDPOINTS.DOCUMENT.CRAWL_WEBSITE.replace(':chatbotId', chatbotId),
      data
    )
  },
  /**
   * Delete a single document
   * @param documentId - ID of the document to delete
   * @returns Promise with delete response
   */
  deleteDocument: (documentId: string): Promise<AxiosResponse<ApiResponse<null>>> => {
    return apiClient.delete(
      ENDPOINTS.DOCUMENT.DELETE_DOCUMENT.replace(':documentId', documentId)
    )
  },
  /**
   * Delete multiple documents
   * @param documentIds - Array of document IDs to delete
   * @returns Promise with delete response containing count of deleted documents
   */
  deleteMultipleDocuments: (
    documentIds: string[]
  ): Promise<AxiosResponse<ApiResponse<{ deletedCount: number }>>> => {
    return apiClient.post(ENDPOINTS.DOCUMENT.DELETE_MULTIPLE_DOCUMENTS, { documentIds })
  },
  /**
   * Train all untrained documents for a chatbot
   * @param chatbotId - ID of the chatbot
   * @returns Promise with training result
   */
  trainDocuments: (
    chatbotId: string
  ): Promise<
    AxiosResponse<ApiResponse<{ documentsProcessed: number; chunksCreated: number }>>
  > => {
    return apiClient.post(ENDPOINTS.DOCUMENT.TRAIN.replace(':chatbotId', chatbotId))
  },
  /**
   * Get training status for a chatbot
   * @param chatbotId - ID of the chatbot
   * @returns Promise with training status
   */
  getTrainingStatus: (
    chatbotId: string
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        totalDocuments: number
        trainedDocuments: number
        untrainedDocuments: number
        failedDocuments: number
        totalChunks: number
        isFullyTrained: boolean
      }>
    >
  > => {
    return apiClient.get(ENDPOINTS.DOCUMENT.TRAINING_STATUS.replace(':chatbotId', chatbotId))
  },
}
