import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collectionsService } from '@/services/collections'
import type { CollectionFormData } from '@/types/collection'

export const COLLECTIONS_KEY = 'collections'

export function useCollections() {
  return useQuery({
    queryKey: [COLLECTIONS_KEY],
    queryFn: () => collectionsService.list(),
  })
}

export function useCollectionMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })

  const create = useMutation({
    mutationFn: (data: CollectionFormData) => collectionsService.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CollectionFormData> }) =>
      collectionsService.update(id, data),
    onSuccess: invalidate,
  })

  const archive = useMutation({
    mutationFn: (id: string) => collectionsService.archive(id),
    onSuccess: invalidate,
  })

  return { create, update, archive }
}
