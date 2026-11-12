'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import {
  FaChevronDown,
  FaFacebookF,
  FaHeart,
  FaPinterestP,
  FaRegHeart,
  FaTruck,
  FaArrowRotateLeft,
  FaGift,
  FaXTwitter,
} from 'react-icons/fa6'
import { usePublicProductBySlug } from '@/hooks/useProducts'
import { useTrackRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useCart, useCartMutations } from '@/hooks/useCart'
import { useCartDrawer } from './CartDrawerProvider'
import { NewFabricsAdore } from './NewFabricsAdore'
import { YouMayAlsoLike } from './YouMayAlsoLike'
import { RecentlyViewed } from './RecentlyViewed'
import type { Product, ProductVariantDetail } from '@/types/product'

interface ProductDetailProps {
  slug: string
}

const priceFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

/* ── Helpers ─────────────────────────────────────────────── */

function pickDefaultVariant(variants: ProductVariantDetail[]): ProductVariantDetail | null {
  if (!variants.length) return null
  return variants.find((v) => v.isDefault) ?? variants[0]
}

function stockOf(v: ProductVariantDetail | null): number {
  if (!v || !v.inventory) return 0
  return Math.max(0, v.inventory.quantityOnHand - v.inventory.quantityReserved)
}

/* ── Layout ──────────────────────────────────────────────── */

const Wrap = styled.section`
  background: ${({ theme }) => theme.colors.primary150};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 3rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3rem;
  }
`

const StatusText = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 6rem 1rem;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ── Loading skeleton ────────────────────────────────────── */

const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.85; }
`

const SkeletonBlock = styled.div`
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  animation: ${pulse} 1.4s ease-in-out infinite;
`

const SkeletonGallery = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
`

const SkeletonTile = styled(SkeletonBlock)<{ $spanFull?: boolean }>`
  aspect-ratio: ${({ $spanFull }) => ($spanFull ? '2 / 1' : '1 / 1')};
  grid-column: ${({ $spanFull }) => ($spanFull ? '1 / -1' : 'auto')};
  border-radius: 0;
`

const SkeletonDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SkeletonLine = styled(SkeletonBlock)<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
`

const SkeletonRow = styled.div`
  display: flex;
  gap: 0.75rem;
`

function ProductDetailSkeleton() {
  return (
    <Wrap>
      <Inner>
        <SkeletonGallery aria-hidden>
          <SkeletonTile />
          <SkeletonTile />
          <SkeletonTile $spanFull />
        </SkeletonGallery>

        <SkeletonDetails aria-busy aria-live="polite" aria-label="Loading product">
          <SkeletonLine $w="40%" $h="12px" />
          <SkeletonLine $w="80%" $h="32px" />
          <SkeletonLine $w="30%" $h="18px" />
          <SkeletonLine $w="60%" />
          <SkeletonLine $w="95%" />
          <SkeletonLine $w="90%" />
          <SkeletonLine $w="75%" />
          <SkeletonRow>
            <SkeletonLine $w="70%" $h="44px" />
            <SkeletonLine $w="20%" $h="44px" />
          </SkeletonRow>
          <SkeletonLine $w="100%" $h="44px" />
          <SkeletonRow>
            <SkeletonLine $w="33%" $h="56px" />
            <SkeletonLine $w="33%" $h="56px" />
            <SkeletonLine $w="33%" $h="56px" />
          </SkeletonRow>
        </SkeletonDetails>
      </Inner>
    </Wrap>
  )
}

/* ── Gallery ─────────────────────────────────────────────── */

const Gallery = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) =>
    $count === 1 ? '1fr' : '1fr 1fr'};
  gap: 2px;
  align-content: start;
`

/**
 * Tile aspect ratio adapts:
 * - single image → 3:4 portrait (feels like a proper hero)
 * - 2+ images   → 1:1 so the grid stays even
 * - last tile when odd count (≥3) spans both columns
 */
const Tile = styled.div<{ $count: number; $spanFull?: boolean }>`
  position: relative;
  aspect-ratio: ${({ $count, $spanFull }) =>
    $count === 1 ? '3 / 4' : $spanFull ? '2 / 1' : '1 / 1'};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  overflow: hidden;
  grid-column: ${({ $spanFull }) => ($spanFull ? '1 / -1' : 'auto')};
`

const TileImage = styled(Image)`
  object-fit: cover;
  object-position: center;
`

const EmptyState = styled.div`
  aspect-ratio: 3 / 4;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const DiscountBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.05em;
  border-radius: ${({ theme }) => theme.radii.sm};
`

/* ── Details column ──────────────────────────────────────── */

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  text-transform: uppercase;
  letter-spacing: 0.1em;

  a {
    color: inherit;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  .sep {
    opacity: 0.5;
  }
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

/* ── Stock indicator ─────────────────────────────────────── */

const StockWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const StockRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const StockDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const StockBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => theme.colors.primary200};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`

const StockFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $color }) => $color};
  transition: width 240ms ease;
`

/* ── Price ───────────────────────────────────────────────── */

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.heading};
`

const PriceOld = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: line-through;
`

const PriceCurrent = styled.span<{ $onSale: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ $onSale, theme }) =>
    $onSale ? theme.colors.terracotta : theme.colors.textNav};
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0.25rem 0;
`

/* ── Accordion ───────────────────────────────────────────── */

const Section = styled.details`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:first-of-type {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  summary::-webkit-details-marker { display: none; }
`

const Summary = styled.summary`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
  list-style: none;

  svg {
    transition: transform ${({ theme }) => theme.transitions.fast};
  }

  details[open] & svg {
    transform: rotate(180deg);
  }
`

const SummaryBody = styled.div`
  padding: 0 0 1rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.textNav};
  white-space: pre-line;
`

/* ── CTAs ────────────────────────────────────────────────── */

const AddToCartBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 1.75rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clayDark};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.terracotta}; }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`

const QtyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const QtyLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const QtyStepper = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`

const QtyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textNav};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.surfaceMuted}; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`

const QtyVal = styled.span`
  min-width: 40px;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textNav};
`

const InCartNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.colors.primary150};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};

  a {
    color: ${({ theme }) => theme.colors.terracotta};
    text-decoration: underline;
  }

  button {
    background: transparent;
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: pointer;
    font: inherit;
    text-decoration: underline;

    &:hover { color: ${({ theme }) => theme.colors.danger}; }
  }
`

const WishlistBtn = styled.button<{ $saved: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 1.75rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $saved }) =>
    $saved ? theme.colors.terracottaDark : theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.terracottaDark}; }
`

/* ── Perks + share ───────────────────────────────────────── */

const Perks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`

const Perk = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Share = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`

const ShareLabel = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const ShareRow = styled.div`
  display: flex;
  gap: 1.25rem;
  color: ${({ theme }) => theme.colors.textNav};

  a:hover { color: ${({ theme }) => theme.colors.terracotta}; }
`



export function ProductDetail({ slug }: ProductDetailProps) {
  const { data: product, isLoading, isError } = usePublicProductBySlug(slug)
  const [wishlisted, setWishlisted] = useState(false)

  if (isLoading) return <ProductDetailSkeleton />
  if (isError || !product) return <StatusText>Product not found.</StatusText>

  return <ProductDetailView product={product} wishlisted={wishlisted} setWishlisted={setWishlisted} />
}

function ProductDetailView({
  product,
  wishlisted,
  setWishlisted,
}: {
  product: Product
  wishlisted: boolean
  setWishlisted: (v: boolean) => void
}) {
  const { data: cart } = useCart()
  const { add, update, remove } = useCartMutations()
  const { open: openCart } = useCartDrawer()
  const defaultVariant = pickDefaultVariant(product.variants)
  const [qty, setQty] = useState(product.minOrderQty)

  const cartLine = cart?.items.find((i) => i.variantId === defaultVariant?.id) ?? null
  const price = defaultVariant ? defaultVariant.priceAmount / 100 : 0
  const salePrice = defaultVariant?.salePriceAmount
    ? defaultVariant.salePriceAmount / 100
    : null
  const onSale = salePrice != null && salePrice < price
  const effectivePrice = onSale ? salePrice : price

  const discountPct = onSale ? Math.round(((price - salePrice) / price) * 100) : 0

  const stock = stockOf(defaultVariant)
  const lowStockThreshold = 20
  const isLowStock = stock > 0 && stock <= lowStockThreshold
  const stockPercent = stock === 0 ? 0 : Math.min(100, (stock / lowStockThreshold) * 100)
  const stockColor = stock === 0 ? '#9ba58a' : isLowStock ? '#c2714f' : '#4a7c59'
  const stockLabel =
    stock === 0
      ? 'Out of stock'
      : isLowStock
        ? `Selling fast — ${stock} left`
        : `In stock — ${stock} available`

  // Show all images, layout adapts to the count.
  const images = product.images
  // When the count is odd and > 1, the last tile spans both columns so the
  // grid never ends with a lonely half-row. (Single image keeps its 3:4 hero.)
  const lastSpansFull = images.length > 1 && images.length % 2 === 1

  const primaryCategory = product.categories[0]?.category

  // Push to the recently-viewed list on mount — summary data only.
  useTrackRecentlyViewed({
    id: product.id,
    name: product.name,
    slug: product.slug,
    coverImage: images[0]
      ? { id: images[0].id, url: images[0].url, altText: images[0].altText ?? null }
      : null,
    priceMin: effectivePrice,
    priceMax: effectivePrice,
    totalStock: stock,
  })

  return (
    <>
      <Wrap>
      <Inner>
        {/* ── Left: image gallery ───────────────────────── */}
        <Gallery $count={images.length}>
          {images.length === 0 && (
            <EmptyState>No images available</EmptyState>
          )}
          {images.map((img, i) => {
            const isLast = i === images.length - 1
            const spanFull = lastSpansFull && isLast
            return (
              <Tile
                key={img.id}
                $count={images.length}
                $spanFull={spanFull}
              >
                {i === 0 && onSale && (
                  <DiscountBadge>-{discountPct}%</DiscountBadge>
                )}
                <TileImage
                  src={img.url}
                  alt={img.altText ?? product.name}
                  fill
                  sizes={
                    images.length === 1 || spanFull
                      ? '(max-width: 1024px) 100vw, 55vw'
                      : '(max-width: 1024px) 50vw, 27vw'
                  }
                  priority={i === 0}
                />
              </Tile>
            )
          })}
        </Gallery>

        {/* ── Right: product info ───────────────────────── */}
        <Details>
          <Breadcrumb aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">›</span>
            {primaryCategory ? (
              <>
                <Link href={`/shop/${primaryCategory.slug}`}>
                  {primaryCategory.name}
                </Link>
                <span className="sep">›</span>
              </>
            ) : (
              <>
                <Link href="/shop">Shop</Link>
                <span className="sep">›</span>
              </>
            )}
          </Breadcrumb>

          <Title>{product.name}</Title>

          <StockWrap>
            <StockRow>
              <StockDot $color={stockColor} />
              {stockLabel}
            </StockRow>
            <StockBar>
              <StockFill $percent={stockPercent} $color={stockColor} />
            </StockBar>
          </StockWrap>

          <PriceRow>
            {onSale && <PriceOld>{priceFormatter.format(price)}</PriceOld>}
            <PriceCurrent $onSale={onSale}>
              {priceFormatter.format(effectivePrice)}
            </PriceCurrent>
          </PriceRow>

          <Divider />

          <Section>
            <Summary>
              Description
              <FaChevronDown size={12} />
            </Summary>
            <SummaryBody>
              {product.description ?? 'No description available.'}
            </SummaryBody>
          </Section>

          <Section>
            <Summary>
              How many units do I need?
              <FaChevronDown size={12} />
            </Summary>
            <SummaryBody>
              Fabric is sold by the {product.sellingUnit.toLowerCase()}. Minimum
              order is {product.minOrderQty}
              {product.qtyIncrement > 1
                ? `, in increments of ${product.qtyIncrement}`
                : ''}
              . Add any quantity above that to your cart.
            </SummaryBody>
          </Section>

          <Section>
            <Summary>
              Shipping & returns
              <FaChevronDown size={12} />
            </Summary>
            <SummaryBody>
              Worldwide shipping. Orders ship within 3–7 working days. Returns
              accepted within 14 days of delivery on uncut fabric only.
            </SummaryBody>
          </Section>

          <QtyRow>
            <QtyLabel>Quantity</QtyLabel>
            <QtyStepper>
              <QtyBtn
                type="button"
                onClick={() => setQty((q) => Math.max(product.minOrderQty, q - product.qtyIncrement))}
                disabled={qty <= product.minOrderQty}
                aria-label="Decrease quantity"
              >
                <Minus size={14} strokeWidth={1.5} />
              </QtyBtn>
              <QtyVal>{qty}</QtyVal>
              <QtyBtn
                type="button"
                onClick={() => setQty((q) => Math.min(stock, q + product.qtyIncrement))}
                disabled={qty >= stock}
                aria-label="Increase quantity"
              >
                <Plus size={14} strokeWidth={1.5} />
              </QtyBtn>
            </QtyStepper>
          </QtyRow>

          <AddToCartBtn
            type="button"
            disabled={stock === 0 || !defaultVariant || add.isPending}
            onClick={() => {
              if (!defaultVariant) return
              add.mutate(
                { variantId: defaultVariant.id, quantity: qty },
                { onSuccess: openCart },
              )
            }}
          >
            <span>
              {stock === 0
                ? 'Sold out'
                : add.isPending
                  ? 'Adding…'
                  : cartLine
                    ? 'Add more'
                    : 'Add to cart'}
            </span>
            <span>{priceFormatter.format(effectivePrice * qty)}</span>
          </AddToCartBtn>

          {cartLine && (
            <InCartNote>
              <span>
                ✓ {cartLine.quantity} already in your cart
              </span>
              <span style={{ display: 'inline-flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => remove.mutate(cartLine.id)}
                  disabled={remove.isPending}
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = cartLine.quantity + product.qtyIncrement
                    if (next > stock) return
                    update.mutate({ itemId: cartLine.id, quantity: next })
                  }}
                  disabled={update.isPending || cartLine.quantity >= stock}
                >
                  +1
                </button>
                <button type="button" onClick={openCart}>View cart</button>
              </span>
            </InCartNote>
          )}

          {add.isError && (
            <ErrorText role="alert">
              {(add.error as Error)?.message ?? 'Could not add to cart.'}
            </ErrorText>
          )}

          <WishlistBtn
            type="button"
            $saved={wishlisted}
            onClick={() => setWishlisted(!wishlisted)}
            /* TODO: wire to wishlist API when it ships */
          >
            {wishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
            {wishlisted ? 'Saved to wishlist' : 'Add to wishlist'}
          </WishlistBtn>

          <Perks>
            <Perk>
              <FaTruck size={14} /> Worldwide shipping available
            </Perk>
            <Perk>
              <FaArrowRotateLeft size={14} /> Easy returns
            </Perk>
            <Perk>
              <FaGift size={14} /> Send it as a gift
            </Perk>
          </Perks>

          <Share>
            <ShareLabel>Share</ShareLabel>
            <ShareRow>
              <a href="https://facebook.com" aria-label="Share on Facebook">
                <FaFacebookF size={16} />
              </a>
              <a href="https://twitter.com" aria-label="Share on X">
                <FaXTwitter size={16} />
              </a>
              <a href="https://pinterest.com" aria-label="Share on Pinterest">
                <FaPinterestP size={16} />
              </a>
            </ShareRow>
          </Share>
        </Details>
      </Inner>
    </Wrap>

    <NewFabricsAdore excludeId={product.id} />
    <YouMayAlsoLike
      categorySlug={primaryCategory?.slug}
      excludeId={product.id}
    />
    <RecentlyViewed excludeId={product.id} />
  </>
  )
}
