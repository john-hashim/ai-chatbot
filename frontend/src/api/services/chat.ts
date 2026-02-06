import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ChatMessage, ChatSession, ChatSessionSource } from '@/types/chatbot'
import type { ApiResponse } from '@/types/api'
import { useStore } from '@/store'

export const chatService = {
  /**
   * Send a chat message to a chatbot
   * @param chatbotId - ID of the chatbot
   * @param message - User message text
   * @param sessionId - Optional existing session ID (omit to create new session)
   * @returns Promise with session ID and saved message
   */
  postMessage: (
    chatbotId: string,
    message: string,
    sessionId?: string,
    source?: ChatSessionSource
  ): Promise<AxiosResponse<ApiResponse<{ sessionId: string; message: ChatMessage }>>> => {
    return apiClient.post(ENDPOINTS.CHAT.POST_MESSAGE.replace(':chatbotId', chatbotId), {
      message,
      sessionId,
      source,
    })
  },
  /**
   * Get all chat sessions for a chatbot (first session includes messages)
   * @param chatbotId - ID of the chatbot
   * @returns Promise with array of chat sessions
   */
  getChatSessions: (chatbotId: string): Promise<AxiosResponse<ApiResponse<ChatSession[]>>> => {
    return apiClient.get(ENDPOINTS.CHAT.GET_SESSIONS.replace(':chatbotId', chatbotId))
  },
  /**
   * Get a chat session with all its messages
   * @param chatbotId - ID of the chatbot
   * @param sessionId - ID of the chat session
   * @returns Promise with chat session and messages
   */
  getChatSession: (
    chatbotId: string,
    sessionId: string
  ): Promise<AxiosResponse<ApiResponse<{ chatSession: ChatSession }>>> => {
    return apiClient.get(
      ENDPOINTS.CHAT.GET_SESSION.replace(':chatbotId', chatbotId).replace(
        ':sessionId',
        sessionId
      )
    )
  },

  deleteChatSession: (
    chatbotId: string,
    sessionId: string
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return apiClient.delete(
      ENDPOINTS.CHAT.DELETE_SESSION.replace(':chatbotId', chatbotId).replace(
        ':sessionId',
        sessionId
      )
    )
  },
  exportChatsAsJSON: (chatbotId: string): Promise<AxiosResponse<Blob>> => {
    return apiClient.get(ENDPOINTS.CHAT.EXPORT_JSON.replace(':chatbotId', chatbotId), {
      responseType: 'blob',
    })
  },
  exportChatsAsCSV: (chatbotId: string): Promise<AxiosResponse<Blob>> => {
    return apiClient.get(ENDPOINTS.CHAT.EXPORT_CSV.replace(':chatbotId', chatbotId), {
      responseType: 'blob',
    })
  },
  exportChatsAsPDF: (chatbotId: string): Promise<AxiosResponse<Blob>> => {
    return apiClient.get(ENDPOINTS.CHAT.EXPORT_PDF.replace(':chatbotId', chatbotId), {
      responseType: 'blob',
    })
  },
}

export interface StreamChatCallbacks {
  onSessionId: (sessionId: string) => void
  onToken: (token: string) => void
  onDone: (message: ChatMessage) => void
  onError: (error: string) => void
}

/**
 * Stream a chat response via SSE using native fetch.
 * Axios does not support streaming, so we use fetch + ReadableStream.
 */
export async function streamChat(
  chatbotId: string,
  message: string,
  sessionId: string | undefined,
  callbacks: StreamChatCallbacks,
  source?: ChatSessionSource
): Promise<void> {
  const token = useStore.getState().token
  const baseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')
  const endpoint = ENDPOINTS.CHAT.POST_MESSAGE.replace(':chatbotId', chatbotId)
  const url = `${baseUrl}/${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, sessionId, source }),
  })

  if (!response.ok) {
    callbacks.onError(`Request failed: ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue

      const jsonStr = trimmed.slice(5).trim()
      try {
        const data = JSON.parse(jsonStr)

        switch (data.type) {
          case 'session':
            callbacks.onSessionId(data.sessionId)
            break
          case 'token':
            callbacks.onToken(data.token)
            break
          case 'done':
            callbacks.onDone(data.message)
            break
          case 'error':
            callbacks.onError(data.message)
            break
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }
}
