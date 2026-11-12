import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mediaService } from '@/services/media'
import type {
  CreateMediaAssetPayload,
  MediaFilters,
  UpdateMediaAssetPayload,
} from '@/types/media'

export const MEDIA_KEY = 'media'

export function useMediaList(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: [MEDIA_KEY, 'list', filters],
    queryFn: () => mediaService.list(filters),
    placeholderData: (prev) => prev,
  })
}

export function useMediaAsset(id: string | null) {
  return useQuery({
    queryKey: [MEDIA_KEY, 'detail', id],
    queryFn: () => mediaService.get(id as string),
    enabled: !!id,
  })
}

export function useMediaUsages(id: string | null) {
  return useQuery({
    queryKey: [MEDIA_KEY, 'usages', id],
    queryFn: () => mediaService.usages(id as string),
    enabled: !!id,
  })
}

export function useMediaMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [MEDIA_KEY] })

  const create = useMutation({
    mutationFn: (payload: CreateMediaAssetPayload) => mediaService.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMediaAssetPayload }) =>
      mediaService.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => mediaService.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
