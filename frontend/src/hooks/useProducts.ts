import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/services/products'
import type { ProductFilters, ProductFormData } from '@/types/product'

export const PRODUCTS_KEY = 'products'
// Match the key declared in useInventory.ts. Inlined here to avoid a circular import.
const INVENTORY_KEY = 'inventory'

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'list', filters],
    queryFn: () => productsService.list(filters),
    // Admin dashboard feels live — refetch when the user tabs back in after > 10s.
    staleTime: 10_000,
  })
}

export function usePublicProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'public', filters],
    queryFn: () => productsService.listPublic(filters),
    staleTime: 60_000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsService.get(id),
    enabled: Boolean(id),
    staleTime: 10_000,
  })
}

export function usePublicProductBySlug(slug: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'public', 'slug', slug],
    queryFn: () => productsService.getPublicBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 30_000,
  })
}

export function useProductMutations() {
  const qc = useQueryClient()

  // Products and inventory are joined on the dashboard — invalidate both so
  // either view reflects the mutation on the next render.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    qc.invalidateQueries({ queryKey: [INVENTORY_KEY] })
  }

  const create = useMutation({
    mutationFn: (data: ProductFormData) => productsService.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      productsService.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: invalidate,
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => productsService.duplicate(id),
    onSuccess: invalidate,
  })

  const publish = useMutation({
    mutationFn: (id: string) => productsService.publish(id),
    onSuccess: invalidate,
  })

  const unpublish = useMutation({
    mutationFn: (id: string) => productsService.unpublish(id),
    onSuccess: invalidate,
  })

  const archive = useMutation({
    mutationFn: (id: string) => productsService.archive(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, duplicate, publish, unpublish, archive }
}
