import type { Metadata } from 'next'
import { StorefrontChrome } from '@/components/storefront/StorefrontChrome'

export const metadata: Metadata = {
  title: {
    template: '%s — Ogenna',
    default: 'Ogenna — Fabric for the makers',
  },
  description: 'Premium fabric for modern makers.',
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StorefrontChrome>{children}</StorefrontChrome>
}
