'use client'

import { usePublicProducts } from '@/hooks/useProducts'
import { ProductRail } from './ProductRail'

interface YouMayAlsoLikeProps {
  categorySlug?: string | null
  excludeId?: string
}

export function YouMayAlsoLike({ categorySlug, excludeId }: YouMayAlsoLikeProps) {
  // Pull from the same category; fall back to newest if no category.
  const { data, isLoading } = usePublicProducts({
    limit: 9,
    categorySlug: categorySlug ?? undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const products = (data?.data ?? []).filter((p) => p.id !== excludeId).slice(0, 8)

  // Truly empty (category has no siblings) — hide the whole section.
  if (!isLoading && products.length === 0) return null

  return (
    <ProductRail
      title="You may also like"
      products={products}
      background="body"
      isLoading={isLoading}
    />
  )
}
