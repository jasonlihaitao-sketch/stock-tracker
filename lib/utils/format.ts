/**
 * 格式化价格
 */
export function formatPrice(price: number): string {
  return price.toFixed(2)
}

/**
 * 格式化涨跌幅
 */
export function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

/**
 * 格式化金额（万/亿）
 */
export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`
  }
  return amount.toFixed(2)
}

/**
 * 格式化时间
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}