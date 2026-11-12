'use client'

import { useEffect, useState } from 'react'
import type { ProductListItem } from '@/types/product'

// Storage strategy: localStorage for anonymous visitors.
// TODO: when a signed-in customer session exists, fetch + mutate a
// `user_views` record via the account API instead, and hydrate this hook
// from the server on first mount. Keep the same shape so consumers don't
// need to change.

const STORAGE_KEY = 'ogenna_recently_viewed'
const MAX_ENTRIES = 10
// Window event we dispatch on every mutation so other mounted instances
// react immediately in the same tab (localStorage events only fire cross-tab).
const UPDATE_EVENT = 'ogenna:recently-viewed-updated'

export type RecentlyViewedItem = Pick<
  ProductListItem,
  'id' | 'name' | 'slug' | 'coverImage' | 'priceMin' | 'priceMax' | 'totalStock'
>

function readStore(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RecentlyViewedItem[]) : []
  } catch {
    return []
  }
}

function writeStore(items: RecentlyViewedItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
}

/** Push the given product to the front of the recently-viewed list. */
export function useTrackRecentlyViewed(item: RecentlyViewedItem | null) {
  useEffect(() => {
    if (!item) return
    const current = readStore()
    const deduped = current.filter((entry) => entry.id !== item.id)
    writeStore([item, ...deduped].slice(0, MAX_ENTRIES))
  }, [item?.id]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Read the current recently-viewed list, excluding an optional id. */
export function useRecentlyViewed(excludeId?: string): RecentlyViewedItem[] {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    const sync = () => setItems(readStore())
    sync()

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(UPDATE_EVENT, sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(UPDATE_EVENT, sync)
    }
  }, [])

  return excludeId ? items.filter((i) => i.id !== excludeId) : items
}
