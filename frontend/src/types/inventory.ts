export type MovementReason =
  | 'INITIAL_STOCK'
  | 'RESTOCK'
  | 'SALE_RESERVED'
  | 'SALE_DEDUCTED'
  | 'RESERVATION_RELEASED'
  | 'ADMIN_ADJUSTMENT'
  | 'RETURN'

export interface InventoryVariant {
  id: string
  name: string
  sku: string
  product: { id: string; name: string; slug: string }
}

export interface InventoryItem {
  id: string
  variantId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  isLowStock: boolean
  updatedAt: string
  variant: InventoryVariant
}

export interface InventoryMovement {
  id: string
  inventoryItemId: string
  delta: number
  reason: MovementReason
  referenceId?: string
  note?: string
  createdAt: string
}

export interface InventoryListResponse {
  data: InventoryItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AdjustInventoryPayload {
  variantId: string
  delta: number
  reason: MovementReason
  note?: string
  referenceId?: string
}

export interface InventoryFilters {
  search?: string
  lowStock?: boolean
  page?: number
  limit?: number
}

/* Reasons an admin can trigger manually */
export const ADMIN_MOVEMENT_REASONS: { value: MovementReason; label: string }[] = [
  { value: 'RESTOCK',          label: 'Restock'            },
  { value: 'ADMIN_ADJUSTMENT', label: 'Manual adjustment'  },
  { value: 'RETURN',           label: 'Customer return'    },
  { value: 'INITIAL_STOCK',    label: 'Set initial stock'  },
]

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  INITIAL_STOCK:        'Initial stock',
  RESTOCK:              'Restock',
  SALE_RESERVED:        'Reserved for order',
  SALE_DEDUCTED:        'Sold',
  RESERVATION_RELEASED: 'Reservation released',
  ADMIN_ADJUSTMENT:     'Manual adjustment',
  RETURN:               'Customer return',
}
