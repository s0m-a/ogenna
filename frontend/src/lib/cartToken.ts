

const STORAGE_KEY = 'ogenna_cart_token'

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setCartToken(token: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, token)
}

export function clearCartToken(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
