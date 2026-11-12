export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  parent?: Pick<Category, 'id' | 'name' | 'slug'> | null
  children?: Category[]
  _count?: { products: number }
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export interface CategoryFormData {
  name: string
  slug: string
  parentId?: string
}
