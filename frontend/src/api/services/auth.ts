// src/api/services/auth.ts
import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { AuthResponseData, GoogleSignInRequest, User } from '@/types/auth'
import type { ApiResponse } from '@/types/api'

export const authService = {
  /**
   * Get current user profile
   * @returns Promise with user data
   */
  getMe: (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return apiClient.get(ENDPOINTS.AUTH.GET_ME)
  },

  /**
   * Sign in with Google using authorization code (API approach)
   * @param data - Google authorization code
   * @returns Promise with user data and token
   */
  googleSignIn: (data: GoogleSignInRequest): Promise<AxiosResponse<ApiResponse<AuthResponseData>>> => {
    return apiClient.post(ENDPOINTS.AUTH.GOOGLE.SIGNIN, data)
  },

  /**
   * Logout user and delete session
   * @returns Promise with success message
   */
  logout: (): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(ENDPOINTS.AUTH.LOGOUT)
  },
}
