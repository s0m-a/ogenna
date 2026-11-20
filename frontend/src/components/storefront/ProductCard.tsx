'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'
import { PiImageBrokenLight, PiShoppingBagLight } from 'react-icons/pi'
import { useCartMutations } from '@/hooks/useCart'
import { useCartDrawer } from './CartDrawerProvider'
import type { ProductListItem } from '@/types/product'

type BadgeVariant = 'default' | 'soldOut' | 'sale'

interface ProductCardProps {
  product: ProductListItem
  // Optional badge e.g. "OEKOTEX 100" / "SOLD OUT" / "-27%"
  badge?: string
  badgeVariant?: BadgeVariant
  /** Show secondary meta (fabric type / category) under the name. */
  showMeta?: boolean
}

/* ── Layout ──────────────────────────────────────────────── */

const Card = styled.article`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const Media = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 2 / 3;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

const MediaImage = styled(Image)`
  object-fit: cover;
  object-position: center;
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${Media}:hover & { transform: scale(1.03); }
`

const HoverImage = styled(Image)`
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.base};

  ${Media}:hover & { opacity: 1; }
`

const PlaceholderIcon = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.border};
`

const Badge = styled.span<{ $variant: BadgeVariant }>`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: ${({ theme }) => theme.radii.sm};

  background: ${({ theme, $variant }) =>
    $variant === 'soldOut'
      ? theme.colors.sage
      : $variant === 'sale'
        ? theme.colors.terracotta
        : theme.colors.primary100};
  color: ${({ theme, $variant }) =>
    $variant === 'default'
      ? theme.colors.primary500
      : theme.colors.textInverse};
`

const Info = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0 0;
`

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Name = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  line-height: ${({ theme }) => theme.lineHeights.snug};

  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const PriceRow = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SalePrice = styled.span`
  color: ${({ theme }) => theme.colors.terracotta};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

const WasPrice = styled.span`
  text-decoration: line-through;
  opacity: 0.65;
`

const Meta = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.75;
`

const CartButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.clayDark}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

/* ── Price formatter ─────────────────────────────────────── */

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

// Discount uses the best-case variant (priceMin ↔ salePriceMin) so the badge
// matches the strikethrough pairing the shopper sees.
function discountPercent(list?: number, sale?: number): number | null {
  if (list == null || sale == null || sale >= list || list <= 0) return null
  return Math.round(((list - sale) / list) * 100)
}

/* ── Quick-add button ────────────────────────────────────── */

function QuickAddButton({ product }: { product: ProductListItem }) {
  const { add } = useCartMutations()
  const { open } = useCartDrawer()
  const disabled = !product.defaultVariantId || add.isPending

  return (
    <CartButton
      type="button"
      aria-label={`Add ${product.name} to cart`}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        if (!product.defaultVariantId) return
        add.mutate(
          { variantId: product.defaultVariantId, quantity: 1 },
          { onSuccess: open },
        )
      }}
    >
      <PiShoppingBagLight size={16} />
    </CartButton>
  )
}

/* ── Component ───────────────────────────────────────────── */

export function ProductCard({
  product,
  badge,
  badgeVariant = 'default',
  showMeta = false,
}: ProductCardProps) {
  const href = `/shop/product/${product.slug}`
  const meta = showMeta
    ? [product.fabricType, product.category?.name].filter(Boolean).join(' · ')
    : ''

  const hasSale =
    product.salePriceMin != null &&
    product.priceMin != null &&
    product.salePriceMin < product.priceMin

  const discount = discountPercent(product.priceMin, product.salePriceMin)
  const resolvedBadge = badge ?? (discount ? `-${discount}%` : undefined)
  const resolvedBadgeVariant: BadgeVariant = badge
    ? badgeVariant
    : discount
      ? 'sale'
      : badgeVariant

  return (
    <Card>
      <Media href={href} aria-label={product.name}>
        {product.coverImage?.url ? (
          <>
            <MediaImage
              src={product.coverImage.url}
              alt={product.coverImage.altText ?? product.name}
              fill
              sizes="280px"
            />
            {product.hoverImage?.url && (
              <HoverImage
                src={product.hoverImage.url}
                alt=""
                fill
                sizes="280px"
                aria-hidden
              />
            )}
          </>
        ) : (
          <PlaceholderIcon aria-hidden>
            <PiImageBrokenLight size={32} />
          </PlaceholderIcon>
        )}
        {resolvedBadge && <Badge $variant={resolvedBadgeVariant}>{resolvedBadge}</Badge>}
      </Media>

      <Info>
        <Text>
          <Name href={href}>{product.name}</Name>
          {meta && <Meta>{meta}</Meta>}
          <PriceRow>
            {hasSale ? (
              <>
                <SalePrice>{formatPrice(product.salePriceMin, product.salePriceMax)}</SalePrice>
                <WasPrice>{formatPrice(product.priceMin, product.priceMax)}</WasPrice>
              </>
            ) : (
              <span>{formatPrice(product.priceMin, product.priceMax)}</span>
            )}
          </PriceRow>
        </Text>
        <QuickAddButton product={product} />
      </Info>
    </Card>
  )
}
