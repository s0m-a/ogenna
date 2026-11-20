import { AxiosError } from 'axios'
import { apiClient, axiosInstance, ApiError } from './apiClient'
import { getCartToken } from '@/lib/cartToken'
import type {
  AdminOrder,
  AdminOrderListResponse,
  CheckoutPayload,
  CreateOrderResponse,
  OrderFilters,
  OrderStatus,
  OrderVerification,
  PublicOrder,
} from '@/types/order'

function normalize(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const raw = (err.response.data as { message?: string | string[] })?.message
    const message = Array.isArray(raw) ? raw.join(' ') : raw ?? 'Checkout request failed'
    throw new ApiError(err.response.status, message)
  }
  throw err
}

function buildQuery(filters: OrderFilters): string {
  const params = new URLSearchParams()
  if (filters.search)        params.set('search',        filters.search)
  if (filters.status)        params.set('status',        filters.status)
  if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus)
  if (filters.page)          params.set('page',          String(filters.page))
  params.set('limit', String(filters.limit ?? 20))
  return `?${params.toString()}`
}

export const ordersService = {
  /** Converts the current cart into an order and returns the Paystack payment URL. */
  create: (payload: CheckoutPayload) => {
    const token = getCartToken()
    return axiosInstance
      .post<CreateOrderResponse>('/orders', payload, {
        headers: token ? { 'x-cart-token': token } : {},
      })
      .then((r) => r.data)
      .catch(normalize)
  },

  get: (reference: string) =>
    apiClient.get<PublicOrder>(`/orders/${encodeURIComponent(reference)}`),

  /** Payment state for display, backed by Paystack Verify Transaction on the server. */
  verify: (reference: string) =>
    apiClient.get<OrderVerification>(`/orders/${encodeURIComponent(reference)}/verify`),

  adminList: (filters: OrderFilters = {}) =>
    apiClient.get<AdminOrderListResponse>(`/admin/orders${buildQuery(filters)}`),

  adminGet: (id: string) => apiClient.get<AdminOrder>(`/admin/orders/${id}`),

  adminUpdateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<AdminOrder>(`/admin/orders/${id}/status`, { status }),
}
