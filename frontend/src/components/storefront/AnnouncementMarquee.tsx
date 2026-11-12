'use client'

import { Marquee, type MarqueeItem } from './Marquee'

// TODO: replace with GET /api/v1/storefront/announcements when the storefront
// settings API lands (Milestone 5). Keep the shape so swap is trivial.
const ITEMS: MarqueeItem[] = [
  {
    key: 'arrivals',
    text: 'Shop our newest arrivals.',
    link: { label: 'Shop new', href: '/shop/new' },
  },
  {
    key: 'newsletter',
    text: 'Join our newsletter and receive 10% off.',
    link: { label: 'Subscribe', href: '/newsletter' },
  },
  {
    key: 'sale',
    text: 'Fabrics on sale.',
    link: { label: 'Shop sale', href: '/sale' },
  },
]

export function AnnouncementMarquee() {
  return (
    <Marquee
      items={ITEMS}
      background="clay"
      color="textInverse"
      font="nav"
      fontSize="sm"
      ariaLabel="Promotional announcements"
    />
  )
}
