'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

interface PrintTile {
  label: string
  href: string
  imageSrc: string
  focal?: string
}

const TILES: PrintTile[] = [
  {
    label: 'Embroideries',
    href: '/shop/embroideries',
    imageSrc: '/images/linenfabric.jpg',
    focal: 'center 40%',
  },
  {
    label: 'Tiny florals',
    href: '/shop/tiny-florals',
    imageSrc: '/images/quiltedCotton.jpg',
    focal: 'center 20%',
  },
  {
    label: 'Checkers',
    href: '/shop/checkers',
    imageSrc: '/images/cottonFabric2.jpg',
    focal: 'center top',
  },
  {
    label: 'Stripes',
    href: '/shop/stripes',
    imageSrc: '/images/stripeLinen.jpg',
    focal: 'center',
  },
  {
    label: 'Bold florals',
    href: '/shop/bold-florals',
    imageSrc: '/images/quiltedFabric.jpg',
    focal: 'center 20%',
  },
  {
    label: 'Kids prints',
    href: '/shop/kids-prints',
    imageSrc: '/images/cottonFabric4.jpg',
    focal: 'center',
  },
]

/* ── Layout ──────────────────────────────────────────────── */

const Wrap = styled.section`
 
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const Subtitle = styled.p`
  margin-top: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Grid = styled.div`
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(6, 140px);
  justify-content: center;
  gap: 0.3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 140px);
    row-gap: 2rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 140px);
  }
`

const Tile = styled(Link)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
`

const Bubble = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

const BubbleImage = styled(Image)<{ $focal?: string }>`
  object-fit: cover;
  object-position: ${({ $focal }) => $focal ?? 'center'};
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${Tile}:hover & {
    transform: scale(1.06);
  }
`

const Label = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.02em;
  text-underline-offset: 4px;

  ${Tile}:hover &,
  ${Tile}:focus-visible & {
    text-decoration: underline;
  }
`

export function ShopByPrint() {
  return (
    <Wrap aria-label="Shop by print">
      <Inner>
        <Heading>Shop by print</Heading>
        <Subtitle>Find the perfect fabric for your next project</Subtitle>

        <Grid>
          {TILES.map((tile) => (
            <Tile key={tile.href} href={tile.href}>
              <Bubble>
                <BubbleImage
                  src={tile.imageSrc}
                  alt={tile.label}
                  fill
                  sizes="140px"
                  $focal={tile.focal}
                />
              </Bubble>
              <Label>{tile.label}</Label>
            </Tile>
          ))}
        </Grid>
      </Inner>
    </Wrap>
  )
}
