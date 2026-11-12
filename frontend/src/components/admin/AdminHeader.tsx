'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import styled, { keyframes } from 'styled-components'
import { Bell, ChevronDown, LogOut, Menu, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/* ── Helpers ───────────────────────────────────────────────── */

function deriveTitleFromPath(path: string): string {
  const segments = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean)
  if (segments.length === 0 || segments[0] === 'dashboard') return 'Dashboard'
  const raw = segments[segments.length - 1]
  return raw
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getInitials(email: string): string {
  const [local] = email.split('@')
  const parts = local.replace(/[._-]/g, ' ').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

/* ── Animations ────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* ── Styled components ────────────────────────────────────── */

const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  height: ${({ theme }) => theme.layout.headerHeight};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  gap: 1rem;
  z-index: 10;
  flex-shrink: 0;
`

const LeftSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 0;
`

const HamburgerButton = styled.button`
  display: none;
  padding: 0.4375rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const PageTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const RightSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`

const Divider = styled.div`
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0 0.5rem;
`

/* ── Icon button ───────────────────────────────────────────── */

const IconBtn = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const NotificationDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary400};
  border: 1.5px solid ${({ theme }) => theme.colors.surface};
`

/* ── User chip ─────────────────────────────────────────────── */

const UserChipWrapper = styled.div`
  position: relative;
`

const UserChip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3125rem 0.625rem 0.3125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const Avatar = styled.span`
  width: 28px;
  height: 28px;
  background: ${({ theme }) => theme.colors.primary200};
  color: ${({ theme }) => theme.colors.primary600};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.03em;
  font-family: ${({ theme }) => theme.fonts.body};
`

const ChipEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`

/* ── Dropdown ──────────────────────────────────────────────── */

const Dropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 216px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 0.375rem;
  z-index: 100;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  animation: ${fadeIn} 140ms ease;
`

const DropdownHeader = styled.div`
  padding: 0.625rem 0.75rem 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
`

const DropdownAvatar = styled.span`
  width: 36px;
  height: 36px;
  background: ${({ theme }) => theme.colors.primary200};
  color: ${({ theme }) => theme.colors.primary600};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.03em;
  font-family: ${({ theme }) => theme.fonts.body};
`

const DropdownMeta = styled.div`
  min-width: 0;
`

const DropdownEmail = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DropdownRole = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
  text-transform: capitalize;
`

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &.danger:hover {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  }
`

const DropdownSep = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0.25rem 0;
`

/* ── Component ─────────────────────────────────────────────── */

interface AdminHeaderProps {
  onMenuToggle: () => void
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const pageTitle = deriveTitleFromPath(pathname)
  const initials = user ? getInitials(user.email) : ''
  const roleLabel = user?.role.toLowerCase().replace(/_/g, ' ') ?? ''

  /* Close dropdown when clicking outside */
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
  }

  const goToSettings = () => {
    setDropdownOpen(false)
    router.push('/admin/settings')
  }

  return (
    <HeaderRoot>
      <LeftSlot>
        <HamburgerButton onClick={onMenuToggle} aria-label="Open navigation">
          <Menu size={18} />
        </HamburgerButton>
        <PageTitle>{pageTitle}</PageTitle>
      </LeftSlot>

      <RightSlot>
        <IconBtn aria-label="Notifications">
          <Bell size={16} strokeWidth={1.75} />
          <NotificationDot aria-hidden />
        </IconBtn>

        <Divider aria-hidden />

        {user && (
          <UserChipWrapper ref={wrapperRef}>
            <UserChip
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <Avatar aria-hidden>{initials}</Avatar>
              <ChipEmail>{user.email}</ChipEmail>
              <ChevronDown size={12} style={{ opacity: 0.55, marginLeft: 2 }} />
            </UserChip>

            <Dropdown $open={dropdownOpen} role="menu">
              <DropdownHeader>
                <DropdownAvatar aria-hidden>{initials}</DropdownAvatar>
                <DropdownMeta>
                  <DropdownEmail title={user.email}>{user.email}</DropdownEmail>
                  <DropdownRole>{roleLabel}</DropdownRole>
                </DropdownMeta>
              </DropdownHeader>

              <DropdownItem role="menuitem" onClick={goToSettings}>
                <Settings size={14} strokeWidth={1.75} />
                Store settings
              </DropdownItem>

              <DropdownSep />

              <DropdownItem className="danger" role="menuitem" onClick={handleLogout}>
                <LogOut size={14} strokeWidth={1.75} />
                Sign out
              </DropdownItem>
            </Dropdown>
          </UserChipWrapper>
        )}
      </RightSlot>
    </HeaderRoot>
  )
}
