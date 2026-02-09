// src/api/endpoints.ts
export const ENDPOINTS = {
  AUTH: {
    GET_ME: '/auth/me',
    LOGOUT: '/auth/logout',
    GOOGLE: {
      SIGNIN: '/auth/google/signin', // POST - API-based Google sign-in
    },
  },
  CHATBOT: {
    CREATE: 'chatbot/create',
    UPDATE: 'chatbot/:chatbotId',
    DELETE: 'chatbot/:chatbotId',
    GET_ALL: 'chatbot/chatbots',
    GET_BY_ID: 'chatbot/:chatbotId',
  },
  DOCUMENT: {
    UPLOAD_URL: 'chatbot/upload-url',
    DELETE_FILE: 'chatbot/delete-file',
    UPLOAD_DOCUMENT: 'chatbot/:chatbotId/upload-document',
    UPLOAD_TEXT: 'chatbot/:chatbotId/upload-text',
    CRAWL_WEBSITE: 'chatbot/:chatbotId/crawl-website',
    DELETE_DOCUMENT: 'chatbot/documents/:documentId',
    DELETE_MULTIPLE_DOCUMENTS: 'chatbot/documents/delete-multiple',
    TRAIN: 'chatbot/:chatbotId/train',
    TRAINING_STATUS: 'chatbot/:chatbotId/training-status',
  },
  CHAT: {
    POST_MESSAGE: 'chatbot/:chatbotId/chat',
    GET_SESSIONS: 'chatbot/:chatbotId/chat-sessions',
    GET_SESSION: 'chatbot/:chatbotId/:sessionId',
    DELETE_SESSION: 'chatbot/:chatbotId/:sessionId',
    EXPORT_JSON: 'chatbot/:chatbotId/export/json',
    EXPORT_CSV: 'chatbot/:chatbotId/export/csv',
    EXPORT_PDF: 'chatbot/:chatbotId/export/pdf',
    UPDATE_MESSAGE: 'chatbot/:chatbotId/:sessionId/:messageId',
  },
  ANALYTICS: {
    GET: 'chatbot/:chatbotId/analytics',
  },
} as const

export type EndpointValues = typeof ENDPOINTS
