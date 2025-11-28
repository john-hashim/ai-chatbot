// src/api/index.ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from 'axios'
import { useUserStore } from '@/store/userStore'
import { notifications } from '@mantine/notifications'

const BASE_URL = import.meta.env.VITE_API_URL

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
    const token = useUserStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError<{ message?: string }>): Promise<AxiosError> => {
    const { response } = error

    // Handle global errors with notifications
    if (response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      if (!isLoginEndpoint) {
        notifications.show({
          message: 'Session expired. Please login again.',
          className: 'error',
        })
        useUserStore.getState().logout()
      }
    } else if (response?.status === 400) {
      // Validation errors
      const message = response.data?.message || 'Invalid request. Please check your inputs.'
      notifications.show({
        message,
        className: 'error',
      })
    } else if (response?.status === 500) {
      notifications.show({
        message: 'Server error. Please try again later.',
        className: 'error',
      })
    } else if (response?.status === 503) {
      notifications.show({
        message: 'Service unavailable. Please try again.',
        className: 'error',
      })
    } else if (!response) {
      // Network error
      notifications.show({
        message: 'Network error. Please check your connection.',
        className: 'error',
      })
    }

    return Promise.reject(error)
  }
)

export default apiClient
