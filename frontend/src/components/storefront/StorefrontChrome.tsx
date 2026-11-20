'use client'

import styled from 'styled-components'
import { AnnouncementMarquee } from './AnnouncementMarquee'
import { ServiceBanner } from './ServiceBanner'
import { LocaleBar } from './LocaleBar'
import { StorefrontHeader } from './StorefrontHeader'
import { StorefrontFooter } from './StorefrontFooter'
import { CartDrawerProvider } from './CartDrawerProvider'
import { CartDrawer } from './CartDrawer'

const Shell = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
`

const Main = styled.main`
  flex: 1;
`

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartDrawerProvider>
      <Shell>
        {/* <AnnouncementMarquee /> */}
        <ServiceBanner />
        <LocaleBar />
        <StorefrontHeader />
        <Main>{children}</Main>
        <StorefrontFooter />
      </Shell>
      <CartDrawer />
    </CartDrawerProvider>
  )
}
