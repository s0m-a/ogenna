import type { SellingUnit, ProductStatus } from './product'

export type CartStatus = 'ACTIVE' | 'MERGED' | 'CONVERTED' | 'ABANDONED'

export interface CartLineItem {
  id: string
  variantId: string
  quantity: number
  unitPriceAmount: number    // cents / kobo
  lineTotalAmount: number    // cents / kobo
  currencyCode: string
  variant: {
    id: string
    name: string
    sku?: string | null
    attributes: Record<string, unknown>
    coverImage?: { id: string; url: string; altText?: string | null } | null
    product: {
      id: string
      name: string
      slug: string
      sellingUnit: SellingUnit
      minOrderQty: number
      qtyIncrement: number
      status: ProductStatus
    }
  }
}

export interface Cart {
  id: string | null
  guestToken: string | null
  status?: CartStatus
  items: CartLineItem[]
  itemCount: number
  subtotalAmount: number     // cents / kobo
  currencyCode: string
  updatedAt?: string
}
