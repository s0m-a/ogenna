import type { Metadata } from 'next'
import { ShopCollection } from '@/components/storefront/ShopCollection'

export const metadata: Metadata = {
  title: 'Sale — Ogenna',
}

export default function SalePage() {
  return (
    <ShopCollection
      onSale
      titleOverride="Sale"
      trail={[{ label: 'Sale' }]}
    />
  )
}
