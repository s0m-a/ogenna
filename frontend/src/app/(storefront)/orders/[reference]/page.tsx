import type { Metadata } from 'next'
import { OrderStatusView } from '@/components/storefront/OrderStatusView'

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false },
}

export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  return <OrderStatusView reference={decodeURIComponent(reference)} />
}
