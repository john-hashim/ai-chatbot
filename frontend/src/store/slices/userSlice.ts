import type { User } from '@/types/auth'
import type { StateCreator } from 'zustand'

export interface UserSlice {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const createUserSlice: StateCreator<UserSlice> = set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: user => set({ user, isAuthenticated: true }),
  setToken: token => set({ token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
})
