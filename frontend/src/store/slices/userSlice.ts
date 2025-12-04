import type { User, GoogleSignInRequest } from '@/types/auth'
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
  logout: () => void
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
  logout: () => set({ user: null, token: null, isAuthenticated: false, error: null }),
})
