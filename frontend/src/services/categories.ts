import { apiClient } from './apiClient'
import type { Category, CategoryFormData } from '@/types/category'

export const categoriesService = {
  list: () =>
    apiClient.get<Category[]>('/admin/categories'),

  listPublic: () =>
    apiClient.get<Category[]>('/categories'),

  create: (data: CategoryFormData) =>
    apiClient.post<Category>('/admin/categories', data),

  update: (id: string, data: Partial<CategoryFormData>) =>
    apiClient.patch<Category>(`/admin/categories/${id}`, data),

  archive: (id: string) =>
    apiClient.delete<void>(`/admin/categories/${id}`),
}
