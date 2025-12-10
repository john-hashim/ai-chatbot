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
    UPLOAD_URL: 'chatbot/upload-url',
    UPLOAD_DOCUMENT: 'chatbot/:chatbotId/upload-document',
    GET_DOCUMENTS: 'chatbot/:chatbotId/documents',
  },
} as const

export type EndpointValues = typeof ENDPOINTS
