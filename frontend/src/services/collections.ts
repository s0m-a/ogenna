import { apiClient } from './apiClient'
import type { Collection, CollectionFormData } from '@/types/collection'

export const collectionsService = {
  list: () =>
    apiClient.get<Collection[]>('/admin/collections'),

  create: (data: CollectionFormData) =>
    apiClient.post<Collection>('/admin/collections', data),

  update: (id: string, data: Partial<CollectionFormData>) =>
    apiClient.patch<Collection>(`/admin/collections/${id}`, data),

  archive: (id: string) =>
    apiClient.delete<void>(`/admin/collections/${id}`),
}
