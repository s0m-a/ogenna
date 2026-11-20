'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styled, { css, keyframes } from 'styled-components'
import { PiDotsThreeLight, PiPackageLight, PiPlusLight, PiCopyLight, PiPencilSimpleLight, PiEyeLight, PiEyeSlashLight, PiArchiveLight, PiTrashLight } from 'react-icons/pi'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'

const LinkButton = styled(Link)<{ $size?: 'sm' | 'md'; $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  border-radius: 6px;
  transition: background 120ms ease, border-color 120ms ease;

  ${({ $size = 'sm' }) => $size === 'sm' && css`
    padding: 0.4375rem 0.875rem;
    font-size: 0.8125rem;
  `}

  ${({ $variant = 'primary', theme }) =>
    $variant === 'primary'
      ? css`
          background: ${theme.colors.primary400};
          color: ${theme.colors.textInverse};
          border: 1px solid transparent;
          &:hover { background: ${theme.colors.primary500}; }
        `
      : css`
          background: ${theme.colors.surface};
          color: ${theme.colors.textPrimary};
          border: 1px solid ${theme.colors.border};
          &:hover { background: ${theme.colors.surfaceMuted}; }
        `}
`
import { StatusBadge } from '@/components/common/StatusBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { useProducts, useProductMutations } from '@/hooks/useProducts'
import type { ProductListItem, ProductStatus, ProductFilters } from '@/types/product'

/* ── Animations ────────────────────────────────────────────── */

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* ── Status helpers ────────────────────────────────────────── */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'

function statusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status?.toUpperCase()) {
    case 'PUBLISHED': return { label: 'Published', variant: 'success' }
    case 'ARCHIVED':  return { label: 'Archived',  variant: 'neutral' }
    case 'DRAFT':
    default:          return { label: 'Draft',     variant: 'neutral' }
  }
}

function inventoryBadge(stock: number, variantCount: number): { label: string; variant: BadgeVariant } {
  if (variantCount === 0)  return { label: 'No variants', variant: 'neutral' }
  if (stock === 0)         return { label: 'Out of stock', variant: 'danger' }
  if (stock <= 5)          return { label: 'Low stock',    variant: 'warning' }
  return                          { label: 'In stock',     variant: 'success' }
}

function formatPrice(min?: number, max?: number): string {
  if (min == null) return '—'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max!)}`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

/* ── Filter bar ─────────────────────────────────────────────── */

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`

const StyledSearch = styled(SearchInput)`
  width: 260px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }
`

const FilterSelect = styled.select`
  height: 36px;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5444' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

/* ── Table container ───────────────────────────────────────── */

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const TableScroll = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Th = styled.th<{ $align?: 'left' | 'right' | 'center' }>`
  padding: 0.625rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: ${({ $align = 'left' }) => $align};
  white-space: nowrap;
  user-select: none;
`

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child { border-bottom: none; }

  &:hover td { background: ${({ theme }) => theme.colors.primary100}; }
`

const Td = styled.td<{ $align?: 'left' | 'right' | 'center' }>`
  padding: 0.75rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  vertical-align: middle;
  text-align: ${({ $align = 'left' }) => $align};
  background: ${({ theme }) => theme.colors.surface};
  transition: background ${({ theme }) => theme.transitions.fast};
`

/* ── Product image ─────────────────────────────────────────── */

const ImgWrap = styled.div`
  width: 40px;
  height: 50px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  display: flex;
  align-items: center;
  justify-content: center;
`

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ImgPlaceholder = styled.span`
  color: ${({ theme }) => theme.colors.border};
`

/* ── Product cell ──────────────────────────────────────────── */

const ProductCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const ProductName = styled(Link)`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  display: block;

  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const ProductMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  margin-top: 1px;
`

/* ── Row action menu ───────────────────────────────────────── */

const ActionWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
`

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast},
              color     ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 0.3125rem;
  z-index: 20;
  animation: ${fadeIn} 120ms ease;
`

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast},
              color     ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &.danger:hover {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  }
`

const MenuSep = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0.25rem 0;
`

/* ── Skeleton ──────────────────────────────────────────────── */

const SkeletonCell = styled.div<{ $w?: string }>`
  height: 14px;
  width: ${({ $w = '80%' }) => $w};
  border-radius: 4px;
  background: linear-gradient(90deg,
    ${({ theme }) => theme.colors.surfaceMuted} 25%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surfaceMuted} 75%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease infinite;
`

/* ── Row action menu component ─────────────────────────────── */

interface RowMenuProps {
  product: ProductListItem
  onEdit: () => void
  onDuplicate: () => void
  onPublish: () => void
  onUnpublish: () => void
  onArchive: () => void
  onDelete: () => void
}

function RowMenu({ product, onEdit, onDuplicate, onPublish, onUnpublish, onArchive, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const close = () => setOpen(false)

  return (
    <ActionWrap ref={ref}>
      <ActionBtn
        onClick={() => setOpen((v) => !v)}
        aria-label="Product actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <PiDotsThreeLight size={15} />
      </ActionBtn>
      {open && (
        <Menu role="menu">
          <MenuItem role="menuitem" onClick={() => { close(); onEdit() }}>
            <PiPencilSimpleLight size={13} /> Edit
          </MenuItem>
          <MenuItem role="menuitem" onClick={() => { close(); onDuplicate() }}>
            <PiCopyLight size={13} /> Duplicate
          </MenuItem>
          <MenuSep />
          {product.status !== 'PUBLISHED' && (
            <MenuItem role="menuitem" onClick={() => { close(); onPublish() }}>
              <PiEyeLight size={13} /> Publish
            </MenuItem>
          )}
          {product.status === 'PUBLISHED' && (
            <MenuItem role="menuitem" onClick={() => { close(); onUnpublish() }}>
              <PiEyeSlashLight size={13} /> Unpublish
            </MenuItem>
          )}
          {product.status !== 'ARCHIVED' && (
            <MenuItem role="menuitem" onClick={() => { close(); onArchive() }}>
              <PiArchiveLight size={13} /> Archive
            </MenuItem>
          )}
          <MenuSep />
          <MenuItem className="danger" role="menuitem" onClick={() => { close(); onDelete() }}>
            <PiTrashLight size={13} /> Delete
          </MenuItem>
        </Menu>
      )}
    </ActionWrap>
  )
}

/* ── Delete confirm dialog ─────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(44, 31, 20, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 1.75rem;
  max-width: 400px;
  width: 100%;
`

const DialogTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.5rem;
`

const DialogBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  margin-bottom: 1.5rem;
`

const DialogActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`

/* ── Main page component ───────────────────────────────────── */

const LIMIT = 20

export default function ProductsPage() {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null)

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const filters: ProductFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page,
    limit: LIMIT,
  }

  const { data, isLoading, isError } = useProducts(filters)
  const mutations = useProductMutations()

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    await mutations.remove.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }, [deleteTarget, mutations.remove])

  const SKELETON_ROWS = 8

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your fabric catalogue."
        actions={
          <LinkButton href="/admin/products/new" $variant="primary" $size="sm">
            <PiPlusLight size={14} />
            Add product
          </LinkButton>
        }
      />

      <Toolbar>
        <StyledSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search products…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ProductStatus | ''); setPage(1) }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </FilterSelect>
      </Toolbar>

      <TableCard>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th style={{ width: 40 }} />
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Inventory</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th style={{ width: 48 }} />
              </tr>
            </Thead>
            <tbody>
              {/* Loading skeleton */}
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <Tr key={i}>
                    <Td><ImgWrap /></Td>
                    <Td>
                      <SkeletonCell $w="160px" style={{ marginBottom: 6 }} />
                      <SkeletonCell $w="80px" />
                    </Td>
                    <Td><SkeletonCell $w="90px" /></Td>
                    <Td><SkeletonCell $w="70px" /></Td>
                    <Td><SkeletonCell $w="80px" /></Td>
                    <Td><SkeletonCell $w="70px" /></Td>
                    <Td><SkeletonCell $w="90px" /></Td>
                    <Td />
                  </Tr>
                ))}

              {/* Error */}
              {isError && (
                <tr>
                  <Td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'inherit' }}>
                    <EmptyState
                      title="Could not load products"
                      description="Check your connection or try refreshing the page."
                    />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && data?.data?.length === 0 && (
                <tr>
                  <Td colSpan={8}>
                    <EmptyState
                      icon={PiPackageLight}
                      title={debouncedSearch || statusFilter ? 'No products match your filters' : 'No products yet'}
                      description={
                        debouncedSearch || statusFilter
                          ? 'Try adjusting your search or filter.'
                          : 'Add your first fabric product to get started.'
                      }
                      action={
                        !debouncedSearch && !statusFilter ? (
                          <LinkButton href="/admin/products/new" $variant="primary" $size="sm">
                            <PiPlusLight size={14} /> Add product
                          </LinkButton>
                        ) : undefined
                      }
                    />
                  </Td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading && !isError && data?.data?.map((product) => {
                const pub = statusBadge(product.status)
                const inv = inventoryBadge(product.totalStock ?? 0, product.variantCount ?? 0)

                return (
                  <Tr key={product.id}>
                    <Td>
                      <ImgWrap>
                        {product.coverImage ? (
                          <Img
                            src={product.coverImage.url}
                            alt={product.coverImage.altText ?? product.name}
                          />
                        ) : (
                          <ImgPlaceholder aria-hidden>
                            <PiPackageLight size={16} />
                          </ImgPlaceholder>
                        )}
                      </ImgWrap>
                    </Td>
                    <Td>
                      <ProductCell>
                        <div>
                          <ProductName href={`/admin/products/${product.id}/edit`}>
                            {product.name}
                          </ProductName>
                          <ProductMeta>
                            {(product.variantCount ?? 0) === 1
                              ? '1 variant'
                              : `${product.variantCount ?? 0} variants`}
                          </ProductMeta>
                        </div>
                      </ProductCell>
                    </Td>
                    <Td style={{ color: product.category || product.fabricType ? undefined : '#a89585' }}>
                      {product.category?.name ?? product.fabricType ?? '—'}
                    </Td>
                    <Td>{formatPrice(product.priceMin, product.priceMax)}</Td>
                    <Td>
                      <StatusBadge $variant={inv.variant}>{inv.label}</StatusBadge>
                    </Td>
                    <Td>
                      <StatusBadge $variant={pub.variant}>{pub.label}</StatusBadge>
                    </Td>
                    <Td style={{ color: '#6b5444' }}>{formatDate(product.updatedAt)}</Td>
                    <Td>
                      <RowMenu
                        product={product}
                        onEdit={() => router.push(`/admin/products/${product.id}/edit`)}
                        onDuplicate={() => mutations.duplicate.mutateAsync(product.id)}
                        onPublish={() => mutations.publish.mutateAsync(product.id)}
                        onUnpublish={() => mutations.unpublish.mutateAsync(product.id)}
                        onArchive={() => mutations.archive.mutateAsync(product.id)}
                        onDelete={() => setDeleteTarget(product)}
                      />
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </TableScroll>

        {data && data.meta.totalPages > 1 && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {/* Delete confirmation */}
      {deleteTarget && (
        <Overlay onClick={() => setDeleteTarget(null)}>
          <Dialog onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogBody>
              <strong>{deleteTarget.name}</strong> will be permanently deleted. This cannot be undone.
            </DialogBody>
            <DialogActions>
              <Button $variant="secondary" $size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                $variant="danger"
                $size="sm"
                onClick={handleDelete}
                disabled={mutations.remove.isPending}
              >
                {mutations.remove.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Overlay>
      )}
    </>
  )
}
