'use client'

import styled from 'styled-components'
import { PiCaretDownLight } from 'react-icons/pi'

// Display-only for now. Switching logic is a later milestone.
const Wrap = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0.375rem 0.875rem;
  }
`

const Selector = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.25rem 0.375rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const Flag = styled.span`
  width: 18px;
  height: 12px;
  border-radius: 1px;
  background: linear-gradient(
    to bottom,
    #008751 0 33%,
    #ffffff 33% 66%,
    #008751 66% 100%
  );
  display: inline-block;
  flex-shrink: 0;
`

export function LocaleBar() {
  return (
    <Wrap>
      <Selector type="button" aria-label="Change language">
        English
        <PiCaretDownLight size={12} />
      </Selector>
      <Selector type="button" aria-label="Change currency">
        <Flag aria-hidden />
        NGN ₦
        <PiCaretDownLight size={12} />
      </Selector>
    </Wrap>
  )
}
