'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styled from 'styled-components'
import { PiWarningLight, PiCheckCircleLight, PiClockLight, PiBankLight, PiCircleNotchLight, PiXCircleLight } from 'react-icons/pi'
import type { IconType } from 'react-icons'
import { useOrderVerification } from '@/hooks/useOrders'
import { usePaystackPopup } from '@/hooks/usePaystackPopup'
import { formatMoney } from '@/lib/formatMoney'
import type { PaymentDisplayState, PublicOrder } from '@/types/order'

/* ── Styles ─────────────────────────────────────────────── */

type Tone = 'success' | 'waiting' | 'danger'

const Wrap = styled.section`
  max-width: 760px;
  margin: 0 auto;
  padding: 4rem ${({ theme }) => theme.layout.pagePaddingXMobile} 5rem;
  min-height: 60vh;
`

const StatusCard = styled.div<{ $tone: Tone }>`
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.successBg
      : $tone === 'danger'
        ? theme.colors.dangerBg
        : theme.colors.primary150};
  color: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success
      : $tone === 'danger'
        ? theme.colors.danger
        : theme.colors.textNav};

  svg.spin {
    animation: spin 1.1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    svg.spin { animation: none; }
  }
`

const Heading = styled.h1`
  margin: 1rem 0 0.5rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.textNav};
`

const Lead = styled.p`
  margin: 0 auto;
  max-width: 52ch;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const PrimaryButton = styled.button`
  padding: 0.875rem 1.5rem;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: wait; }

  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;

  &:hover { background: ${({ theme }) => theme.colors.terracottaDark}; }
`

const SecondaryLink = styled(Link)`
  padding: 0.875rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textNav};
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const Details = styled.div`
  margin-top: 2rem;
  padding: 1.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const Meta = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0 0 1.5rem;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt { color: ${({ theme }) => theme.colors.textSecondary}; }
  dd {
    margin: 0;
    color: ${({ theme }) => theme.colors.textNav};
    overflow-wrap: anywhere;
  }
`

const Lines = styled.ul`
  list-style: none;
  margin: 0;
  padding: 1.25rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
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

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1.25rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textNav};
`

/* ── Copy per payment state ─────────────────────────────── */

interface StateView {
  Icon: IconType
  tone: Tone
  spin?: boolean
  title: string
  body: (order: PublicOrder) => string
  /** Offer the Paystack page again so the customer can finish paying. */
  resume?: boolean
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

const STATE_VIEWS: Record<PaymentDisplayState, StateView> = {
  paid: {
    Icon: PiCheckCircleLight,
    tone: 'success',
    title: 'Thank you — your order is confirmed',
    body: (o) =>
      `We've received your payment of ${formatMoney(o.totalAmount, o.currencyCode)} and will start preparing your fabric.`,
  },
  confirming: {
    Icon: PiCircleNotchLight,
    tone: 'waiting',
    spin: true,
    title: 'Confirming your payment…',
    body: () =>
      'Your payment went through and we are confirming it with our payment provider. This usually takes a few seconds — this page updates on its own.',
  },
  awaiting_transfer: {
    Icon: PiBankLight,
    tone: 'waiting',
    title: 'Waiting for your transfer',
    body: (o) =>
      `Your order is reserved as pending while we wait for your bank transfer of ${formatMoney(o.totalAmount, o.currencyCode)}. Transfers can take a while to arrive; we'll confirm your order as soon as it does. Please complete it before ${formatDateTime(o.expiresAt)}.`,
    resume: true,
  },
  not_completed: {
    Icon: PiClockLight,
    tone: 'waiting',
    title: 'Payment not completed yet',
    body: (o) =>
      `We haven't received a payment for this order. You can reopen the payment window to finish. If you've already made a bank transfer, there's nothing more to do — it will be confirmed when it arrives. This order is held until ${formatDateTime(o.expiresAt)}.`,
    resume: true,
  },
  failed: {
    Icon: PiXCircleLight,
    tone: 'danger',
    title: 'Payment failed',
    body: () =>
      'Your payment was not successful and you have not been charged for this order. Your items may still be available — add them to your cart to try again.',
  },
  expired: {
    Icon: PiClockLight,
    tone: 'danger',
    title: 'This order has expired',
    body: () =>
      "We didn't receive payment in time, so this order was released. If you sent a bank transfer that hasn't arrived yet, we'll still process it when it lands, or contact us and we'll help.",
  },
  cancelled: {
    Icon: PiXCircleLight,
    tone: 'danger',
    title: 'This order was cancelled',
    body: () => 'This order is no longer active. Contact us if you think this is a mistake.',
  },
  review: {
    Icon: PiWarningLight,
    tone: 'danger',
    title: 'We need to look at this payment',
    body: () =>
      "We received a payment for this order but couldn't complete it automatically. Our team will review it and contact you about fulfilment or a refund — you don't need to pay again.",
  },
}

/* ── Components ─────────────────────────────────────────── */

function Message({
  Icon,
  tone,
  title,
  children,
  spin,
}: {
  Icon: IconType
  tone: Tone
  title: string
  children?: React.ReactNode
  spin?: boolean
}) {
  return (
    <StatusCard $tone={tone} role="status" aria-live="polite">
      <Icon size={44} className={spin ? 'spin' : undefined} aria-hidden />
      <Heading>{title}</Heading>
      {children}
    </StatusCard>
  )
}

export function OrderStatusView({ reference }: { reference: string | null }) {
  const { data, isLoading, isError, refetch } = useOrderVerification(reference)
  const popup = usePaystackPopup()

  /** Reopens the payment popup; falls back to Paystack's hosted page if it can't load. */
  const resumePayment = (accessCode: string | null, authorizationUrl: string | null) => {
    const fallback = () => {
      if (authorizationUrl) window.location.assign(authorizationUrl)
    }
    if (!accessCode) return fallback()

    void popup.open({
      accessCode,
      onSuccess: () => void refetch(),
      onCancel: () => void refetch(),
      onUnavailable: fallback,
    })
  }

  if (!reference) {
    return (
      <Wrap>
        <Message Icon={PiWarningLight} tone="danger" title="No order to show">
          <Lead>This link is missing its order reference.</Lead>
          <Actions>
            <SecondaryLink href="/shop">Continue shopping</SecondaryLink>
          </Actions>
        </Message>
      </Wrap>
    )
  }

  if (isLoading) {
    return (
      <Wrap>
        <Message Icon={PiCircleNotchLight} tone="waiting" title="Checking your payment…" spin />
      </Wrap>
    )
  }

  if (isError || !data) {
    return (
      <Wrap>
        <Message Icon={PiWarningLight} tone="danger" title="We couldn't find that order">
          <Lead>
            Check the link and try again. If you completed a payment, it is safe — contact us with
            reference <strong>{reference}</strong>.
          </Lead>
          <Actions>
            <SecondaryLink href="/shop">Continue shopping</SecondaryLink>
          </Actions>
        </Message>
      </Wrap>
    )
  }

  const { order, payment } = data
  const view = STATE_VIEWS[payment.state]

  return (
    <Wrap>
      <Message Icon={view.Icon} tone={view.tone} title={view.title} spin={view.spin}>
        <Lead>{view.body(order)}</Lead>
        <Actions>
          {view.resume && (order.accessCode || order.authorizationUrl) && (
            <PrimaryButton
              type="button"
              disabled={popup.isBusy}
              onClick={() => resumePayment(order.accessCode, order.authorizationUrl)}
            >
              {popup.status === 'opening' ? 'Opening payment…' : 'Complete payment'}
            </PrimaryButton>
          )}
          <SecondaryLink href="/shop">Continue shopping</SecondaryLink>
        </Actions>
      </Message>

      <Details>
        <Meta>
          <dt>Order reference</dt>
          <dd>{order.reference}</dd>
          <dt>Placed</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
          <dt>Email</dt>
          <dd>{order.email}</dd>
          <dt>Delivering to</dt>
          <dd>
            {order.customerName}, {order.shippingCity}, {order.shippingState}
          </dd>
        </Meta>

        <Lines>
          {order.items.map((item) => (
            <Line key={item.id}>
              <Thumb>
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </Thumb>
              <div>
                {item.productName}
                <LineMeta>
                  {item.variantName !== item.productName && `${item.variantName} · `}
                  Qty {item.quantity}
                </LineMeta>
              </div>
              <span>{formatMoney(item.lineTotalAmount, order.currencyCode)}</span>
            </Line>
          ))}
        </Lines>

        <Total>
          <span>Total</span>
          <span>{formatMoney(order.totalAmount, order.currencyCode)}</span>
        </Total>
      </Details>
    </Wrap>
  )
}

/** Landing page for Paystack's redirect: /checkout/callback?reference=…&trxref=… */
export function PaymentCallback() {
  const params = useSearchParams()
  return <OrderStatusView reference={params.get('reference') ?? params.get('trxref')} />
}
