import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { productsService } from '@/services/products'
import { PRODUCTS_KEY } from './useProducts'

/** Must match SEARCH_TERM_MIN / SEARCH_TERM_MAX on the backend. */
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_MAX_LENGTH = 80
/** Wait this long after the last keystroke before searching. */
const DEBOUNCE_MS = 300

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/**
 * Instant product search while typing. Debounced, and an in-flight request is
 * cancelled when the term changes. Keeps the last results on screen meanwhile.
 */
export function useProductSearch(rawTerm: string, limit = 8) {
  const term = useDebouncedValue(rawTerm.trim(), DEBOUNCE_MS)
  const enabled = term.length >= SEARCH_MIN_LENGTH

  const query = useQuery({
    queryKey: [PRODUCTS_KEY, 'search', term, limit],
    // React Query aborts this request if the term changes before it returns.
    queryFn: ({ signal }) => productsService.search(term, limit, signal),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    term,
    enabled,
    /** True while the typed text hasn't been searched yet. */
    isPending: rawTerm.trim() !== term || (enabled && query.isFetching),
  }
}
