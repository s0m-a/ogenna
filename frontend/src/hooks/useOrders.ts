'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '@/services/orders'
import { clearCartToken } from '@/lib/cartToken'
import { CART_KEY } from './useCart'
import { INVENTORY_KEY } from './useInventory'
import type { CheckoutPayload, OrderFilters, OrderStatus, PaymentDisplayState } from '@/types/order'

export const ORDERS_KEY = 'orders'

export function useCreateOrder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => ordersService.create(payload),
    onSuccess: () => {
      // The cart is now an order; the next add-to-cart starts a fresh one.
      clearCartToken()
      qc.removeQueries({ queryKey: [CART_KEY] })
    },
  })
}

/** How often to re-check, per payment state. Settled states stop polling. */
const POLL_MS: Partial<Record<PaymentDisplayState, number>> = {
  confirming: 3_000,
  awaiting_transfer: 15_000,
  not_completed: 30_000,
}

export function useOrderVerification(reference: string | null) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'verify', reference],
    queryFn: () => ordersService.verify(reference!),
    enabled: Boolean(reference),
    retry: 1,
    refetchInterval: (query) => {
      const state = query.state.data?.payment.state
      return state ? POLL_MS[state] ?? false : false
    },
  })
}

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'admin', 'list', filters],
    queryFn: () => ordersService.adminList(filters),
    staleTime: 10_000,
  })
}

export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'admin', 'detail', id],
    queryFn: () => ordersService.adminGet(id!),
    enabled: Boolean(id),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.adminUpdateStatus(id, status),
    // Cancelling a paid order restocks it, so inventory views are stale too.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, 'admin'] })
      qc.invalidateQueries({ queryKey: [INVENTORY_KEY] })
    },
  })
}
