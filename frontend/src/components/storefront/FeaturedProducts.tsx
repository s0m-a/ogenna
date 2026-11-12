'use client'

import Link from 'next/link'
import styled from 'styled-components'
import { usePublicProducts } from '@/hooks/useProducts'
import { ProductCard } from './ProductCard'
import { Carousel } from './Carousel'

/* ── Layout ──────────────────────────────────────────────── */

const SectionWrap = styled.section`
  background: ${({ theme }) => theme.colors.sand};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingX};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
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

const StatusText = styled.p`
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export function FeaturedProducts() {
  const { data, isLoading, isError } = usePublicProducts({ limit: 8 })

  if (isLoading) {
    return (
      <SectionWrap aria-label="Featured products">
        <Inner>
          <StatusText>Loading products…</StatusText>
        </Inner>
      </SectionWrap>
    )
  }

  if (isError || !data || data.data.length === 0) return null

  return (
    <SectionWrap aria-label="Featured products">
      <Inner>
        <Carousel ariaLabel="Featured products">
          {data.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Carousel>

        <Footer>
          <ViewAll href="/shop">View all</ViewAll>
        </Footer>
      </Inner>
    </SectionWrap>
  )
}
