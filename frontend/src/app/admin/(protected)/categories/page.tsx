'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  AlertCircle,
  Check,
  ChevronRight,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useCategories, useCategoryMutations } from '@/hooks/useCategories'
import type { Category, CategoryFormData } from '@/types/category'

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

const CategoryName = styled.button`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;
  &:hover { color: ${({ theme }) => theme.colors.primary500}; }
`

const SubRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
  &:hover td { background: ${({ theme }) => theme.colors.primary100}; }
`

const SubTd = styled(Td)`
  padding-left: 2.5rem;
`

const ParentChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
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
  &:hover {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
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
      <ActionBtn onClick={() => setOpen((v) => !v)} aria-label="Category actions">
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

/* ── Create / Edit panel (slide-in) ────────────────────────── */

const PanelBackdrop = styled.div`
  position: fixed; inset: 0;
  background: rgba(44,31,20,0.3);
  z-index: 100;
`

const Panel = styled.div`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 100%; max-width: 420px;
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
  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; color: ${({ theme }) => theme.colors.textPrimary}; }
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

const Select = styled.select`
  height: 38px;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.9375rem;
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5444' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
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

/* ── Slug helper ───────────────────────────────────────────── */

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

/* ── Panel component ───────────────────────────────────────── */

interface CategoryPanelProps {
  editing: Category | null
  categories: Category[]
  onClose: () => void
}

function CategoryPanel({ editing, categories, onClose }: CategoryPanelProps) {
  const mutations = useCategoryMutations()
  const [form, setForm] = useState<CategoryFormData>({ name: '', slug: '', parentId: '' })
  const [slugManual, setSlugManual] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, slug: editing.slug, parentId: editing.parentId ?? '' })
      setSlugManual(true)
    } else {
      setForm({ name: '', slug: '', parentId: '' })
      setSlugManual(false)
    }
    setFeedback(null)
  }, [editing])

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: slugManual ? prev.slug : slugify(name) }))
  }

  const isSaving = mutations.create.isPending || mutations.update.isPending

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required.' })
      return
    }
    if (!form.slug.trim()) {
      setFeedback({ type: 'error', message: 'Slug is required.' })
      return
    }

    const payload: CategoryFormData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      ...(form.parentId ? { parentId: form.parentId } : {}),
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

  const parentOptions = categories.filter((c) => c.id !== editing?.id && !c.parentId)

  return (
    <>
      <PanelBackdrop onClick={onClose} />
      <Panel role="dialog" aria-modal aria-label={editing ? 'Edit category' : 'New category'}>
        <PanelHeader>
          <PanelTitle>{editing ? 'Edit category' : 'New category'}</PanelTitle>
          <CloseBtn onClick={onClose} aria-label="Close"><X size={16} /></CloseBtn>
        </PanelHeader>
        <PanelBody>
          {feedback && (
            <Banner $type={feedback.type}>
              {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {feedback.message}
            </Banner>
          )}
          <Field>
            <Label htmlFor="cat-name">Name <sup>*</sup></Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Cotton Fabrics"
            />
          </Field>
          <Field>
            <Label htmlFor="cat-slug">Slug <sup>*</sup></Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => { setSlugManual(true); setForm((p) => ({ ...p, slug: e.target.value })) }}
              placeholder="cotton-fabrics"
            />
            <HelperText>Used in the category URL. Auto-generated from name.</HelperText>
          </Field>
          <Field>
            <Label htmlFor="cat-parent">Parent category</Label>
            <Select
              id="cat-parent"
              value={form.parentId ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
            >
              <option value="">None (top-level)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <HelperText>Optionally nest this under a parent category.</HelperText>
          </Field>
        </PanelBody>
        <PanelFooter>
          <Button $variant="secondary" $size="sm" onClick={onClose}>Cancel</Button>
          <Button $variant="primary" $size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
          </Button>
        </PanelFooter>
      </Panel>
    </>
  )
}

/* ── Main page ─────────────────────────────────────────────── */

export default function CategoriesPage() {
  const { data: categories = [], isLoading, isError } = useCategories()
  const mutations = useCategoryMutations()

  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null)

  const openNew = useCallback(() => { setEditing(null); setPanelOpen(true) }, [])
  const openEdit = useCallback((cat: Category) => { setEditing(cat); setPanelOpen(true) }, [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const handleArchive = useCallback(async () => {
    if (!archiveTarget) return
    await mutations.archive.mutateAsync(archiveTarget.id)
    setArchiveTarget(null)
  }, [archiveTarget, mutations.archive])

  const topLevel = categories.filter((c) => !c.parentId)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organise your fabric catalogue into categories."
        actions={
          <Button $variant="primary" $size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={2.5} /> Add category
          </Button>
        }
      />

      <TableCard>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th>Category</Th>
                <Th>Slug</Th>
                <Th>Products</Th>
                <Th style={{ width: 48 }} />
              </tr>
            </Thead>
            <tbody>
              {isLoading && (
                <tr>
                  <Td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b5444' }}>
                    Loading…
                  </Td>
                </tr>
              )}

              {isError && (
                <tr>
                  <Td colSpan={4}>
                    <EmptyState title="Could not load categories" description="Check your connection or try refreshing." />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && topLevel.length === 0 && (
                <tr>
                  <Td colSpan={4}>
                    <EmptyState
                      icon={FolderOpen}
                      title="No categories yet"
                      description="Create your first category to start organising your catalogue."
                      action={
                        <Button $variant="primary" $size="sm" onClick={openNew}>
                          <Plus size={14} /> Add category
                        </Button>
                      }
                    />
                  </Td>
                </tr>
              )}

              {topLevel.map((cat) => {
                const children = childrenOf(cat.id)
                return (
                  <React.Fragment key={cat.id}>
                    <Tr>
                      <Td>
                        <CategoryName onClick={() => openEdit(cat)}>{cat.name}</CategoryName>
                      </Td>
                      <Td style={{ color: '#6b5444', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {cat.slug}
                      </Td>
                      <Td>
                        <CountBadge>{cat._count?.products ?? 0}</CountBadge>
                      </Td>
                      <Td $align="right">
                        <RowMenu onEdit={() => openEdit(cat)} onDelete={() => setArchiveTarget(cat)} />
                      </Td>
                    </Tr>
                    {children.map((child) => (
                      <SubRow key={child.id}>
                        <SubTd>
                          <ParentChip>
                            <ChevronRight size={12} />
                            <CategoryName onClick={() => openEdit(child)}>{child.name}</CategoryName>
                          </ParentChip>
                        </SubTd>
                        <Td style={{ color: '#6b5444', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {child.slug}
                        </Td>
                        <Td>
                          <CountBadge>{child._count?.products ?? 0}</CountBadge>
                        </Td>
                        <Td $align="right">
                          <RowMenu onEdit={() => openEdit(child)} onDelete={() => setArchiveTarget(child)} />
                        </Td>
                      </SubRow>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>

      {panelOpen && (
        <CategoryPanel editing={editing} categories={categories} onClose={closePanel} />
      )}

      {archiveTarget && (
        <Overlay onClick={() => setArchiveTarget(null)}>
          <Dialog onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal>
            <DialogTitle>Archive category?</DialogTitle>
            <DialogBody>
              <strong>{archiveTarget.name}</strong> will be archived and hidden from the storefront. Products in this category will not be affected.
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
