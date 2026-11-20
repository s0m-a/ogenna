import type { Metadata } from 'next'
import { ShopCollection } from '@/components/storefront/ShopCollection'

interface ShopPageProps {
  searchParams: Promise<{ q?: string | string[] }>
}

/** First `q` value, trimmed and capped like the search API. */
function readQuery(q: string | string[] | undefined) {
  const value = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 80)
  return value && value.length >= 2 ? value : undefined
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const search = readQuery((await searchParams).q)
  return {
    title: search ? `Search: ${search} — Ogenna` : 'All fabrics — Ogenna',
    // Result pages for arbitrary terms shouldn't be indexed.
    ...(search && { robots: { index: false } }),
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const search = readQuery((await searchParams).q)
  // Keyed so a new search starts on page 1 with relevance sorting.
  return <ShopCollection key={search ?? ''} search={search} />
}
