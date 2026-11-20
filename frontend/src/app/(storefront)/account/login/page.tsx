import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CustomerSignIn } from '@/components/storefront/account/CustomerSignIn'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomerSignIn />
    </Suspense>
  )
}
