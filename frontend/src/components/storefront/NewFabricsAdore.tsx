'use client'

import { usePublicProducts } from '@/hooks/useProducts'
import { ProductRail } from './ProductRail'

interface NewFabricsAdoreProps {
  excludeId?: string
}

export function NewFabricsAdore({ excludeId }: NewFabricsAdoreProps) {
  const { data, isLoading } = usePublicProducts({
    limit: 9,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const products = (data?.data ?? []).filter((p) => p.id !== excludeId).slice(0, 8)

  return (
    <ProductRail
      title="New fabrics to adore"
      products={products}
      viewAllHref="/shop/new"
      background="sand"
      isLoading={isLoading}
    />
  )
}
