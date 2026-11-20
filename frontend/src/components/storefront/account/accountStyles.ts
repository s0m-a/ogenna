'use client'

import styled, { keyframes } from 'styled-components'

/** Shared pieces for the customer account pages (matches checkout's header band). */

export const PageHeader = styled.header`
  background: ${({ theme }) => theme.colors.clay};
  padding: 2.25rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const Spinner = styled.span`
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.terracotta};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`

export const CenteredState = styled.div`
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`
