import { apiClient } from './apiClient'
import type {
  AddressInput,
  CustomerOrdersResponse,
  CustomerProfile,
  SavedAddress,
} from '@/types/customer'

export const customerService = {
  me: () => apiClient.get<CustomerProfile>('/customers/me'),

  updateMe: (body: { name: string }) => apiClient.patch<CustomerProfile>('/customers/me', body),

  myOrders: (page = 1, limit = 10) =>
    apiClient.get<CustomerOrdersResponse>(`/customers/me/orders?page=${page}&limit=${limit}`),
}

export const addressService = {
  list: () => apiClient.get<SavedAddress[]>('/customers/me/addresses'),

  create: (body: AddressInput) => apiClient.post<SavedAddress>('/customers/me/addresses', body),

  update: (id: string, body: Partial<AddressInput>) =>
    apiClient.patch<SavedAddress>(`/customers/me/addresses/${encodeURIComponent(id)}`, body),

  setDefault: (id: string) =>
    apiClient.post<SavedAddress>(`/customers/me/addresses/${encodeURIComponent(id)}/default`, {}),

  remove: (id: string) =>
    apiClient.delete<void>(`/customers/me/addresses/${encodeURIComponent(id)}`),
}
