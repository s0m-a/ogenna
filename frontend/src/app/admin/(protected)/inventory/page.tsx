'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { PiWarningLight, PiArrowCircleDownLight, PiArrowCircleUpLight, PiCheckLight, PiCaretDownLight, PiCaretUpLight, PiClockLight, PiPackageLight, PiSlidersHorizontalLight, PiXLight } from 'react-icons/pi'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import {
  useInventory,
  useInventoryMovements,
  useAdjustInventory,
} from '@/hooks/useInventory'
import {
  ADMIN_MOVEMENT_REASONS,
  MOVEMENT_REASON_LABELS,
  type InventoryItem,
  type MovementReason,
} from '@/types/inventory'

/* ── Animations ────────────────────────────────────────────── */

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* ── Stock badge helper ────────────────────────────────────── */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'

function stockBadge(item: InventoryItem): { label: string; variant: BadgeVariant } {
  if (item.quantityAvailable === 0) return { label: 'Out of stock', variant: 'danger'  }
  if (item.isLowStock)              return { label: 'Low stock',    variant: 'warning' }
  return                                   { label: 'In stock',     variant: 'success' }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

/* ── Toolbar ────────────────────────────────────────────────── */

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`

const StyledSearch = styled(SearchInput)`
  width: 260px;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { width: 100%; }
`

const FilterToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  height: 36px;
  padding: 0 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.warning : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.warningBg : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.warning : theme.colors.textSecondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.warning};
    background: ${({ theme }) => theme.colors.warningBg};
    color: ${({ theme }) => theme.colors.warning};
  }
`

/* ── Table ──────────────────────────────────────────────────── */

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const TableScroll = styled.div`overflow-x: auto;`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Th = styled.th`
  padding: 0.625rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: left;
  white-space: nowrap;
  user-select: none;
`

const ThRight = styled(Th)`text-align: right;`

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
  &:hover td   { background: ${({ theme }) => theme.colors.primary100}; }
`

const Td = styled.td`
  padding: 0.8125rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  vertical-align: middle;
  background: ${({ theme }) => theme.colors.surface};
  transition: background ${({ theme }) => theme.transitions.fast};
`

const TdRight = styled(Td)`text-align: right;`

/* ── Product + variant cell ─────────────────────────────────── */

const ProductLink = styled(Link)`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: block;
  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const VariantMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  margin-top: 1px;
`

/* ── Qty cells ──────────────────────────────────────────────── */

const QtyBig = styled.span<{ $warn?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ $warn, theme }) => $warn ? theme.colors.warning : theme.colors.textPrimary};
`

const QtySmall = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ── Row action buttons ─────────────────────────────────────── */

const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
`

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  height: 28px;
  padding: 0 0.625rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

/* ── Skeleton ───────────────────────────────────────────────── */

const Bone = styled.div<{ $w?: string }>`
  height: 13px;
  width: ${({ $w = '80%' }) => $w};
  border-radius: 4px;
  background: linear-gradient(90deg,
    ${({ theme }) => theme.colors.surfaceMuted} 25%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surfaceMuted} 75%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease infinite;
`

/* ── Overlay / Modal shared ─────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(44, 31, 20, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

/* ── Adjust modal ───────────────────────────────────────────── */

const AdjustDialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  animation: ${fadeUp} 160ms ease;
`

const DialogTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.25rem;
`

const DialogSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1.25rem;
`

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  margin-bottom: 0.875rem;
`

const ModalLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ModalInput = styled.input`
  height: 38px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const ModalSelect = styled.select`
  height: 38px;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5444' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const ModalTextarea = styled.textarea`
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  resize: vertical;
  min-height: 72px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

/* Direction toggles */
const DirRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
`

const DirBtn = styled.button<{ $active: boolean; $type: 'add' | 'remove' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 38px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: 1px solid;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $active, $type, theme }) => {
    if ($active && $type === 'add')
      return `background:${theme.colors.successBg};color:${theme.colors.success};border-color:${theme.colors.success}44;`
    if ($active && $type === 'remove')
      return `background:${theme.colors.dangerBg};color:${theme.colors.danger};border-color:${theme.colors.danger}44;`
    return `background:transparent;color:${theme.colors.textSecondary};border-color:${theme.colors.border};`
  }}
`

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 0.75rem;
`

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.successBg};
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 0.875rem;
`

const DialogActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
`

/* ── History panel ──────────────────────────────────────────── */

const HistoryPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 300;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 200ms ease;
`

const HistoryHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
`

const HistoryTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const HistorySub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
`

const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
`

const HistoryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`

const DeltaBadge = styled.div<{ $positive: boolean }>`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $positive, theme }) =>
    $positive ? theme.colors.successBg : theme.colors.dangerBg};
  color: ${({ $positive, theme }) =>
    $positive ? theme.colors.success : theme.colors.danger};
`

const HistoryMeta = styled.div`flex: 1; min-width: 0;`

const HistoryReason = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const HistoryNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
`

const HistoryDate = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const DeltaNum = styled.span<{ $positive: boolean }>`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  flex-shrink: 0;
  color: ${({ $positive, theme }) =>
    $positive ? theme.colors.success : theme.colors.danger};
`

const HistoryEmpty = styled.p`
  text-align: center;
  padding: 3rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ── Adjust modal component ─────────────────────────────────── */

interface AdjustModalProps {
  item: InventoryItem
  onClose: () => void
}

function AdjustModal({ item, onClose }: AdjustModalProps) {
  const adjust = useAdjustInventory()
  const [direction, setDirection] = useState<'add' | 'remove'>('add')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState<MovementReason>('RESTOCK')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    const n = parseInt(qty, 10)
    if (!qty || isNaN(n) || n <= 0) {
      setError('Enter a valid quantity (whole number, greater than 0).')
      return
    }
    const delta = direction === 'add' ? n : -n
    setError('')

    try {
      await adjust.mutateAsync({ variantId: item.variantId, delta, reason, note: note || undefined })
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Adjustment failed.')
    }
  }

  return (
    <Overlay onClick={onClose}>
      <AdjustDialog onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogSub>
          {item.variant.product.name} · {item.variant.name} · SKU {item.variant.sku}
          <br />
          Currently on hand: <strong>{item.quantityOnHand}</strong> ·
          Available: <strong>{item.quantityAvailable}</strong>
        </DialogSub>

        {success && (
          <SuccessBanner>
            <PiCheckLight size={14} /> Stock updated successfully.
          </SuccessBanner>
        )}

        <DirRow>
          <DirBtn
            $active={direction === 'add'}
            $type="add"
            onClick={() => setDirection('add')}
          >
            <PiArrowCircleUpLight size={14} /> Add stock
          </DirBtn>
          <DirBtn
            $active={direction === 'remove'}
            $type="remove"
            onClick={() => setDirection('remove')}
          >
            <PiArrowCircleDownLight size={14} /> Remove stock
          </DirBtn>
        </DirRow>

        <ModalField>
          <ModalLabel htmlFor="adj-qty">Quantity</ModalLabel>
          <ModalInput
            ref={inputRef}
            id="adj-qty"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 10"
            value={qty}
            onChange={(e) => { setQty(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </ModalField>

        <ModalField>
          <ModalLabel htmlFor="adj-reason">Reason</ModalLabel>
          <ModalSelect
            id="adj-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as MovementReason)}
          >
            {ADMIN_MOVEMENT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </ModalSelect>
        </ModalField>

        <ModalField>
          <ModalLabel htmlFor="adj-note">Note (optional)</ModalLabel>
          <ModalTextarea
            id="adj-note"
            placeholder="Internal note about this adjustment…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </ModalField>

        {error && <ErrorText>{error}</ErrorText>}

        <DialogActions>
          <Button $variant="secondary" $size="sm" onClick={onClose}>Cancel</Button>
          <Button
            $variant="primary"
            $size="sm"
            onClick={handleSubmit}
            disabled={adjust.isPending || success}
          >
            {adjust.isPending ? 'Saving…' : 'Apply adjustment'}
          </Button>
        </DialogActions>
      </AdjustDialog>
    </Overlay>
  )
}

/* ── History panel component ────────────────────────────────── */

interface HistoryPanelProps {
  item: InventoryItem
  onClose: () => void
}

function MovementHistoryPanel({ item, onClose }: HistoryPanelProps) {
  const { data: movements, isLoading } = useInventoryMovements(item.variantId)

  return (
    <>
      <Overlay style={{ background: 'transparent' }} onClick={onClose} />
      <HistoryPanel role="dialog" aria-modal aria-label="Movement history">
        <HistoryHeader>
          <div>
            <HistoryTitle>Movement history</HistoryTitle>
            <HistorySub>
              {item.variant.product.name} · {item.variant.name} · {item.variant.sku}
            </HistorySub>
          </div>
          <CloseBtn onClick={onClose} aria-label="Close">
            <PiXLight size={16} />
          </CloseBtn>
        </HistoryHeader>

        <HistoryList>
          {isLoading && (
            <div style={{ padding: '1.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <Bone $w="60%" style={{ marginBottom: 6 }} />
                  <Bone $w="40%" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!movements || movements.length === 0) && (
            <HistoryEmpty>No movements recorded yet.</HistoryEmpty>
          )}

          {movements?.map((mv) => {
            const positive = mv.delta > 0
            return (
              <HistoryItem key={mv.id}>
                <DeltaBadge $positive={positive}>
                  {positive
                    ? <PiArrowCircleUpLight size={16} />
                    : <PiArrowCircleDownLight size={16} />}
                </DeltaBadge>
                <HistoryMeta>
                  <HistoryReason>{MOVEMENT_REASON_LABELS[mv.reason]}</HistoryReason>
                  {mv.note && <HistoryNote>{mv.note}</HistoryNote>}
                  <HistoryDate>
                    <PiClockLight size={10} /> {formatDate(mv.createdAt)}
                  </HistoryDate>
                </HistoryMeta>
                <DeltaNum $positive={positive}>
                  {positive ? '+' : ''}{mv.delta}
                </DeltaNum>
              </HistoryItem>
            )
          })}
        </HistoryList>
      </HistoryPanel>
    </>
  )
}

/* ── Page ───────────────────────────────────────────────────── */

const LIMIT = 20

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useInventory({
    search: debouncedSearch || undefined,
    lowStock: lowStockOnly || undefined,
    page,
    limit: LIMIT,
  })

  const SKELETONS = 8

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track and adjust stock levels for all product variants."
      />

      <Toolbar>
        <StyledSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by product, variant, or SKU…"
        />
        <FilterToggle
          $active={lowStockOnly}
          onClick={() => { setLowStockOnly((v) => !v); setPage(1) }}
        >
          <PiWarningLight size={13} />
          Low stock only
          {lowStockOnly
            ? <PiCaretUpLight size={12} />
            : <PiCaretDownLight size={12} />}
        </FilterToggle>
      </Toolbar>

      <TableCard>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th>Product / Variant</Th>
                <Th>SKU</Th>
                <ThRight>On hand</ThRight>
                <ThRight>Reserved</ThRight>
                <ThRight>Available</ThRight>
                <Th>Status</Th>
                <Th>Last updated</Th>
                <Th style={{ width: 180 }} />
              </tr>
            </Thead>
            <tbody>
              {/* Skeleton */}
              {isLoading && Array.from({ length: SKELETONS }).map((_, i) => (
                <Tr key={i}>
                  <Td><Bone $w="160px" style={{ marginBottom: 5 }} /><Bone $w="100px" /></Td>
                  <Td><Bone $w="90px" /></Td>
                  <TdRight><Bone $w="30px" style={{ marginLeft: 'auto' }} /></TdRight>
                  <TdRight><Bone $w="30px" style={{ marginLeft: 'auto' }} /></TdRight>
                  <TdRight><Bone $w="30px" style={{ marginLeft: 'auto' }} /></TdRight>
                  <Td><Bone $w="80px" /></Td>
                  <Td><Bone $w="110px" /></Td>
                  <Td />
                </Tr>
              ))}

              {/* Error */}
              {isError && (
                <tr>
                  <Td colSpan={8}>
                    <EmptyState
                      title="Could not load inventory"
                      description="Check your connection or try refreshing."
                    />
                  </Td>
                </tr>
              )}

              {/* Empty */}
              {!isLoading && !isError && data?.data?.length === 0 && (
                <tr>
                  <Td colSpan={8}>
                    <EmptyState
                      icon={PiPackageLight}
                      title={
                        debouncedSearch || lowStockOnly
                          ? 'No items match your filters'
                          : 'No inventory items yet'
                      }
                      description={
                        debouncedSearch || lowStockOnly
                          ? 'Try adjusting your search or clearing the low-stock filter.'
                          : 'Inventory items are created automatically when product variants are added.'
                      }
                    />
                  </Td>
                </tr>
              )}

              {/* Data */}
              {!isLoading && !isError && data?.data?.map((item) => {
                const badge = stockBadge(item)
                return (
                  <Tr key={item.id}>
                    <Td>
                      <ProductLink href={`/admin/products/${item.variant.product.id}/edit`}>
                        {item.variant.product.name}
                      </ProductLink>
                      <VariantMeta>{item.variant.name}</VariantMeta>
                    </Td>
                    <Td>
                      <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {item.variant.sku}
                      </code>
                    </Td>
                    <TdRight>
                      <QtyBig $warn={item.isLowStock}>{item.quantityOnHand}</QtyBig>
                    </TdRight>
                    <TdRight>
                      <QtySmall>{item.quantityReserved}</QtySmall>
                    </TdRight>
                    <TdRight>
                      <QtyBig $warn={item.quantityAvailable === 0}>
                        {item.quantityAvailable}
                      </QtyBig>
                    </TdRight>
                    <Td>
                      <StatusBadge $variant={badge.variant}>{badge.label}</StatusBadge>
                    </Td>
                    <Td style={{ color: '#6b5444', fontSize: '0.8125rem' }}>
                      {formatDate(item.updatedAt)}
                    </Td>
                    <Td>
                      <RowActions>
                        <ActionBtn onClick={() => setAdjustTarget(item)}>
                          <PiSlidersHorizontalLight size={12} />
                          Adjust
                        </ActionBtn>
                        <ActionBtn onClick={() => setHistoryTarget(item)}>
                          <PiClockLight size={12} />
                          History
                        </ActionBtn>
                      </RowActions>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </TableScroll>

        {data && data.meta.totalPages > 1 && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {adjustTarget && (
        <AdjustModal item={adjustTarget} onClose={() => setAdjustTarget(null)} />
      )}

      {historyTarget && (
        <MovementHistoryPanel item={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </>
  )
}
