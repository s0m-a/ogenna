import axios from 'axios'
import { apiClient } from './apiClient'
import type {
  CloudinaryUploadResult,
  CreateMediaAssetPayload,
  MediaAsset,
  MediaFilters,
  MediaListResponse,
  MediaUsage,
  SignUploadResponse,
  UpdateMediaAssetPayload,
} from '@/types/media'

function buildQuery(filters: MediaFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.folder) params.set('folder', filters.folder)
  if (filters.resourceType) params.set('resourceType', filters.resourceType)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const mediaService = {
  list: (filters: MediaFilters = {}) =>
    apiClient.get<MediaListResponse>(`/admin/media${buildQuery(filters)}`),

  get: (id: string) => apiClient.get<MediaAsset>(`/admin/media/${id}`),

  usages: (id: string) => apiClient.get<MediaUsage>(`/admin/media/${id}/usages`),

  sign: (folder?: string) =>
    apiClient.post<SignUploadResponse>('/admin/media/sign', folder ? { folder } : {}),

  create: (payload: CreateMediaAssetPayload) =>
    apiClient.post<MediaAsset>('/admin/media', payload),

  update: (id: string, payload: UpdateMediaAssetPayload) =>
    apiClient.patch<MediaAsset>(`/admin/media/${id}`, payload),

  remove: (id: string) => apiClient.delete<MediaAsset>(`/admin/media/${id}`),

  async uploadToCloudinary(
    file: File,
    signed: SignUploadResponse,
    onProgress?: (percent: number) => void,
  ): Promise<CloudinaryUploadResult> {
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', signed.apiKey)
    form.append('timestamp', String(signed.timestamp))
    form.append('signature', signed.signature)
    form.append('folder', signed.folder)

    const endpoint = `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`
    const { data } = await axios.post<CloudinaryUploadResult>(endpoint, form, {
      onUploadProgress: (ev) => {
        if (!onProgress || !ev.total) return
        onProgress(Math.round((ev.loaded / ev.total) * 100))
      },
    })
    return data
  },
}
