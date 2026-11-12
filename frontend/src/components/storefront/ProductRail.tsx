'use client'

import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { Carousel } from './Carousel'
import { ProductCard } from './ProductCard'
import type { ProductListItem } from '@/types/product'

interface ProductRailProps {
  title: string
  products: ProductListItem[]
  viewAllHref?: string
  background?: 'body' | 'primary150' | 'sand'
  isLoading?: boolean
}

const SectionWrap = styled.section<{ $bg: ProductRailProps['background'] }>`
  background: ${({ theme, $bg }) =>
    $bg === 'primary150'
      ? theme.colors.primary150
      : $bg === 'sand'
        ? theme.colors.sand
        : theme.colors.background};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
  margin-bottom: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    margin-bottom: 1.5rem;
  }
`

const Rail = styled.div`
  text-align: left;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
`

const ViewAll = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2.25rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.clayDark}; }
`

/* ── Skeleton card for loading state ─────────────────────── */

const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 0.85; }
  100% { opacity: 0.5; }
`

const Skeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: ${pulse} 1.4s ease-in-out infinite;
`

const SkeletonMedia = styled.div`
  aspect-ratio: 2 / 3;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

const SkeletonLine = styled.div<{ $w?: string }>`
  height: 12px;
  width: ${({ $w }) => $w ?? '80%'};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

export function ProductRail({
  title,
  products,
  viewAllHref,
  background = 'body',
  isLoading = false,
}: ProductRailProps) {
  // Hide only after the fetch has settled and the list is truly empty.
  if (!isLoading && products.length === 0) return null

  return (
    <SectionWrap $bg={background} aria-label={title}>
      <Inner>
        <Heading>{title}</Heading>
        <Rail>
          <Carousel ariaLabel={title}>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`}>
                    <SkeletonMedia />
                    <SkeletonLine $w="70%" />
                    <SkeletonLine $w="40%" />
                  </Skeleton>
                ))
              : products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </Carousel>
        </Rail>
        {viewAllHref && !isLoading && (
          <Footer>
            <ViewAll href={viewAllHref}>View all</ViewAll>
          </Footer>
        )}
      </Inner>
    </SectionWrap>
  )
}
