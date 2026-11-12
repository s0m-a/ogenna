'use client'

import React from 'react'
import styled from 'styled-components'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`

const TextGroup = styled.div``

const Breadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
`

const Crumb = styled.a`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const CrumbSeparator = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.border};
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`

const Subtitle = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.snug};
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Wrapper>
      <TextGroup>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <CrumbSeparator aria-hidden>/</CrumbSeparator>}
                <Crumb href={crumb.href}>{crumb.label}</Crumb>
              </React.Fragment>
            ))}
            <CrumbSeparator aria-hidden>/</CrumbSeparator>
            <span
              style={{ fontSize: '0.8125rem', color: '#2c1f14', fontWeight: 500 }}
              aria-current="page"
            >
              {title}
            </span>
          </Breadcrumbs>
        )}
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TextGroup>

      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  )
}
