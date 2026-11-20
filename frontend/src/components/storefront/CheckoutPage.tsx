'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { PiCreditCardLight, PiBankLight, PiLockLight } from 'react-icons/pi'
import { useCart } from '@/hooks/useCart'
import { useCreateOrder } from '@/hooks/useOrders'
import { usePaystackPopup } from '@/hooks/usePaystackPopup'
import { useAuth } from '@/hooks/useAuth'
import { useAddresses, useAddressMutations, useCustomerProfile } from '@/hooks/useCustomer'
import { MAX_SAVED_ADDRESSES, formatAddressLine, type SavedAddress } from '@/types/customer'
import { formatMoney } from '@/lib/formatMoney'
import type { CheckoutPayload, CreateOrderResponse } from '@/types/order'


/* ── Validation (mirrors the API; the server remains authoritative) ── */

type FormState = Required<CheckoutPayload>
type Errors = Partial<Record<keyof FormState, string>>

const EMPTY_FORM: FormState = {
  email: '',
  customerName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
}

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!form.customerName.trim()) errors.customerName = 'Enter your full name.'
  if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Enter your delivery address.'
  if (!form.city.trim()) errors.city = 'Enter your city.'
  if (!form.state.trim()) errors.state = 'Enter your state.'
  return errors
}

/* ── Component ──────────────────────────────────────────── */

export function CheckoutPage() {
  const { data: cart, isLoading: cartLoading } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const profile = useCustomerProfile()
  const addresses = useAddresses()
  const { create: saveAddress } = useAddressMutations()
  const savedAddresses = user ? addresses.data ?? [] : []
  // Which saved address is in use, or 'new' for typing one in.
  const [addressChoice, setAddressChoice] = useState<string | 'new' | null>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(true)
  // The cart waits for the session to restore; show loading rather than "empty".
  const isLoading = cartLoading || authLoading
  const createOrder = useCreateOrder()
  const popup = usePaystackPopup()
  const router = useRouter()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [redirecting, setRedirecting] = useState(false)
  // The order awaiting payment. Once set, the cart no longer exists.
  const [placed, setPlaced] = useState<CreateOrderResponse | null>(null)
  const [closedWithoutPaying, setClosedWithoutPaying] = useState(false)

  // Signed-in customers get their name and email filled in (still editable).
  useEffect(() => {
    if (!profile.data) return
    const { email, name } = profile.data
    setForm((f) => ({
      ...f,
      email: f.email || email,
      customerName: f.customerName || name,
    }))
  }, [profile.data])

  const applyAddress = (a: SavedAddress) =>
    setForm((f) => ({
      ...f,
      customerName: a.recipientName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode ?? '',
    }))

  // Preselect the default saved address once the address book loads.
  useEffect(() => {
    if (addressChoice !== null || !addresses.data) return
    const preferred = addresses.data.find((a) => a.isDefault) ?? addresses.data[0]
    if (preferred) {
      applyAddress(preferred)
      setAddressChoice(preferred.id)
    } else {
      setAddressChoice('new')
    }
  }, [addresses.data, addressChoice])

  const chooseAddress = (choice: string) => {
    setAddressChoice(choice)
    setErrors({})
    const picked = savedAddresses.find((a) => a.id === choice)
    if (picked) {
      applyAddress(picked)
    } else {
      setForm((f) => ({ ...f, addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '' }))
    }
  }

  const usingSavedAddress = savedAddresses.length > 0 && addressChoice !== null && addressChoice !== 'new'
  const canSaveAddress =
    Boolean(user) && !usingSavedAddress && savedAddresses.length < MAX_SAVED_ADDRESSES

  const items = cart?.items ?? []
  const busy = createOrder.isPending || redirecting || popup.isBusy

  /** Opens Paystack's popup over this page; falls back to the hosted page if it can't load. */
  const openPayment = (result: CreateOrderResponse) => {
    setClosedWithoutPaying(false)
    void popup.open({
      accessCode: result.accessCode,
      onSuccess: (reference) => {
        setRedirecting(true)
        router.push(`/checkout/callback?reference=${encodeURIComponent(reference)}`)
      },
      onCancel: () => setClosedWithoutPaying(true),
      onUnavailable: () => {
        setRedirecting(true)
        window.location.assign(result.authorizationUrl)
      },
    })
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // A saved address that no longer passes validation: open it for editing.
      const addressKeys: Array<keyof FormState> = ['addressLine1', 'city', 'state']
      if (usingSavedAddress && addressKeys.some((k) => found[k])) setAddressChoice('new')
      return
    }

    try {
      const result = await createOrder.mutateAsync({
        email: form.email.trim(),
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim() || undefined,
      })
      setPlaced(result)
      openPayment(result)

      // Best effort: the order is placed either way; duplicates are ignored server-side.
      if (canSaveAddress && saveNewAddress) {
        saveAddress.mutate({
          recipientName: form.customerName.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
        })
      }
    } catch {
      // Surfaced through createOrder.error below; the form keeps its values.
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & { optional?: boolean; full?: boolean } = {},
  ) => {
    const { optional, full, ...inputProps } = props
    const id = `checkout-${key}`
    return (
      <Field $full={full}>
        <Label htmlFor={id}>
          {label} {optional && <Optional>(optional)</Optional>}
        </Label>
        <Input
          id={id}
          name={key}
          value={form[key]}
          onChange={set(key)}
          required={!optional}
          $invalid={Boolean(errors[key])}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${id}-error` : undefined}
          {...inputProps}
        />
        {errors[key] && <FieldError id={`${id}-error`}>{errors[key]}</FieldError>}
      </Field>
    )
  }

  return (
    <Wrap>
      <Header>
        <HeaderInner>
          <Title>Checkout</Title>
        </HeaderInner>
      </Header>

      {redirecting ? (
        <Empty role="status">One moment — checking your payment…</Empty>
      ) : placed ? (
        <PendingPanel>
          <PendingTitle>
            {closedWithoutPaying ? 'Your order is saved' : 'Complete your payment'}
          </PendingTitle>
          <PendingAmount>
            {formatMoney(placed.order.totalAmount, placed.order.currencyCode)}
          </PendingAmount>
          <PendingText role="status">
            {closedWithoutPaying
              ? 'You closed the payment window before paying. Nothing has been charged. If you already sent a bank transfer, you don\u2019t need to do anything — we\u2019ll confirm it when it arrives.'
              : 'Pay by card or bank transfer in the secure Paystack window.'}
          </PendingText>
          <PayBtn type="button" onClick={() => openPayment(placed)} disabled={popup.isBusy}>
            <PiLockLight size={14} aria-hidden />
            {popup.status === 'opening'
              ? 'Opening payment…'
              : popup.status === 'open'
                ? 'Payment window open'
                : 'Pay now'}
          </PayBtn>
          <Note>Order reference {placed.order.reference}</Note>
          <BackLink href={`/orders/${encodeURIComponent(placed.order.reference)}`}>
            View order status
          </BackLink>
        </PendingPanel>
      ) : isLoading && items.length === 0 ? (
        <Empty>Loading your cart…</Empty>
      ) : items.length === 0 ? (
        <Empty>
          Your cart is empty.
          <br />
          <Link href="/shop">Continue shopping</Link>
        </Empty>
      ) : (
        <Body onSubmit={handleSubmit} noValidate>
          <div>
            <Fieldset>
              <Legend>Contact</Legend>
              {user ? (
                <AccountNote>Signed in as {user.email}</AccountNote>
              ) : (
                <AccountNote>
                  Have an account?{' '}
                  <Link href="/account/login?returnTo=/checkout">Sign in</Link> for faster
                  checkout.
                </AccountNote>
              )}
              <Grid>
                {field('email', 'Email', { type: 'email', autoComplete: 'email', full: true })}
                {field('customerName', 'Full name', { autoComplete: 'name' })}
                {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '+234…' })}
              </Grid>
            </Fieldset>

            <Fieldset>
              <Legend>Delivery address</Legend>
              {savedAddresses.length > 0 && (
                <AddressChoices role="radiogroup" aria-label="Saved addresses">
                  {savedAddresses.map((a) => (
                    <AddressChoice key={a.id} $selected={addressChoice === a.id}>
                      <input
                        type="radio"
                        name="address-choice"
                        checked={addressChoice === a.id}
                        onChange={() => chooseAddress(a.id)}
                      />
                      <span>
                        <strong>{a.label || a.recipientName}</strong>
                        {a.isDefault && <DefaultTag>Default</DefaultTag>}
                        <br />
                        {formatAddressLine(a)}
                      </span>
                    </AddressChoice>
                  ))}
                  <AddressChoice $selected={addressChoice === 'new'}>
                    <input
                      type="radio"
                      name="address-choice"
                      checked={addressChoice === 'new'}
                      onChange={() => chooseAddress('new')}
                    />
                    <span>
                      <strong>Use a different address</strong>
                    </span>
                  </AddressChoice>
                </AddressChoices>
              )}
              {!usingSavedAddress && (
              <Grid>
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
              )}
              {canSaveAddress && (
                <SaveCheck>
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                  />
                  Save this address to my account for next time
                </SaveCheck>
              )}
            </Fieldset>

            <Fieldset>
              <Legend>Payment</Legend>
              <PayMethods>
                <PayMethod>
                  <PiCreditCardLight size={20} aria-hidden />
                  <div>
                    <strong>Card</strong>
                    <span>Pay with your debit or credit card. Confirmed instantly.</span>
                  </div>
                </PayMethod>
                <PayMethod>
                  <PiBankLight size={20} aria-hidden />
                  <div>
                    <strong>Bank transfer</strong>
                    <span>
                      Transfer to the account shown in the payment window. We confirm your order as soon
                      as the transfer arrives.
                    </span>
                  </div>
                </PayMethod>
              </PayMethods>
            </Fieldset>
          </div>

          <Summary>
            <SummaryHead>Order summary</SummaryHead>
            <Lines>
              {items.map((item) => (
                <Line key={item.id}>
                  <Thumb>
                    {item.variant.coverImage?.url && (
                      <Image
                        src={item.variant.coverImage.url}
                        alt={item.variant.coverImage.altText ?? item.variant.product.name}
                        fill
                        sizes="56px"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </Thumb>
                  <div>
                    {item.variant.product.name}
                    <LineMeta>
                      {item.variant.name !== item.variant.product.name && `${item.variant.name} · `}
                      Qty {item.quantity}
                    </LineMeta>
                  </div>
                  <span>{formatMoney(item.lineTotalAmount, item.currencyCode)}</span>
                </Line>
              ))}
            </Lines>
            <Row>
              <span>Subtotal</span>
              <span>{formatMoney(cart?.subtotalAmount ?? 0, cart?.currencyCode)}</span>
            </Row>
            <Total>
              <span>Total</span>
              <span>{formatMoney(cart?.subtotalAmount ?? 0, cart?.currencyCode)}</span>
            </Total>

            {createOrder.isError && (
              <Alert role="alert">
                {createOrder.error instanceof Error
                  ? createOrder.error.message
                  : 'We could not start your payment. Please try again.'}
              </Alert>
            )}

            <PayBtn type="submit" disabled={busy}>
              <PiLockLight size={14} aria-hidden />
              {busy ? 'Starting payment…' : `Pay ${formatMoney(cart?.subtotalAmount ?? 0, cart?.currencyCode)}`}
            </PayBtn>
            <BackLink href="/cart">Back to cart</BackLink>
          </Summary>
        </Body>
      )}
    </Wrap>
  )
}

/* ── Layout ─────────────────────────────────────────────── */

const Wrap = styled.section`
  min-height: 60vh;
`

const Header = styled.header`
  background: ${({ theme }) => theme.colors.clay};
`

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 2.25rem ${({ theme }) => theme.layout.pagePaddingX};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem ${({ theme }) => theme.layout.pagePaddingXMobile};
  }
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  color: ${({ theme }) => theme.colors.textNav};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const Body = styled.form`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 3rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3.5rem;
  }
`

const Empty = styled.div`
  text-align: center;
  padding: 5rem 1rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    display: inline-block;
    margin-top: 1rem;
    color: ${({ theme }) => theme.colors.terracotta};
    text-decoration: underline;
  }
`

/* ── Form ───────────────────────────────────────────────── */

const Fieldset = styled.fieldset`
  border: 0;
  padding: 0;
  margin: 0 0 2.5rem;
  min-width: 0;
`

const AccountNote = styled.p`
  margin: -0.5rem 0 1.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    color: ${({ theme }) => theme.colors.terracottaDark};
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`

const AddressChoices = styled.div`
  display: grid;
  gap: 0.625rem;
  margin-bottom: 1.25rem;
`

const AddressChoice = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.terracotta : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primary100 : theme.colors.surface)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.snug};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  input {
    margin-top: 3px;
    accent-color: ${({ theme }) => theme.colors.terracotta};
  }

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

const DefaultTag = styled.span`
  margin-left: 0.5rem;
  padding: 0.0625rem 0.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.sand};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textNav};
`

const SaveCheck = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input { accent-color: ${({ theme }) => theme.colors.terracotta}; }
`

const Legend = styled.legend`
  padding: 0;
  margin-bottom: 1.25rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.25rem;

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
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Optional = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Input = styled.input<{ $invalid?: boolean }>`
  height: 46px;
  padding: 0 0.875rem;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.terracotta};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const FieldError = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`

const PayMethods = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const PayMethod = styled.li`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textNav};

  svg { flex-shrink: 0; margin-top: 2px; }

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.nav};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  span {
    font-family: ${({ theme }) => theme.fonts.nav};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: ${({ theme }) => theme.lineHeights.snug};
  }
`

/* ── Summary ────────────────────────────────────────────── */

const Summary = styled.aside`
  background: ${({ theme }) => theme.colors.primary150};
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: start;
`

const SummaryHead = styled.h2`
  margin: 0 0 0.25rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textNav};
`

const Lines = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`

const Line = styled.li`
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Thumb = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.sand};
`

const LineMeta = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textNav};
`

const Total = styled(Row)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const PayBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.terracottaDark}; }
  &:disabled { opacity: 0.6; cursor: wait; }
`

const Note = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.lineHeights.snug};
`

const Alert = styled.div`
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

/* Shown once the order exists: the cart is gone, payment is all that's left. */
const PendingPanel = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingXMobile} 5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
`

const PendingTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textNav};
`

const PendingText = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PendingAmount = styled.p`
  margin: 0.25rem 0 0.5rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.textNav};
`

const BackLink = styled(Link)`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.terracotta};
  text-decoration: underline;
`
