export const currencyOptions = ['USD', 'MMK', 'THB', 'SGD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR']

export function createMoneyFormatter(code = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'MMK' || code === 'JPY' ? 0 : 2,
  })
}
