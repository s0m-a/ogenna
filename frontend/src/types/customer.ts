import type { PublicOrder } from './order'

export interface CustomerProfile {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: string
  createdAt: string
  providers: Array<'GOOGLE'>
}

export interface CustomerOrdersResponse {
  data: PublicOrder[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

/** Codes the backend sends to /auth/callback when Google sign-in is refused. */
export type OAuthErrorCode =
  | 'cancelled'
  | 'invalid_state'
  | 'google_error'
  | 'not_configured'
  | 'email_unverified'
  | 'staff_account'
  | 'account_disabled'
  | 'session_failed'

export const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  cancelled: 'Google sign-in was cancelled. You can try again whenever you’re ready.',
  invalid_state: 'That sign-in link expired. Please try again.',
  google_error: 'We couldn’t reach Google just now. Please try again in a moment.',
  not_configured: 'Google sign-in isn’t available yet. You can still check out as a guest.',
  email_unverified: 'Your Google account’s email isn’t verified yet. Verify it with Google, then try again.',
  staff_account: 'This email belongs to a staff account. Please sign in through the staff login instead.',
  account_disabled: 'This account has been disabled. Please contact us for help.',
  session_failed: 'We couldn’t finish signing you in. Please try again.',
}

export function oauthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null
  return OAUTH_ERROR_MESSAGES[code as OAuthErrorCode] ?? OAUTH_ERROR_MESSAGES.google_error
}

/* ── Address book ───────────────────────────────────────── */

export interface SavedAddress {
  id: string
  label: string | null
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressInput {
  label?: string
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode?: string
  isDefault?: boolean
}

export const MAX_SAVED_ADDRESSES = 10

/** One-line summary for pickers and cards. */
export function formatAddressLine(a: Pick<SavedAddress, 'addressLine1' | 'addressLine2' | 'city' | 'state'>): string {
  return [a.addressLine1, a.addressLine2, a.city, a.state].filter(Boolean).join(', ')
}
