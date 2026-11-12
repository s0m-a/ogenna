'use client'

import Link from 'next/link'
import Image from 'next/image'
import styled from 'styled-components'

/* ── Styled components ────────────────────────────────────── */

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

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  line-height: 1;
  margin-bottom: 3.5rem;
`

const Logo = styled(Image)`
  height: 52px;
  width: auto;
`

const Ornament = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;

  &::before,
  &::after {
    content: '';
    display: block;
    width: 3rem;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const OrnamentDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.clay};
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
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary500};
  margin-bottom: 0.875rem;
`

const Body = styled.p`
  font-family: ${({ theme }) => theme.fonts.nav};
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

const ctaChipStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  min-width: 180px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 120ms ease;
`

const PrimaryCta = styled(Link)`
  ${ctaChipStyles}
  font-family: ${({ theme }) => theme.fonts.nav};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};

  &:hover { background: ${({ theme }) => theme.colors.clayDark}; }
`

const SecondaryCta = styled(Link)`
  ${ctaChipStyles}
  font-family: ${({ theme }) => theme.fonts.nav};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

export default function NotFound() {
  return (
    <Page>
      <Brand href="/" aria-label="Ogenna — home">
        <Wordmark>ogenna</Wordmark>
        <WordmarkSub>fabric shop</WordmarkSub>
      </Brand>

      <Ornament>
        <OrnamentDot />
        <OrnamentDot />
        <OrnamentDot />
      </Ornament>

      <Code aria-hidden>404</Code>

      <Heading>Page not found</Heading>

      <Body>
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </Body>

      <Actions>
        <PrimaryCta href="/">Back to home</PrimaryCta>
        <SecondaryCta href="/shop">Shop fabrics</SecondaryCta>
      </Actions>
    </Page>
  )
}
