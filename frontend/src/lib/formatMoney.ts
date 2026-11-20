/** Formats an amount held in minor units (kobo) as a currency string. */
export function formatMoney(minorAmount: number, currencyCode = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: minorAmount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minorAmount / 100)
}
