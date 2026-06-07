import type { User, GoogleSignInRequest, SignupRequest, LoginRequest } from '@/types/auth'
import type { StateCreator } from 'zustand'
import { authService } from '@/api/services/auth'

// Initial State + actions
export interface UserSlice {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  googleSignIn: (data: GoogleSignInRequest) => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  signup: (data: SignupRequest) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const createUserSlice: StateCreator<UserSlice> = set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  googleSignIn: async (data: GoogleSignInRequest) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.googleSignIn(data)

      if (!response.data.data) {
        throw new Error('No data received from server')
      }

      const { user, token } = response.data.data

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed'
      set({
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  },
  login: async (data: LoginRequest) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.login(data)

      if (!response.data.data) {
        throw new Error('No data received from server')
      }

      const { user, token } = response.data.data

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  signup: async (data: SignupRequest) => {
    set({ loading: true, error: null })
    try {
      await authService.signup(data)
      set({ loading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  verifyEmail: async (token: string) => {
    set({ loading: true, error: null })
    try {
      const response = await authService.verifyEmail({ token })

      if (!response.data.data) {
        throw new Error('No data received from server')
      }

      const { user, token: sessionToken } = response.data.data

      set({
        user,
        token: sessionToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  logout: () => set({ user: null, token: null, isAuthenticated: false, error: null }),
  updateUser: (updates: Partial<User>) =>
    set(state => ({ user: state.user ? { ...state.user, ...updates } : state.user })),
})
