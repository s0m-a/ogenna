'use client'

import styled, { css } from 'styled-components'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary'

interface BadgeProps {
  $variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  success: css`
    background: ${({ theme }) => theme.colors.successBg};
    color: ${({ theme }) => theme.colors.success};
    border-color: ${({ theme }) => theme.colors.success}33;
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningBg};
    color: ${({ theme }) => theme.colors.warning};
    border-color: ${({ theme }) => theme.colors.warning}33;
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
    border-color: ${({ theme }) => theme.colors.danger}33;
  `,
  neutral: css`
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textSecondary};
    border-color: ${({ theme }) => theme.colors.border};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primary100};
    color: ${({ theme }) => theme.colors.primary500};
    border-color: ${({ theme }) => theme.colors.primary300};
  `,
}

export const StatusBadge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5625rem;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.03em;
  white-space: nowrap;
  line-height: 1.5;

  ${({ $variant = 'neutral' }) => variantStyles[$variant]}
`
