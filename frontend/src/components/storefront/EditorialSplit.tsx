'use client'

import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

// TODO: move to GET /api/v1/storefront/sections (Milestone 5)
const CONTENT = {
  copy: {
    heading: 'Time for a new\nsewing project',
    body:
      'Fresh colours, soft textures and fabrics made for new beginnings. For all the projects you’re already dreaming about.',
    ctaLabel: 'Shop now',
    ctaHref: '/shop/new',
  },
  image: {
    heading: 'Time to start creating',
    ctaLabel: 'Shop now',
    ctaHref: '/shop/all',
    imageSrc: '/images/cottonFabric2.jpg',
    imageAlt: 'Shelves stacked with folded cotton fabric bolts.',
  },
}

/* ── Layout ──────────────────────────────────────────────── */

const Section = styled.section`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 0.375rem ${({ theme }) => theme.layout.pagePaddingX} 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0.375rem ${({ theme }) => theme.layout.pagePaddingXMobile} 1rem;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`

/* ── Copy panel (left) ───────────────────────────────────── */

const CopyPanel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  padding: 3rem 2.5rem;
  background: ${({ theme }) => theme.colors.primary150};
  border-radius: ${({ theme }) => theme.radii.sm};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    aspect-ratio: auto;
    padding: 2.5rem 1.5rem;
  }
`

const CopyHeading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary500};
  white-space: pre-line;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const CopyBody = styled.p`
  max-width: 420px;
  margin-top: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary500};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`

/* ── Shared CTA chip ─────────────────────────────────────── */

const ctaChipStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2.25rem;
  min-width: 180px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 120ms ease;
`

const CopyCta = styled(Link)`
  ${ctaChipStyles}
  margin-top: 2rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textInverse};

  &:hover { background: ${({ theme }) => theme.colors.clayDark}; }
`

/* ── Image panel (right) ─────────────────────────────────── */

const ImagePanel = styled(Link)`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    aspect-ratio: 4 / 3;
  }
`

const PanelImage = styled(Image)`
  object-fit: cover;
  object-position: center;
  transition: transform ${({ theme }) => theme.transitions.slow};

  ${ImagePanel}:hover & {
    transform: scale(1.03);
  }
`

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 55%,
    rgba(44, 31, 20, 0.35) 100%
  );
  pointer-events: none;
`

const PanelOverlay = styled.div`
  position: relative;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  text-align: right;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem;
    align-items: center;
    text-align: center;
  }
`

const PanelHeading = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  line-height: 1.1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary400};
  text-shadow: 0 1px 10px rgba(44, 31, 20, 0.2);

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

const PanelCta = styled.span`
  ${ctaChipStyles}
  font-family: ${({ theme }) => theme.fonts.nav};
  background: ${({ theme }) => theme.colors.primary300};
  color: ${({ theme }) => theme.colors.primary600};

  ${ImagePanel}:hover & {
    background: ${({ theme }) => theme.colors.primary400};
    color: ${({ theme }) => theme.colors.textInverse};
  }
`

export function EditorialSplit() {
  const { copy, image } = CONTENT

  return (
    <Section aria-label="Editorial feature">
      <Grid>
        <CopyPanel>
          <CopyHeading>{copy.heading}</CopyHeading>
          <CopyBody>{copy.body}</CopyBody>
          <CopyCta href={copy.ctaHref}>{copy.ctaLabel}</CopyCta>
        </CopyPanel>

        <ImagePanel href={image.ctaHref} aria-label={image.heading}>
          <PanelImage
            src={image.imageSrc}
            alt={image.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <Scrim aria-hidden />
          <PanelOverlay>
            <PanelHeading>{image.heading}</PanelHeading>
            <PanelCta>{image.ctaLabel}</PanelCta>
          </PanelOverlay>
        </ImagePanel>
      </Grid>
    </Section>
  )
}
