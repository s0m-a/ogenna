// @paystack/inline-js ships no type definitions; this covers the part we use.
declare module '@paystack/inline-js' {
  export interface PaystackPopupCallbacks {
    /** The checkout form is visible to the customer. */
    onLoad?: (transaction: { id: number; accessCode: string }) => void
    onSuccess?: (transaction: { id: number; reference: string; message: string }) => void
    /** The customer closed the popup without completing payment. */
    onCancel?: () => void
    /** The transaction could not be loaded. */
    onError?: (error: { message: string }) => void
  }

  export default class PaystackPop {
    /** Opens the popup for a transaction initialized on the server. */
    resumeTransaction(accessCode: string, callbacks?: PaystackPopupCallbacks): unknown
  }
}
