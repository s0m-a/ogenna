'use client'

import Link from 'next/link'
import Image from 'next/image'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
`

const Brand = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3.5rem;
`

const Logo = styled(Image)`
  height: 44px;
  width: auto;
`

const Code = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-style: italic;
  font-size: clamp(5rem, 18vw, 9rem);
  font-weight: 400;
  color: ${({ theme }) => theme.colors.primary200};
  line-height: 1;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
  user-select: none;
`

const Heading = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.875rem;
`

const Body = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 360px;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  margin-bottom: 2.5rem;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  padding: 0 1.375rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary400};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background ${({ theme }) => theme.transitions.fast};
  text-decoration: none;

  &:hover { background: ${({ theme }) => theme.colors.primary500}; }
`

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 1.375rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background ${({ theme }) => theme.transitions.fast},
              border-color ${({ theme }) => theme.transitions.fast};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export default function AdminNotFound() {
  return (
    <Page>
      <Brand>
        <Logo
          src="/logo/ogenna-logo.svg"
          alt="Ogenna Fabrics"
          width={704}
          height={250}
          priority
        />
      </Brand>

      <Code aria-hidden>404</Code>

      <Heading>Page not found</Heading>

      <Body>
        The admin page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </Body>

      <Actions>
        <PrimaryLink href="/admin/dashboard">Go to dashboard</PrimaryLink>
        <SecondaryLink href="/admin/products">View products</SecondaryLink>
      </Actions>
    </Page>
  )
}
