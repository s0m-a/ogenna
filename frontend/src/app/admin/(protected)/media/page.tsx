'use client'

import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { AlertCircle, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { Modal } from '@/components/common/Modal'
import { ImageUploader } from '@/components/media/ImageUploader'
import { useMediaList, useMediaMutations, useMediaUsages } from '@/hooks/useMedia'
import { thumb, fitWidth } from '@/lib/cloudinary'
import type { MediaAsset } from '@/types/media'

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
  flex-wrap: wrap;
`

const SearchWrap = styled.div`
  flex: 1;
  min-width: 220px;
  max-width: 360px;
`

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
`

const ThumbButton = styled.button`
  position: relative;
  aspect-ratio: 1 / 1;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover { border-color: ${({ theme }) => theme.colors.primary300}; }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const Preview = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  img {
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    display: block;
  }
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Input = styled.input`
  height: 38px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const Meta = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 1rem;

  dt { color: ${({ theme }) => theme.colors.textSecondary}; }
  dd {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: monospace;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    word-break: break-all;
  }
`

const UsageList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  li { padding: 0.25rem 0; }
`

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  border: 1px solid ${({ theme }) => theme.colors.danger}33;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 1rem;
`

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

interface DetailProps {
  asset: MediaAsset
  onClose: () => void
}

function DetailDialog({ asset, onClose }: DetailProps) {
  const { update, remove } = useMediaMutations()
  const { data: usages } = useMediaUsages(asset.id)
  const [alt, setAlt] = useState(asset.alt ?? '')
  const [tags, setTags] = useState((asset.tags ?? []).join(', '))
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const dirty = alt !== (asset.alt ?? '') || tags !== (asset.tags ?? []).join(', ')
  const usageCount = usages?.productImages.length ?? 0

  const handleSave = async () => {
    setError(null)
    try {
      await update.mutateAsync({
        id: asset.id,
        data: {
          alt: alt.trim() || undefined,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleRemove = async () => {
    setError(null)
    try {
      await remove.mutateAsync(asset.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setConfirmRemove(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Media details"
      size="lg"
      footer={
        <>
          <Button
            $variant="danger"
            $size="sm"
            onClick={() => setConfirmRemove(true)}
            disabled={remove.isPending || usageCount > 0}
            title={usageCount > 0 ? 'In use — remove references first' : 'Delete'}
          >
            <Trash2 size={14} /> Delete
          </Button>
          <div style={{ flex: 1 }} />
          <Button $variant="secondary" $size="sm" onClick={onClose}>Cancel</Button>
          <Button $size="sm" onClick={handleSave} disabled={!dirty || update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {error && (
        <Banner>
          <AlertCircle size={14} /> {error}
        </Banner>
      )}

      <Preview>
        <img src={fitWidth(asset.secureUrl, 900)} alt={asset.alt ?? ''} />
      </Preview>

      <Field>
        <Label htmlFor="asset-alt">Alt text</Label>
        <Input
          id="asset-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe the image for accessibility"
        />
      </Field>

      <Field>
        <Label htmlFor="asset-tags">Tags</Label>
        <Input
          id="asset-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </Field>

      <Meta>
        <dt>Dimensions</dt>
        <dd>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}</dd>
        <dt>Size</dt>
        <dd>{formatBytes(asset.bytes)}</dd>
        <dt>Format</dt>
        <dd>{asset.format ?? '—'}</dd>
        <dt>Folder</dt>
        <dd>{asset.folder ?? '—'}</dd>
        <dt>Public ID</dt>
        <dd>{asset.publicId}</dd>
      </Meta>

      <Field>
        <Label>Used by</Label>
        {usageCount === 0 ? (
          <UsageList><li>Not currently in use.</li></UsageList>
        ) : (
          <UsageList>
            {usages!.productImages.map((u) => (
              <li key={u.id}>
                {u.product.name}
                {u.variant ? ` · ${u.variant.name}` : ''}
              </li>
            ))}
          </UsageList>
        )}
      </Field>

      {confirmRemove && (
        <Banner>
          <AlertCircle size={14} /> Delete this asset? This cannot be undone.
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button $variant="secondary" $size="sm" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            <Button $variant="danger" $size="sm" onClick={handleRemove} disabled={remove.isPending}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </Banner>
      )}
    </Modal>
  )
}

export default function MediaPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailAsset, setDetailAsset] = useState<MediaAsset | null>(null)

  const pageSize = 24
  const { data, isLoading, isError } = useMediaList({
    search: search || undefined,
    page,
    pageSize,
  })

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1),
    [data],
  )

  return (
    <>
      <PageHeader
        title="Media Library"
        subtitle="Images uploaded here are available to products, categories, collections, and homepage sections."
        actions={
          <Button $variant="primary" $size="sm" onClick={() => setUploadOpen(true)}>
            <Plus size={14} strokeWidth={2.5} /> Upload
          </Button>
        }
      />

      <Toolbar>
        <SearchWrap>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search by name, alt, tag…"
          />
        </SearchWrap>
        {data && <CountText>{data.total} asset{data.total === 1 ? '' : 's'}</CountText>}
      </Toolbar>

      <Card>
        {isLoading ? (
          <EmptyState icon={ImageIcon} title="Loading…" />
        ) : isError ? (
          <EmptyState
            title="Could not load media"
            description="Check your connection or try refreshing."
          />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={search ? 'No matches' : 'No media yet'}
            description={
              search ? 'Try a different search.' : 'Upload your first asset to get started.'
            }
            action={
              !search ? (
                <Button $size="sm" onClick={() => setUploadOpen(true)}>
                  <Plus size={14} /> Upload
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Grid>
              {data.items.map((asset) => (
                <ThumbButton
                  key={asset.id}
                  onClick={() => setDetailAsset(asset)}
                  aria-label={asset.alt ?? asset.originalName ?? asset.publicId}
                >
                  <img src={thumb(asset.secureUrl, 400)} alt={asset.alt ?? ''} loading="lazy" />
                </ThumbButton>
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
      </Card>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload media"
        size="md"
      >
        <ImageUploader
          folder="library"
          multiple
          onUploaded={() => setUploadOpen(false)}
        />
      </Modal>

      {detailAsset && (
        <DetailDialog asset={detailAsset} onClose={() => setDetailAsset(null)} />
      )}
    </>
  )
}
