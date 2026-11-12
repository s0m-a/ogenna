import { apiClient } from './apiClient'
import type {
  InventoryItem,
  InventoryListResponse,
  InventoryMovement,
  AdjustInventoryPayload,
  InventoryFilters,
} from '@/types/inventory'

function buildQuery(filters: InventoryFilters): string {
  const params = new URLSearchParams()
  if (filters.search)            params.set('search',   filters.search)
  if (filters.lowStock)          params.set('lowStock', 'true')
  if (filters.page)              params.set('page',     String(filters.page))
  params.set('limit', String(filters.limit ?? 20))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const inventoryService = {
  list: (filters: InventoryFilters = {}) =>
    apiClient.get<InventoryListResponse>(`/admin/inventory${buildQuery(filters)}`),

  getByVariant: (variantId: string) =>
    apiClient.get<InventoryItem>(`/admin/inventory/${variantId}`),

  movements: (variantId: string) =>
    apiClient.get<InventoryMovement[]>(`/admin/inventory/${variantId}/movements`),

  adjust: (payload: AdjustInventoryPayload) =>
    apiClient.post<InventoryItem>('/admin/inventory/adjustments', payload),
}
