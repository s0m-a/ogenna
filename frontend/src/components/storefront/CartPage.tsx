'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart, useCartMutations } from '@/hooks/useCart'
import { CartUpsell } from './CartUpsell'

const priceFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})
const formatCents = (c: number) => priceFormatter.format(c / 100)

const Wrap = styled.section`
  min-height: 60vh;
`

const Header = styled.header`
  background: ${({ theme }) => theme.colors.clay};
`

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 2.25rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const Body = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 3rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3rem;
  }
`

const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Item = styled.li`
  display: grid;
  grid-template-columns: 120px 1.2fr auto auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 80px 1fr auto;
    gap: 1rem;
  }
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
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  line-height: ${({ theme }) => theme.lineHeights.snug};

  &:hover { color: ${({ theme }) => theme.colors.terracotta}; }
`

const ItemMeta = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Price = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const QtyRow = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`

const QtyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  cursor: pointer;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const QtyVal = styled.span`
  min-width: 32px;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const RemoveBtn = styled.button`
  display: inline-flex;
  padding: 0.5rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover { color: ${({ theme }) => theme.colors.danger}; }
`

const Summary = styled.aside`
  background: ${({ theme }) => theme.colors.primary150};
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: start;
`

const SummaryHead = styled.h2`
  margin: 0 0 0.5rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Total = styled(Row)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Note = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CheckoutBtn = styled.button`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: not-allowed;
  opacity: 0.6;
`

const ContinueLink = styled(Link)`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.terracotta};
  text-decoration: underline;
`

const Empty = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 1rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    display: inline-block;
    margin-top: 1rem;
    color: ${({ theme }) => theme.colors.terracotta};
    text-decoration: underline;
  }
`

export function CartPage() {
  const { data: cart, isLoading } = useCart()
  const { update, remove } = useCartMutations()

  const items = cart?.items ?? []

  return (
    <Wrap>
      <Header>
        <HeaderInner>
          <Title>Cart</Title>
        </HeaderInner>
      </Header>

      <Body>
        {isLoading && items.length === 0 ? (
          <Empty>Loading your cart…</Empty>
        ) : items.length === 0 ? (
          <Empty>
            Your cart is empty.
            <br />
            <Link href="/shop">Continue shopping</Link>
          </Empty>
        ) : (
          <>
            <div>
              <Items>
                {items.map((item) => {
                  const { minOrderQty, qtyIncrement } = item.variant.product
                  return (
                    <Item key={item.id}>
                      <Thumb>
                        {item.variant.coverImage?.url && (
                          <Image
                            src={item.variant.coverImage.url}
                            alt={item.variant.coverImage.altText ?? item.variant.product.name}
                            fill
                            sizes="120px"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </Thumb>
                      <Info>
                        <ItemName href={`/shop/product/${item.variant.product.slug}`}>
                          {item.variant.product.name}
                        </ItemName>
                        {item.variant.name && item.variant.name !== item.variant.product.name && (
                          <ItemMeta>{item.variant.name}</ItemMeta>
                        )}
                      </Info>
                      <Price>{formatCents(item.unitPriceAmount)}</Price>
                      <QtyRow>
                        <QtyBtn
                          type="button"
                          onClick={() =>
                            update.mutate({
                              itemId: item.id,
                              quantity: Math.max(minOrderQty, item.quantity - qtyIncrement),
                            })
                          }
                          disabled={item.quantity <= minOrderQty}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} strokeWidth={1.5} />
                        </QtyBtn>
                        <QtyVal>{item.quantity}</QtyVal>
                        <QtyBtn
                          type="button"
                          onClick={() =>
                            update.mutate({ itemId: item.id, quantity: item.quantity + qtyIncrement })
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </QtyBtn>
                      </QtyRow>
                      <RemoveBtn
                        type="button"
                        onClick={() => remove.mutate(item.id)}
                        aria-label={`Remove ${item.variant.product.name}`}
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </RemoveBtn>
                    </Item>
                  )
                })}
              </Items>
              <CartUpsell />
            </div>

            <Summary>
              <SummaryHead>Order summary</SummaryHead>
              <Row>
                <span>Items ({cart?.itemCount ?? 0})</span>
                <span>{formatCents(cart?.subtotalAmount ?? 0)}</span>
              </Row>
              <Row>
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </Row>
              <Total>
                <span>Subtotal</span>
                <span>{formatCents(cart?.subtotalAmount ?? 0)}</span>
              </Total>
              <Note>Tax included where applicable.</Note>
              <CheckoutBtn type="button" disabled title="Checkout coming soon">
                Checkout coming soon
              </CheckoutBtn>
              <ContinueLink href="/shop">Continue shopping</ContinueLink>
            </Summary>
          </>
        )}
      </Body>
    </Wrap>
  )
}
