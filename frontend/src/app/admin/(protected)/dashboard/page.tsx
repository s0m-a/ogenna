'use client'

import styled from 'styled-components'
import { PageHeader } from '@/components/common/PageHeader'
import { PiShoppingCartLight, PiClockLight, PiPackageLight, PiTagLight } from 'react-icons/pi'
import type { IconType } from 'react-icons'

/* ── Types ─────────────────────────────────────────────────── */

interface MetricCard {
  label: string
  value: string | null
  Icon: IconType
  accent: 'default' | 'warning' | 'success' | 'primary'
}

/* ── Data ──────────────────────────────────────────────────── */

const METRIC_CARDS: MetricCard[] = [
  { label: 'Total Orders',        value: null, Icon: PiShoppingCartLight, accent: 'default'  },
  { label: 'Pending Orders',      value: null, Icon: PiClockLight,        accent: 'warning'  },
  { label: 'Published Products',  value: null, Icon: PiPackageLight,      accent: 'success'  },
  { label: 'Active Discounts',    value: null, Icon: PiTagLight,          accent: 'primary'  },
]

/* ── Styled components ────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
  margin-top: 1.75rem;
`

const accentIcon = {
  default: ({ theme }: { theme: any }) => `
    background: ${theme.colors.surfaceMuted};
    color: ${theme.colors.textSecondary};
  `,
  warning: ({ theme }: { theme: any }) => `
    background: ${theme.colors.warningBg};
    color: ${theme.colors.warning};
  `,
  success: ({ theme }: { theme: any }) => `
    background: ${theme.colors.successBg};
    color: ${theme.colors.success};
  `,
  primary: ({ theme }: { theme: any }) => `
    background: ${theme.colors.primary100};
    color: ${theme.colors.primary500};
  `,
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 1.375rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const CardLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  letter-spacing: 0.01em;
`

const IconWrap = styled.span<{ $accent: MetricCard['accent'] }>`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  ${({ $accent, theme }) => {
    const map: Record<MetricCard['accent'], string> = {
      default: `background:${theme.colors.surfaceMuted};color:${theme.colors.textSecondary};`,
      warning: `background:${theme.colors.warningBg};color:${theme.colors.warning};`,
      success: `background:${theme.colors.successBg};color:${theme.colors.success};`,
      primary: `background:${theme.colors.primary100};color:${theme.colors.primary500};`,
    }
    return map[$accent]
  }}
`

const CardValue = styled.p`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`

const Dash = styled.span`
  display: inline-block;
  width: 2rem;
  height: 3px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`

/* ── Component ─────────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's an overview of your store."
      />
      <Grid>
        {METRIC_CARDS.map(({ label, value, Icon, accent }) => (
          <Card key={label}>
            <CardTop>
              <CardLabel>{label}</CardLabel>
              <IconWrap $accent={accent} aria-hidden>
                <Icon size={15} />
              </IconWrap>
            </CardTop>
            <CardValue>
              {value ?? <Dash aria-label="No data" />}
            </CardValue>
          </Card>
        ))}
      </Grid>
    </>
  )
}
