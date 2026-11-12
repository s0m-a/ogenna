'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { axiosInstance, setAuthToken } from '@/services/apiClient'

const REFRESH_KEY = 'ogenna_rt'

type UserRole = 'OWNER' | 'ADMIN' | 'CONTENT_EDITOR' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

function decodeJwtPayload(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1])) as {
    sub: string
    email: string
    role: UserRole
  }
  return { id: payload.sub, email: payload.email, role: payload.role }
}

function storedRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

function saveRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

function clearStoredTokens(): void {
  localStorage.removeItem(REFRESH_KEY)
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response) {
    return (err.response.data as { message?: string })?.message ?? 'Request failed'
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  const applyTokenResponse = useCallback((data: TokenResponse) => {
    setAccessToken(data.accessToken)
    setAuthToken(data.accessToken)
    saveRefreshToken(data.refreshToken)
    setUser(decodeJwtPayload(data.accessToken))
  }, [])

  // Restore session on mount using stored refresh token
  useEffect(() => {
    const rt = storedRefreshToken()
    if (!rt) {
      setIsLoading(false)
      return
    }

    axiosInstance
      .post<TokenResponse>('/auth/refresh', { refreshToken: rt })
      .then((res) => applyTokenResponse(res.data))
      .catch(() => clearStoredTokens())
      .finally(() => setIsLoading(false))
  }, [applyTokenResponse])

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      axiosInstance
        .post<TokenResponse>('/auth/login', { email, password })
        .then((res) => res.data),
    onSuccess: (data) => {
      applyTokenResponse(data)
      router.push('/admin/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const rt = storedRefreshToken()
      if (rt) {
        await axiosInstance
          .post('/auth/logout', { refreshToken: rt })
          .catch(() => {})
      }
    },
    onSettled: () => {
      setUser(null)
      setAccessToken(null)
      setAuthToken(null)
      clearStoredTokens()
      queryClient.clear()
      router.push('/admin/login')
    },
  })

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await loginMutation.mutateAsync({ email, password })
      } catch (err) {
        throw new Error(extractMessage(err))
      }
    },
    [loginMutation],
  )

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
