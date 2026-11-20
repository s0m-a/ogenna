'use client'

import React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import styled, { css } from 'styled-components'
import { PiPulseLight, PiFolderLight, PiGiftLight, PiHouseLight, PiImageLight, PiSquaresFourLight, PiStackLight, PiListLight, PiPackageLight, PiPercentLight, PiGearSixLight, PiShareNetworkLight, PiShoppingCartLight, PiStarLight, PiTagLight, PiFileTextLight, PiUserCheckLight, PiUsersLight, PiXLight } from 'react-icons/pi'
import type { IconType } from 'react-icons'

interface NavItem {
  href: string
  label: string
  Icon: IconType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', Icon: PiSquaresFourLight },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', Icon: PiTagLight },
      { href: '/admin/categories', label: 'Categories', Icon: PiFolderLight },
      { href: '/admin/collections', label: 'Collections', Icon: PiStackLight },
      { href: '/admin/inventory', label: 'Inventory', Icon: PiPackageLight },
      { href: '/admin/media', label: 'Media Library', Icon: PiImageLight },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { href: '/admin/storefront/homepage', label: 'Homepage Editor', Icon: PiHouseLight },
      { href: '/admin/storefront/pages', label: 'Pages & Content', Icon: PiFileTextLight },
      { href: '/admin/storefront/navigation', label: 'Navigation Menus', Icon: PiListLight },
      { href: '/admin/storefront/reviews', label: 'Reviews', Icon: PiStarLight },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/discounts', label: 'Discounts & Coupons', Icon: PiPercentLight },
      { href: '/admin/referrals', label: 'Referrals', Icon: PiShareNetworkLight },
      { href: '/admin/gift-cards', label: 'Gift Cards', Icon: PiGiftLight },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', Icon: PiShoppingCartLight },
      { href: '/admin/customers', label: 'Customers', Icon: PiUsersLight },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/settings', label: 'Store Settings', Icon: PiGearSixLight },
      { href: '/admin/users', label: 'Users & Permissions', Icon: PiUserCheckLight },
      { href: '/admin/activity', label: 'Activity Log', Icon: PiPulseLight },
    ],
  },
]

/* ── Styled components ────────────────────────────────────── */

const Overlay = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(44, 31, 20, 0.35);
    z-index: 40;
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: opacity ${({ theme }) => theme.transitions.base};
  }
`

const SidebarRoot = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
    transition: transform ${({ theme }) => theme.transitions.base};
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.125rem 1.25rem 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
`

const LogoImg = styled(NextImage)`
  height: 36px;
  width: auto;
`

const CloseButton = styled.button`
  display: none;
  padding: 0.375rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const Nav = styled.nav`
  flex: 1;
  padding: 0.75rem 0 1.5rem;
  overflow-y: auto;
`

const Group = styled.div`
  margin-bottom: 0.25rem;
`

const GroupLabel = styled.p`
  padding: 0.625rem 1.25rem 0.25rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.7;
`

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 1.25rem;
  margin: 0.0625rem 0.5rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textNav};
  text-decoration: none;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  svg {
    flex-shrink: 0;
    opacity: 0.7;
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary100};
    color: ${({ theme }) => theme.colors.textPrimary};
    svg { opacity: 1; }
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.primary200};
      color: ${theme.colors.primary600};
      font-weight: ${theme.fontWeights.semibold};
      svg { opacity: 1; }

      &:hover {
        background: ${theme.colors.primary200};
        color: ${theme.colors.primary600};
      }
    `}
`

/* ── Component ─────────────────────────────────────────────── */

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <Overlay $open={isOpen} onClick={onClose} aria-hidden />
      <SidebarRoot $open={isOpen} aria-label="Admin navigation">
        <SidebarTop>
          <BrandLink href="/admin/dashboard" aria-label="Ogenna Admin — dashboard">
            <LogoImg
              src="/logo/ogenna-logo.svg"
              alt="Ogenna Fabrics"
              width={704}
              height={250}
              priority
            />
          </BrandLink>
          <CloseButton onClick={onClose} aria-label="Close navigation">
            <PiXLight size={16} />
          </CloseButton>
        </SidebarTop>

        <Nav>
          {NAV_GROUPS.map((group) => (
            <Group key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <NavLink
                    key={href}
                    href={href}
                    $active={active}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon size={15} />
                    {label}
                  </NavLink>
                )
              })}
            </Group>
          ))}
        </Nav>
      </SidebarRoot>
    </>
  )
}
