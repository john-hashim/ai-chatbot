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
const ENABLE_API_DELAY = false
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

    // Interceptor only handles infra-level failures (network, session, 5xx).
    // 4xx statuses reject silently — components show contextual messages.

    if (!response) {
      notifications.show({
        message: 'Network error. Please check your connection.',
        className: 'error',
      })
      return Promise.reject(error)
    }

    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (response.status === 401 && !isLoginEndpoint) {
      notifications.show({
        message: 'Session expired. Please login again.',
        className: 'error',
      })
      useStore.getState().logout()
    } else if (response.status >= 500) {
      notifications.show({
        message: 'Server is unavailable. Please try again later.',
        className: 'error',
      })
    }

    return Promise.reject(error)
  }
)

export default apiClient
