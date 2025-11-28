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
  },
} as const

export type EndpointValues = typeof ENDPOINTS
