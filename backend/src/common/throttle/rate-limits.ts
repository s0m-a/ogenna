import { Throttle } from '@nestjs/throttler';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;


export const RateLimit = {
  /** Staff password login — the brute-force target. */
  login: () =>
    Throttle({ default: { limit: 5, ttl: MINUTE, blockDuration: 5 * MINUTE } }),
  /** One-off owner setup. */
  bootstrap: () => Throttle({ default: { limit: 3, ttl: HOUR, blockDuration: HOUR } }),
  /** Token refresh/logout: the app does this every ~14 min, plus page loads. */
  session: () => Throttle({ default: { limit: 30, ttl: MINUTE } }),
  /** Starting / finishing Google sign-in. */
  oauth: () => Throttle({ default: { limit: 20, ttl: MINUTE } }),
  /** Placing an order creates a Paystack transaction each time. */
  placeOrder: () =>
    Throttle({ default: { limit: 10, ttl: MINUTE, blockDuration: 2 * MINUTE } }),
  /** Status page polls every 3s while a payment confirms (≈20/min). */
  verifyPayment: () => Throttle({ default: { limit: 40, ttl: MINUTE } }),
  /** Order lookups by reference — slows down reference guessing. */
  orderLookup: () => Throttle({ default: { limit: 30, ttl: MINUTE } }),
  /** Customer writes (profile, addresses). */
  accountWrite: () => Throttle({ default: { limit: 30, ttl: MINUTE } }),
  /** Instant search fires as the customer types (debounced client-side). */
  search: () => Throttle({ default: { limit: 90, ttl: MINUTE } }),
  /** One write per submitted search. */
  searchLog: () => Throttle({ default: { limit: 20, ttl: MINUTE } }),
};

export const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a moment and try again.';
