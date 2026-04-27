// src/api/endpoints.ts
export const ENDPOINTS = {
  AUTH: {
    GET_ME: '/auth/me',
    LOGOUT: '/auth/logout',
    UPDATE_AVATAR: '/auth/me/avatar',
    UPDATE_NAME: '/auth/me/name',
    UPDATE_EMAIL: '/auth/me/email',
    DELETE_ACCOUNT: '/auth/me',
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
  EMBED: {
    CREATE: 'chatbot/:chatbotId/embed',
    GET: 'chatbot/:chatbotId/embed',
    UPDATE: 'chatbot/:chatbotId/embed',
  },
  BOOKINGS: {
    CREATE_AVAILABILITY: 'chatbot/:chatbotId/availability',
    GET_AVAILABILITY: 'chatbot/:chatbotId/availability',
    UPDATE_TIMESLOTS: 'chatbot/:chatbotId/availability/:slotId',
    DELETE_SLOT: 'chatbot/:chatbotId/availability/:slotId',
    GET_CONFIG: 'chatbot/:chatbotId/booking-config',
    UPDATE_CONFIG: 'chatbot/:chatbotId/booking-config',
    GET_TIMESLOTS: 'chatbot/:chatbotId/booking/timeslots',
    CONFIRM: 'chatbot/:chatbotId/booking/confirm',
    CANCEL: 'chatbot/:chatbotId/booking/cancel',
    GET_APPOINTMENTS: 'chatbot/:chatbotId/appointments',
  },
} as const

export type EndpointValues = typeof ENDPOINTS
