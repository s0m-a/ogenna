'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled, { css } from 'styled-components'
import {
  AlertCircle,
  Check,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/common/Button'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MediaPicker } from '@/components/media/MediaPicker'
import { MediaThumb } from '@/components/media/MediaThumb'
import { useProduct, useProductMutations } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import {
  SELLING_UNIT_LABELS,
  type ApiImagePayload,
  type ApiProductPayload,
  type ApiVariantPayload,
  type ProductFormState,
  type ProductStatus,
  type SelectedImage,
  type SellingUnit,
  type VariantFormRow,
} from '@/types/product'

/* ── Helpers ─────────────────────────────────────────────── */

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function newRow(): VariantFormRow {
  return {
    _localId: Math.random().toString(36).slice(2),
    name: '',
    sku: '',
    price: '',
    salePrice: '',
    isDefault: false,
    images: [],
  }
}

function emptyForm(): ProductFormState {
  return {
    name: '',
    slug: '',
    description: '',
    fabricType: '',
    materialComposition: '',
    widthCm: '',
    weightGsm: '',
    careInstructions: '',
    status: 'DRAFT',
    sellingUnit: 'METER',
    minOrderQty: '1',
    qtyIncrement: '1',
    isFeatured: false,
    categoryIds: [],
    hasMultipleVariants: false,
    basePrice: '',
    baseSalePrice: '',
    baseSku: '',
    variants: [],
    images: [],
  }
}

function priceToCents(value: string): number {
  return Math.round(parseFloat(value || '0') * 100)
}

function toImagePayload(imgs: SelectedImage[]): ApiImagePayload[] {
  return imgs.map((img, idx) => ({
    mediaAssetId: img.mediaAssetId,
    ...(img.altText ? { altText: img.altText } : {}),
    position: idx,
  }))
}

function buildPayload(
  form: ProductFormState,
  status: ProductStatus,
  existingDefaultVariantId?: string,
): ApiProductPayload {
  const p: ApiProductPayload = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    status,
    sellingUnit: form.sellingUnit,
    minOrderQty: Math.max(1, parseInt(form.minOrderQty, 10) || 1),
    qtyIncrement: Math.max(1, parseInt(form.qtyIncrement, 10) || 1),
    isFeatured: form.isFeatured,
  }

  if (form.description.trim()) p.description = form.description.trim()
  if (form.fabricType.trim()) p.fabricType = form.fabricType.trim()
  if (form.materialComposition.trim()) p.materialComposition = form.materialComposition.trim()
  if (form.widthCm) p.widthCm = parseInt(form.widthCm, 10)
  if (form.weightGsm) p.weightGsm = parseInt(form.weightGsm, 10)
  if (form.careInstructions.trim()) p.careInstructions = form.careInstructions.trim()
  p.categoryIds = form.categoryIds
  p.images = toImagePayload(form.images)

  let apiVariants: ApiVariantPayload[]
  if (form.hasMultipleVariants && form.variants.length > 0) {
    apiVariants = form.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      name: v.name.trim(),
      ...(v.sku.trim() ? { sku: v.sku.trim() } : {}),
      priceAmount: priceToCents(v.price),
      ...(v.salePrice.trim() ? { salePriceAmount: priceToCents(v.salePrice) } : {}),
      isDefault: v.isDefault,
      images: toImagePayload(v.images),
    }))
  } else {
    apiVariants = [
      {
        ...(existingDefaultVariantId ? { id: existingDefaultVariantId } : {}),
        name: 'Default',
        ...(form.baseSku.trim() ? { sku: form.baseSku.trim() } : {}),
        priceAmount: priceToCents(form.basePrice),
        ...(form.baseSalePrice.trim()
          ? { salePriceAmount: priceToCents(form.baseSalePrice) }
          : {}),
        isDefault: true,
      },
    ]
  }
  p.variants = apiVariants

  return p
}

/* ── Layout ─────────────────────────────────────────────── */

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.25rem;
  align-items: start;
  margin-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: -1;
  }
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const CardHeader = styled.div`
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  letter-spacing: 0.01em;
`

const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

/* ── Form controls ─────────────────────────────────────── */

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};

  sup {
    color: ${({ theme }) => theme.colors.danger};
    margin-left: 1px;
  }
`

const HelperText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  margin: 0;
`

const inputStyles = css`
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &::placeholder { opacity: 0.5; }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const Input = styled.input`
  ${inputStyles}
  height: 38px;
  padding: 0 0.75rem;
`

const Textarea = styled.textarea`
  ${inputStyles}
  padding: 0.625rem 0.75rem;
  resize: vertical;
  min-height: 100px;
  line-height: 1.55;
`

const Select = styled.select`
  ${inputStyles}
  height: 38px;
  padding: 0 2rem 0 0.75rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5444' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
  cursor: pointer;
`

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`

const Row3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
`

/* ── Status selector ─────────────────────────────────────── */

const StatusOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

const StatusOption = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary300 : theme.colors.border};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary100 : 'transparent'};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: background ${({ theme }) => theme.transitions.fast},
              border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary100};
    border-color: ${({ theme }) => theme.colors.primary300};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`

const StatusDot = styled.span<{ $status: ProductStatus }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status, theme }) => {
    if ($status === 'PUBLISHED') return theme.colors.success
    if ($status === 'ARCHIVED') return theme.colors.textSecondary
    return theme.colors.warning
  }};
`

/* ── Image gallery ───────────────────────────────────────── */

const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 0.5rem;
`

const Tile = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const TileRemove = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${Tile}:hover & { opacity: 1; }
`

const AddTile = styled.button`
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary400};
    color: ${({ theme }) => theme.colors.primary500};
  }
`

/* ── Variant editor ──────────────────────────────────────── */

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ToggleTrack = styled.span<{ $on: boolean }>`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${({ $on, theme }) => ($on ? theme.colors.primary400 : theme.colors.border)};
  transition: background ${({ theme }) => theme.transitions.fast};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '18px' : '2px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: left ${({ theme }) => theme.transitions.fast};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`

const VTableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`

const VTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const VTh = styled.th`
  padding: 0.5rem 0.625rem;
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;

  &:first-child { width: 40px; text-align: center; }
  &:last-child { width: 36px; }
`

const VTd = styled.td`
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  &:first-child { text-align: center; }
  &:last-child { text-align: center; }

  tr:last-child & { border-bottom: none; }
`

const VInput = styled.input`
  width: 100%;
  min-width: 80px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 0.3125rem 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  &::placeholder { opacity: 0.45; }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary200};
  }
`

const DefaultRadio = styled.input`
  width: 15px;
  height: 15px;
  accent-color: ${({ theme }) => theme.colors.primary400};
  cursor: pointer;
`

const DeleteRowBtn = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  }

  &:disabled { opacity: 0.3; cursor: not-allowed; }
`

const VariantImageButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary400};
    color: ${({ theme }) => theme.colors.primary500};
  }
`

const AddVariantBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

/* ── Organisation ────────────────────────────────────────── */

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 0.375rem;
`

const CheckRow = styled.label<{ $indent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  padding-left: ${({ $indent }) => ($indent ? '1.5rem' : '0.5rem')};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: ${({ theme }) => theme.colors.primary400};
    flex-shrink: 0;
    cursor: pointer;
  }
`

const FeaturedRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

/* ── Feedback banner ─────────────────────────────────────── */

const Banner = styled.div<{ $type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ $type, theme }) =>
    $type === 'success' ? theme.colors.successBg : theme.colors.dangerBg};
  color: ${({ $type, theme }) =>
    $type === 'success' ? theme.colors.success : theme.colors.danger};
  border: 1px solid ${({ $type, theme }) =>
    $type === 'success' ? `${theme.colors.success}33` : `${theme.colors.danger}33`};
  margin-bottom: 0.5rem;
`

/* ── Header ──────────────────────────────────────────────── */

const DiscardLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

/* ── Loading skeleton ────────────────────────────────────── */

const LoadingWrap = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

/* ══════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════ */

interface ProductFormProps {
  productId?: string
}

type PickerTarget = { kind: 'product' } | { kind: 'variant'; variantLocalId: string }

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const isEdit = Boolean(productId)

  const { data: existing, isLoading: loadingExisting } = useProduct(productId ?? '')
  const mutations = useProductMutations()
  const { data: categories = [] } = useCategories()

  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [slugManual, setSlugManual] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)

  /* Populate form when loading an existing product */
  useEffect(() => {
    if (!existing) return
    setForm({
      name: existing.name,
      slug: existing.slug,
      description: existing.description ?? '',
      fabricType: existing.fabricType ?? '',
      materialComposition: existing.materialComposition ?? '',
      widthCm: existing.widthCm != null ? String(existing.widthCm) : '',
      weightGsm: existing.weightGsm != null ? String(existing.weightGsm) : '',
      careInstructions: existing.careInstructions ?? '',
      status: existing.status,
      sellingUnit: existing.sellingUnit,
      minOrderQty: String(existing.minOrderQty),
      qtyIncrement: String(existing.qtyIncrement),
      isFeatured: existing.isFeatured,
      categoryIds: existing.categories.map((c) => c.category.id),
      hasMultipleVariants: existing.variants.length > 1,
      basePrice: existing.variants[0]
        ? String(existing.variants[0].priceAmount / 100)
        : '',
      baseSalePrice: existing.variants[0]?.salePriceAmount != null
        ? String(existing.variants[0].salePriceAmount / 100)
        : '',
      baseSku: existing.variants[0]?.sku ?? '',
      variants: existing.variants.map((v) => ({
        _localId: v.id,
        id: v.id,
        name: v.name,
        sku: v.sku ?? '',
        price: String(v.priceAmount / 100),
        salePrice:
          v.salePriceAmount != null ? String(v.salePriceAmount / 100) : '',
        isDefault: v.isDefault,
        images: v.images
          .filter((img) => !!img.mediaAssetId)
          .map((img) => ({
            mediaAssetId: img.mediaAssetId as string,
            url: img.url,
            altText: img.altText ?? undefined,
          })),
      })),
      images: existing.images
        .filter((img) => !!img.mediaAssetId)
        .map((img) => ({
          mediaAssetId: img.mediaAssetId as string,
          url: img.url,
          altText: img.altText ?? undefined,
        })),
    })
    setSlugManual(true)
  }, [existing])

  /* Generic field setter */
  const set = useCallback(
    <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleNameChange = (name: string) => {
    set('name', name)
    if (!slugManual) {
      setForm((prev) => ({ ...prev, slug: slugify(name) }))
    }
  }

  /* ── Variant helpers ── */

  const addVariant = () => {
    setForm((prev) => {
      const hasDefault = prev.variants.some((v) => v.isDefault)
      return {
        ...prev,
        variants: [...prev.variants, { ...newRow(), isDefault: !hasDefault }],
      }
    })
  }

  const updateVariant = (localId: string, patch: Partial<VariantFormRow>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v._localId === localId ? { ...v, ...patch } : v,
      ),
    }))
  }

  const setDefaultVariant = (localId: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        isDefault: v._localId === localId,
      })),
    }))
  }

  const removeVariant = (localId: string) => {
    setForm((prev) => {
      const remaining = prev.variants.filter((v) => v._localId !== localId)
      if (remaining.length > 0 && !remaining.some((v) => v.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      return { ...prev, variants: remaining }
    })
  }

  const toggleMultipleVariants = () => {
    setForm((prev) => {
      const next = !prev.hasMultipleVariants
      if (next && prev.variants.length === 0) {
        return {
          ...prev,
          hasMultipleVariants: true,
          variants: [
            {
              ...newRow(),
              name: 'Default',
              sku: prev.baseSku,
              price: prev.basePrice,
              salePrice: prev.baseSalePrice,
              isDefault: true,
            },
          ],
        }
      }
      return { ...prev, hasMultipleVariants: next }
    })
  }

  /* ── Image helpers ── */

  const openPicker = (target: PickerTarget) => setPickerTarget(target)

  const handlePicked = (assets: { id: string; secureUrl: string; alt: string | null }[]) => {
    if (!pickerTarget) return
    const newImages: SelectedImage[] = assets.map((a) => ({
      mediaAssetId: a.id,
      url: a.secureUrl,
      altText: a.alt ?? undefined,
    }))
    if (pickerTarget.kind === 'product') {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }))
    } else {
      const { variantLocalId } = pickerTarget
      setForm((prev) => ({
        ...prev,
        variants: prev.variants.map((v) =>
          v._localId === variantLocalId ? { ...v, images: [...v.images, ...newImages] } : v,
        ),
      }))
    }
    setPickerTarget(null)
  }

  const removeProductImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
  }

  const removeVariantImage = (variantLocalId: string, idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v._localId === variantLocalId
          ? { ...v, images: v.images.filter((_, i) => i !== idx) }
          : v,
      ),
    }))
  }

  /* ── Category toggle ── */

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }))
  }

  /* ── Feedback ── */

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    if (type === 'success') setTimeout(() => setFeedback(null), 4000)
  }

  /* ── Save ── */

  const handleSave = async (overrideStatus?: ProductStatus) => {
    if (!form.name.trim()) {
      showFeedback('error', 'Product name is required.')
      return
    }
    if (!form.hasMultipleVariants) {
      if (!form.basePrice || parseFloat(form.basePrice) <= 0) {
        showFeedback('error', 'Price is required.')
        return
      }
    } else {
      if (form.variants.length === 0) {
        showFeedback('error', 'Add at least one variant or disable multiple variants.')
        return
      }
      if (form.variants.some((v) => !v.name.trim())) {
        showFeedback('error', 'Each variant must have a name.')
        return
      }
      if (form.variants.some((v) => !v.price)) {
        showFeedback('error', 'Each variant must have a price.')
        return
      }
    }

    const status = overrideStatus ?? form.status
    const existingDefaultId = existing?.variants.find((v) => v.isDefault)?.id
    const payload = buildPayload(form, status, existingDefaultId)

    try {
      if (isEdit && productId) {
        await mutations.update.mutateAsync({ id: productId, data: payload })
        showFeedback('success', 'Product saved.')
      } else {
        const created = await mutations.create.mutateAsync(payload)
        showFeedback('success', 'Product created.')
        router.push(`/admin/products/${created.id}/edit`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      showFeedback('error', msg)
    }
  }

  /* ── Render ── */

  if (loadingExisting) return <LoadingWrap>Loading…</LoadingWrap>

  const isSaving = mutations.create.isPending || mutations.update.isPending
  const pageTitle = isEdit ? (existing?.name ?? 'Edit product') : 'New product'

  return (
    <>
      <PageHeader
        title={pageTitle}
        breadcrumbs={[{ label: 'Products', href: '/admin/products' }]}
        actions={
          <HeaderActions>
            <DiscardLink href="/admin/products">Discard</DiscardLink>
            <Button
              $variant="secondary"
              $size="sm"
              onClick={() => handleSave('DRAFT')}
              disabled={isSaving}
            >
              Save draft
            </Button>
            <Button
              $variant="primary"
              $size="sm"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving…'
                : form.status === 'PUBLISHED'
                  ? 'Save'
                  : 'Publish'}
            </Button>
          </HeaderActions>
        }
      />

      {feedback && (
        <Banner $type={feedback.type}>
          {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {feedback.message}
        </Banner>
      )}

      <FormGrid>
        {/* ════════════════ Left column ════════════════ */}
        <LeftCol>
          {/* Basic details */}
          <Card>
            <CardHeader><CardTitle>Basic details</CardTitle></CardHeader>
            <CardBody>
              <Field>
                <Label htmlFor="name">Name <sup>*</sup></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Linen Canvas Natural"
                />
              </Field>

              <Row2>
                <Field>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManual(true)
                      set('slug', e.target.value)
                    }}
                    placeholder="linen-canvas-natural"
                  />
                </Field>
                <Field>
                  <Label htmlFor="fabricType">Fabric type</Label>
                  <Input
                    id="fabricType"
                    value={form.fabricType}
                    onChange={(e) => set('fabricType', e.target.value)}
                    placeholder="e.g. Linen, Cotton, Silk"
                  />
                </Field>
              </Row2>
              <HelperText>Slug is auto-generated from the name. You can override it.</HelperText>
            </CardBody>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardBody>
              <Field>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="Describe the fabric — feel, weave, drape, and use cases…"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              {form.images.length > 0 && (
                <StatusBadge $variant="neutral">
                  {form.images.length} image{form.images.length === 1 ? '' : 's'}
                </StatusBadge>
              )}
            </CardHeader>
            <CardBody>
              <HelperText>
                Upload or pick from the Media Library. First image is used as the cover.
              </HelperText>
              <Gallery>
                {form.images.map((img, idx) => (
                  <Tile key={`${img.mediaAssetId}-${idx}`}>
                    <img src={img.url} alt={img.altText ?? ''} />
                    <TileRemove
                      type="button"
                      onClick={() => removeProductImage(idx)}
                      aria-label="Remove image"
                    >
                      <X size={13} />
                    </TileRemove>
                  </Tile>
                ))}
                <AddTile
                  type="button"
                  onClick={() => openPicker({ kind: 'product' })}
                  aria-label="Add image"
                >
                  <ImagePlus size={22} strokeWidth={1.5} />
                </AddTile>
              </Gallery>
            </CardBody>
          </Card>

          {/* Technical specifications */}
          <Card>
            <CardHeader><CardTitle>Technical specifications</CardTitle></CardHeader>
            <CardBody>
              <Field>
                <Label htmlFor="materialComposition">Material composition</Label>
                <Input
                  id="materialComposition"
                  value={form.materialComposition}
                  onChange={(e) => set('materialComposition', e.target.value)}
                  placeholder="e.g. 100% Linen"
                />
              </Field>
              <Row2>
                <Field>
                  <Label htmlFor="widthCm">Width (cm)</Label>
                  <Input
                    id="widthCm"
                    type="number"
                    min={1}
                    value={form.widthCm}
                    onChange={(e) => set('widthCm', e.target.value)}
                    placeholder="140"
                  />
                </Field>
                <Field>
                  <Label htmlFor="weightGsm">Weight (gsm)</Label>
                  <Input
                    id="weightGsm"
                    type="number"
                    min={1}
                    value={form.weightGsm}
                    onChange={(e) => set('weightGsm', e.target.value)}
                    placeholder="180"
                  />
                </Field>
              </Row2>
              <Field>
                <Label htmlFor="careInstructions">Care instructions</Label>
                <Textarea
                  id="careInstructions"
                  value={form.careInstructions}
                  onChange={(e) => set('careInstructions', e.target.value)}
                  rows={2}
                  placeholder="e.g. Machine wash at 30°C, iron while damp"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Fabric selling rules */}
          <Card>
            <CardHeader><CardTitle>Fabric selling rules</CardTitle></CardHeader>
            <CardBody>
              <HelperText>How this fabric is measured and sold. Applies to all variants.</HelperText>
              <Row3>
                <Field>
                  <Label htmlFor="sellingUnit">Selling unit</Label>
                  <Select
                    id="sellingUnit"
                    value={form.sellingUnit}
                    onChange={(e) => set('sellingUnit', e.target.value as SellingUnit)}
                  >
                    {(Object.keys(SELLING_UNIT_LABELS) as SellingUnit[]).map((unit) => (
                      <option key={unit} value={unit}>{SELLING_UNIT_LABELS[unit]}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="minOrderQty">Min. order qty</Label>
                  <Input
                    id="minOrderQty"
                    type="number"
                    min={1}
                    step={1}
                    value={form.minOrderQty}
                    onChange={(e) => set('minOrderQty', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="qtyIncrement">Qty increment</Label>
                  <Input
                    id="qtyIncrement"
                    type="number"
                    min={1}
                    step={1}
                    value={form.qtyIncrement}
                    onChange={(e) => set('qtyIncrement', e.target.value)}
                  />
                </Field>
              </Row3>
            </CardBody>
          </Card>

          {/* Pricing & variants */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & variants</CardTitle>
              {isEdit && (
                <StatusBadge $variant="neutral">
                  {form.variants.length} variant{form.variants.length !== 1 ? 's' : ''}
                </StatusBadge>
              )}
            </CardHeader>

            <CardBody>
                {!form.hasMultipleVariants ? (
                  <Row3>
                    <Field>
                      <Label htmlFor="basePrice">Price (₦) <sup>*</sup></Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.basePrice}
                        onChange={(e) => set('basePrice', e.target.value)}
                        placeholder="0.00"
                      />
                    </Field>
                    <Field>
                      <Label htmlFor="baseSalePrice">Sale price (₦)</Label>
                      <Input
                        id="baseSalePrice"
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.baseSalePrice}
                        onChange={(e) => set('baseSalePrice', e.target.value)}
                        placeholder="optional"
                      />
                    </Field>
                    <Field>
                      <Label htmlFor="baseSku">SKU</Label>
                      <Input
                        id="baseSku"
                        value={form.baseSku}
                        onChange={(e) => set('baseSku', e.target.value)}
                        placeholder="optional"
                      />
                    </Field>
                  </Row3>
                ) : (
                  <>
                    {form.variants.length > 0 && (
                      <VTableWrap>
                        <VTable>
                          <thead>
                            <tr>
                              <VTh title="Default variant">★</VTh>
                              <VTh>Image</VTh>
                              <VTh>Name <sup style={{ color: '#b03a2e' }}>*</sup></VTh>
                              <VTh>SKU</VTh>
                              <VTh>Price (₦) <sup style={{ color: '#b03a2e' }}>*</sup></VTh>
                              <VTh>Sale (₦)</VTh>
                              <VTh />
                            </tr>
                          </thead>
                          <tbody>
                            {form.variants.map((v) => (
                              <tr key={v._localId}>
                                <VTd>
                                  <DefaultRadio
                                    type="radio"
                                    name="variantDefault"
                                    checked={v.isDefault}
                                    onChange={() => setDefaultVariant(v._localId)}
                                    aria-label={`Set ${v.name || 'this variant'} as default`}
                                  />
                                </VTd>
                                <VTd>
                                  {v.images[0] ? (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}
                                    >
                                      <MediaThumb src={v.images[0].url} size={32} />
                                      <DeleteRowBtn
                                        type="button"
                                        onClick={() => removeVariantImage(v._localId, 0)}
                                        aria-label="Remove variant image"
                                      >
                                        <X size={12} />
                                      </DeleteRowBtn>
                                    </div>
                                  ) : (
                                    <VariantImageButton
                                      type="button"
                                      onClick={() =>
                                        openPicker({ kind: 'variant', variantLocalId: v._localId })
                                      }
                                    >
                                      <ImagePlus size={12} /> Add
                                    </VariantImageButton>
                                  )}
                                </VTd>
                                <VTd>
                                  <VInput
                                    value={v.name}
                                    onChange={(e) =>
                                      updateVariant(v._localId, { name: e.target.value })
                                    }
                                    placeholder="e.g. Natural"
                                    aria-label="Variant name"
                                  />
                                </VTd>
                                <VTd>
                                  <VInput
                                    value={v.sku}
                                    onChange={(e) =>
                                      updateVariant(v._localId, { sku: e.target.value })
                                    }
                                    placeholder="optional"
                                    aria-label="SKU"
                                  />
                                </VTd>
                                <VTd>
                                  <VInput
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={v.price}
                                    onChange={(e) =>
                                      updateVariant(v._localId, { price: e.target.value })
                                    }
                                    placeholder="0.00"
                                    aria-label="Price"
                                  />
                                </VTd>
                                <VTd>
                                  <VInput
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={v.salePrice}
                                    onChange={(e) =>
                                      updateVariant(v._localId, { salePrice: e.target.value })
                                    }
                                    placeholder="optional"
                                    aria-label="Sale price"
                                  />
                                </VTd>
                                <VTd>
                                  <DeleteRowBtn
                                    type="button"
                                    onClick={() => removeVariant(v._localId)}
                                    aria-label={`Remove ${v.name || 'variant'}`}
                                    disabled={form.variants.length === 1}
                                  >
                                    <Trash2 size={13} />
                                  </DeleteRowBtn>
                                </VTd>
                              </tr>
                            ))}
                          </tbody>
                        </VTable>
                      </VTableWrap>
                    )}
                    <AddVariantBar>
                      <Button
                        $variant="ghost"
                        $size="sm"
                        type="button"
                        onClick={addVariant}
                      >
                        <Plus size={14} style={{ marginRight: '0.25rem' }} />
                        Add variant
                      </Button>
                    </AddVariantBar>
                  </>
                )}

                <ToggleRow htmlFor="hasMultipleVariants">
                  <span>
                    This product has multiple variants
                    <br />
                    <HelperText as="span">Use variants for colour, size, or other options.</HelperText>
                  </span>
                  <ToggleTrack $on={form.hasMultipleVariants}>
                    <input
                      type="checkbox"
                      id="hasMultipleVariants"
                      checked={form.hasMultipleVariants}
                      onChange={toggleMultipleVariants}
                    />
                  </ToggleTrack>
                </ToggleRow>
              </CardBody>
          </Card>
        </LeftCol>

        {/* ════════════════ Right column ════════════════ */}
        <RightCol>
          {/* Status */}
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardBody>
              <StatusOptions>
                {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as ProductStatus[]).map((s) => (
                  <StatusOption
                    key={s}
                    $selected={form.status === s}
                    htmlFor={`status-${s}`}
                  >
                    <input
                      type="radio"
                      id={`status-${s}`}
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => set('status', s)}
                    />
                    <StatusDot $status={s} aria-hidden />
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </StatusOption>
                ))}
              </StatusOptions>
            </CardBody>
          </Card>

          {/* Organisation */}
          <Card>
            <CardHeader><CardTitle>Organisation</CardTitle></CardHeader>
            <CardBody>
              <Field>
                <Label>Categories</Label>
                {categories.length === 0 ? (
                  <HelperText>No categories yet. Create some in the Catalogue section.</HelperText>
                ) : (
                  <CategoryList>
                    {categories.flatMap((cat) => [
                      <CheckRow key={cat.id} htmlFor={`cat-${cat.id}`}>
                        <input
                          type="checkbox"
                          id={`cat-${cat.id}`}
                          checked={form.categoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        {cat.name}
                      </CheckRow>,
                      ...(cat.children ?? []).map((child) => (
                        <CheckRow key={child.id} htmlFor={`cat-${child.id}`} $indent>
                          <input
                            type="checkbox"
                            id={`cat-${child.id}`}
                            checked={form.categoryIds.includes(child.id)}
                            onChange={() => toggleCategory(child.id)}
                          />
                          {child.name}
                        </CheckRow>
                      )),
                    ])}
                  </CategoryList>
                )}
                <HelperText>Manage categories in the Catalogue section.</HelperText>
              </Field>

              <Field>
                <FeaturedRow htmlFor="isFeatured">
                  Featured product
                  <ToggleTrack $on={form.isFeatured}>
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={form.isFeatured}
                      onChange={(e) => set('isFeatured', e.target.checked)}
                    />
                  </ToggleTrack>
                </FeaturedRow>
                <HelperText>Featured products appear in highlighted storefront sections.</HelperText>
              </Field>
            </CardBody>
          </Card>
        </RightCol>
      </FormGrid>

      <MediaPicker
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(assets) =>
          handlePicked(
            assets.map((a) => ({ id: a.id, secureUrl: a.secureUrl, alt: a.alt })),
          )
        }
        multiple={pickerTarget?.kind === 'product'}
        folder={pickerTarget?.kind === 'variant' ? 'variants' : 'products'}
        title={pickerTarget?.kind === 'variant' ? 'Choose variant image' : 'Add product images'}
      />
    </>
  )
}
