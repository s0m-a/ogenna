'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styled, { css } from 'styled-components'
import { PiHeartLight, PiListLight, PiMagnifyingGlassLight, PiShoppingBagLight, PiUserLight } from 'react-icons/pi'
import { MegaMenu } from './MegaMenu'
import { MobileNav } from './MobileNav'
import { SearchPanel } from './SearchPanel'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useCartDrawer } from './CartDrawerProvider'

interface NavItemDef {
  href: string
  label: string
  hasMegaMenu?: boolean
}

const NAV: NavItemDef[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop', hasMegaMenu: true },
  { href: '/sale', label: 'Sale' },
  { href: '/fabric-qualities', label: 'Fabric qualities' },
]

/** Pages whose hero photo runs underneath a transparent header. */
const OVERLAY_PATHS = new Set(['/'])

/** True once the page has scrolled past `threshold` pixels. */
function useScrolledPast(threshold: number) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return scrolled
}

/*
 * Transparent over the hero (light text, light logo). Turns solid white once
 * the page scrolls, or while the pointer or keyboard focus is inside it.
 */
const TRANSPARENT = "[data-transparent='true']:not(:hover):not(:focus-within)"

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  color: ${({ theme }) => theme.colors.textPrimary};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition:
    background-color 300ms ${({ theme }) => theme.motion.easeOut},
    color 300ms ${({ theme }) => theme.motion.easeOut},
    border-color 300ms ${({ theme }) => theme.motion.easeOut},
    box-shadow 300ms ${({ theme }) => theme.motion.easeOut};

  &[data-scrolled='true'] {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  &${TRANSPARENT} {
    color: ${({ theme }) => theme.colors.textInverse};
    background-color: transparent;
    border-bottom-color: ${({ theme }) => theme.colors.hairlineInverse};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  height: ${({ theme }) => theme.layout.storefrontHeaderHeight};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 ${({ theme }) => theme.layout.pagePaddingX};
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.layout.pagePaddingXMobile};
    grid-template-columns: auto 1fr auto;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: ${({ theme }) => theme.layout.storefrontHeaderHeightMobile};
  }
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const NavItem = styled.div`
  position: static;
`

const NavLink = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
  text-decoration: none;
  padding: 0.25rem 0;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover { color: ${({ theme }) => theme.colors.primary500}; }

  ${Bar}${TRANSPARENT} & { color: inherit; }
`

const BrandWrap = styled.div`
  display: flex;
  justify-content: center;
`

const Brand = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  line-height: 0;
`

const logoSize = css`
  height: 56px;
  width: auto;
  transition: opacity 300ms ${({ theme }) => theme.motion.easeOut};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 44px;
  }
`

const LogoDark = styled(Image)`
  ${logoSize}

  ${Bar}${TRANSPARENT} & {
    opacity: 0;
  }
`

const LogoLight = styled(Image)`
  ${logoSize}
  position: absolute;
  inset: 0;
  opacity: 0;

  ${Bar}${TRANSPARENT} & {
    opacity: 1;
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
`

const iconButtonStyles = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const IconButton = styled.button`
  ${iconButtonStyles}
`

const IconLink = styled(Link)`
  ${iconButtonStyles}
`

const Badge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary500};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: 0.625rem;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const Hamburger = styled(IconButton)`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: inline-flex;
  }
`

function CartToggle() {
  const { toggle } = useCartDrawer()
  const { data } = useCart()
  const count = data?.itemCount ?? 0
  return (
    <IconButton onClick={toggle} aria-label={`Cart (${count} ${count === 1 ? 'item' : 'items'})`}>
      <PiShoppingBagLight size={19} />
      <Badge aria-hidden>{count}</Badge>
    </IconButton>
  )
}

export function StorefrontHeader() {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const scrolled = useScrolledPast(8)
  const transparent =
    OVERLAY_PATHS.has(pathname) && !scrolled && !megaOpen && !mobileOpen && !searchOpen

  return (
    <Bar
      data-transparent={transparent}
      data-scrolled={scrolled}
      onMouseLeave={() => setMegaOpen(false)}
    >
      <Inner>
        <Nav>
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              onMouseEnter={() => setMegaOpen(!!item.hasMegaMenu)}
            >
              <NavLink href={item.href}>{item.label}</NavLink>
            </NavItem>
          ))}
        </Nav>

        <Hamburger
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <PiListLight size={20} />
        </Hamburger>

        <BrandWrap>
          <Brand href="/" aria-label="Ogenna — home">
            <LogoDark
              src="/logo/ogenna-logo.svg"
              alt=""
              width={704}
              height={250}
              priority
            />
            <LogoLight
              src="/logo/ogenna-logo-light.svg"
              alt=""
              width={704}
              height={250}
              priority
            />
          </Brand>
        </BrandWrap>

        <Actions>
          <IconLink href="/wishlist" aria-label="Wishlist">
            <PiHeartLight size={19} />
          </IconLink>
          <IconButton
            type="button"
            onClick={() => {
              setMegaOpen(false)
              setSearchOpen(true)
            }}
            aria-label="Search fabrics"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
          >
            <PiMagnifyingGlassLight size={19} />
          </IconButton>
          <CartToggle />

          <AccountLink />
        </Actions>
      </Inner>

      {megaOpen && <MegaMenu onNavigate={() => setMegaOpen(false)} />}

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={NAV.map(({ href, label }) => ({ href, label }))}
      />
    </Bar>
  )
}

/** Account icon: signed-in customers see their initial and go to /account. */
function AccountLink() {
  const { user, isLoading } = useAuth()
  const signedIn = !isLoading && Boolean(user)
  return (
    <IconLink
      href={signedIn ? '/account' : '/account/login'}
      aria-label={signedIn ? 'My account' : 'Sign in or create an account'}
      title={signedIn ? 'My account' : 'Sign in'}
    >
      {signedIn && user ? (
        <Initial aria-hidden>{user.email.charAt(0).toUpperCase()}</Initial>
      ) : (
        <PiUserLight size={19} />
      )}
    </IconLink>
  )
}

const Initial = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textNav};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
