'use client'

import React from 'react'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import type { LucideIcon } from 'lucide-react'
import type { Theme } from '@/styles/theme'

export interface MarqueeItem {
  key: string
  text: string
  icon?: LucideIcon
  link?: { label: string; href: string }
}

type ColorToken = keyof Theme['colors']
type FontToken = keyof Theme['fonts']

interface MarqueeProps {
  items: MarqueeItem[]
  background: ColorToken
  color: ColorToken
  font?: FontToken
  iconColor?: ColorToken
  durationSeconds?: number
  repeat?: number
  fontSize?: keyof Theme['fontSizes']
  itemPadding?: string
  ariaLabel?: string
}

const slide = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`

const Wrap = styled.div<{ $bg: ColorToken; $color: ColorToken }>`
  background: ${({ theme, $bg }) => theme.colors[$bg]};
  color: ${({ theme, $color }) => theme.colors[$color]};
  overflow: hidden;
  position: relative;
`

const Track = styled.div<{ $duration: number }>`
  display: flex;
  width: max-content;
  animation: ${slide} ${({ $duration }) => $duration}s linear infinite;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    justify-content: center;
    width: 100%;
  }
`

const Item = styled.span<{
  $font: FontToken
  $size: keyof Theme['fontSizes']
  $padding: string
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem ${({ $padding }) => $padding};
  font-family: ${({ theme, $font }) => theme.fonts[$font]};
  font-size: ${({ theme, $size }) => theme.fontSizes[$size]};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
`

const IconWrap = styled.span<{ $color: ColorToken }>`
  display: inline-flex;
  color: ${({ theme, $color }) => theme.colors[$color]};
  flex-shrink: 0;
`

const MarqueeLink = styled(Link)`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover { opacity: 0.85; }
`

export function Marquee({
  items,
  background,
  color,
  font = 'nav',
  iconColor,
  durationSeconds = 42,
  repeat = 4,
  fontSize = 'sm',
  itemPadding = '2rem',
  ariaLabel,
}: MarqueeProps) {
  const sequence = Array.from({ length: repeat }, () => items).flat()

  return (
    <Wrap $bg={background} $color={color} aria-label={ariaLabel} role="region">
      <Track $duration={durationSeconds}>
        {sequence.map((item, i) => {
          const Icon = item.icon
          return (
            <Item
              key={`${item.key}-${i}`}
              $font={font}
              $size={fontSize}
              $padding={itemPadding}
            >
              {Icon && (
                <IconWrap $color={iconColor ?? color} aria-hidden>
                  <Icon size={18} strokeWidth={1.5} />
                </IconWrap>
              )}
              {item.text}
              {item.link && (
                <MarqueeLink href={item.link.href}>{item.link.label}</MarqueeLink>
              )}
            </Item>
          )
        })}
      </Track>
    </Wrap>
  )
}
