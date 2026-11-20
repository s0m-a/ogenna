'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { PiXLight, PiMinusLight, PiPlusLight, PiTrashLight } from 'react-icons/pi'
import { useCart, useCartMutations } from '@/hooks/useCart'
import { useCartDrawer } from './CartDrawerProvider'
import { CartUpsell } from './CartUpsell'
import type { CartLineItem } from '@/types/cart'

const priceFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function formatCents(cents: number) {
  return priceFormatter.format(cents / 100)
}

/* ── Layout ─────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(44, 31, 20, 0.45);
  z-index: 1000;
  animation: ${fadeIn} 180ms ease-out;
`

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(440px, 100%);
  background: ${({ theme }) => theme.colors.background};
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${slideIn} 260ms cubic-bezier(0.32, 0.72, 0, 1);
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const CloseBtn = styled.button`
  display: inline-flex;
  padding: 0.5rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
`

const Empty = styled.div`
  padding: 4rem 1.5rem;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    display: inline-block;
    margin-top: 1rem;
    color: ${({ theme }) => theme.colors.terracotta};
    text-decoration: underline;
  }
`

const Items = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const Item = styled.li`
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Thumb = styled.div`
  position: relative;
  aspect-ratio: 2 / 3;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`

const ItemName = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  line-height: ${({ theme }) => theme.lineHeights.snug};

  &:hover { color: ${({ theme }) => theme.colors.terracotta}; }
`

const ItemMeta = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const UnitPrice = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const QtyRow = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 0.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  width: fit-content;
`

const QtyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  cursor: pointer;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const QtyVal = styled.span`
  min-width: 28px;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Side = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
`

const LineTotal = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const RemoveBtn = styled.button`
  display: inline-flex;
  padding: 0.35rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover { color: ${({ theme }) => theme.colors.danger}; }
`

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SubtotalRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const Note = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`

const ViewCart = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textNav};
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const CheckoutBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1rem;
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.terracottaDark}; }
`

/* ── Component ──────────────────────────────────────────── */

function LineItem({ item, onClose }: { item: CartLineItem; onClose: () => void }) {
  const { update, remove } = useCartMutations()
  const href = `/shop/product/${item.variant.product.slug}`
  const { minOrderQty, qtyIncrement } = item.variant.product

  const dec = () => {
    const next = item.quantity - qtyIncrement
    if (next < minOrderQty) return
    update.mutate({ itemId: item.id, quantity: next })
  }
  const inc = () => update.mutate({ itemId: item.id, quantity: item.quantity + qtyIncrement })
  const del = () => remove.mutate(item.id)

  return (
    <Item>
      <Thumb>
        {item.variant.coverImage?.url && (
          <Image
            src={item.variant.coverImage.url}
            alt={item.variant.coverImage.altText ?? item.variant.product.name}
            fill
            sizes="80px"
            style={{ objectFit: 'cover' }}
          />
        )}
      </Thumb>

      <Info>
        <ItemName href={href} onClick={onClose}>
          {item.variant.product.name}
        </ItemName>
        {item.variant.name && item.variant.name !== item.variant.product.name && (
          <ItemMeta>{item.variant.name}</ItemMeta>
        )}
        <UnitPrice>{formatCents(item.unitPriceAmount)}</UnitPrice>
        <QtyRow>
          <QtyBtn type="button" onClick={dec} disabled={item.quantity <= minOrderQty} aria-label="Decrease quantity">
            <PiMinusLight size={14} />
          </QtyBtn>
          <QtyVal>{item.quantity}</QtyVal>
          <QtyBtn type="button" onClick={inc} aria-label="Increase quantity">
            <PiPlusLight size={14} />
          </QtyBtn>
        </QtyRow>
      </Info>

      <Side>
        <LineTotal>{formatCents(item.lineTotalAmount)}</LineTotal>
        <RemoveBtn type="button" onClick={del} aria-label={`Remove ${item.variant.product.name}`}>
          <PiTrashLight size={16} />
        </RemoveBtn>
      </Side>
    </Item>
  )
}

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer()
  const { data: cart } = useCart()

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  if (!isOpen) return null

  const items = cart?.items ?? []
  const count = cart?.itemCount ?? 0

  return (
    <>
      <Overlay onClick={close} aria-hidden />
      <Panel role="dialog" aria-modal="true" aria-label="Shopping cart">
        <Header>
          <Title>Cart ({count})</Title>
          <CloseBtn type="button" onClick={close} aria-label="Close cart">
            <PiXLight size={20} />
          </CloseBtn>
        </Header>

        <Body>
          {items.length === 0 ? (
            <Empty>
              Your cart is empty.
              <br />
              <Link href="/shop" onClick={close}>Continue shopping</Link>
            </Empty>
          ) : (
            <>
              <Items>
                {items.map((item) => (
                  <LineItem key={item.id} item={item} onClose={close} />
                ))}
              </Items>
              <CartUpsell />
            </>
          )}
        </Body>

        {items.length > 0 && (
          <Footer>
            <SubtotalRow>
              <span>Subtotal</span>
              <span>{formatCents(cart?.subtotalAmount ?? 0)}</span>
            </SubtotalRow>
            <Note>Tax included. Shipping calculated at checkout.</Note>
            <Actions>
              <ViewCart href="/cart" onClick={close}>View cart</ViewCart>
              <CheckoutBtn href="/checkout" onClick={close}>Checkout</CheckoutBtn>
            </Actions>
          </Footer>
        )}
      </Panel>
    </>
  )
}
