'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

interface ShowcaseTile {
  heading: string
  ctaLabel: string
  ctaHref: string
  imageSrc: string
  imageAlt: string
  focal?: string
}

// TODO: source from /storefront/sections (Milestone 5 — Storefront Editor).
const COPY = {
  heading: 'New fabrics to love',
  body:
    'Freshly added fabrics — soft textures, earthy tones, and timeless prints, ready for your next creation.',
  ctaLabel: 'Shop now',
  ctaHref: '/shop/new',
}

const TILES: ShowcaseTile[] = [
  {
    heading: 'Quilted fabrics',
    ctaLabel: 'Shop here',
    ctaHref: '/shop/cotton/quilted',
    imageSrc: '/images/quiltedCotton.jpg',
    imageAlt: 'Stack of quilted cotton fabrics.',
    focal: 'center',
  },
  {
    heading: 'Always our favourite',
    ctaLabel: 'Explore muslins',
    ctaHref: '/shop/muslin',
    imageSrc: '/images/linenfabric3.jpg',
    imageAlt: 'Soft neutral muslin stack.',
    focal: 'center 55%',
  },
  {
    heading: 'Soft as a cloud',
    ctaLabel: 'Shop knits',
    ctaHref: '/shop/knits',
    imageSrc: '/images/cottonFabric.jpg',
    imageAlt: 'Stack of cream knitted fabrics.',
    focal: 'center 45%',
  },
]


const Wrap = styled.section`
  background: ${({ theme }) => theme.colors.background};
`

const Inner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingX};
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 3fr;
  gap: 2.5rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`


const CopyColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const Body = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  max-width: 320px;
`

const ctaChipStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 120ms ease;
`

const CopyCta = styled(Link)`
  ${ctaChipStyles}
  font-family: ${({ theme }) => theme.fonts.heading};
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  align-self: flex-start;

  &:hover { background: ${({ theme }) => theme.colors.terracottaDark}; }
`


const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
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

  ${Tile}:hover & { transform: scale(1.04); }
`

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 45%,
    rgba(44, 31, 20, 0.35) 100%
  );
  pointer-events: none;
`

const Overlay = styled.div`
  position: relative;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
`

const OverlayHeading = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textInverse};
  text-shadow: 0 1px 10px rgba(44, 31, 20, 0.3);
`

const TileCta = styled.span`
  ${ctaChipStyles}
  font-family: ${({ theme }) => theme.fonts.heading};
  background: ${({ theme }) => theme.colors.clayDark};
  color: ${({ theme }) => theme.colors.textInverse};

  ${Tile}:hover & {
    background: ${({ theme }) => theme.colors.terracotta};
  }
`

/* ── Component ───────────────────────────────────────────── */

export function NewFabricsShowcase() {
  return (
    <Wrap aria-label="New fabrics">
      <Inner>
        <CopyColumn>
          <Heading>{COPY.heading}</Heading>
          <Body>{COPY.body}</Body>
          <CopyCta href={COPY.ctaHref}>{COPY.ctaLabel}</CopyCta>
        </CopyColumn>

        <Tiles>
          {TILES.map((tile) => (
            <Tile key={tile.ctaHref} href={tile.ctaHref} aria-label={tile.heading}>
              <TileImage
                src={tile.imageSrc}
                alt={tile.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                $focal={tile.focal}
              />
              <Scrim aria-hidden />
              <Overlay>
                <OverlayHeading>{tile.heading}</OverlayHeading>
                <TileCta>{tile.ctaLabel}</TileCta>
              </Overlay>
            </Tile>
          ))}
        </Tiles>
      </Inner>
    </Wrap>
  )
}
