'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { PiCaretRightLight } from 'react-icons/pi'
import { usePublicProducts } from '@/hooks/useProducts'
import { usePublicCategories } from '@/hooks/useCategories'
import { ProductCard } from './ProductCard'
import { getCategoryDescription } from '@/constants/categoryDescriptions'
import type { ProductFilters } from '@/types/product'

interface ShopCollectionProps {
  categorySlug?: string
  /** Search term from /shop?q=; results default to relevance order. */
  search?: string
  onSale?: boolean
  titleOverride?: string
  trail?: Array<{ label: string; href?: string }>
}

type Sort = 'relevance' | 'newest' | 'oldest' | 'nameAsc' | 'priceAsc' | 'priceDesc'
type Availability = 'all' | 'inStock'

const PAGE_SIZE = 16

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: 'newest',    label: 'Date, new to old' },
  { value: 'oldest',    label: 'Date, old to new' },
  { value: 'nameAsc',   label: 'Alphabetical, A-Z' },
  { value: 'priceAsc',  label: 'Price, low to high' },
  { value: 'priceDesc', label: 'Price, high to low' },
]

const RELEVANCE_OPTION = { value: 'relevance' as const, label: 'Best match' }

function sortToFilter(sort: Sort): Pick<ProductFilters, 'sortBy' | 'sortOrder'> {
  switch (sort) {
    case 'relevance': return { sortBy: 'relevance' }
    case 'oldest':    return { sortBy: 'createdAt', sortOrder: 'asc' }
    case 'nameAsc':   return { sortBy: 'name',      sortOrder: 'asc' }
    case 'priceAsc':  return { sortBy: 'price',     sortOrder: 'asc' }
    case 'priceDesc': return { sortBy: 'price',     sortOrder: 'desc' }
    case 'newest':
    default:          return { sortBy: 'createdAt', sortOrder: 'desc' }
  }
}


const Wrap = styled.section`
  min-height: 60vh;
`

const Header = styled.header`
  background: ${({ theme }) => theme.colors.clay};
`

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 2.25rem ${({ theme }) => theme.layout.headerHeight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3rem;
  }
`

const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};

  a {
    color: inherit;
    text-decoration: none;
    opacity: 0.7;
    transition: opacity ${({ theme }) => theme.transitions.fast};

    &:hover { opacity: 1; }
  }

  span[aria-current='page'] { opacity: 1; }
`

const Title = styled.h1`
  margin: 1rem 0 1rem;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    margin: 0.75rem 0 0.75rem;
  }
`

const Description = styled.p`
  max-width: 36rem;
  margin: 0 auto;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.textNav};
`

const Controls = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 0 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 220px;
`

const ControlLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const Select = styled.select`
  appearance: none;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
                    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: right 1rem center, right 0.65rem center;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;

  &:focus { outline: 2px solid ${({ theme }) => theme.colors.clay}; outline-offset: 2px; }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.25rem 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem 0.75rem;
  }
`

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Cell = styled.div<{ $index: number }>`
  opacity: 0;
  animation: ${fadeInUp} 520ms ease-out forwards;
  animation-delay: ${({ $index }) => Math.min($index, 11) * 55}ms;
`

const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.85; }
`

const SkeletonCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  animation: ${pulse} 1.4s ease-in-out infinite;
`

const SkeletonMedia = styled.div`
  aspect-ratio: 2 / 3;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
`

const SkeletonLine = styled.div<{ $w?: string }>`
  height: 10px;
  width: ${({ $w }) => $w ?? '70%'};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
`

const Empty = styled.div`
  text-align: center;
  padding: 6rem 1rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Pagination = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const PageBtn = styled.button<{ $active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 0.6rem;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.textNav : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.textNav : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.textInverse : theme.colors.textNav)};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:not(:disabled):hover { background: ${({ theme, $active }) => ($active ? theme.colors.textNav : theme.colors.surfaceMuted)}; }
`

/* ── Component ───────────────────────────────────────────── */

export function ShopCollection({ categorySlug, search, onSale, titleOverride, trail = [] }: ShopCollectionProps) {
  const [sort, setSort] = useState<Sort>(search ? 'relevance' : 'newest')
  const sortOptions = search ? [RELEVANCE_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS
  const [availability, setAvailability] = useState<Availability>('all')
  const [page, setPage] = useState(1)

  const filters = useMemo<ProductFilters>(
    () => ({
      categorySlug,
      search,
      onSale,
      page,
      limit: PAGE_SIZE,
      ...sortToFilter(sort),
    }),
    [categorySlug, search, onSale, page, sort],
  )

  const { data, isLoading } = usePublicProducts(filters)
  const { data: categories } = usePublicCategories()

  const resolvedTitle = useMemo(() => {
    if (titleOverride) return titleOverride
    if (search) return `Results for “${search}”`
    if (!categorySlug) return 'All fabrics'
    const match = categories?.find((c) => c.slug === categorySlug)
    return match?.name ?? categorySlug.replace(/-/g, ' ')
  }, [titleOverride, search, categorySlug, categories])

  const items = data?.data ?? []
  const meta = data?.meta

  const description = search
    ? meta
      ? `${meta.total} ${meta.total === 1 ? 'fabric' : 'fabrics'} found`
      : 'Searching…'
    : getCategoryDescription(categorySlug)

  // Availability is applied client-side until the backend exposes a stock filter.
  const visible = availability === 'inStock'
    ? items.filter((p) => (p.totalStock ?? 0) > 0)
    : items

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as Sort)
    setPage(1)
  }

  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAvailability(e.target.value as Availability)
  }

  const pageNumbers = useMemo(() => {
    if (!meta) return []
    const max = meta.totalPages
    const current = meta.page
    const windowSize = 5
    const half = Math.floor(windowSize / 2)
    const start = Math.max(1, Math.min(current - half, max - windowSize + 1))
    const end = Math.min(max, start + windowSize - 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [meta])

  return (
    <Wrap>
      <Header>
        <HeaderInner>
          <Crumbs aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <PiCaretRightLight size={12} aria-hidden />
            {search ? (
              <>
                <Link href="/shop">Shop</Link>
                <PiCaretRightLight size={12} aria-hidden />
                <span aria-current="page">Search</span>
              </>
            ) : trail.length === 0 ? (
              <span aria-current="page">Shop</span>
            ) : (
              <>
                <Link href="/shop">Shop</Link>
                {trail.map((crumb, idx) => {
                  const isLast = idx === trail.length - 1
                  return (
                    <Fragment key={crumb.label}>
                      <PiCaretRightLight size={12} aria-hidden />
                      {isLast || !crumb.href ? (
                        <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href}>{crumb.label}</Link>
                      )}
                    </Fragment>
                  )
                })}
              </>
            )}
          </Crumbs>

          <Title>{resolvedTitle}</Title>
          <Description>{description}</Description>
        </HeaderInner>
      </Header>

      <Inner>
        <Controls>
          <ControlGroup>
            <ControlLabel>Filter by</ControlLabel>
            <Select value={availability} onChange={handleAvailabilityChange} aria-label="Availability">
              <option value="all">Availability</option>
              <option value="inStock">In stock</option>
            </Select>
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>Sort by</ControlLabel>
            <Select value={sort} onChange={handleSortChange} aria-label="Sort by">
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </ControlGroup>
        </Controls>

        {isLoading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCell key={`s-${i}`}>
                <SkeletonMedia />
                <SkeletonLine $w="70%" />
                <SkeletonLine $w="40%" />
              </SkeletonCell>
            ))}
          </Grid>
        ) : visible.length === 0 ? (
          <Empty>
            {search
              ? `No fabrics found for “${search}”. Check the spelling or try a broader term.`
              : 'No fabrics match your filters.'}
          </Empty>
        ) : (
          <Grid>
            {visible.map((product, i) => (
              <Cell key={product.id} $index={i}>
                <ProductCard product={product} showMeta />
              </Cell>
            ))}
          </Grid>
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination aria-label="Pagination">
            <PageBtn
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              aria-label="Previous page"
            >
              ‹
            </PageBtn>
            {pageNumbers.map((n) => (
              <PageBtn
                key={n}
                type="button"
                $active={n === meta.page}
                onClick={() => setPage(n)}
                aria-current={n === meta.page ? 'page' : undefined}
                aria-label={`Page ${n}`}
              >
                {n}
              </PageBtn>
            ))}
            <PageBtn
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              aria-label="Next page"
            >
              ›
            </PageBtn>
          </Pagination>
        )}
      </Inner>
    </Wrap>
  )
}
