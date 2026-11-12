'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services/cart'
import { getCartToken, setCartToken } from '@/lib/cartToken'
import type { Cart } from '@/types/cart'

export const CART_KEY = 'cart'

const EMPTY_CART: Cart = {
  id: null,
  guestToken: null,
  items: [],
  itemCount: 0,
  subtotalAmount: 0,
  currencyCode: 'NGN',
}

export function useCart() {
  return useQuery({
    queryKey: [CART_KEY],
    queryFn: () => cartService.get(),
    // Don't hit the network for visitors that have never added anything.
    enabled: typeof window !== 'undefined' && Boolean(getCartToken()),
    staleTime: 30_000,
    placeholderData: EMPTY_CART,
  })
}

/**
 * Ensure a cart (and token) exists before mutating.
 * POST /cart returns the guestToken for first-time visitors.
 */
async function ensureCart(): Promise<void> {
  if (getCartToken()) return
  const cart = await cartService.getOrCreate()
  if (cart.guestToken) setCartToken(cart.guestToken)
}

export function useCartMutations() {
  const qc = useQueryClient()
  const setCart = (cart: Cart) => qc.setQueryData([CART_KEY], cart)

  const add = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      await ensureCart()
      return cartService.addItem(variantId, quantity)
    },
    onSuccess: setCart,
  })

  const update = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await qc.cancelQueries({ queryKey: [CART_KEY] })
      const previous = qc.getQueryData<Cart>([CART_KEY])
      if (previous) {
        const items = previous.items.map((i) =>
          i.id === itemId
            ? { ...i, quantity, lineTotalAmount: i.unitPriceAmount * quantity }
            : i,
        )
        const subtotalAmount = items.reduce((s, i) => s + i.lineTotalAmount, 0)
        const itemCount = items.reduce((s, i) => s + i.quantity, 0)
        setCart({ ...previous, items, subtotalAmount, itemCount })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) setCart(ctx.previous)
    },
    onSuccess: setCart,
  })

  const remove = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: [CART_KEY] })
      const previous = qc.getQueryData<Cart>([CART_KEY])
      if (previous) {
        const items = previous.items.filter((i) => i.id !== itemId)
        const subtotalAmount = items.reduce((s, i) => s + i.lineTotalAmount, 0)
        const itemCount = items.reduce((s, i) => s + i.quantity, 0)
        setCart({ ...previous, items, subtotalAmount, itemCount })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) setCart(ctx.previous)
    },
    onSuccess: setCart,
  })

  return { add, update, remove }
}
