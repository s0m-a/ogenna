import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesService } from '@/services/categories'
import type { CategoryFormData } from '@/types/category'

export const CATEGORIES_KEY = 'categories'

export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: () => categoriesService.list(),
  })
}

export function usePublicCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY, 'public'],
    queryFn: () => categoriesService.listPublic(),
    staleTime: 60_000,
  })
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] })

  const create = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.create(data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      categoriesService.update(id, data),
    onSuccess: invalidate,
  })

  const archive = useMutation({
    mutationFn: (id: string) => categoriesService.archive(id),
    onSuccess: invalidate,
  })

  return { create, update, archive }
}
