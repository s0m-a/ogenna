'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface CartDrawerCtx {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const Ctx = createContext<CartDrawerCtx | null>(null)

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const value = useMemo<CartDrawerCtx>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCartDrawer(): CartDrawerCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCartDrawer must be used inside <CartDrawerProvider>')
  return ctx
}
