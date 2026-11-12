'use client'

import { useCallback, useRef } from 'react'
import styled from 'styled-components'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface CarouselProps {
  children: React.ReactNode
  ariaLabel?: string
  /** grid-auto-columns value at ≥ lg (e.g. "280px"). */
  itemWidth?: string
  /** grid-auto-columns at < lg. */
  itemWidthLg?: string
  /** grid-auto-columns at < md. */
  itemWidthMd?: string
  /** Gap between slides. */
  gap?: string
  /** Number of rows in the track. Children fill column-by-column. Default 1. */
  rows?: number
}

/* ── Styled ──────────────────────────────────────────────── */

const Rail = styled.div`
  position: relative;

  &:hover button[data-rail-nav],
  &:focus-within button[data-rail-nav] {
    opacity: 1;
    pointer-events: auto;
    transform: translate(0, -50%);
  }
`

const Track = styled.div<{
  $w: string
  $wLg: string
  $wMd: string
  $gap: string
  $rows: number
}>`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: ${({ $w }) => $w};
  grid-template-rows: repeat(${({ $rows }) => $rows}, 1fr);
  gap: ${({ $gap }) => $gap};
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 1rem;
  padding-bottom: 0.25rem;

  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  & > * { scroll-snap-align: start; }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-auto-columns: ${({ $wLg }) => $wLg};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-auto-columns: ${({ $wMd }) => $wMd};
  }
`

const NavButton = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 0.5rem;' : 'right: 0.5rem;')}
  transform: translate(
    ${({ $side }) => ($side === 'left' ? '-12px' : '12px')},
    -50%
  );
  opacity: 0;
  pointer-events: none;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  z-index: 10;
  transition:
    opacity 260ms ease,
    transform 260ms ease,
    background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translate(0, -50%);
    outline: 2px solid ${({ theme }) => theme.colors.primary400};
    outline-offset: 2px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

/* ── Component ───────────────────────────────────────────── */

export function Carousel({
  children,
  ariaLabel,
  itemWidth = '280px',
  itemWidthLg = '240px',
  itemWidthMd = '220px',
  gap = '1rem',
  rows = 1,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }, [])

  return (
    <Rail aria-label={ariaLabel} role={ariaLabel ? 'region' : undefined}>
      <NavButton
        $side="left"
        data-rail-nav="left"
        onClick={() => scrollBy('left')}
        aria-label="Scroll left"
      >
        <ArrowLeft size={18} strokeWidth={1.75} />
      </NavButton>

      <Track
        ref={trackRef}
        $w={itemWidth}
        $wLg={itemWidthLg}
        $wMd={itemWidthMd}
        $gap={gap}
        $rows={rows}
      >
        {children}
      </Track>

      <NavButton
        $side="right"
        data-rail-nav="right"
        onClick={() => scrollBy('right')}
        aria-label="Scroll right"
      >
        <ArrowRight size={18} strokeWidth={1.75} />
      </NavButton>
    </Rail>
  )
}
