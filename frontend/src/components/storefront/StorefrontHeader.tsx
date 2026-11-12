'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styled from 'styled-components'
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { MegaMenu } from './MegaMenu'
import { MobileNav } from './MobileNav'
import { useCart } from '@/hooks/useCart'
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

const Bar = styled.header`
  position: relative;
  background: ${({ theme }) => theme.colors.background};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingX};
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 1rem ${({ theme }) => theme.layout.pagePaddingXMobile};
    grid-template-columns: auto 1fr auto;
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
`

const BrandWrap = styled.div`
  display: flex;
  justify-content: center;
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  line-height: 1;
`

const LogoImg = styled(Image)`
  height: 56px;
  width: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 44px;
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
`

const iconButtonStyles = `
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
`

const IconButton = styled.button`
  ${iconButtonStyles}
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const IconLink = styled(Link)`
  ${iconButtonStyles}
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
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
      <ShoppingBag size={19} strokeWidth={1.5} />
      <Badge aria-hidden>{count}</Badge>
    </IconButton>
  )
}

export function StorefrontHeader() {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Bar
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
          <Menu size={20} strokeWidth={1.75} />
        </Hamburger>

        <BrandWrap>
          <Brand href="/" aria-label="Ogenna — home">
            <LogoImg
              src="/logo/ogenna-logo.svg"
              alt="Ogenna Fabrics"
              width={704}
              height={250}
              priority
            />
          </Brand>
        </BrandWrap>

        <Actions>
          <IconLink href="/wishlist" aria-label="Wishlist">
            <Heart size={19} strokeWidth={1.5} />
          </IconLink>
          <IconButton aria-label="Search">
            <Search size={19} strokeWidth={1.5} />
          </IconButton>
          <CartToggle />

          <IconLink href="/account" aria-label="Account">
            <User size={19} strokeWidth={1.5} />
          </IconLink>
        </Actions>
      </Inner>

      {megaOpen && <MegaMenu onNavigate={() => setMegaOpen(false)} />}

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={NAV.map(({ href, label }) => ({ href, label }))}
      />
    </Bar>
  )
}
