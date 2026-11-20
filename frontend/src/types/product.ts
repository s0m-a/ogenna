/* ── Enums ──────────────────────────────────────────────────── */

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type SellingUnit = 'METER' | 'HALF_METER' | 'CENTIMETER' | 'YARD' | 'PIECE'

export const SELLING_UNIT_LABELS: Record<SellingUnit, string> = {
  METER:       'Meter',
  HALF_METER:  'Half meter',
  CENTIMETER:  'Centimeter',
  YARD:        'Yard',
  PIECE:       'Piece',
}

/* ── List API (GET /admin/products) ─────────────────────────── */

export interface ProductListItem {
  id: string
  name: string
  slug: string
  status: ProductStatus
  fabricType?: string
  category?: { id: string; name: string; slug: string } | null
  coverImage?: { id: string; url: string; altText?: string | null } | null
  hoverImage?: { id: string; url: string; altText?: string | null } | null
  variantCount?: number
  defaultVariantId?: string | null
  priceMin?: number   // already divided by 100 (display value)
  priceMax?: number
  salePriceMin?: number
  salePriceMax?: number
  totalStock?: number
  updatedAt: string
}

export interface ProductListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductListResponse {
  data: ProductListItem[]
  meta: ProductListMeta
}

/** GET /products/search — instant results, best match first. */
export interface ProductSearchResponse {
  data: ProductListItem[]
}

export interface ProductFilters {
  search?: string
  status?: ProductStatus | ''
  categoryId?: string
  categorySlug?: string
  onSale?: boolean
  page?: number
  limit?: number
  /** 'relevance' only applies together with `search`. */
  sortBy?: 'createdAt' | 'name' | 'price' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

/* ── Detail API (GET /admin/products/:id) ───────────────────── */

export interface ProductImage {
  id: string
  url: string
  altText?: string | null
  position: number
  mediaAssetId?: string | null
}

export interface ProductVariantDetail {
  id: string
  name: string
  sku?: string | null
  attributes: Record<string, unknown>
  priceAmount: number           // cents
  salePriceAmount?: number | null
  currencyCode: string
  isDefault: boolean
  isActive: boolean
  inventory?: { quantityOnHand: number; quantityReserved: number } | null
  images: ProductImage[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  fabricType?: string | null
  materialComposition?: string | null
  widthCm?: number | null
  weightGsm?: number | null
  careInstructions?: string | null
  status: ProductStatus
  sellingUnit: SellingUnit
  minOrderQty: number
  qtyIncrement: number
  isFeatured: boolean
  variants: ProductVariantDetail[]
  images: ProductImage[]
  categories: Array<{
    categoryId: string
    category: { id: string; name: string; slug: string }
  }>
  collections: Array<{
    collection: { id: string; name: string; slug: string }
  }>
  createdAt: string
  updatedAt: string
}

/* ── Create / Update API payloads ───────────────────────────── */

export interface ApiImagePayload {
  mediaAssetId: string
  altText?: string
  position?: number
}

export interface ApiVariantPayload {
  id?: string              // present when updating an existing variant
  name: string
  sku?: string
  priceAmount: number      // integer kobo
  salePriceAmount?: number
  currencyCode?: string
  attributes?: Record<string, unknown>
  isDefault?: boolean
  images?: ApiImagePayload[]
}

export interface ApiProductPayload {
  name: string
  slug: string
  description?: string
  fabricType?: string
  materialComposition?: string
  widthCm?: number
  weightGsm?: number
  careInstructions?: string
  status?: ProductStatus
  sellingUnit?: SellingUnit
  minOrderQty?: number
  qtyIncrement?: number
  isFeatured?: boolean
  categoryIds?: string[]
  variants?: ApiVariantPayload[]
  images?: ApiImagePayload[]
}

/* ── Form state (used inside ProductForm component) ─────────── */

export interface SelectedImage {
  mediaAssetId: string
  url: string
  altText?: string
}

export interface VariantFormRow {
  _localId: string   // React key — crypto.randomUUID()
  id?: string        // present if loaded from API (read-only in edit mode)
  name: string
  sku: string
  price: string      // display string "1200" (₦)
  salePrice: string
  isDefault: boolean
  images: SelectedImage[]
}

export interface ProductFormState {
  name: string
  slug: string
  description: string
  fabricType: string
  materialComposition: string
  widthCm: string
  weightGsm: string
  careInstructions: string
  status: ProductStatus
  sellingUnit: SellingUnit
  minOrderQty: string
  qtyIncrement: string
  isFeatured: boolean
  categoryIds: string[]
  hasMultipleVariants: boolean   // toggle for multi-variant UI
  basePrice: string              // used when hasMultipleVariants is false
  baseSalePrice: string
  baseSku: string
  variants: VariantFormRow[]
  images: SelectedImage[]        // product-level images
}

/* Keep ProductFormData alias so existing imports don't break */
export type ProductFormData = ApiProductPayload
