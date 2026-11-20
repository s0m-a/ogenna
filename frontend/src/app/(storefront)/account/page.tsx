import type { Metadata } from 'next'
import { AccountPage } from '@/components/storefront/account/AccountPage'

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false },
}

export default function Page() {
  return <AccountPage />
}
