// src/api/services/auth.ts
import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type {
  AuthResponseData,
  GoogleSignInRequest,
  SignupRequest,
  VerifyEmailRequest,
  User,
} from '@/types/auth'
import type { ApiResponse } from '@/types/api'

export const authService = {
  /**
   * Register a new account with email + password. Sends a verification email;
   * no session is returned until the user verifies via the emailed link.
   */
  signup: (data: SignupRequest): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.post(ENDPOINTS.AUTH.SIGNUP, data)
  },

  /**
   * Complete signup by verifying the emailed token. Returns user + session token.
   */
  verifyEmail: (data: VerifyEmailRequest): Promise<AxiosResponse<ApiResponse<AuthResponseData>>> => {
    return apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, data)
  },

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

  updateAvatar: (avatar: string | null): Promise<AxiosResponse<ApiResponse<User>>> => {
    return apiClient.patch(ENDPOINTS.AUTH.UPDATE_AVATAR, { avatar })
  },

  updateName: (name: string): Promise<AxiosResponse<ApiResponse<User>>> => {
    return apiClient.patch(ENDPOINTS.AUTH.UPDATE_NAME, { name })
  },

  updateEmail: (email: string): Promise<AxiosResponse<ApiResponse<User>>> => {
    return apiClient.patch(ENDPOINTS.AUTH.UPDATE_EMAIL, { email })
  },

  deleteAccount: (): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(ENDPOINTS.AUTH.DELETE_ACCOUNT)
  },
}
