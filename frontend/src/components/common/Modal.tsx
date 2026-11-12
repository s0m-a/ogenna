'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { X } from 'lucide-react'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(44, 31, 20, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
`

const Dialog = styled.div<{ $size: 'sm' | 'md' | 'lg' | 'xl' }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 2rem);
  max-width: ${({ $size }) =>
    $size === 'sm' ? '420px'
      : $size === 'md' ? '640px'
      : $size === 'lg' ? '880px'
      : '1100px'};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Close = styled.button`
  display: inline-flex;
  padding: 0.375rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Body = styled.div`
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: 0 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg};
`

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Modal({ open, onClose, title, size = 'md', footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <Backdrop onMouseDown={onClose} role="dialog" aria-modal aria-label={title}>
      <Dialog $size={size} onMouseDown={(e) => e.stopPropagation()}>
        {title && (
          <Header>
            <Title>{title}</Title>
            <Close onClick={onClose} aria-label="Close dialog">
              <X size={16} />
            </Close>
          </Header>
        )}
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Backdrop>,
    document.body,
  )
}
