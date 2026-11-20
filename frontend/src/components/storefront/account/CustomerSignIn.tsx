'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styled from 'styled-components'
import { PiPackageLight, PiShoppingBagLight, PiLightningLight } from 'react-icons/pi'
import { useAuth } from '@/hooks/useAuth'
import { oauthErrorMessage } from '@/types/customer'
import { GoogleButton } from './GoogleButton'
import { PageHeader, PageTitle, Spinner, CenteredState } from './accountStyles'

/** Same rules as the backend: only same-site relative paths. */
export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/account'
  }
  if (value.startsWith('/auth/') || value.startsWith('/account/login')) return '/account'
  return value
}

const BENEFITS = [
  { icon: PiLightningLight, text: 'Faster checkout; your details are filled in for you' },
  { icon: PiPackageLight, text: 'Track every order and finish unpaid ones in one place' },
  { icon: PiShoppingBagLight, text: 'Your bag follows you across devices' },
]

export function CustomerSignIn() {
  const params = useSearchParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const returnTo = safeReturnTo(params.get('returnTo'))
  const error = oauthErrorMessage(params.get('error'))
  const fromCheckout = returnTo.startsWith('/checkout')

  // Already signed in? Skip straight to where they were going.
  useEffect(() => {
    if (!isLoading && user) router.replace(returnTo)
  }, [isLoading, user, returnTo, router])

  if (isLoading || user) {
    return (
      <CenteredState>
        <Spinner aria-label="Loading" />
      </CenteredState>
    )
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Account</PageTitle>
      </PageHeader>

      <Layout>
        <Card aria-labelledby="signin-heading">
          <Heading id="signin-heading">Sign in or create an account</Heading>
          <Lead>
            {fromCheckout
              ? 'Sign in to check out faster and keep track of this order.'
              : 'One tap with Google, no new password to remember.'}
          </Lead>

          {error && <ErrorBox role="alert">{error}</ErrorBox>}

          <GoogleButton returnTo={returnTo} />

          <Fine>
            New to Ogenna? Continuing with Google creates your account. We only receive your
            name, email address and profile photo.
          </Fine>

          <Divider>
            <span>or</span>
          </Divider>

          <GuestLink href={fromCheckout ? '/checkout' : '/shop'}>
            {fromCheckout ? 'Continue as guest' : 'Keep browsing'}
          </GuestLink>
        </Card>

        <Benefits aria-label="Why create an account">
          <BenefitsTitle>With an account</BenefitsTitle>
          <ul>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={18} aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </Benefits>
      </Layout>
    </>
  )
}

/* ── Styles ─────────────────────────────────────────────── */

const Layout = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 3.5rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3.5rem;
  }
`

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2.5rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.75rem 1.25rem;
  }
`

const Heading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Lead = styled.p`
  margin: -0.5rem 0 0.25rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`

const ErrorBox = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  border: 1px solid ${({ theme }) => theme.colors.danger}33;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.snug};
`

const Fine = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.12em;
  text-transform: uppercase;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const GuestLink = styled(Link)`
  display: inline-flex;
  justify-content: center;
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const Benefits = styled.aside`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.sand};
  border-radius: ${({ theme }) => theme.radii.lg};

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  li {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: ${({ theme }) => theme.lineHeights.snug};
  }

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.terracotta};
  }
`

const BenefitsTitle = styled.h3`
  margin: 0 0 1.25rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`
