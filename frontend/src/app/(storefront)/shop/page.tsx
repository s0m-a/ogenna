import type { Metadata } from 'next'
import { ShopCollection } from '@/components/storefront/ShopCollection'

export const metadata: Metadata = {
  title: 'All fabrics — Ogenna',
}

export default function ShopPage() {
  return <ShopCollection />
}
