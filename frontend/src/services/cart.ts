import { AxiosError } from 'axios'
import { axiosInstance, ApiError } from './apiClient'
import { getCartToken } from '@/lib/cartToken'
import type { Cart } from '@/types/cart'

const CART_TOKEN_HEADER = 'x-cart-token'

function headers() {
  const token = getCartToken()
  return token ? { [CART_TOKEN_HEADER]: token } : {}
}

function normalize(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const message =
      (err.response.data as { message?: string })?.message ?? 'Cart request failed'
    throw new ApiError(err.response.status, message)
  }
  throw err
}

export const cartService = {
  getOrCreate: () =>
    axiosInstance
      .post<Cart>('/cart', {}, { headers: headers() })
      .then((r) => r.data)
      .catch(normalize),

  get: () =>
    axiosInstance
      .get<Cart>('/cart', { headers: headers() })
      .then((r) => r.data)
      .catch(normalize),

  addItem: (variantId: string, quantity: number) =>
    axiosInstance
      .post<Cart>('/cart/items', { variantId, quantity }, { headers: headers() })
      .then((r) => r.data)
      .catch(normalize),

  updateItem: (itemId: string, quantity: number) =>
    axiosInstance
      .patch<Cart>(`/cart/items/${itemId}`, { quantity }, { headers: headers() })
      .then((r) => r.data)
      .catch(normalize),

  removeItem: (itemId: string) =>
    axiosInstance
      .delete<Cart>(`/cart/items/${itemId}`, { headers: headers() })
      .then((r) => r.data)
      .catch(normalize),
}
