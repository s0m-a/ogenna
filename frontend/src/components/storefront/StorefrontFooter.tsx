'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'
import {
  FaChevronDown,
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
} from 'react-icons/fa6'

interface NavLink {
  label: string
  href: string
}

const INFORMATION: NavLink[] = [
  { label: 'Search', href: '/search' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Store policies', href: '/policies' },
  { label: 'Wholesale', href: '/wholesale' },
  { label: 'My wishlist', href: '/wishlist' },
  { label: 'Affiliate program', href: '/affiliates' },
  { label: 'Blog', href: '/blog' },
]

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FaFacebookF },
  { label: 'X / Twitter', href: 'https://twitter.com', Icon: FaXTwitter },
  { label: 'Instagram', href: 'https://instagram.com', Icon: FaInstagram },
  { label: 'TikTok', href: 'https://tiktok.com', Icon: FaTiktok },
] as const

const BANNER_IMAGES = [
  { src: '/images/stripeLinen.jpg', alt: 'Stacked striped fabrics.' },
  { src: '/images/linenfabric3.jpg', alt: 'Folded neutral linens.' },
  { src: '/images/quiltedCotton.jpg', alt: 'Patterned quilted cottons.' },
  { src: '/images/cottonFabric.jpg', alt: 'Stack of cream knitted fabrics.' },
]

const CURRENT_YEAR = new Date().getFullYear()

/* ── Layout ──────────────────────────────────────────────── */

const Wrap = styled.footer`
  background: ${({ theme }) => theme.colors.primary150};
  color: ${({ theme }) => theme.colors.textNav};
`

const Banner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const BannerTile = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  background: ${({ theme }) => theme.colors.surfaceMuted};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    aspect-ratio: 1 / 1;
  }
`

const BannerImage = styled(Image)`
  object-fit: cover;
  object-position: center;
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingX} 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingXMobile} 1.5rem;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const ColumnHeading = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
  line-height: 1.2;
`

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const InfoLink = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  text-decoration: none;

  &:hover { color: ${({ theme }) => theme.colors.primary500}; text-decoration: underline; }
`

/* ── Social ─────────────────────────────────────────────── */

const SocialRow = styled.div`
  display: flex;
  gap: 1rem;
`

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.textNav};
  color: ${({ theme }) => theme.colors.textNav};
  transition: background ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.textNav};
    color: ${({ theme }) => theme.colors.primary150};
  }
`

/* ── About ──────────────────────────────────────────────── */

const AboutText = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`

/* ── Newsletter ─────────────────────────────────────────── */

const Pitch = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const EmailInput = styled.input`
  height: 44px;
  padding: 0 0.875rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.textNav};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};

  &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.terracotta};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const SubscribeBtn = styled.button`
  align-self: flex-start;
  padding: 0.875rem 2.25rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clayDark};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.terracotta}; }
`

/* ── Bottom row ─────────────────────────────────────────── */

const Bottom = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 1rem ${({ theme }) => theme.layout.pagePaddingX} 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1rem ${({ theme }) => theme.layout.pagePaddingXMobile} 1.5rem;
    justify-content: center;
    text-align: center;
  }
`

const Selectors = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Selector = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.textNav};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
`

const Copyright = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

/* ── Component ──────────────────────────────────────────── */

export function StorefrontFooter() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: POST to /newsletter when the newsletter API lands.
    setEmail('')
  }

  return (
    <Wrap>
      <Banner>
        {BANNER_IMAGES.map((img) => (
          <BannerTile key={img.src}>
            <BannerImage
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </BannerTile>
        ))}
      </Banner>

      <Inner>
        <Column>
          <ColumnHeading>Information</ColumnHeading>
          <LinkList>
            {INFORMATION.map((item) => (
              <li key={item.href}>
                <InfoLink href={item.href}>{item.label}</InfoLink>
              </li>
            ))}
          </LinkList>
        </Column>

        <Column>
          <ColumnHeading>Social</ColumnHeading>
          <SocialRow>
            {SOCIALS.map(({ label, href, Icon }) => (
              <SocialLink
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon size={16} />
              </SocialLink>
            ))}
          </SocialRow>
        </Column>

        <Column>
          <ColumnHeading>About us</ColumnHeading>
          <AboutText>
            Ogenna is a curated fabric shop for modern makers. We source natural
            fabrics with soft textures, earthy tones, and timeless prints —
            inspiring your next creation and celebrating the beauty of handmade.
          </AboutText>
        </Column>

        <Column>
          <ColumnHeading>Sign up to our emails</ColumnHeading>
          <Pitch>Receive a discount code for 10% off your first order.</Pitch>
          <Form onSubmit={handleSubscribe}>
            <EmailInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              aria-label="Email address"
              required
            />
            <SubscribeBtn type="submit">Subscribe</SubscribeBtn>
          </Form>
        </Column>
      </Inner>

      <Bottom>
        <Selectors>
          <Selector type="button" aria-label="Change currency">
            NGN ₦
            <FaChevronDown size={10} />
          </Selector>
          <Selector type="button" aria-label="Change language">
            English
            <FaChevronDown size={10} />
          </Selector>
        </Selectors>

        <Copyright>© {CURRENT_YEAR} Ogenna. All rights reserved.</Copyright>
      </Bottom>
    </Wrap>
  )
}
