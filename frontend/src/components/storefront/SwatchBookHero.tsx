'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PiArrowRightLight } from 'react-icons/pi'
import styled, { css, keyframes } from 'styled-components'
import { useScrollProgress } from '@/hooks/useScrollProgress'

/** Where a card rests in the desktop fan, and how far it travels as the fan opens on scroll. */
interface FanPlacement {
  x: 'left' | 'right'
  inset: number // % from the chosen side
  top: number // % from the top of the stage
  rotate: number // resting tilt, deg
  spread: [number, number, number] // scroll travel: dx px, dy px, extra tilt deg
}

interface HeroSwatch {
  code: string
  label: string
  href: string
  src: string
  alt: string
  focal?: string // CSS object-position value
  fan: FanPlacement
}

// TODO: move to GET /api/v1/storefront/sections (Milestone 5 — Storefront Editor)
// Placeholder imagery — see the replacement guide in the handover notes.
const HERO = {
  eyebrow: 'Linen · Cotton · Quilted prints',
  headline: ['Fabric for the', 'things you'],
  headlineAccent: 'make.',
  tagline:
    'Natural linens, soft cottons and characterful prints, cut to your length and chosen for how they drape, wash and wear.',
  cta: { label: 'Shop fabrics', href: '/shop' },
  backdrop: {
    src: '/images/linenfabric.jpg',
    alt: 'Stacks of natural linen fabric against a dark backdrop.',
    focal: 'center 58%',
  },
  swatches: [
    {
      code: 'No. 01',
      label: 'Linen',
      href: '/shop/linen-viscose',
      src: '/images/linenfabric3.jpg',
      alt: 'Soft neutral linen fabrics folded on a bench.',
      fan: { x: 'left', inset: 3, top: 5, rotate: -8, spread: [-70, -40, -5] },
    },
    {
      code: 'No. 02',
      label: 'Quilted cotton',
      href: '/shop/quilted-cotton',
      src: '/images/quiltedFabric.jpg',
      alt: 'Patterned quilted cotton fabric.',
      fan: { x: 'left', inset: 8, top: 49, rotate: 5, spread: [-90, 50, 6] },
    },
    {
      code: 'No. 03',
      label: 'New arrivals',
      href: '/shop/new',
      src: '/images/fabricRolls.jpg',
      alt: 'Rolls of fabric stacked on a shelf.',
      fan: { x: 'right', inset: 4, top: 3, rotate: 7, spread: [70, -40, 5] },
    },
    {
      code: 'No. 04',
      label: 'Cotton',
      href: '/shop/cotton',
      src: '/images/cottonFabric2.jpg',
      alt: 'Soft cotton fabric in muted tones.',
      fan: { x: 'right', inset: 8, top: 51, rotate: -6, spread: [90, 50, -6] },
    },
  ] as HeroSwatch[],
}

/* ── Motion ──────────────────────────────────────────────── */

// A card drops in and sways to rest, like cloth settling onto a table.
const settle = keyframes`
  0%   { opacity: 0; transform: translate3d(0, -70px, 0) rotate(-9deg); }
  45%  { opacity: 1; }
  60%  { transform: translate3d(0, 6px, 0) rotate(3deg); }
  80%  { transform: translate3d(0, -2px, 0) rotate(-1.2deg); }
  100% { transform: none; }
`

const rise = keyframes`
  from { transform: translate3d(0, 105%, 0); }
  to   { transform: none; }
`

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 12px, 0); }
  to   { opacity: 1; transform: none; }
`

const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

// Choreography (ms): copy rises first, then the cards fall in around it.
const T = {
  eyebrow: 150,
  headline: 250,
  tagline: 650,
  cta: 800,
  cards: 500,
  cardStagger: 150,
}

/* ── Layout ──────────────────────────────────────────────── */

const Section = styled.section`
  /* Pull the photo up underneath the transparent header. */
  margin-top: calc(-1 * ${({ theme }) => theme.layout.storefrontHeaderHeight});

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: calc(-1 * ${({ theme }) => theme.layout.storefrontHeaderHeightMobile});
  }
`

const Stage = styled.div`
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: clamp(40rem, 96svh, 62rem);
  padding: calc(${({ theme }) => theme.layout.storefrontHeaderHeight} + 3rem) 1.5rem 4rem;
  background-color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;

  /* Dissolve the photo into the page so the next section follows on softly. */
  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    z-index: -1;
    height: clamp(8rem, 22%, 14rem);
    background: linear-gradient(
      180deg,
      transparent 0%,
      ${({ theme }) => theme.colors.background} 100%
    );
    pointer-events: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
    min-height: 0;
    padding: calc(${({ theme }) => theme.layout.storefrontHeaderHeight} + 2.5rem) 0 2.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: calc(${({ theme }) => theme.layout.storefrontHeaderHeightMobile} + 2rem) 0 2rem;
  }
`

const backdropSettle = keyframes`
  from { transform: scale(1.08); }
  to   { transform: none; }
`

/** Full-bleed photo; drifts slower than the page as it scrolls away. */
const Backdrop = styled.div`
  position: absolute;
  inset: -2rem 0;
  z-index: -1;
  transform: translate3d(0, calc(var(--hero-progress, 0) * 120px), 0);
  will-change: transform;

  img {
    object-fit: cover;
    animation: ${backdropSettle} 2400ms ${({ theme }) => theme.motion.easeOut} backwards;
    ${reducedMotion}
  }

  /* Darken the top for the header and the centre for the headline. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 50% at 50% 52%, ${({ theme }) => theme.colors.scrim}, transparent),
      linear-gradient(
        180deg,
        ${({ theme }) => theme.colors.scrim} 0%,
        ${({ theme }) => theme.colors.scrimSoft} 30%,
        ${({ theme }) => theme.colors.scrimSoft} 100%
      );
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    will-change: auto;
  }
`

const BackdropImage = styled(Image)<{ $focal?: string }>`
  object-position: ${({ $focal }) => $focal ?? 'center'};
`

/* ── Copy ────────────────────────────────────────────────── */

const Copy = styled.div`
  position: relative;
  z-index: 2;
  max-width: 40rem;
  text-align: center;
  text-shadow: 0 1px 24px ${({ theme }) => theme.colors.scrim};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary200};
  margin-bottom: 1.25rem;
  animation: ${fadeUp} 700ms ${({ theme }) => theme.motion.easeOut} ${T.eyebrow}ms backwards;
  ${reducedMotion}

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-bottom: 0.75rem;
  }
`

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  font-size: ${({ theme }) => theme.fontSizes.display};
  line-height: 1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.textInverse};

  em {
    font-family: ${({ theme }) => theme.fonts.nav};
    font-style: italic;
    color: ${({ theme }) => theme.colors.primary300};
  }
`

/** Clips each line so it can rise into view. */
const LineMask = styled.span`
  display: block;
  overflow: hidden;
  padding-bottom: 0.08em;
`

const LineText = styled.span<{ $index: number }>`
  display: block;
  animation: ${rise} 1000ms ${({ theme }) => theme.motion.easeDrape}
    ${({ $index }) => T.headline + $index * 120}ms backwards;
  ${reducedMotion}
`

const Tagline = styled.p`
  max-width: 34ch;
  margin: 1.25rem auto 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.primary100};
  animation: ${fadeUp} 800ms ${({ theme }) => theme.motion.easeOut} ${T.tagline}ms backwards;
  ${reducedMotion}

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: 0.875rem;
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

const PrimaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  margin-top: 1.75rem;
  padding: 0 1.75rem 0 2rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary500};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  text-shadow: none;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: background-color ${({ theme }) => theme.transitions.base};
  animation: ${fadeUp} 800ms ${({ theme }) => theme.motion.easeOut} ${T.cta}ms backwards;
  ${reducedMotion}

  svg {
    transition: transform ${({ theme }) => theme.transitions.slow};
  }

  &:hover,
  &:active {
    background-color: ${({ theme }) => theme.colors.primary600};
  }

  &:hover svg {
    transform: translateX(4px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: 1.25rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: flex;
    width: 100%;
  }
`

/* ── Swatch cards ────────────────────────────────────────── */

const Fan = styled.ul`
  position: absolute;
  inset: ${({ theme }) => theme.layout.storefrontHeaderHeight} 0 0;
  z-index: 1;
  padding: 0;
  pointer-events: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: relative;
    inset: auto;
    display: flex;
    width: 100%;
    margin-top: 2.5rem;
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingX} 1.75rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: ${({ theme }) => theme.layout.pagePaddingX};
    scrollbar-width: none;
    pointer-events: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: 1.75rem;
    padding-inline: ${({ theme }) => theme.layout.pagePaddingXMobile};
    scroll-padding-inline: ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

/** Positions a card in the fan; on scroll the fan opens and each card drifts outward. */
const CardSlot = styled.li<{ $fan: FanPlacement; $index: number }>`
  --r: ${({ $fan }) => $fan.rotate}deg;

  position: absolute;
  ${({ $fan }) => $fan.x}: ${({ $fan }) => $fan.inset}%;
  top: ${({ $fan }) => $fan.top}%;
  width: clamp(10rem, 14vw, 13.5rem);
  pointer-events: auto;
  transform: translate3d(
      calc(var(--hero-progress, 0) * ${({ $fan }) => $fan.spread[0]}px),
      calc(var(--hero-progress, 0) * ${({ $fan }) => $fan.spread[1]}px),
      0
    )
    rotate(calc(var(--r) + var(--hero-progress, 0) * ${({ $fan }) => $fan.spread[2]}deg));
  will-change: transform;

  &:hover,
  &:focus-within {
    z-index: 3;
  }

  @media (prefers-reduced-motion: reduce) {
    transform: rotate(var(--r));
    will-change: auto;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    --r: ${({ $index }) => ($index % 2 ? 3 : -3)}deg;

    position: relative;
    top: auto;
    left: auto;
    right: auto;
    flex: 0 0 clamp(9.5rem, 42vw, 13rem);
    margin-right: -1.25rem;
    z-index: ${({ $index }) => $index};
    scroll-snap-align: start;
    transform: rotate(var(--r));
    will-change: auto;

    &:last-child {
      margin-right: 0;
    }
  }
`

const CardSettle = styled.div<{ $index: number }>`
  animation: ${settle} 1300ms ${({ theme }) => theme.motion.easeOut}
    ${({ $index }) => T.cards + $index * T.cardStagger}ms backwards;
  ${reducedMotion}
`

const CardLink = styled(Link)`
  position: relative;
  display: block;
  padding: 0.625rem 0.625rem 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  transition:
    transform 450ms ${({ theme }) => theme.motion.easeOut},
    box-shadow 450ms ${({ theme }) => theme.motion.easeOut};

  /* Lift the card and straighten it out of the fan. */
  &:hover,
  &:focus-visible,
  &:active {
    transform: translate3d(0, -10px, 0) rotate(calc(-1 * var(--r))) scale(1.04);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** The punched hole a swatch card hangs from on its ring. */
const RingHole = styled.span`
  position: absolute;
  z-index: 2;
  top: 0.3rem;
  left: 50%;
  width: 0.625rem;
  height: 0.625rem;
  margin-left: -0.3125rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.sand};
  box-shadow: inset 0 1px 2px ${({ theme }) => theme.colors.clayDark};
`

const CardFabric = styled.span`
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};

  /* Stitching just inside the fabric edge. */
  &::after {
    content: '';
    position: absolute;
    inset: 0.4rem;
    border: 1px dashed ${({ theme }) => theme.colors.textInverse};
    opacity: 0.8;
    pointer-events: none;
  }
`

const CardImage = styled(Image)<{ $focal?: string }>`
  object-fit: cover;
  object-position: ${({ $focal }) => $focal ?? 'center'};
`

const CardLabel = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.125rem 0.75rem;

  /* In the overlapping mobile stack the right edge is covered, so stack the code above the name. */
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 0.125rem;
  }
`

const CardName = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`

const CardCode = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ── Component ───────────────────────────────────────────── */

export function SwatchBookHero() {
  const sectionRef = useRef<HTMLElement>(null)
  useScrollProgress(sectionRef, '--hero-progress')

  return (
    <Section ref={sectionRef} aria-labelledby="hero-heading">
      <Stage>
        <Backdrop>
          <BackdropImage
            src={HERO.backdrop.src}
            alt={HERO.backdrop.alt}
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            $focal={HERO.backdrop.focal}
          />
        </Backdrop>

        <Copy>
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <Headline id="hero-heading">
            {HERO.headline.map((line, idx) => (
              <LineMask key={line}>
                <LineText $index={idx}>
                  {line}
                  {idx === HERO.headline.length - 1 && <> <em>{HERO.headlineAccent}</em></>}
                </LineText>
              </LineMask>
            ))}
          </Headline>
          <Tagline>{HERO.tagline}</Tagline>
          <PrimaryCta href={HERO.cta.href}>
            {HERO.cta.label}
            <PiArrowRightLight size={18} aria-hidden />
          </PrimaryCta>
        </Copy>

        <Fan aria-label="Shop by fabric">
          {HERO.swatches.map((swatch, idx) => (
            <CardSlot key={swatch.href} $fan={swatch.fan} $index={idx}>
              <CardSettle $index={idx}>
                <CardLink href={swatch.href}>
                  <RingHole aria-hidden />
                  <CardFabric>
                    <CardImage
                      src={swatch.src}
                      alt={swatch.alt}
                      fill
                      sizes="(max-width: 1024px) 42vw, 14vw"
                      loading="eager"
                      $focal={swatch.focal}
                    />
                  </CardFabric>
                  <CardLabel>
                    <CardName>{swatch.label}</CardName>
                    <CardCode>{swatch.code}</CardCode>
                  </CardLabel>
                </CardLink>
              </CardSettle>
            </CardSlot>
          ))}
        </Fan>
      </Stage>
    </Section>
  )
}
