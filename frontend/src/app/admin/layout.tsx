import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s — Ogenna Admin',
    default: 'Ogenna Admin',
  },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
