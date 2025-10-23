import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../lib/api'

interface User {
  id: string
  email: string
  displayName: string | null
  createdAt?: string
  lastLoginAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
  updateProfile: (data: { displayName?: string; email?: string }) => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await authApi.login({ email, password })
          const { user, token } = response.data.data
          
          if (!token || token === 'undefined' || token === 'null') {
            throw new Error('Invalid token received from server')
          }
          
          localStorage.setItem('auth_token', token)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
          console.log('Auth store: Login successful, user set')
        } catch (error) {
          console.error('Auth store: Login error:', error)
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        try {
          set({ isLoading: true })
          const response = await authApi.register({ email, password, displayName })
          const { user, token } = response.data.data
          
          localStorage.setItem('auth_token', token)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        localStorage.removeItem('auth-storage') // Clear zustand storage too
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          set({ isLoading: true })
          const response = await authApi.getMe()
          const { user } = response.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateProfile: async (data: { displayName?: string; email?: string }) => {
        try {
          set({ isLoading: true })
          const response = await authApi.updateProfile(data)
          const { user } = response.data
          
          set({
            user,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      clearStorage: () => {
        localStorage.clear()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
