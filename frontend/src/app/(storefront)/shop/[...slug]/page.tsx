import type { Metadata } from 'next'
import { ShopCollection } from '@/components/storefront/ShopCollection'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const label = titleCase(slug[slug.length - 1] ?? 'Shop')
  return { title: `${label} — Ogenna` }
}

export default async function ShopCategoryPage({ params }: PageProps) {
  const { slug } = await params

  // "new" is a convenience alias for newest arrivals — no category filter.
  const isNewest = slug.length === 1 && slug[0] === 'new'
  const categorySlug = isNewest ? undefined : slug[slug.length - 1]

  const trail = slug.map((segment, i) => ({
    label: titleCase(segment),
    href: i < slug.length - 1 ? `/shop/${slug.slice(0, i + 1).join('/')}` : undefined,
  }))

  return (
    <ShopCollection
      categorySlug={categorySlug}
      titleOverride={isNewest ? 'New arrivals' : undefined}
      trail={trail}
    />
  )
}
