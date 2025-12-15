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
    GET_ALL: 'chatbot/chatbots',
    GET_BY_ID: 'chatbot/:chatbotId',
    UPLOAD_URL: 'chatbot/upload-url',
    UPLOAD_DOCUMENT: 'chatbot/:chatbotId/upload-document',
    UPLOAD_TEXT: 'chatbot/:chatbotId/upload-text',
    DELETE_DOCUMENT: 'chatbot/documents/:documentId',
    DELETE_MULTIPLE_DOCUMENTS: 'chatbot/documents/delete-multiple',
  },
} as const

export type EndpointValues = typeof ENDPOINTS
