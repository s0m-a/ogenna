'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { safeReturnTo } from './CustomerSignIn'
import { CenteredState, Spinner } from './accountStyles'

/**
 * Landing page after Google. The backend puts either a one-time token or an
 * error code in the URL fragment (fragments never reach any server or log).
 */
export function OAuthCallback() {
  const router = useRouter()
  const { completeOAuthSignIn } = useAuth()
  // The token rotates on first use; a second attempt (e.g. React Strict Mode
  // re-running effects) would fail, so redeem exactly once.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const fragment = new URLSearchParams(window.location.hash.slice(1))
    // Drop the token from the address bar and history right away.
    window.history.replaceState(null, '', window.location.pathname)

    const token = fragment.get('token')
    const error = fragment.get('error')
    const returnTo = safeReturnTo(fragment.get('returnTo'))

    const toSignIn = (code: string) =>
      router.replace(
        `/account/login?${new URLSearchParams({ error: code, returnTo }).toString()}`,
      )

    if (!token) {
      toSignIn(error ?? 'session_failed')
      return
    }

    completeOAuthSignIn(token)
      .then(() => router.replace(returnTo))
      .catch(() => toSignIn('session_failed'))
  }, [completeOAuthSignIn, router])

  return (
    <CenteredState role="status" aria-live="polite">
      <Spinner aria-hidden />
      <p>Signing you in…</p>
    </CenteredState>
  )
}
