import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventory'
import type { AdjustInventoryPayload, InventoryFilters } from '@/types/inventory'
import { PRODUCTS_KEY } from './useProducts'

export const INVENTORY_KEY = 'inventory'

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'list', filters],
    queryFn: () => inventoryService.list(filters),
    staleTime: 10_000,
  })
}

export function useInventoryMovements(variantId: string | null) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'movements', variantId],
    queryFn: () => inventoryService.movements(variantId!),
    enabled: Boolean(variantId),
    staleTime: 10_000,
  })
}

export function useAdjustInventory() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdjustInventoryPayload) => inventoryService.adjust(payload),
    // Stock change affects the product list's `totalStock` column — refresh both.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORY_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}
