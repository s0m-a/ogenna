'use client'

import Link from 'next/link'
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
  margin-bottom: 3.5rem;
`

const Wordmark = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-style: italic;
  font-weight: 400;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary500};
  letter-spacing: -0.01em;
`

const WordmarkSub = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
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
        <Wordmark>ogenna</Wordmark>
        <WordmarkSub>Admin</WordmarkSub>
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
