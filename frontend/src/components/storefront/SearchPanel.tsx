'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styled, { keyframes } from 'styled-components'
import { PiArrowRightLight, PiImageBrokenLight, PiCircleNotchLight, PiMagnifyingGlassLight, PiXLight } from 'react-icons/pi'
import {
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_LENGTH,
  useProductSearch,
} from '@/hooks/useProductSearch'
import { usePublicCategories } from '@/hooks/useCategories'
import { productsService } from '@/services/products'
import { formatMoney } from '@/lib/formatMoney'
import type { ProductListItem } from '@/types/product'

interface SearchPanelProps {
  open: boolean
  onClose: () => void
}

export function searchResultsHref(term: string) {
  return `/shop?${new URLSearchParams({ q: term.trim() })}`
}

/* ── Styled ──────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: none; }
`

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  background: ${({ theme }) => theme.colors.scrim};
  animation: ${fadeIn} 200ms ${({ theme }) => theme.motion.easeOut};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Panel = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 81;
  max-height: min(42rem, 100svh);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${dropIn} 260ms ${({ theme }) => theme.motion.easeOut};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 100svh;
    max-height: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Column = styled.div`
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.layout.pagePaddingXWide};
`

const Form = styled.form`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const InputRow = styled(Column)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: ${({ theme }) => theme.layout.storefrontHeaderHeight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: ${({ theme }) => theme.layout.storefrontHeaderHeightMobile};
  }

  > svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  border: none;
  background: none;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textPrimary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  /* The panel itself shows focus; the caret is enough inside the field. */
  &:focus-visible {
    outline: none;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`

const CloseButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Spinner = styled(PiCircleNotchLight)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  animation: ${spin} 900ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
`

const BodyInner = styled(Column)`
  padding-block: 1.25rem 1.75rem;
`

const SectionLabel = styled.p`
  margin-bottom: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Results = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const ResultLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 0.75rem;
  margin-inline: -0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  color: inherit;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover,
  &[data-active='true'] {
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`

const Thumb = styled.span`
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  img {
    object-fit: cover;
  }
`

const ResultText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`

const ResultName = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textNav};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ResultMeta = styled.span`
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ResultPrice = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ViewAll = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  min-height: 44px;
  padding: 0 1.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primary500};
  color: ${({ theme }) => theme.colors.textInverse};
  font-family: ${({ theme }) => theme.fonts.ui};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary600};
  }
`

const Message = styled.p`
  margin-bottom: 1.25rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Chips = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Chip = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 1.125rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
  text-decoration: none;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`

/* ── Helpers ─────────────────────────────────────────────── */

function displayPrice(product: ProductListItem) {
  const price = product.salePriceMin ?? product.priceMin
  // List prices arrive in display units; formatMoney expects minor units.
  return price == null ? null : formatMoney(Math.round(price * 100))
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])'

/* ── Component ───────────────────────────────────────────── */

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  if (!open) return null
  return <SearchDialog onClose={onClose} />
}

/** Mounted only while open, so every opening starts from a clean state. */
function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const listId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const loggedRef = useRef<string | null>(null)

  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)

  const { data, term, enabled, isError, isPending } = useProductSearch(value)
  const { data: categories } = usePublicCategories()

  const results = enabled ? data?.data ?? [] : []
  const topCategories = (categories ?? []).filter((c) => !c.parentId).slice(0, 8)
  const typed = value.trim()
  const canSearch = typed.length >= SEARCH_MIN_LENGTH
  const settled = canSearch && !isPending

  /** Records a search once per term. Logging is best-effort. */
  const logSearch = (q: string) => {
    const normalized = q.trim().toLowerCase()
    if (normalized.length < SEARCH_MIN_LENGTH || loggedRef.current === normalized) return
    loggedRef.current = normalized
    productsService.logSearch(normalized).catch(() => {})
  }

  const close = () => {
    // Searches abandoned without a click are the most useful ones to see.
    logSearch(value)
    onClose()
  }

  // Keep the latest close handler for the effect below without re-running it.
  const closeRef = useRef(close)
  closeRef.current = close

  // Focus the field, lock page scroll, trap Tab, close on Escape, and hand
  // focus back to whatever opened the panel.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [])

  const goToResults = () => {
    if (!canSearch) return
    logSearch(typed)
    onClose()
    router.push(searchResultsHref(typed))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const picked = results[active]
    if (picked) {
      logSearch(typed)
      onClose()
      router.push(`/shop/product/${picked.slug}`)
    } else {
      goToResults()
    }
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    }
  }

  const onPickResult = () => {
    logSearch(typed)
    onClose()
  }

  const status = !canSearch
    ? ''
    : isPending
      ? 'Searching…'
      : isError
        ? 'Search is unavailable right now.'
        : results.length
          ? `${results.length} ${results.length === 1 ? 'fabric' : 'fabrics'} found. Use the arrow keys to browse.`
          : `No fabrics found for ${typed}.`

  const categoryChips = topCategories.length > 0 && (
    <>
      <SectionLabel>Browse categories</SectionLabel>
      <Chips>
        {topCategories.map((c) => (
          <li key={c.id}>
            <Chip href={`/shop/${c.slug}`} onClick={close}>
              {c.name}
            </Chip>
          </li>
        ))}
      </Chips>
    </>
  )

  return (
    <>
      <Backdrop aria-hidden onClick={close} />
      <Panel ref={panelRef} role="dialog" aria-modal="true" aria-label="Search fabrics">
        <Form role="search" onSubmit={onSubmit}>
          <InputRow>
            <PiMagnifyingGlassLight size={22} aria-hidden />
            <Input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setActive(-1)
              }}
              onKeyDown={onInputKeyDown}
              maxLength={SEARCH_MAX_LENGTH}
              placeholder="Search fabrics, e.g. linen or muslin"
              aria-label="Search fabrics"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              autoComplete="off"
              enterKeyHint="search"
            />
            {canSearch && isPending && <Spinner size={18} aria-hidden />}
            <CloseButton type="button" onClick={close} aria-label="Close search">
              <PiXLight size={22} />
            </CloseButton>
          </InputRow>
        </Form>

        <Body>
          <BodyInner>
            <SrOnly role="status" aria-live="polite">{status}</SrOnly>

            {!canSearch && categoryChips}

            {settled && isError && (
              <Message>Search isn&apos;t available right now. Please try again in a moment.</Message>
            )}

            {settled && !isError && results.length === 0 && term === typed && (
              <>
                <Message>
                  No fabrics found for &ldquo;{typed}&rdquo;. Check the spelling, or browse a category.
                </Message>
                {categoryChips}
              </>
            )}

            {canSearch && results.length > 0 && (
              <>
                <SectionLabel>Fabrics</SectionLabel>
                <Results id={listId} role="listbox" aria-label="Matching fabrics">
                  {results.map((product, i) => {
                    const price = displayPrice(product)
                    return (
                      <li key={product.id} role="presentation">
                        <ResultLink
                          id={`${listId}-${i}`}
                          href={`/shop/product/${product.slug}`}
                          role="option"
                          aria-selected={i === active}
                          data-active={i === active}
                          onClick={onPickResult}
                          onMouseEnter={() => setActive(i)}
                          tabIndex={-1}
                        >
                          <Thumb>
                            {product.coverImage ? (
                              <Image
                                src={product.coverImage.url}
                                alt=""
                                fill
                                sizes="56px"
                              />
                            ) : (
                              <PiImageBrokenLight size={18} aria-hidden />
                            )}
                          </Thumb>
                          <ResultText>
                            <ResultName>{product.name}</ResultName>
                            {(product.category?.name || product.fabricType) && (
                              <ResultMeta>{product.category?.name ?? product.fabricType}</ResultMeta>
                            )}
                          </ResultText>
                          {price && <ResultPrice>{price}</ResultPrice>}
                        </ResultLink>
                      </li>
                    )
                  })}
                </Results>
                <ViewAll type="button" onClick={goToResults}>
                  View all results for &ldquo;{typed}&rdquo;
                  <PiArrowRightLight size={16} aria-hidden />
                </ViewAll>
              </>
            )}
          </BodyInner>
        </Body>
      </Panel>
    </>
  )
}
