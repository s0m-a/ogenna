'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE, axiosInstance, setAuthToken } from '@/services/apiClient'
import { clearCartToken, getCartToken } from '@/lib/cartToken'

const REFRESH_KEY = 'ogenna_rt'
/** Refresh this long before the access token expires. */
const REFRESH_LEAD_MS = 60_000

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'CONTENT_EDITOR'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'CUSTOMER'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  /** True for store staff (anyone allowed into /admin). */
  isStaff: boolean
  /** Staff email + password sign-in. */
  login: (email: string, password: string) => Promise<void>
  /** Leaves the site for Google; comes back through /auth/callback. */
  startGoogleSignIn: (returnTo?: string) => void
  /** Redeems the one-time token handed to /auth/callback. */
  completeOAuthSignIn: (refreshToken: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

interface AccessClaims {
  sub: string
  email: string
  role: UserRole
  exp?: number
}

function decodeJwtPayload(token: string): AccessClaims {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64)) as AccessClaims
}

function storedRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function saveRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_KEY, token)
  } catch {
    /* storage unavailable — session lasts until the tab closes */
  }
}

function clearStoredTokens(): void {
  try {
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* ignore */
  }
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response) {
    return (err.response.data as { message?: string })?.message ?? 'Request failed'
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}

export function isStaffRole(role: UserRole | undefined): boolean {
  return Boolean(role) && role !== 'CUSTOMER'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refresh tokens rotate, so concurrent refreshes must share one request.
  const inflightRefresh = useRef<Promise<string | null> | null>(null)

  const clearSession = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    setUser(null)
    setAccessToken(null)
    setAuthToken(null)
    clearStoredTokens()
  }, [])

  const refreshSession = useCallback((): Promise<string | null> => {
    if (inflightRefresh.current) return inflightRefresh.current
    const rt = storedRefreshToken()
    if (!rt) return Promise.resolve(null)

    inflightRefresh.current = axiosInstance
      .post<TokenResponse>('/auth/refresh', { refreshToken: rt })
      .then((res) => {
        applyRef.current(res.data)
        return res.data.accessToken
      })
      .catch(() => {
        clearSession()
        return null
      })
      .finally(() => {
        inflightRefresh.current = null
      })
    return inflightRefresh.current
  }, [clearSession])

  const applyTokenResponse = useCallback(
    (data: TokenResponse) => {
      const claims = decodeJwtPayload(data.accessToken)
      setAccessToken(data.accessToken)
      setAuthToken(data.accessToken)
      saveRefreshToken(data.refreshToken)
      setUser({ id: claims.sub, email: claims.email, role: claims.role })

      // Renew quietly before expiry: the cart treats an expired token as a
      // guest, so waiting for a 401 would silently swap the customer's cart.
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      if (claims.exp) {
        const delay = Math.max(claims.exp * 1000 - Date.now() - REFRESH_LEAD_MS, 5_000)
        refreshTimer.current = setTimeout(() => void refreshSession(), delay)
      }
    },
    [refreshSession],
  )

  // refreshSession and applyTokenResponse reference each other.
  const applyRef = useRef(applyTokenResponse)
  applyRef.current = applyTokenResponse

  // Restore session on mount using the stored refresh token
  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false))
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [refreshSession])

  // Safety net: on a 401 from a protected endpoint, refresh once and retry.
  useEffect(() => {
    const id = axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
      const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
      const isAuthCall = config?.url?.startsWith('/auth/')
      if (error.response?.status !== 401 || !config || config._retried || isAuthCall) {
        throw error
      }
      const token = await refreshSession()
      if (!token) throw error
      config._retried = true
      config.headers.set('Authorization', `Bearer ${token}`)
      return axiosInstance(config)
    })
    return () => axiosInstance.interceptors.response.eject(id)
  }, [refreshSession])

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

  const startGoogleSignIn = useCallback((returnTo?: string) => {
    const params = returnTo ? `?${new URLSearchParams({ returnTo }).toString()}` : ''
    window.location.assign(`${API_BASE}/auth/google${params}`)
  }, [])

  const completeOAuthSignIn = useCallback(
    async (refreshToken: string) => {
      // Let the on-mount restore of any older session finish first, so it
      // can't land afterwards and overwrite the account just signed in to.
      if (inflightRefresh.current) await inflightRefresh.current
      // /auth/refresh rotates the token, so the one from the URL dies here.
      const res = await axiosInstance
        .post<TokenResponse>('/auth/refresh', { refreshToken })
        .catch((err) => {
          throw new Error(extractMessage(err))
        })
      applyTokenResponse(res.data)

      // Bring along anything added to the bag before signing in.
      const guestToken = getCartToken()
      if (guestToken) {
        await axiosInstance
          .post('/cart/merge', {}, { headers: { 'x-cart-token': guestToken } })
          .catch(() => {})
        clearCartToken()
      }
      await queryClient.invalidateQueries()
    },
    [applyTokenResponse, queryClient],
  )

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const rt = storedRefreshToken()
      if (rt) {
        await axiosInstance.post('/auth/logout', { refreshToken: rt }).catch(() => {})
      }
    },
    onSettled: () => {
      const wasStaff = isStaffRole(user?.role)
      clearSession()
      clearCartToken()
      queryClient.clear()
      router.push(wasStaff ? '/admin/login' : '/')
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isStaff: isStaffRole(user?.role),
        login,
        startGoogleSignIn,
        completeOAuthSignIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
