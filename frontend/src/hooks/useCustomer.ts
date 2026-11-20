'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addressService, customerService } from '@/services/customers'
import { useAuth } from '@/hooks/useAuth'
import type { AddressInput, CustomerProfile } from '@/types/customer'

const PROFILE_KEY = ['customer', 'me'] as const

export function useCustomerProfile() {
  const { user } = useAuth()
  return useQuery({
    // Keyed on the user so switching accounts never shows the previous profile.
    queryKey: [...PROFILE_KEY, user?.id],
    queryFn: () => customerService.me(),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  })
}

export function useCustomerOrders(page: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['customer', 'orders', user?.id, page],
    queryFn: () => customerService.myOrders(page),
    enabled: Boolean(user),
    placeholderData: (previous) => previous,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (name: string) => customerService.updateMe({ name }),
    onSuccess: (profile: CustomerProfile) => {
      qc.setQueryData([...PROFILE_KEY, user?.id], profile)
    },
  })
}

/* ── Address book ───────────────────────────────────────── */

export function useAddresses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['customer', 'addresses', user?.id],
    queryFn: () => addressService.list(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })
}

export function useAddressMutations() {
  const qc = useQueryClient()
  const { user } = useAuth()
  // Defaults move between rows, so refetch the list rather than patching it.
  const refresh = () => qc.invalidateQueries({ queryKey: ['customer', 'addresses', user?.id] })

  return {
    create: useMutation({
      mutationFn: (input: AddressInput) => addressService.create(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
        addressService.update(id, input),
      onSuccess: refresh,
    }),
    setDefault: useMutation({
      mutationFn: (id: string) => addressService.setDefault(id),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => addressService.remove(id),
      onSuccess: refresh,
    }),
  }
}
