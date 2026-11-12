'use client'

import Link from 'next/link'
import styled from 'styled-components'
import { usePublicProducts } from '@/hooks/useProducts'
import { ProductCard } from './ProductCard'
import type { ProductListItem } from '@/types/product'

/* ── Layout ──────────────────────────────────────────────── */

const SectionWrap = styled.section`
  background: ${({ theme }) => theme.colors.sand};
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
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const Subtitle = styled.p`
  margin-top: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Grid = styled.div`
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  text-align: left;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Footer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2.5rem;
`

const ViewAll = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2.5rem;
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

const StatusText = styled.p`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

/* ── Badge derivation ────────────────────────────────────── */

interface Derived {
  badge?: string
  badgeVariant?: 'default' | 'soldOut' | 'sale'
}

// TODO: once the public list response exposes sale prices, compute "-NN%" from
//       (priceMin - salePriceMin) / priceMin and set badgeVariant='sale'.
function deriveBadge(product: ProductListItem): Derived {
  if (product.totalStock !== undefined && product.totalStock <= 0) {
    return { badge: 'Sold out', badgeVariant: 'soldOut' }
  }
  return {}
}

/* ── Component ───────────────────────────────────────────── */

export function LastMetersInStock() {
  // TODO: filter server-side to products that actually have low stock / are on
  //       sale once the API supports those query params. For now we show the
  //       8 most recent published products.
  const { data, isLoading, isError } = usePublicProducts({ limit: 8 })

  if (isLoading) {
    return (
      <SectionWrap aria-label="Last meters in stock">
        <Inner>
          <StatusText>Loading products…</StatusText>
        </Inner>
      </SectionWrap>
    )
  }

  if (isError || !data || data.data.length === 0) return null

  return (
    <SectionWrap aria-label="Last meters in stock">
      <Inner>
        <Heading>Last meters in stock</Heading>
        <Subtitle>Shop fabrics on sale</Subtitle>

        <Grid>
          {data.data.map((product) => {
            const { badge, badgeVariant } = deriveBadge(product)
            return (
              <ProductCard
                key={product.id}
                product={product}
                badge={badge}
                badgeVariant={badgeVariant}
              />
            )
          })}
        </Grid>

        <Footer>
          <ViewAll href="/sale">View all</ViewAll>
        </Footer>
      </Inner>
    </SectionWrap>
  )
}
