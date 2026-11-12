export interface Collection {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: { products: number }
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export interface CollectionFormData {
  name: string
  slug: string
  description?: string
}
