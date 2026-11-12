'use client'

import styled from 'styled-components'
import { ImageOff } from 'lucide-react'
import { thumb } from '@/lib/cloudinary'

const Wrap = styled.div<{ $size: number; $rounded: boolean; $fit: 'cover' | 'contain' }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ $rounded, theme }) => ($rounded ? theme.radii.md : '0')};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textSecondary};

  img {
    width: 100%;
    height: 100%;
    object-fit: ${({ $fit }) => $fit};
    display: block;
  }
`

interface MediaThumbProps {
  src?: string | null
  alt?: string | null
  size?: number
  rounded?: boolean
  fit?: 'cover' | 'contain'
}

export function MediaThumb({
  src,
  alt,
  size = 72,
  rounded = true,
  fit = 'cover',
}: MediaThumbProps) {
  if (!src) {
    return (
      <Wrap $size={size} $rounded={rounded} $fit={fit} aria-hidden>
        <ImageOff size={Math.round(size * 0.3)} strokeWidth={1.5} />
      </Wrap>
    )
  }

  return (
    <Wrap $size={size} $rounded={rounded} $fit={fit}>
      <img src={thumb(src, size * 2)} alt={alt ?? ''} loading="lazy" />
    </Wrap>
  )
}
