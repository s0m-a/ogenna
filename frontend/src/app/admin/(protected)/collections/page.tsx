'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { AlertCircle, Check, Layers, MoreHorizontal, Plus, Trash2, X } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useCollections, useCollectionMutations } from '@/hooks/useCollections'
import type { Collection, CollectionFormData } from '@/types/collection'

/* ── Animations ────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`

/* ── Table ──────────────────────────────────────────────────── */

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  margin-top: 1.5rem;
`

const TableScroll = styled.div`
  overflow-x: auto;
`

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
`

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
  &:hover td { background: ${({ theme }) => theme.colors.primary100}; }
`

const Td = styled.td<{ $align?: 'right' }>`
  padding: 0.75rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  vertical-align: middle;
  background: ${({ theme }) => theme.colors.surface};
  transition: background ${({ theme }) => theme.transitions.fast};
  text-align: ${({ $align }) => $align ?? 'left'};
`

const CollectionName = styled.button`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;
  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DescText = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

/* ── Row action menu ───────────────────────────────────────── */

const ActionWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
`

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; color: ${({ theme }) => theme.colors.textPrimary}; }
`

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 0.3125rem;
  z-index: 20;
  animation: ${fadeIn} 120ms ease;
`

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; color: ${({ theme }) => theme.colors.textPrimary}; }
  &.danger:hover { background: ${({ theme }) => theme.colors.dangerBg}; color: ${({ theme }) => theme.colors.danger}; }
`

const MenuSep = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0.25rem 0;
`

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <ActionWrap ref={ref}>
      <ActionBtn onClick={() => setOpen((v) => !v)} aria-label="Collection actions">
        <MoreHorizontal size={15} />
      </ActionBtn>
      {open && (
        <Menu>
          <MenuItem onClick={() => { setOpen(false); onEdit() }}>Edit</MenuItem>
          <MenuSep />
          <MenuItem className="danger" onClick={() => { setOpen(false); onDelete() }}>
            <Trash2 size={13} strokeWidth={1.75} /> Archive
          </MenuItem>
        </Menu>
      )}
    </ActionWrap>
  )
}

/* ── Confirm dialog ────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(44,31,20,0.45);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
`

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 1.75rem; max-width: 400px; width: 100%;
`

const DialogTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.5rem;
`

const DialogBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  margin-bottom: 1.5rem;
`

const DialogActions = styled.div`
  display: flex; gap: 0.5rem; justify-content: flex-end;
`

/* ── Panel ──────────────────────────────────────────────────── */

const PanelBackdrop = styled.div`
  position: fixed; inset: 0;
  background: rgba(44,31,20,0.3);
  z-index: 100;
`

const Panel = styled.div`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 100%; max-width: 440px;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 101;
  display: flex; flex-direction: column;
  animation: ${slideIn} 180ms ease;
`

const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const PanelTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CloseBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const PanelBody = styled.div`
  flex: 1; overflow-y: auto;
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
`

const PanelFooter = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex; gap: 0.5rem; justify-content: flex-end;
`

const Field = styled.div`
  display: flex; flex-direction: column; gap: 0.3125rem;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  sup { color: ${({ theme }) => theme.colors.danger}; margin-left: 1px; }
`

const HelperText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Input = styled.input`
  height: 38px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.9375rem;
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  &::placeholder { opacity: 0.55; }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const Textarea = styled.textarea`
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.9375rem;
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  resize: vertical;
  min-height: 80px;
  line-height: 1.55;
  &::placeholder { opacity: 0.55; }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const Banner = styled.div<{ $type: 'success' | 'error' }>`
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ $type, theme }) => $type === 'success' ? theme.colors.successBg : theme.colors.dangerBg};
  color: ${({ $type, theme }) => $type === 'success' ? theme.colors.success : theme.colors.danger};
  border: 1px solid ${({ $type, theme }) => $type === 'success' ? `${theme.colors.success}33` : `${theme.colors.danger}33`};
`

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

/* ── Panel component ───────────────────────────────────────── */

function CollectionPanel({ editing, onClose }: { editing: Collection | null; onClose: () => void }) {
  const mutations = useCollectionMutations()
  const [form, setForm] = useState<CollectionFormData>({ name: '', slug: '', description: '' })
  const [slugManual, setSlugManual] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, slug: editing.slug, description: editing.description ?? '' })
      setSlugManual(true)
    } else {
      setForm({ name: '', slug: '', description: '' })
      setSlugManual(false)
    }
    setFeedback(null)
  }, [editing])

  const isSaving = mutations.create.isPending || mutations.update.isPending

  const handleSave = async () => {
    if (!form.name.trim()) { setFeedback({ type: 'error', message: 'Name is required.' }); return }
    if (!form.slug.trim()) { setFeedback({ type: 'error', message: 'Slug is required.' }); return }

    const payload: CollectionFormData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      ...(form.description?.trim() ? { description: form.description.trim() } : {}),
    }

    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, data: payload })
      } else {
        await mutations.create.mutateAsync(payload)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setFeedback({ type: 'error', message: msg })
    }
  }

  return (
    <>
      <PanelBackdrop onClick={onClose} />
      <Panel role="dialog" aria-modal aria-label={editing ? 'Edit collection' : 'New collection'}>
        <PanelHeader>
          <PanelTitle>{editing ? 'Edit collection' : 'New collection'}</PanelTitle>
          <CloseBtn onClick={onClose}><X size={16} /></CloseBtn>
        </PanelHeader>
        <PanelBody>
          {feedback && (
            <Banner $type={feedback.type}>
              {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {feedback.message}
            </Banner>
          )}
          <Field>
            <Label htmlFor="col-name">Name <sup>*</sup></Label>
            <Input
              id="col-name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((p) => ({ ...p, name, slug: slugManual ? p.slug : slugify(name) }))
              }}
              placeholder="e.g. New Arrivals"
            />
          </Field>
          <Field>
            <Label htmlFor="col-slug">Slug <sup>*</sup></Label>
            <Input
              id="col-slug"
              value={form.slug}
              onChange={(e) => { setSlugManual(true); setForm((p) => ({ ...p, slug: e.target.value })) }}
              placeholder="new-arrivals"
            />
            <HelperText>Used in the collection URL. Auto-generated from name.</HelperText>
          </Field>
          <Field>
            <Label htmlFor="col-desc">Description</Label>
            <Textarea
              id="col-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this collection…"
              rows={3}
            />
          </Field>
        </PanelBody>
        <PanelFooter>
          <Button $variant="secondary" $size="sm" onClick={onClose}>Cancel</Button>
          <Button $variant="primary" $size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create collection'}
          </Button>
        </PanelFooter>
      </Panel>
    </>
  )
}

/* ── Main page ─────────────────────────────────────────────── */

export default function CollectionsPage() {
  const { data: collections = [], isLoading, isError } = useCollections()
  const mutations = useCollectionMutations()

  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Collection | null>(null)

  const openNew = useCallback(() => { setEditing(null); setPanelOpen(true) }, [])
  const openEdit = useCallback((col: Collection) => { setEditing(col); setPanelOpen(true) }, [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const handleArchive = useCallback(async () => {
    if (!archiveTarget) return
    await mutations.archive.mutateAsync(archiveTarget.id)
    setArchiveTarget(null)
  }, [archiveTarget, mutations.archive])

  return (
    <>
      <PageHeader
        title="Collections"
        subtitle="Group products for merchandising, campaigns, and seasonal edits."
        actions={
          <Button $variant="primary" $size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={2.5} /> Add collection
          </Button>
        }
      />

      <TableCard>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th>Collection</Th>
                <Th>Slug</Th>
                <Th>Description</Th>
                <Th>Products</Th>
                <Th style={{ width: 48 }} />
              </tr>
            </Thead>
            <tbody>
              {isLoading && (
                <tr>
                  <Td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b5444' }}>Loading…</Td>
                </tr>
              )}

              {isError && (
                <tr>
                  <Td colSpan={5}>
                    <EmptyState title="Could not load collections" description="Check your connection or try refreshing." />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && collections.length === 0 && (
                <tr>
                  <Td colSpan={5}>
                    <EmptyState
                      icon={Layers}
                      title="No collections yet"
                      description="Create collections to group products for your storefront."
                      action={
                        <Button $variant="primary" $size="sm" onClick={openNew}>
                          <Plus size={14} /> Add collection
                        </Button>
                      }
                    />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && collections.map((col) => (
                <Tr key={col.id}>
                  <Td>
                    <CollectionName onClick={() => openEdit(col)}>{col.name}</CollectionName>
                  </Td>
                  <Td style={{ color: '#6b5444', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {col.slug}
                  </Td>
                  <Td>
                    {col.description ? <DescText>{col.description}</DescText> : <span style={{ color: '#a89585' }}>—</span>}
                  </Td>
                  <Td>
                    <CountBadge>{col._count?.products ?? 0}</CountBadge>
                  </Td>
                  <Td $align="right">
                    <RowMenu onEdit={() => openEdit(col)} onDelete={() => setArchiveTarget(col)} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>

      {panelOpen && <CollectionPanel editing={editing} onClose={closePanel} />}

      {archiveTarget && (
        <Overlay onClick={() => setArchiveTarget(null)}>
          <Dialog onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal>
            <DialogTitle>Archive collection?</DialogTitle>
            <DialogBody>
              <strong>{archiveTarget.name}</strong> will be archived. Products in this collection will not be affected.
            </DialogBody>
            <DialogActions>
              <Button $variant="secondary" $size="sm" onClick={() => setArchiveTarget(null)}>Cancel</Button>
              <Button
                $variant="danger"
                $size="sm"
                onClick={handleArchive}
                disabled={mutations.archive.isPending}
              >
                {mutations.archive.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            </DialogActions>
          </Dialog>
        </Overlay>
      )}
    </>
  )
}
