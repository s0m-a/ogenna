'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

interface CategoryTile {
  label: string
  href: string
  imageSrc: string
  focal?: string
}

// One row of four. Rough matches against existing fabric shots — swap
// imageSrc when real category photos land in the media library.
// TODO: move to GET /api/v1/storefront/sections (Milestone 5)
const TILES: CategoryTile[] = [
  { label: 'Jersey', href: '/shop/jersey', imageSrc: '/images/cottonFabric.jpg', focal: 'center 40%' },
  { label: 'Embroidered muslin', href: '/shop/muslin/embroidered', imageSrc: '/images/linenfabric.jpg' },
  { label: 'Muslin prints', href: '/shop/muslin/print', imageSrc: '/images/quiltedCotton.jpg' },
  { label: 'Ribbed jersey', href: '/shop/jersey/ribbed', imageSrc: '/images/cottonFabric4.jpg' },
]

/* ── Styled ──────────────────────────────────────────────── */

const Wrap = styled.section`
  background: ${({ theme }) => theme.colors.background};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.wideMaxWidth};
  margin: 0 auto;
  padding: 3rem ${({ theme }) => theme.layout.pagePaddingXWide};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Tile = styled(Link)`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  aspect-ratio: 3 / 4;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

const TileImage = styled(Image)<{ $focal?: string }>`
  object-fit: cover;
  object-position: ${({ $focal }) => $focal ?? 'center'};
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${Tile}:hover & {
    transform: scale(1.04);
  }
`

const LabelChip = styled.span`
  position: relative;
  margin: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clayDark};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast};

  ${Tile}:hover & {
    background: ${({ theme }) => theme.colors.terracotta};
  }
`

/* ── Component ───────────────────────────────────────────── */

export function CategoryGrid() {
  return (
    <Wrap aria-label="Shop by category">
      <Inner>
        <Grid>
          {TILES.map((tile) => (
            <Tile key={tile.href} href={tile.href} aria-label={tile.label}>
              <TileImage
                src={tile.imageSrc}
                alt={tile.label}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                $focal={tile.focal}
              />
              <LabelChip>{tile.label}</LabelChip>
            </Tile>
          ))}
        </Grid>
      </Inner>
    </Wrap>
  )
}
