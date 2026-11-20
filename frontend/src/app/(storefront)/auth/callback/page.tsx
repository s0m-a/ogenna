import type { Metadata } from 'next'
import { OAuthCallback } from '@/components/storefront/account/OAuthCallback'

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false },
}

export default function Page() {
  return <OAuthCallback />
}
