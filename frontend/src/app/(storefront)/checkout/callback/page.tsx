import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PaymentCallback } from '@/components/storefront/OrderStatusView'

export const metadata: Metadata = {
  title: 'Payment status',
  robots: { index: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentCallback />
    </Suspense>
  )
}
