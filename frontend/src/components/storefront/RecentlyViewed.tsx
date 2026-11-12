'use client'

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { ProductRail } from './ProductRail'
import type { ProductListItem } from '@/types/product'

interface RecentlyViewedProps {
  excludeId?: string
}

export function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const items = useRecentlyViewed(excludeId)
  if (items.length === 0) return null

  // The stored shape matches enough of ProductListItem that the card renders
  // fine — undefined fields (updatedAt, status, etc.) aren't surfaced by the UI.
  const products = items as unknown as ProductListItem[]

  return (
    <ProductRail
      title="Recently viewed products"
      products={products}
      background="body"
    />
  )
}
