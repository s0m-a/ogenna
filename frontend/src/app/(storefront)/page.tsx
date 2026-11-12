import type { Metadata } from 'next'
import { StorefrontHome } from '@/components/storefront/StorefrontHome'

export const metadata: Metadata = {
  title: 'Ogenna — Fabric for the makers',
}

export default function HomePage() {
  return <StorefrontHome />
}
