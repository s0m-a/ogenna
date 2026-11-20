'use client'

import styled, { keyframes } from 'styled-components'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

interface GoogleButtonProps {
  /** Where to land after signing in (a same-site path). */
  returnTo?: string
  label?: string
  className?: string
}

/**
 * "Continue with Google", styled per Google's sign-in branding guidance
 * (white surface, full-colour G mark, neutral text). Sign-in and sign-up are
 * the same action: a first-time Google login creates the account.
 */
export function GoogleButton({
  returnTo,
  label = 'Continue with Google',
  className,
}: GoogleButtonProps) {
  const { startGoogleSignIn } = useAuth()
  const [leaving, setLeaving] = useState(false)

  // Pressing Back on Google's page restores this page from the bfcache with
  // the spinner still showing — reset it.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setLeaving(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  return (
    <Button
      type="button"
      className={className}
      disabled={leaving}
      aria-busy={leaving}
      onClick={() => {
        setLeaving(true)
        startGoogleSignIn(returnTo)
      }}
    >
      {leaving ? <Spinner aria-hidden /> : <GoogleMark />}
      <span>{leaving ? 'Opening Google…' : label}</span>
    </Button>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Spinner = styled.span`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  color: #1f1f1f;
  border: 1px solid #747775;
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: #f8f9fa;
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
  &:active:not(:disabled) { background: #f1f3f4; }
  &:disabled { cursor: wait; opacity: 0.8; }
`
