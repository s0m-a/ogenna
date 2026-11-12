'use client'

import React from 'react'
import styled from 'styled-components'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
  sidebarOpen: boolean
  onSidebarToggle: () => void
  onSidebarClose: () => void
}

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
`

const SidebarSlot = styled.div`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const ContentColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const Main = styled.main`
  flex: 1;
  padding: 2rem 2rem 3rem;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.25rem 1rem 2rem;
  }
`

export function AdminLayout({
  children,
  sidebarOpen,
  onSidebarToggle,
  onSidebarClose,
}: AdminLayoutProps) {
  return (
    <Shell>
      <SidebarSlot aria-hidden />
      <AdminSidebar isOpen={sidebarOpen} onClose={onSidebarClose} />

      <ContentColumn>
        <AdminHeader onMenuToggle={onSidebarToggle} />
        <Main>{children}</Main>
      </ContentColumn>
    </Shell>
  )
}
