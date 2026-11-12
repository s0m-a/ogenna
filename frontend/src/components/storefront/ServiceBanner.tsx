'use client'

import styled from 'styled-components'

// TODO: source from storefront settings API (Milestone 5)
const SHIPPING_NOTICE =
  'Due to high order volume — please allow 3-7 days for your order to be shipped.'

const Wrap = styled.div`
  background: ${({ theme }) => theme.colors.sage};
  color: ${({ theme }) => theme.colors.textInverse};
  text-align: center;
  padding: 0.75rem 1rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.01em;
`

export function ServiceBanner() {
  return <Wrap role="status">{SHIPPING_NOTICE}</Wrap>
}
