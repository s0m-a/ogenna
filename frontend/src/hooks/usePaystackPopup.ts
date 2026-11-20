'use client'

import { useCallback, useEffect, useState } from 'react'

interface OpenOptions {
  accessCode: string
  /** Paystack reports the payment as complete. The server still confirms it via webhook. */
  onSuccess: (reference: string) => void
  /** The customer closed the popup without paying. */
  onCancel?: () => void
  /** The popup could not be shown (script blocked, network, expired transaction). */
  onUnavailable: () => void
}

type PopupStatus = 'idle' | 'opening' | 'open'

export function usePaystackPopup() {
  const [status, setStatus] = useState<PopupStatus>('idle')

  // Fetch the library ahead of time so the popup opens without a pause.
  useEffect(() => {
    import('@paystack/inline-js').catch(() => undefined)
  }, [])

  const open = useCallback(async ({ accessCode, onSuccess, onCancel, onUnavailable }: OpenOptions) => {
    setStatus('opening')

    try {
      // Imported on demand: the library touches `window`, so it can't load during SSR.
      const { default: PaystackPop } = await import('@paystack/inline-js')

      new PaystackPop().resumeTransaction(accessCode, {
        onLoad: () => setStatus('open'),
        onSuccess: (transaction) => {
          setStatus('idle')
          onSuccess(transaction.reference)
        },
        onCancel: () => {
          setStatus('idle')
          onCancel?.()
        },
        onError: () => {
          setStatus('idle')
          onUnavailable()
        },
      })
    } catch {
      setStatus('idle')
      onUnavailable()
    }
  }, [])

  return { open, status, isBusy: status !== 'idle' }
}
