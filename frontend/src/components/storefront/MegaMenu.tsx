'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

interface MenuGroup {
  label: string
  href: string
  items: Array<{ label: string; href: string }>
}

const COLUMNS: MenuGroup[][] = [
  [
    {
      label: 'Muslin',
      href: '/shop/muslin',
      items: [
        { label: 'Muslin — plain', href: '/shop/muslin/plain' },
        { label: 'Muslin — print', href: '/shop/muslin/print' },
        { label: 'Embroidered muslin', href: '/shop/muslin/embroidered' },
      ],
    },
    {
      label: 'Linen + viscose + satin',
      href: '/shop/linen-viscose-satin',
      items: [
        { label: 'Linen', href: '/shop/linen' },
        { label: 'Linen + viscose', href: '/shop/linen-viscose' },
        { label: 'Viscose', href: '/shop/viscose' },
        { label: 'Satin', href: '/shop/satin' },
      ],
    },
  ],
  [
    {
      label: 'Jersey',
      href: '/shop/jersey',
      items: [
        { label: 'Jersey — plain', href: '/shop/jersey/plain' },
        { label: 'Jersey — print', href: '/shop/jersey/print' },
        { label: 'Ribbed jersey', href: '/shop/jersey/ribbed' },
        { label: 'Waffle jersey', href: '/shop/jersey/waffle' },
        { label: 'Pointoille', href: '/shop/jersey/pointoille' },
      ],
    }
  ],
  [
    {
      label: 'French terry',
      href: '/shop/french-terry',
      items: [
        { label: 'French terry — plain', href: '/shop/french-terry/plain' },
        { label: 'French terry — print', href: '/shop/french-terry/print' },
      ],
    }
  ],
  [
    {
      label: 'Cotton',
      href: '/shop/cotton',
      items: [
        { label: 'Cotton waffle', href: '/shop/cotton/waffle' },
        { label: 'Cotton poplin', href: '/shop/cotton/poplin' },
        { label: 'Embroidered cotton', href: '/shop/cotton/embroidered' },
        { label: 'Corduroy', href: '/shop/cotton/corduroy' },
        { label: 'Quilted cotton', href: '/shop/cotton/quilted' },
        { label: 'Canvas', href: '/shop/cotton/canvas' },
        { label: 'Seersucker', href: '/shop/cotton/seersucker' },
      ],
    },
    {
      label: 'Luxury fabrics',
      href: '/shop/luxury',
      items: [],
    },
  ],
]

const FEATURE = {
  label: 'Featured',
  href: '/shop/featured',
  imageSrc: '/images/cottonFabric.jpg',
  imageAlt: 'Stack of cream knitted fabrics with a terracotta headband.',
}

/* ── Layout ──────────────────────────────────────────────── */

const Panel = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: 60;
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingX} 3rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr) 320px;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, 1fr);
    .feature-tile { display: none; }
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const GroupLabel = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;

  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const ChildLink = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.125rem 0;

  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

/* ── Feature tile ────────────────────────────────────────── */

const FeatureTile = styled(Link)`
  position: relative;
  min-height: 300px;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1.25rem;
  text-decoration: none;
`

const FeatureImage = styled(Image)`
  object-fit: cover;
  object-position: center;
`

const FeatureLabel = styled.span`
  position: relative;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`

export function MegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Panel role="menu" aria-label="Shop categories">
      <Inner>
        {COLUMNS.map((column, i) => (
          <Column key={i}>
            {column.map((group) => (
              <Group key={group.href}>
                <GroupLabel href={group.href} onClick={onNavigate}>
                  {group.label}
                </GroupLabel>
                {group.items.map((item) => (
                  <ChildLink
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </ChildLink>
                ))}
              </Group>
            ))}
          </Column>
        ))}

        <FeatureTile
          className="feature-tile"
          href={FEATURE.href}
          onClick={onNavigate}
        >
          <FeatureImage
            src={FEATURE.imageSrc}
            alt={FEATURE.imageAlt}
            fill
            sizes="320px"
          />
          <FeatureLabel>{FEATURE.label}</FeatureLabel>
        </FeatureTile>
      </Inner>
    </Panel>
  )
}
