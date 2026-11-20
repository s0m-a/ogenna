'use client'

import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { PiMapPinLight, PiPlusLight } from 'react-icons/pi'
import { Modal } from '@/components/common/Modal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAddresses, useAddressMutations } from '@/hooks/useCustomer'
import {
  MAX_SAVED_ADDRESSES,
  formatAddressLine,
  type AddressInput,
  type SavedAddress,
} from '@/types/customer'
import { Spinner } from './accountStyles'

type FormState = Required<Omit<AddressInput, 'isDefault'>> & { isDefault: boolean }
type Errors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = {
  label: '',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: false,
}

/** Mirrors the API rules (the server stays authoritative). */
export function validateAddress(form: Pick<FormState, 'recipientName' | 'phone' | 'addressLine1' | 'city' | 'state'>): Errors {
  const errors: Errors = {}
  if (!form.recipientName.trim()) errors.recipientName = 'Enter the recipient’s name.'
  if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Enter the street address.'
  if (!form.city.trim()) errors.city = 'Enter the city.'
  if (!form.state.trim()) errors.state = 'Enter the state.'
  return errors
}

function toForm(a: SavedAddress): FormState {
  return {
    label: a.label ?? '',
    recipientName: a.recipientName,
    phone: a.phone,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2 ?? '',
    city: a.city,
    state: a.state,
    postalCode: a.postalCode ?? '',
    isDefault: a.isDefault,
  }
}

export function AddressBook() {
  const addresses = useAddresses()
  const { setDefault, remove } = useAddressMutations()
  // null = closed, 'new' = adding, otherwise the address being edited
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SavedAddress | null>(null)

  const list = addresses.data ?? []
  const atLimit = list.length >= MAX_SAVED_ADDRESSES

  return (
    <Section aria-labelledby="addresses-heading">
      <Head>
        <Title id="addresses-heading">Saved addresses</Title>
        {list.length > 0 && (
          <AddBtn type="button" onClick={() => setEditing('new')} disabled={atLimit}>
            <PiPlusLight size={16} aria-hidden />
            Add address
          </AddBtn>
        )}
      </Head>

      {addresses.isLoading ? (
        <Spinner aria-label="Loading addresses" />
      ) : addresses.isError ? (
        <Muted>We couldn’t load your addresses.</Muted>
      ) : list.length === 0 ? (
        <Empty>
          <PiMapPinLight size={22} aria-hidden />
          <p>Save a delivery address to check out in seconds next time.</p>
          <AddBtn type="button" onClick={() => setEditing('new')}>
            <PiPlusLight size={16} aria-hidden />
            Add address
          </AddBtn>
        </Empty>
      ) : (
        <>
          <Cards>
            {list.map((a) => (
              <Card key={a.id} $default={a.isDefault}>
                <CardTop>
                  <strong>{a.label || a.recipientName}</strong>
                  {a.isDefault && <StatusBadge $variant="primary">Default</StatusBadge>}
                </CardTop>
                {a.label && <span>{a.recipientName}</span>}
                <span>{formatAddressLine(a)}</span>
                {a.postalCode && <span>{a.postalCode}</span>}
                <Muted>{a.phone}</Muted>
                <Actions>
                  <TextBtn type="button" onClick={() => setEditing(a)}>
                    Edit
                  </TextBtn>
                  {!a.isDefault && (
                    <TextBtn
                      type="button"
                      disabled={setDefault.isPending}
                      onClick={() => setDefault.mutate(a.id)}
                    >
                      Make default
                    </TextBtn>
                  )}
                  <TextBtn type="button" $danger onClick={() => setConfirmDelete(a)}>
                    Remove
                  </TextBtn>
                </Actions>
              </Card>
            ))}
          </Cards>
          {atLimit && (
            <Muted>You’ve saved {MAX_SAVED_ADDRESSES} addresses — remove one to add another.</Muted>
          )}
        </>
      )}

      {editing && (
        <AddressDialog
          address={editing === 'new' ? null : editing}
          isFirst={list.length === 0}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove address?"
        size="sm"
        footer={
          <>
            <SecondaryBtn type="button" onClick={() => setConfirmDelete(null)}>
              Keep it
            </SecondaryBtn>
            <DangerBtn
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                confirmDelete &&
                remove.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
              }
            >
              {remove.isPending ? 'Removing…' : 'Remove'}
            </DangerBtn>
          </>
        }
      >
        {confirmDelete && (
          <Muted>
            {formatAddressLine(confirmDelete)} will be removed from your address book. Past orders
            keep their delivery details.
          </Muted>
        )}
      </Modal>
    </Section>
  )
}

/* ── Add / edit dialog ──────────────────────────────────── */

function AddressDialog({
  address,
  isFirst,
  onClose,
}: {
  address: SavedAddress | null
  isFirst: boolean
  onClose: () => void
}) {
  const { create, update } = useAddressMutations()
  const [form, setForm] = useState<FormState>(address ? toForm(address) : { ...EMPTY, isDefault: isFirst })
  const [errors, setErrors] = useState<Errors>({})
  const mutation = address ? update : create
  const formId = 'address-form'

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateAddress(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const input: AddressInput = {
      label: form.label.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      isDefault: form.isDefault,
    }
    if (address) update.mutate({ id: address.id, input }, { onSuccess: onClose })
    else create.mutate(input, { onSuccess: onClose })
  }

  const field = (
    key: Exclude<keyof FormState, 'isDefault'>,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & { optional?: boolean; full?: boolean } = {},
  ) => {
    const { optional, full, ...rest } = props
    const id = `address-${key}`
    return (
      <Field $full={full}>
        <Label htmlFor={id}>
          {label} {optional && <Optional>(optional)</Optional>}
        </Label>
        <Input
          id={id}
          value={form[key]}
          onChange={set(key)}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${id}-error` : undefined}
          $invalid={Boolean(errors[key])}
          {...rest}
        />
        {errors[key] && <FieldError id={`${id}-error`}>{errors[key]}</FieldError>}
      </Field>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={address ? 'Edit address' : 'Add an address'}
      footer={
        <>
          <SecondaryBtn type="button" onClick={onClose}>
            Cancel
          </SecondaryBtn>
          <PrimaryBtn type="submit" form={formId} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save address'}
          </PrimaryBtn>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate>
        {mutation.isError && (
          <ErrorBox role="alert">
            {mutation.error instanceof Error ? mutation.error.message : 'Couldn’t save the address.'}
          </ErrorBox>
        )}
        <Grid>
          {field('label', 'Nickname', { optional: true, placeholder: 'Home, Studio…', maxLength: 40, full: true })}
          {field('recipientName', 'Recipient name', { autoComplete: 'name' })}
          {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '+234…' })}
          {field('addressLine1', 'Address', { autoComplete: 'address-line1', full: true })}
          {field('addressLine2', 'Apartment, suite, landmark', {
            autoComplete: 'address-line2',
            optional: true,
            full: true,
          })}
          {field('city', 'City', { autoComplete: 'address-level2' })}
          {field('state', 'State', { autoComplete: 'address-level1' })}
          {field('postalCode', 'Postal code', { autoComplete: 'postal-code', optional: true })}
        </Grid>
        {!(address?.isDefault) && (
          <Check>
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
            Use as my default delivery address
          </Check>
        )}
      </form>
    </Modal>
  )
}

/* ── Styles ─────────────────────────────────────────────── */

const Section = styled.section`
  margin-top: 3rem;
`

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.surfaceMuted}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Cards = styled.ul`
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
`

const Card = styled.li<{ $default: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid
    ${({ theme, $default }) => ($default ? theme.colors.terracotta : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.snug};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
`

const TextBtn = styled.button<{ $danger?: boolean }>`
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.terracottaDark)};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: wait; }
`

const Muted = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};

  p { margin: 0; }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.div<{ $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  grid-column: ${({ $full }) => ($full ? '1 / -1' : 'auto')};
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Optional = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Input = styled.input<{ $invalid?: boolean }>`
  padding: 0.625rem 0.75rem;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const FieldError = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`

const ErrorBox = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input { accent-color: ${({ theme }) => theme.colors.terracotta}; }
`

const PrimaryBtn = styled.button`
  padding: 0.625rem 1.25rem;
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  border-radius: ${({ theme }) => theme.radii.full};
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.terracottaDark}; }
  &:disabled { opacity: 0.6; cursor: wait; }
`

const SecondaryBtn = styled.button`
  padding: 0.625rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
`

const DangerBtn = styled(PrimaryBtn)`
  background: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.danger}; filter: brightness(0.92); }
`
