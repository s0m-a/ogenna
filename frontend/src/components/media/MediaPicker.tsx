'use client'

import { useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Check, ImageIcon } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { ImageUploader } from './ImageUploader'
import { useMediaList } from '@/hooks/useMedia'
import { thumb } from '@/lib/cloudinary'
import type { MediaAsset } from '@/types/media'

const Toolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1rem;
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.875rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme, $active }) => ($active ? theme.colors.textPrimary : theme.colors.textSecondary)};
  border-bottom: 2px solid ${({ theme, $active }) => ($active ? theme.colors.primary400 : 'transparent')};
  margin-bottom: -1px;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
`

const Card = styled.button<{ $selected: boolean }>`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 2px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover { border-color: ${({ theme }) => theme.colors.primary300}; }

  ${({ $selected, theme }) =>
    $selected &&
    css`
      border-color: ${theme.colors.primary400};
      box-shadow: 0 0 0 3px ${theme.colors.primary200};
    `}

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const SelectedBadge = styled.span`
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary400};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const CountBadge = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  align-self: center;
  margin-left: auto;
`

const UploadWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (assets: MediaAsset[]) => void
  multiple?: boolean
  folder?: string
  title?: string
}

type Tab = 'library' | 'upload'

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  folder,
  title = 'Select media',
}: MediaPickerProps) {
  const [tab, setTab] = useState<Tab>('library')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const pageSize = 24

  const { data, isLoading } = useMediaList({ search: search || undefined, page, pageSize })

  const selectedMap = useMemo(() => new Set(selectedIds), [selectedIds])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  const toggle = (asset: MediaAsset) => {
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(asset.id) ? prev.filter((id) => id !== asset.id) : [...prev, asset.id],
      )
    } else {
      setSelectedIds([asset.id])
    }
  }

  const confirm = () => {
    if (!data || selectedIds.length === 0) return
    const chosen = data.items.filter((a) => selectedMap.has(a.id))
    onSelect(chosen)
    setSelectedIds([])
    onClose()
  }

  const handleUploaded = (assets: MediaAsset[]) => {
    if (!multiple) {
      onSelect(assets.slice(0, 1))
      onClose()
      return
    }
    onSelect(assets)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={selectedIds.length === 0}>
            {multiple ? `Select ${selectedIds.length}` : 'Select'}
          </Button>
        </>
      }
    >
      <Tabs>
        <Tab $active={tab === 'library'} onClick={() => setTab('library')}>Library</Tab>
        <Tab $active={tab === 'upload'} onClick={() => setTab('upload')}>Upload new</Tab>
      </Tabs>

      {tab === 'library' ? (
        <>
          <Toolbar>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Search by name, alt, tag…"
              />
            </div>
            {data && <CountBadge>{data.total} asset{data.total === 1 ? '' : 's'}</CountBadge>}
          </Toolbar>

          {isLoading ? (
            <EmptyState icon={ImageIcon} title="Loading…" />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No media found"
              description={search ? 'Try a different search.' : 'Upload your first asset.'}
            />
          ) : (
            <>
              <Grid>
                {data.items.map((asset) => (
                  <Card
                    key={asset.id}
                    type="button"
                    $selected={selectedMap.has(asset.id)}
                    onClick={() => toggle(asset)}
                    aria-pressed={selectedMap.has(asset.id)}
                    aria-label={asset.alt ?? asset.originalName ?? asset.publicId}
                  >
                    <img
                      src={thumb(asset.secureUrl, 400)}
                      alt={asset.alt ?? ''}
                      loading="lazy"
                    />
                    {selectedMap.has(asset.id) && (
                      <SelectedBadge aria-hidden>
                        <Check size={14} strokeWidth={3} />
                      </SelectedBadge>
                    )}
                  </Card>
                ))}
              </Grid>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={data.total}
                limit={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      ) : (
        <UploadWrap>
          <ImageUploader folder={folder} multiple={multiple} onUploaded={handleUploaded} />
        </UploadWrap>
      )}
    </Modal>
  )
}
