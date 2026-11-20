'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AdminLayout } from '@/components/admin/AdminLayout'
import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`

const LoadingSpinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary400};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isStaff, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Customers are signed in too, but the admin area is staff-only.
    if (!isLoading && (!user || !isStaff)) {
      router.replace('/admin/login')
    }
  }, [isLoading, user, isStaff, router])

  if (isLoading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />
      </LoadingScreen>
    )
  }

  if (!user || !isStaff) return null

  return (
    <AdminLayout
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen((v) => !v)}
      onSidebarClose={() => setSidebarOpen(false)}
    >
      {children}
    </AdminLayout>
  )
}
