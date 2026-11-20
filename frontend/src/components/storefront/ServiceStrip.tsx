'use client'

import { PiRulerLight, PiSparkleLight } from 'react-icons/pi'
import { Marquee, type MarqueeItem } from './Marquee'
import { theme } from '@/styles/theme'

const ITEMS: MarqueeItem[] = [
  { key: 'min-length', text: 'Shop from 0.5 M', icon: PiSparkleLight },
  { key: 'curated', text: 'Natural fabrics curated for makers', icon: PiRulerLight },
  { key: 'trusted', text: 'Trusted by home sewers worldwide', icon: PiSparkleLight },
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
