'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { ChevronRight, X } from 'lucide-react'
import { usePublicCategories } from '@/hooks/useCategories'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  items: Array<{ href: string; label: string }>
}

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(44, 31, 20, 0.45);
  z-index: 70;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity ${({ theme }) => theme.transitions.base};
`

const Drawer = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(85%, 360px);
  background: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 71;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform ${({ theme }) => theme.transitions.base};
  display: flex;
  flex-direction: column;
`

const DrawerHead = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const CloseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const DrawerBody = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
`

const TopItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
  text-decoration: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const SectionLabel = styled.p`
  padding: 1rem 1.25rem 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CategoryItem = styled(Link)`
  display: block;
  padding: 0.5rem 1.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

export function MobileNav({ open, onClose, items }: MobileNavProps) {
  const { data: categories = [] } = usePublicCategories()
  const topLevel = categories.filter((c) => !c.parentId)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <>
      <Backdrop $open={open} onClick={onClose} aria-hidden />
      <Drawer $open={open} aria-label="Mobile navigation" aria-hidden={!open}>
        <DrawerHead>
          <CloseBtn onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </CloseBtn>
        </DrawerHead>

        <DrawerBody>
          {items.map((item) => (
            <TopItem key={item.href} href={item.href} onClick={onClose}>
              {item.label}
              <ChevronRight size={14} />
            </TopItem>
          ))}

          {topLevel.length > 0 && (
            <>
              <SectionLabel>Shop by fabric</SectionLabel>
              {topLevel.map((c) => (
                <CategoryItem
                  key={c.id}
                  href={`/shop/${c.slug}`}
                  onClick={onClose}
                >
                  {c.name}
                </CategoryItem>
              ))}
            </>
          )}
        </DrawerBody>
      </Drawer>
    </>
  )
}
