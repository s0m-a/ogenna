'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'
import { Heart } from 'lucide-react'

// TODO: wire grid tiles to admin "promo" assets once the Storefront Editor lands (Milestone 5).
const GRID_IMAGES = [
  { src: '/images/stripeLinen.jpg', alt: 'Striped linen fabrics in soft colours.', focal: 'center' },
  { src: '/images/linenfabric3.jpg', alt: 'Neutral linen stack on a bench.', focal: 'center' },
  { src: '/images/cottonFabric.jpg', alt: 'Cream knitted fabrics.', focal: 'center 40%' },
  { src: '/images/cottonFabric3.jpg', alt: 'Draped sage, terracotta and cream fabrics.', focal: 'center 55%' },
  { src: '/images/quiltedCotton.jpg', alt: 'Patterned vintage prints stack.', focal: 'center' },
  { src: '/images/linenfabric.jpg', alt: 'Cream linen with frayed edges.', focal: 'center' },
  { src: '/images/linenFabric2.jpg', alt: 'Neutral linens with eucalyptus.', focal: 'center 40%' },
  { src: '/images/cottonFabric4.jpg', alt: 'Pink and magenta knit stack.', focal: 'center' },
  { src: '/images/quiltedFabric.jpg', alt: 'Colourful knit textures.', focal: 'center' },
]

// TODO: source from `/storefront/promos` (Milestone 5).
const COPY = {
  heading: '-35% off',
  body: 'Shop summer favourites — 35% off.',
  note: 'For 3 days only.',
  ctaLabel: 'Shop here',
  ctaHref: '/sale',
}

// Three tiles that show a wishlist heart (indices into GRID_IMAGES).
const HEART_INDICES = new Set([2, 6, 7])

/* ── Layout ──────────────────────────────────────────────── */

const Wrap = styled.section`
  width: 98%;
  height: 100vh;
  margin: 3rem auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
    height: auto;
    margin: 2rem auto;
  }
`

const Split = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    height: auto;
  }
`

/* ── Grid side ───────────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;
  height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    height: auto;
    aspect-ratio: 1 / 1;
  }
`

const Tile = styled.div`
  position: relative;
  min-height: 0;
  min-width: 0;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  overflow: hidden;
`

const TileImage = styled(Image)<{ $focal: string }>`
  object-fit: cover;
  object-position: ${({ $focal }) => $focal};
`

const HeartButton = styled.button`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textInverse};
  cursor: pointer;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover { transform: scale(1.1); }
`

/* ── Copy side ───────────────────────────────────────────── */

const Copy = styled.div`

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  text-align: center;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2.5rem 1.5rem;
  }
`

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  color: ${({ theme }) => theme.colors.primary600};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const Body = styled.p`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.primary500};
  margin-top: 0.75rem;
`

const Note = styled.p`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Cta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  padding: 0.875rem 2.5rem;
  min-width: 180px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.clayDark}; }
`

/* ── Component ───────────────────────────────────────────── */

export function PromoSplit() {
  return (
    <Wrap aria-label="Seasonal promotion">
      <Split>
        <Grid>
          {GRID_IMAGES.map((img, i) => (
            <Tile key={img.src}>
              <TileImage
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 33vw, 17vw"
                $focal={img.focal}
              />
              {HEART_INDICES.has(i) && (
                <HeartButton
                  type="button"
                  aria-label={`Save ${img.alt} to wishlist`}
                  /* TODO: wire to wishlist when the account/wishlist flow ships */
                >
                  <Heart size={18} strokeWidth={2} fill="currentColor" />
                </HeartButton>
              )}
            </Tile>
          ))}
        </Grid>

        <Copy>
          <Heading>{COPY.heading}</Heading>
          <Body>{COPY.body}</Body>
          <Note>{COPY.note}</Note>
          <Cta href={COPY.ctaHref}>{COPY.ctaLabel}</Cta>
        </Copy>
      </Split>
    </Wrap>
  )
}
