'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'

interface HeroTile {
  title: string
  href: string
  cta?: string         // if omitted the title acts as the overlay label
  imageSrc: string
  imageAlt: string
  focal?: string       // CSS object-position value
}

// TODO: move to GET /api/v1/storefront/sections (Milestone 5 — Storefront Editor)
const TILES: HeroTile[] = [
  {
    title: "Vintage inspired",
    href: "/shop/vintage",
    imageSrc: "/images/linenfabric3.jpg",
    imageAlt: "Soft neutral linen fabrics folded on a bench.",
    focal: "center 65%",
  },
  {
    title: "New arrivals",
    cta: "Shop new arrivals",
    href: "/shop/new",
    imageSrc: "/images/linenFabric2.jpg",
    imageAlt: "Draped sage, terracotta and cream cotton fabrics.",
    focal: "center 55%",
  },
  {
    title: "Quilted cotton",
    cta: "Shop quilted cotton",
    href: "/shop/quilted-cotton",
    imageSrc: "/images/quiltedCotton.jpg",
    imageAlt: "Stack of patterned vintage-print quilted cotton fabrics.",
  },
];

/* ── Layout ──────────────────────────────────────────────── */

const Section = styled.section`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingX} 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1rem ${({ theme }) => theme.layout.pagePaddingXMobile} 0;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 0.375rem;
  }
`

/* ── Tile visuals ────────────────────────────────────────── */

const tileIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 12px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

const Tile = styled(Link)<{ $index: number }>`
  animation: ${tileIn} ${({ theme }) => theme.motion.revealDuration}
    ${({ theme }) => theme.motion.easeOut} backwards;
  animation-delay: ${({ $index, theme }) => $index * theme.motion.staggerMs}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textInverse};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    aspect-ratio: 4 / 3;
  }
`

const TileImage = styled(Image)<{ $focal?: string }>`
  object-fit: cover;
  object-position: ${({ $focal }) => $focal ?? 'center'};
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${Tile}:hover & {
    transform: scale(1.03);
  }
`

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 40%,
    rgba(44, 31, 20, 0.35) 100%
  );
  pointer-events: none;
`

const Overlay = styled.div`
  position: relative;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
`

const OverlayTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.textInverse};
  text-shadow: 0 1px 10px rgba(44, 31, 20, 0.25);

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const CtaChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  min-width: 220px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: background ${({ theme }) => theme.transitions.fast};

  ${Tile}:hover & {
    background: ${({ theme }) => theme.colors.clayDark};
  }
`

export function HeroGrid() {
  return (
    <Section aria-label="Featured collections">
      <Grid>
        {TILES.map((tile, idx) => (
          <Tile
            key={tile.href}
            href={tile.href}
            $index={idx}
            aria-label={tile.cta ?? tile.title}
          >
            <TileImage
              src={tile.imageSrc}
              alt={tile.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={idx === 0}
              $focal={tile.focal}
            />
            <Scrim aria-hidden />
            <Overlay>
              {tile.cta ? (
                <CtaChip>{tile.cta}</CtaChip>
              ) : (
                <OverlayTitle>{tile.title}</OverlayTitle>
              )}
            </Overlay>
          </Tile>
        ))}
      </Grid>
    </Section>
  )
}
