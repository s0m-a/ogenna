export type MediaResourceType = 'IMAGE' | 'VIDEO' | 'RAW'

export interface MediaAsset {
  id: string
  provider: string
  publicId: string
  url: string
  secureUrl: string
  resourceType: MediaResourceType
  format: string | null
  width: number | null
  height: number | null
  bytes: number | null
  folder: string | null
  alt: string | null
  tags: string[]
  originalName: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface MediaListResponse {
  items: MediaAsset[]
  total: number
  page: number
  pageSize: number
}

export interface MediaFilters {
  search?: string
  tag?: string
  folder?: string
  resourceType?: MediaResourceType
  page?: number
  pageSize?: number
}

export interface SignUploadResponse {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

export interface CloudinaryUploadResult {
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: 'image' | 'video' | 'raw'
  bytes: number
  url: string
  secure_url: string
  original_filename: string
  folder?: string
}

export interface CreateMediaAssetPayload {
  publicId: string
  url: string
  secureUrl: string
  resourceType?: MediaResourceType
  format?: string
  width?: number
  height?: number
  bytes?: number
  folder?: string
  alt?: string
  tags?: string[]
  originalName?: string
}

export interface UpdateMediaAssetPayload {
  alt?: string
  tags?: string[]
}

export interface MediaUsage {
  assetId: string
  productImages: Array<{
    id: string
    productId: string
    variantId: string | null
    product: { id: string; name: string; slug: string }
    variant: { id: string; name: string; sku: string | null } | null
  }>
}
