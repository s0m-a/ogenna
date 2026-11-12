'use client'

import { useCallback, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { UploadCloud, X } from 'lucide-react'
import { mediaService } from '@/services/media'
import { useMediaMutations } from '@/hooks/useMedia'
import type { MediaAsset, MediaResourceType } from '@/types/media'

interface UploadTask {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  asset?: MediaAsset
}

const Dropzone = styled.div<{ $dragging: boolean }>`
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  padding: 2rem 1.25rem;
  text-align: center;
  cursor: pointer;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  ${({ $dragging, theme }) =>
    $dragging &&
    css`
      border-color: ${theme.colors.primary400};
      background: ${theme.colors.primary100};
    `}

  &:hover { border-color: ${({ theme }) => theme.colors.borderStrong}; }
`

const DropIcon = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
`

const DropLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.125rem;
`

const DropHint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const HiddenInput = styled.input`
  display: none;
`

const TaskList = styled.div`
  margin-top: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const TaskName = styled.span`
  flex: 1;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ProgressTrack = styled.div`
  width: 100px;
  height: 4px;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`

const ProgressBar = styled.div<{ $percent: number; $status: UploadTask['status'] }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ theme, $status }) =>
    $status === 'error' ? theme.colors.danger
      : $status === 'done' ? theme.colors.success
      : theme.colors.primary400};
  transition: width ${({ theme }) => theme.transitions.fast};
`

const Remove = styled.button`
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`

interface ImageUploaderProps {
  folder?: string
  multiple?: boolean
  accept?: string
  resourceType?: MediaResourceType
  onUploaded?: (assets: MediaAsset[]) => void
}

function mapResourceType(
  type: 'image' | 'video' | 'raw',
): MediaResourceType {
  return type === 'image' ? 'IMAGE' : type === 'video' ? 'VIDEO' : 'RAW'
}

export function ImageUploader({
  folder,
  multiple = true,
  accept = 'image/*',
  resourceType,
  onUploaded,
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const { create } = useMediaMutations()

  const uploadOne = useCallback(
    async (task: UploadTask) => {
      try {
        const signed = await mediaService.sign(folder)
        const result = await mediaService.uploadToCloudinary(task.file, signed, (percent) =>
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t)),
          ),
        )

        const asset = await create.mutateAsync({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          resourceType: resourceType ?? mapResourceType(result.resource_type),
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          folder: result.folder ?? signed.folder,
          originalName: result.original_filename,
        })

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, progress: 100, status: 'done', asset } : t,
          ),
        )
        return asset
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'error', error: message } : t,
          ),
        )
        return null
      }
    },
    [folder, resourceType, create],
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files)
      if (arr.length === 0) return

      const newTasks: UploadTask[] = arr.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        progress: 0,
        status: 'uploading',
      }))
      setTasks((prev) => [...prev, ...newTasks])

      const results = await Promise.all(newTasks.map(uploadOne))
      const uploaded = results.filter((a): a is MediaAsset => a !== null)
      if (uploaded.length > 0) onUploaded?.(uploaded)
    },
    [uploadOne, onUploaded],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <Dropzone
        $dragging={dragging}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInput.current?.click()
          }
        }}
      >
        <DropIcon aria-hidden>
          <UploadCloud size={24} strokeWidth={1.5} />
        </DropIcon>
        <DropLabel>Drop files or click to upload</DropLabel>
        <DropHint>PNG, JPG, WEBP up to 10 MB</DropHint>
        <HiddenInput
          ref={fileInput}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </Dropzone>

      {tasks.length > 0 && (
        <TaskList>
          {tasks.map((task) => (
            <TaskRow key={task.id}>
              <TaskName>{task.file.name}</TaskName>
              {task.status === 'error' ? (
                <ErrorText>{task.error}</ErrorText>
              ) : (
                <ProgressTrack>
                  <ProgressBar $percent={task.progress} $status={task.status} />
                </ProgressTrack>
              )}
              <Remove
                onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                aria-label={`Remove ${task.file.name}`}
              >
                <X size={14} />
              </Remove>
            </TaskRow>
          ))}
        </TaskList>
      )}
    </div>
  )
}
