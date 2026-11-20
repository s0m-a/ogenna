'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Writes how far an element has scrolled past the top of the viewport
 * (0 → 1) into a CSS custom property on that element, so styles can drive
 * parallax with transforms. Only listens while the element is on screen and
 * does nothing when the user prefers reduced motion.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  property = '--scroll-progress',
) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0

    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1)
      el.style.setProperty(property, progress.toFixed(4))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true })
        update()
      } else {
        window.removeEventListener('scroll', onScroll)
      }
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ref, property])
}
