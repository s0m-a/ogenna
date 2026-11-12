'use client'

import { Ruler, Sparkles } from 'lucide-react'
import { Marquee, type MarqueeItem } from './Marquee'
import { theme } from '@/styles/theme'

const ITEMS: MarqueeItem[] = [
  { key: 'min-length', text: 'Shop from 0.5 M', icon: Sparkles },
  { key: 'curated', text: 'Natural fabrics curated for makers', icon: Ruler },
  { key: 'trusted', text: 'Trusted by home sewers worldwide', icon: Sparkles },
]

export function ServiceStrip() {
  return (
    <Marquee
      items={ITEMS}
      background="sand"      
      color="primary500"
      iconColor="clay"
      font="heading"
      fontSize="base"
      durationSeconds={60}
      itemPadding="3rem"
      ariaLabel="Store benefits"
    />
  )
}
