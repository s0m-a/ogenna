import { apiClient } from './apiClient'
import type {
  Product,
  ProductListResponse,
  ProductFilters,
  ProductFormData,
  ProductSearchResponse,
} from '@/types/product'

function buildQuery(filters: ProductFilters): string {
  const params = new URLSearchParams()
  if (filters.search)       params.set('search',       filters.search)
  if (filters.status)       params.set('status',       filters.status)
  if (filters.categoryId)   params.set('categoryId',   filters.categoryId)
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug)
  if (filters.onSale)       params.set('onSale',       'true')
  if (filters.sortBy)       params.set('sortBy',       filters.sortBy)
  if (filters.sortOrder)    params.set('sortOrder',    filters.sortOrder)
  if (filters.page)         params.set('page',         String(filters.page))
  params.set('limit', String(filters.limit ?? 20))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const productsService = {
  // Admin list (requires JWT)
  list: (filters: ProductFilters = {}) =>
    apiClient.get<ProductListResponse>(`/admin/products${buildQuery(filters)}`),

  // Public storefront list
  listPublic: (filters: ProductFilters = {}) =>
    apiClient.get<ProductListResponse>(`/products${buildQuery(filters)}`),

  // Public instant search (published products, ranked)
  // Pass React Query's signal so a superseded search is aborted.
  search: (q: string, limit = 8, signal?: AbortSignal) =>
    apiClient.get<ProductSearchResponse>(
      `/products/search?${new URLSearchParams({ q, limit: String(limit) })}`,
      { signal },
    ),

  // Record a submitted search; the server works out the result count itself.
  logSearch: (q: string) =>
    apiClient.post<void>('/products/search/log', { q }),

  // Public storefront detail (by slug)
  getPublicBySlug: (slug: string) =>
    apiClient.get<Product>(`/products/${slug}`),

  get: (id: string) =>
    apiClient.get<Product>(`/admin/products/${id}`),

  // Admin mutations
  create: (data: ProductFormData) =>
    apiClient.post<Product>('/admin/products', data),

  update: (id: string, data: Partial<ProductFormData>) =>
    apiClient.patch<Product>(`/admin/products/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/admin/products/${id}`),

  duplicate: (id: string) =>
    apiClient.post<Product>(`/admin/products/${id}/duplicate`, {}),

  publish: (id: string) =>
    apiClient.patch<Product>(`/admin/products/${id}/publish`, {}),

  unpublish: (id: string) =>
    apiClient.patch<Product>(`/admin/products/${id}/unpublish`, {}),

  archive: (id: string) =>
    apiClient.patch<Product>(`/admin/products/${id}/archive`, {}),
}
