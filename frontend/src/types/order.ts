export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED'

export type PaymentStatus =
  | 'UNPAID'
  | 'AWAITING_TRANSFER'
  | 'PAID'
  | 'MISMATCH'
  | 'REFUND_REQUIRED'

/** What the storefront should tell the customer about their payment. */
export type PaymentDisplayState =
  | 'paid'
  | 'confirming'
  | 'awaiting_transfer'
  | 'not_completed'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'review'

export interface CheckoutPayload {
  email: string
  customerName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode?: string
}

export interface PublicOrderItem {
  id: string
  productName: string
  variantName: string
  sellingUnit: string
  imageUrl: string | null
  quantity: number
  unitPriceAmount: number   // kobo
  lineTotalAmount: number   // kobo
}

export interface PublicOrder {
  reference: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currencyCode: string
  subtotalAmount: number    // kobo
  shippingAmount: number    // kobo
  totalAmount: number       // kobo
  customerName: string
  email: string             // masked by the API
  shippingCity: string
  shippingState: string
  authorizationUrl: string | null
  accessCode: string | null
  createdAt: string
  expiresAt: string
  paidAt: string | null
  items: PublicOrderItem[]
}

export interface CreateOrderResponse {
  order: PublicOrder
  authorizationUrl: string
  accessCode: string
}

export interface OrderVerification {
  order: PublicOrder
  payment: {
    state: PaymentDisplayState
    gatewayStatus: string | null
    channel: string | null
  }
}

/* ── Admin ─────────────────────────────────────────────────── */

export interface AdminOrderItem extends PublicOrderItem {
  variantId: string | null
  sku: string | null
}

export interface AdminOrderSummary {
  id: string
  reference: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  email: string
  customerName: string
  phone: string
  currencyCode: string
  totalAmount: number
  paymentChannel: string | null
  createdAt: string
  expiresAt: string
  paidAt: string | null
  _count: { items: number }
}

export interface AdminOrder extends Omit<AdminOrderSummary, '_count'> {
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string | null
  country: string
  subtotalAmount: number
  shippingAmount: number
  paidAmount: number | null
  paymentNote: string | null
  paystackTransactionId: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  expiredAt: string | null
  items: AdminOrderItem[]
  allowedTransitions: OrderStatus[]
}

export interface AdminOrderListResponse {
  data: AdminOrderSummary[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface OrderFilters {
  search?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  page?: number
  limit?: number
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary'

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING:   { label: 'Pending',   variant: 'warning' },
  PAID:      { label: 'Paid',      variant: 'success' },
  SHIPPED:   { label: 'Shipped',   variant: 'primary' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger'  },
  EXPIRED:   { label: 'Expired',   variant: 'neutral' },
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  UNPAID:            { label: 'Unpaid',               variant: 'neutral' },
  AWAITING_TRANSFER: { label: 'Waiting for transfer', variant: 'warning' },
  PAID:              { label: 'Paid',                 variant: 'success' },
  MISMATCH:          { label: 'Amount mismatch',      variant: 'danger'  },
  REFUND_REQUIRED:   { label: 'Refund required',      variant: 'danger'  },
}

export const ORDER_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  SHIPPED:   'Mark as shipped',
  DELIVERED: 'Mark as delivered',
  CANCELLED: 'Cancel order',
}
