// src/api/index.ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from 'axios'
import { useStore } from '@/store'
import { notifications } from '@mantine/notifications'

const BASE_URL = import.meta.env.VITE_API_URL

// ⚠️ TESTING ONLY: Set to true to add 3-second delay to all API responses
// Remember to set to false before production!
const ENABLE_API_DELAY = true
const API_DELAY_MS = 1000

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = useStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  async (response: AxiosResponse): Promise<AxiosResponse> => {
    // Add delay for testing loading states (if enabled)
    if (ENABLE_API_DELAY) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS))
    }
    return response
  },
  async (error: AxiosError<{ message?: string }>): Promise<AxiosError> => {
    // Add delay for error responses too (if enabled)
    if (ENABLE_API_DELAY) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS))
    }
    const { response } = error

    // Network error (no response from server)
    if (!response) {
      notifications.show({
        message: 'Network error. Please check your connection.',
        className: 'error',
      })
      return Promise.reject(error)
    }

    // Get backend message if available
    const backendMessage = response.data?.message

    // Handle specific status codes with custom logic
    if (response.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      if (!isLoginEndpoint) {
        // Session expired - logout user
        notifications.show({
          message: 'Session expired. Please login again.',
          className: 'error',
        })
        useStore.getState().logout()
      } else {
        // Login endpoint - show error but don't logout
        notifications.show({
          message: backendMessage || 'Authentication failed. Please try again.',
          className: 'error',
        })
      }
    } else if (response.status === 400) {
      // Validation errors
      notifications.show({
        message: backendMessage || 'Invalid request. Please check your inputs.',
        className: 'error',
      })
    } else if (response.status === 404) {
      // Resource not found
      notifications.show({
        message: backendMessage || 'Resource not found.',
        className: 'error',
      })
    } else if (response.status === 409) {
      // Conflict errors (e.g., duplicate entries)
      notifications.show({
        message: backendMessage || 'A conflict occurred. The resource may already exist.',
        className: 'error',
      })
    } else if (response.status === 500) {
      // Internal server error
      notifications.show({
        message: backendMessage || 'Server error. Please try again later.',
        className: 'error',
      })
    } else if (response.status === 503) {
      // Service unavailable
      notifications.show({
        message: backendMessage || 'Service unavailable. Please try again.',
        className: 'error',
      })
    } else {
      // Catch-all for any other error status codes (403, 422, 429, 502, 504, etc.)
      notifications.show({
        message: backendMessage || 'An error occurred. Please try again.',
        className: 'error',
      })
    }

    return Promise.reject(error)
  }
)

export default apiClient
