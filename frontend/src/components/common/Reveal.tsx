'use client'

import { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

type RevealState = 'static' | 'hidden' | 'shown'

const Wrapper = styled.div<{ $state: RevealState }>`
  ${({ $state, theme }) =>
    $state !== 'static' &&
    css`
      transition:
        opacity ${theme.motion.revealDuration} ${theme.motion.easeOut},
        transform ${theme.motion.revealDuration} ${theme.motion.easeOut};
    `}

  ${({ $state, theme }) =>
    $state === 'hidden' &&
    css`
      opacity: 0;
      transform: translate3d(0, ${theme.motion.revealDistance}, 0);
    `}

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`

export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RevealState>('static')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setState('hidden')

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('shown')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && state === 'shown') {
      setState('static')
    }
  }

  return (
    <Wrapper ref={ref} $state={state} onTransitionEnd={handleTransitionEnd}>
      {children}
    </Wrapper>
  )
}
