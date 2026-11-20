'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'
import { PiShoppingBagLight } from 'react-icons/pi'
import { usePublicProducts } from '@/hooks/useProducts'
import { useCart, useCartMutations } from '@/hooks/useCart'
import type { ProductListItem } from '@/types/product'

const Wrap = styled.section`
  padding: 1.5rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Heading = styled.h3`
  margin: 0 0 1rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`

const Tile = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Media = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
`

const Name = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  line-height: ${({ theme }) => theme.lineHeights.snug};

  &:hover { color: ${({ theme }) => theme.colors.terracotta}; }
`

const Price = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  margin-top: 0.25rem;
  border: 1px solid ${({ theme }) => theme.colors.clay};
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.clay};
    color: ${({ theme }) => theme.colors.textInverse};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const priceFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function formatPrice(min?: number, max?: number) {
  if (min == null) return '—'
  if (max == null || max === min) return priceFormatter.format(min)
  return `${priceFormatter.format(min)} – ${priceFormatter.format(max)}`
}

export function CartUpsell() {
  const { data: cart } = useCart()
  const { add } = useCartMutations()
  const { data } = usePublicProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' })

  const inCartVariantIds = new Set((cart?.items ?? []).map((i) => i.variantId))
  const candidates: ProductListItem[] = (data?.data ?? [])
    .filter((p) => p.defaultVariantId && !inCartVariantIds.has(p.defaultVariantId))
    .slice(0, 4)

  if (candidates.length === 0) return null

  return (
    <Wrap aria-label="Recommended products">
      <Heading>Don&apos;t forget these…</Heading>
      <Grid>
        {candidates.map((p) => {
          const href = `/shop/product/${p.slug}`
          const price = formatPrice(p.salePriceMin ?? p.priceMin, p.salePriceMax ?? p.priceMax)
          return (
            <Tile key={p.id}>
              <Media href={href} aria-label={p.name}>
                {p.coverImage?.url && (
                  <Image
                    src={p.coverImage.url}
                    alt={p.coverImage.altText ?? p.name}
                    fill
                    sizes="160px"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </Media>
              <Name href={href}>{p.name}</Name>
              <Price>{price}</Price>
              <AddBtn
                type="button"
                disabled={!p.defaultVariantId || add.isPending}
                onClick={() =>
                  p.defaultVariantId &&
                  add.mutate({ variantId: p.defaultVariantId, quantity: 1 })
                }
              >
                <PiShoppingBagLight size={12} />
                Add to cart
              </AddBtn>
            </Tile>
          )
        })}
      </Grid>
    </Wrap>
  )
}
