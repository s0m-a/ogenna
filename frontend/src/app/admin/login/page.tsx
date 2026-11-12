'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styled, { keyframes } from 'styled-components'
import { useAuth } from '@/hooks/useAuth'
import type { Metadata } from 'next'

/* ── Component ─────────────────────────────────────────────── */

export default function LoginPage() {
  const { login, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/admin/dashboard')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />
      </LoadingScreen>
    )
  }

  if (user) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  return (
    <PageWrapper>
      <Card>
        <BrandArea>
          <Logo
            src="/logo/ogenna-logo.svg"
            alt="Ogenna Fabrics"
            width={704}
            height={250}
            priority
          />
        </BrandArea>

        <Divider />

        <Heading>Sign in</Heading>

        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>

          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>

          {error && <ErrorBox role="alert">{error}</ErrorBox>}

          <SubmitButton type="submit" disabled={!canSubmit} $loading={submitting}>
            {submitting && <Spinner />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </SubmitButton>
        </Form>
      </Card>
    </PageWrapper>
  )
}
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* ── Layout ────────────────────────────────────────────────── */

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 2rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 3rem 2.5rem 2.5rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${fadeIn} 320ms ease both;
`;

/* ── Brand ─────────────────────────────────────────────────── */

const BrandArea = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const Logo = styled(Image)`
  height: 64px;
  width: auto;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.75rem;
`;

/* ── Form heading ──────────────────────────────────────────── */

const Heading = styled.h1`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 1.5rem;
`;

/* ── Form elements ─────────────────────────────────────────── */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  letter-spacing: 0.01em;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6875rem 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.5;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`;

/* ── Error ─────────────────────────────────────────────────── */

const ErrorBox = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerBg};
  border: 1px solid ${({ theme }) => theme.colors.danger}33;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 0.625rem 0.875rem;
  line-height: 1.5;
`;

/* ── Submit button ─────────────────────────────────────────── */

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 0.8125rem 1.25rem;
  margin-top: 0.375rem;
  background: ${({ theme }) => theme.colors.primary400};
  color: ${({ theme }) => theme.colors.textInverse};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.01em;
  cursor: ${({ $loading }) => ($loading ? "default" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary500};
  }

  &:active:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary600};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(253, 246, 240, 0.4);
  border-top-color: ${({ theme }) => theme.colors.textInverse};
  border-radius: 50%;
  animation: ${spin} 600ms linear infinite;
  flex-shrink: 0;
`;

/* ── Full-page loading screen ──────────────────────────────── */

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const LoadingSpinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary400};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`;
