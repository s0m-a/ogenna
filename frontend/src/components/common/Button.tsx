'use client'

import styled, { css } from 'styled-components'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  $variant?: ButtonVariant
  $size?: ButtonSize
}

const sizeStyles = {
  sm: css`
    padding: 0.4375rem 0.875rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
  `,
  md: css`
    padding: 0.5625rem 1rem;
    font-size: ${({ theme }) => theme.fontSizes.base};
    border-radius: ${({ theme }) => theme.radii.md};
  `,
  lg: css`
    padding: 0.75rem 1.375rem;
    font-size: ${({ theme }) => theme.fontSizes.md};
    border-radius: ${({ theme }) => theme.radii.md};
  `,
}

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary400};
    color: ${({ theme }) => theme.colors.textInverse};
    border: 1px solid transparent;

    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primary500}; }
    &:active:not(:disabled) { background: ${({ theme }) => theme.colors.primary600}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textPrimary};
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surfaceMuted};
      border-color: ${({ theme }) => theme.colors.borderStrong};
    }
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.primary100};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.textSecondary};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surfaceMuted};
      color: ${({ theme }) => theme.colors.textPrimary};
    }
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.primary100};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.danger};
    color: #fff;
    border: 1px solid transparent;

    &:hover:not(:disabled) { opacity: 0.88; }
    &:active:not(:disabled) { opacity: 0.76; }
  `,
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    opacity ${({ theme }) => theme.transitions.fast};

  ${({ $size = 'md' }) => sizeStyles[$size]}
  ${({ $variant = 'primary' }) => variantStyles[$variant]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`
