'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { PiCaretRightLight, PiSignOutLight, PiPencilSimpleLight } from 'react-icons/pi'
import { useAuth } from '@/hooks/useAuth'
import { useCustomerOrders, useCustomerProfile, useUpdateProfile } from '@/hooks/useCustomer'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatMoney } from '@/lib/formatMoney'
import { ORDER_STATUS_META, PAYMENT_STATUS_META, type PublicOrder } from '@/types/order'
import { CenteredState, PageHeader, PageTitle, Spinner } from './accountStyles'
import { AddressBook } from './AddressBook'

const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

export function AccountPage() {
  const router = useRouter()
  const { user, isLoading, isStaff, logout } = useAuth()
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/account/login?returnTo=/account')
  }, [isLoading, user, router])

  const profile = useCustomerProfile()
  const orders = useCustomerOrders(page)

  if (isLoading || !user) {
    return (
      <CenteredState>
        <Spinner aria-label="Loading your account" />
      </CenteredState>
    )
  }

  const name = profile.data?.name ?? user.email
  const firstName = name.split(' ')[0]

  return (
    <>
      <PageHeader>
        <PageTitle>My account</PageTitle>
      </PageHeader>

      <Layout>
        <Sidebar aria-label="Profile">
          <ProfileCard>
            <Avatar name={name} url={profile.data?.avatarUrl ?? null} />
            <Greeting>Hello, {firstName}</Greeting>
            <ProfileName />
            <Email>{user.email}</Email>
            {profile.data?.providers.includes('GOOGLE') && (
              <Connected>Signed in with Google</Connected>
            )}
            {isStaff && <StaffLink href="/admin/dashboard">Go to admin dashboard</StaffLink>}
            <SignOut type="button" onClick={() => void logout()}>
              <PiSignOutLight size={16} aria-hidden />
              Sign out
            </SignOut>
          </ProfileCard>
        </Sidebar>

        <Main aria-labelledby="orders-heading">
          <SectionHead>
            <SectionTitle id="orders-heading">Your orders</SectionTitle>
            {orders.data && orders.data.meta.total > 0 && (
              <Count>{orders.data.meta.total} total</Count>
            )}
          </SectionHead>

          {orders.isLoading ? (
            <CenteredState>
              <Spinner aria-label="Loading orders" />
            </CenteredState>
          ) : orders.isError ? (
            <Empty>
              <p>We couldn’t load your orders.</p>
              <Ghost type="button" onClick={() => void orders.refetch()}>
                Try again
              </Ghost>
            </Empty>
          ) : !orders.data || orders.data.data.length === 0 ? (
            <Empty>
              <EmptyTitle>No orders yet</EmptyTitle>
              <p>Orders you place while signed in will appear here.</p>
              <Primary href="/shop">Start shopping</Primary>
            </Empty>
          ) : (
            <>
              <OrderList>
                {orders.data.data.map((order) => (
                  <OrderRow key={order.reference} order={order} />
                ))}
              </OrderList>

              {orders.data.meta.totalPages > 1 && (
                <Pager aria-label="Order pages">
                  <Ghost type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Newer
                  </Ghost>
                  <span>
                    Page {page} of {orders.data.meta.totalPages}
                  </span>
                  <Ghost
                    type="button"
                    disabled={page >= orders.data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Older
                  </Ghost>
                </Pager>
              )}
            </>
          )}

          <AddressBook />
        </Main>
      </Layout>
    </>
  )
}

/* ── Profile name (inline edit) ─────────────────────────── */

function ProfileName() {
  const profile = useCustomerProfile()
  const update = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  if (!profile.data) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = value.trim()
    if (!name || name === profile.data?.name) {
      setEditing(false)
      return
    }
    update.mutate(name, { onSuccess: () => setEditing(false) })
  }

  if (!editing) {
    return (
      <NameRow>
        <Name>{profile.data.name}</Name>
        <IconBtn
          type="button"
          aria-label="Edit your name"
          onClick={() => {
            setValue(profile.data?.name ?? '')
            setEditing(true)
          }}
        >
          <PiPencilSimpleLight size={14} />
        </IconBtn>
      </NameRow>
    )
  }

  return (
    <NameForm onSubmit={submit}>
      <NameInput
        aria-label="Your name"
        value={value}
        maxLength={100}
        autoFocus
        autoComplete="name"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
      />
      <SmallBtn type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save'}
      </SmallBtn>
      {update.isError && <InlineError role="alert">Couldn’t save. Try again.</InlineError>}
    </NameForm>
  )
}

/* ── Order row ──────────────────────────────────────────── */

function OrderRow({ order }: { order: PublicOrder }) {
  const status = ORDER_STATUS_META[order.status]
  const needsPayment = Boolean(order.accessCode)
  const payment =
    order.paymentStatus === 'AWAITING_TRANSFER' ? PAYMENT_STATUS_META.AWAITING_TRANSFER : null
  const itemCount = order.items.length
  const thumbs = order.items.filter((i) => i.imageUrl).slice(0, 3)

  return (
    <li>
      <OrderLink href={`/orders/${order.reference}`}>
        <Thumbs aria-hidden>
          {thumbs.length > 0 ? (
            thumbs.map((item) => (
              <Thumb key={item.id}>
                <Image src={item.imageUrl as string} alt="" fill sizes="56px" />
              </Thumb>
            ))
          ) : (
            <Thumb />
          )}
        </Thumbs>

        <OrderInfo>
          <OrderTop>
            <Reference>{order.reference}</Reference>
            <StatusBadge $variant={status.variant}>{status.label}</StatusBadge>
            {payment && <StatusBadge $variant={payment.variant}>{payment.label}</StatusBadge>}
          </OrderTop>
          <OrderMeta>
            {dateFormat.format(new Date(order.createdAt))} · {itemCount}{' '}
            {itemCount === 1 ? 'item' : 'items'}
          </OrderMeta>
          {needsPayment && <PayHint>Payment not finished — tap to complete it</PayHint>}
        </OrderInfo>

        <OrderTotal>{formatMoney(order.totalAmount, order.currencyCode)}</OrderTotal>
        <PiCaretRightLight size={18} aria-hidden />
      </OrderLink>
    </li>
  )
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <AvatarCircle aria-hidden>
      {url && !failed ? (
        // Google avatars are on lh3.googleusercontent.com; a plain img avoids
        // adding that host to next/image's allow-list.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initial
      )}
    </AvatarCircle>
  )
}

/* ── Styles ─────────────────────────────────────────────── */

const Layout = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem ${({ theme }) => theme.layout.pagePaddingX} 5rem;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2rem ${({ theme }) => theme.layout.pagePaddingXMobile} 3.5rem;
  }
`

const Sidebar = styled.aside``

const ProfileCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.75rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
`

const AvatarCircle = styled.span`
  width: 64px;
  height: 64px;
  margin-bottom: 0.5rem;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.clay};
  color: ${({ theme }) => theme.colors.textNav};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Greeting = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const Name = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const IconBtn = styled.button`
  display: inline-flex;
  padding: 0.375rem;
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const NameForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
`

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
`

const SmallBtn = styled.button`
  padding: 0.5rem 0.875rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.terracotta};
  color: ${({ theme }) => theme.colors.textInverse};
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: wait; }
`

const InlineError = styled.p`
  margin: 0;
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`

const Email = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: break-all;
`

const Connected = styled.p`
  margin: 0.25rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.success};
`

const StaffLink = styled(Link)`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary500};
`

const SignOut = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.625rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }
`

const Main = styled.section``

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Count = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const OrderList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
`

const OrderLink = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: inherit;
  text-decoration: none;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  > svg { color: ${({ theme }) => theme.colors.textSecondary}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: minmax(0, 1fr) auto;
    > svg { display: none; }
  }
`

const Thumbs = styled.div`
  display: flex;

  > * + * { margin-left: -14px; }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`

const Thumb = styled.span`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.colors.surface};
  background: ${({ theme }) => theme.colors.surfaceMuted};

  img { object-fit: cover; }
`

const OrderInfo = styled.div`
  display: grid;
  gap: 0.25rem;
  min-width: 0;
`

const OrderTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`

const Reference = styled.span`
  font-family: ${({ theme }) => theme.fonts.nav};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
`

const OrderMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PayHint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.terracottaDark};
`

const OrderTotal = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  white-space: nowrap;
`

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};

  p { margin: 0; }
`

const EmptyTitle = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Primary = styled(Link)`
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
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

const Ghost = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const Pager = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`
