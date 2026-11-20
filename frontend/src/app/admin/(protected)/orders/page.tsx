'use client'

import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { PiWarningLight, PiShoppingCartLight } from 'react-icons/pi'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { Modal } from '@/components/common/Modal'
import { useAdminOrder, useAdminOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { formatMoney } from '@/lib/formatMoney'
import {
  ORDER_ACTION_LABELS,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  type AdminOrder,
  type OrderStatus,
} from '@/types/order'

/* ── Helpers ────────────────────────────────────────────────── */

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
    : '—'

const CHANNEL_LABELS: Record<string, string> = {
  card: 'Card',
  bank_transfer: 'Bank transfer',
}

const STATUS_FILTERS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((value) => ({
    value,
    label: ORDER_STATUS_META[value].label,
  })),
]

/* ── Styles ─────────────────────────────────────────────────── */

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1.25rem 0 1rem;
`

const StyledSearch = styled(SearchInput)`
  width: 300px;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { width: 100%; }
`

const Select = styled.select`
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary400};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary200};
  }
`

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const TableScroll = styled.div`overflow-x: auto;`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Th = styled.th<{ $right?: boolean }>`
  padding: 0.625rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  white-space: nowrap;
`

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
  &:hover td { background: ${({ theme }) => theme.colors.primary100}; }
`

const Td = styled.td<{ $right?: boolean }>`
  padding: 0.8125rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  vertical-align: middle;
  background: ${({ theme }) => theme.colors.surface};
  transition: background ${({ theme }) => theme.transitions.fast};
`

const RefButton = styled.button`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary500};
  text-align: left;
  &:hover { text-decoration: underline; }
`

const Sub = styled.span`
  display: block;
  margin-top: 1px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Amount = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`

const Bone = styled.div<{ $w?: string }>`
  height: 13px;
  width: ${({ $w = '80%' }) => $w};
  border-radius: 4px;
  background: linear-gradient(90deg,
    ${({ theme }) => theme.colors.surfaceMuted} 25%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surfaceMuted} 75%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease infinite;
`

/* Detail dialog */

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const Notice = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  margin-bottom: 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.snug};

  svg { flex-shrink: 0; margin-top: 1px; }
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const SectionTitle = styled.h3`
  margin-bottom: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Block = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;
`

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt { color: ${({ theme }) => theme.colors.textSecondary}; }
  dd { margin: 0; overflow-wrap: anywhere; }
`

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  th, td {
    padding: 0.5rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
  }
  th {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  th:not(:first-child), td:not(:first-child) {
    text-align: right;
    padding-left: 1rem;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  tfoot td {
    border-bottom: none;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

const ErrorText = styled.p`
  margin-top: 0.75rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`

const ConfirmText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textPrimary};
`

/* ── Order detail dialog ────────────────────────────────────── */

function confirmCopy(order: AdminOrder, next: OrderStatus): string {
  if (next === 'CANCELLED' && order.status === 'PAID') {
    return 'This order has been paid. Cancelling returns its items to stock and flags the payment as needing a refund — the refund itself must be issued from your Paystack dashboard.'
  }
  if (next === 'CANCELLED') {
    return 'The customer will no longer be able to pay for this order. If a payment still arrives, it will be flagged as needing a refund.'
  }
  if (next === 'SHIPPED') return 'Confirm that this order has left for delivery.'
  return 'Confirm that the customer has received this order.'
}

function OrderDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: order, isLoading, isError } = useAdminOrder(id)
  const updateStatus = useUpdateOrderStatus()
  const [pending, setPending] = useState<OrderStatus | null>(null)

  const apply = async () => {
    if (!pending) return
    try {
      await updateStatus.mutateAsync({ id, status: pending })
      setPending(null)
    } catch {
      // Shown via updateStatus.error; the confirmation stays open to retry or dismiss.
    }
  }

  const footer =
    order && order.allowedTransitions.length > 0 ? (
      <>
        {order.allowedTransitions.map((next) => (
          <Button
            key={next}
            $size="sm"
            $variant={next === 'CANCELLED' ? 'secondary' : 'primary'}
            onClick={() => { updateStatus.reset(); setPending(next) }}
          >
            {ORDER_ACTION_LABELS[next] ?? next}
          </Button>
        ))}
      </>
    ) : undefined

  return (
    <>
      <Modal open onClose={onClose} title={order ? `Order ${order.reference}` : 'Order'} size="lg" footer={footer}>
        {isLoading && (
          <>
            <Bone $w="40%" style={{ marginBottom: 12 }} />
            <Bone $w="70%" style={{ marginBottom: 12 }} />
            <Bone $w="55%" />
          </>
        )}

        {isError && (
          <EmptyState title="Could not load this order" description="Close and try again." />
        )}

        {order && (
          <>
            <Badges>
              <StatusBadge $variant={ORDER_STATUS_META[order.status].variant}>
                Order: {ORDER_STATUS_META[order.status].label}
              </StatusBadge>
              <StatusBadge $variant={PAYMENT_STATUS_META[order.paymentStatus].variant}>
                Payment: {PAYMENT_STATUS_META[order.paymentStatus].label}
              </StatusBadge>
            </Badges>

            {order.paymentNote && (
              <Notice role="note">
                <PiWarningLight size={15} aria-hidden />
                <span>{order.paymentNote}</span>
              </Notice>
            )}

            <Columns>
              <div>
                <SectionTitle>Customer</SectionTitle>
                <Block>
                  {order.customerName}
                  <br />
                  {order.email}
                  <br />
                  {order.phone}
                </Block>
              </div>
              <div>
                <SectionTitle>Deliver to</SectionTitle>
                <Block>
                  {order.addressLine1}
                  {order.addressLine2 && (<><br />{order.addressLine2}</>)}
                  <br />
                  {order.city}, {order.state} {order.postalCode ?? ''}
                  <br />
                  {order.country}
                </Block>
              </div>
            </Columns>

            <Columns>
              <div>
                <SectionTitle>Payment</SectionTitle>
                <Facts>
                  <dt>Method</dt>
                  <dd>{order.paymentChannel ? CHANNEL_LABELS[order.paymentChannel] ?? order.paymentChannel : '—'}</dd>
                  <dt>Amount received</dt>
                  <dd>{order.paidAmount != null ? formatMoney(order.paidAmount, order.currencyCode) : '—'}</dd>
                  <dt>Paystack ID</dt>
                  <dd>{order.paystackTransactionId ?? '—'}</dd>
                </Facts>
              </div>
              <div>
                <SectionTitle>Timeline</SectionTitle>
                <Facts>
                  <dt>Placed</dt><dd>{formatDate(order.createdAt)}</dd>
                  {order.status === 'PENDING' && (<><dt>Expires</dt><dd>{formatDate(order.expiresAt)}</dd></>)}
                  {order.paidAt && (<><dt>Paid</dt><dd>{formatDate(order.paidAt)}</dd></>)}
                  {order.shippedAt && (<><dt>Shipped</dt><dd>{formatDate(order.shippedAt)}</dd></>)}
                  {order.deliveredAt && (<><dt>Delivered</dt><dd>{formatDate(order.deliveredAt)}</dd></>)}
                  {order.cancelledAt && (<><dt>Cancelled</dt><dd>{formatDate(order.cancelledAt)}</dd></>)}
                  {order.expiredAt && (<><dt>Expired</dt><dd>{formatDate(order.expiredAt)}</dd></>)}
                </Facts>
              </div>
            </Columns>

            <SectionTitle>Items</SectionTitle>
            <ItemsTable>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.productName}
                      <Sub>
                        {item.variantName}
                        {item.sku ? ` · SKU ${item.sku}` : ''}
                      </Sub>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPriceAmount, order.currencyCode)}</td>
                    <td>{formatMoney(item.lineTotalAmount, order.currencyCode)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td>{formatMoney(order.totalAmount, order.currencyCode)}</td>
                </tr>
              </tfoot>
            </ItemsTable>
          </>
        )}
      </Modal>

      {order && pending && (
        <Modal
          open
          onClose={() => setPending(null)}
          title={ORDER_ACTION_LABELS[pending] ?? 'Update order'}
          size="sm"
          footer={
            <>
              <Button $variant="secondary" $size="sm" onClick={() => setPending(null)}>
                Keep as is
              </Button>
              <Button
                $variant={pending === 'CANCELLED' ? 'danger' : 'primary'}
                $size="sm"
                onClick={apply}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Saving…' : ORDER_ACTION_LABELS[pending] ?? 'Confirm'}
              </Button>
            </>
          }
        >
          <ConfirmText>{confirmCopy(order, pending)}</ConfirmText>
          {updateStatus.isError && (
            <ErrorText role="alert">
              {updateStatus.error instanceof Error
                ? updateStatus.error.message
                : 'Could not update the order.'}
            </ErrorText>
          )}
        </Modal>
      )}
    </>
  )
}

/* ── Page ───────────────────────────────────────────────────── */

const LIMIT = 20
const COLUMNS = 6

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useAdminOrders({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit: LIMIT,
  })

  const filtered = Boolean(debouncedSearch || status)

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Review payments and move orders through fulfilment."
      />

      <Toolbar>
        <StyledSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by reference, name, email or phone…"
        />
        <Select
          aria-label="Filter by order status"
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1) }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
      </Toolbar>

      <TableCard>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Placed</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th $right>Total</Th>
              </tr>
            </Thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  <Td><Bone $w="170px" /></Td>
                  <Td><Bone $w="140px" /></Td>
                  <Td><Bone $w="110px" /></Td>
                  <Td><Bone $w="70px" /></Td>
                  <Td><Bone $w="110px" /></Td>
                  <Td $right><Bone $w="70px" style={{ marginLeft: 'auto' }} /></Td>
                </Tr>
              ))}

              {isError && (
                <tr>
                  <Td colSpan={COLUMNS}>
                    <EmptyState
                      title="Could not load orders"
                      description="Check your connection or try refreshing."
                    />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && data?.data.length === 0 && (
                <tr>
                  <Td colSpan={COLUMNS}>
                    <EmptyState
                      icon={PiShoppingCartLight}
                      title={filtered ? 'No orders match your filters' : 'No orders yet'}
                      description={
                        filtered
                          ? 'Try a different search or clear the status filter.'
                          : 'Orders appear here as soon as a customer checks out.'
                      }
                    />
                  </Td>
                </tr>
              )}

              {!isLoading && !isError && data?.data.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <RefButton type="button" onClick={() => setSelectedId(order.id)}>
                      {order.reference}
                    </RefButton>
                    <Sub>
                      {order._count.items} {order._count.items === 1 ? 'item' : 'items'}
                    </Sub>
                  </Td>
                  <Td>
                    {order.customerName}
                    <Sub>{order.email}</Sub>
                  </Td>
                  <Td>{formatDate(order.createdAt)}</Td>
                  <Td>
                    <StatusBadge $variant={ORDER_STATUS_META[order.status].variant}>
                      {ORDER_STATUS_META[order.status].label}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <StatusBadge $variant={PAYMENT_STATUS_META[order.paymentStatus].variant}>
                      {PAYMENT_STATUS_META[order.paymentStatus].label}
                    </StatusBadge>
                    {order.paymentChannel && (
                      <Sub>{CHANNEL_LABELS[order.paymentChannel] ?? order.paymentChannel}</Sub>
                    )}
                  </Td>
                  <Td $right>
                    <Amount>{formatMoney(order.totalAmount, order.currencyCode)}</Amount>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>

        {data && data.meta.totalPages > 1 && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {selectedId && <OrderDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  )
}
