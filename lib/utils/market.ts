/**
 * 判断当前是否为交易时间
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDay()

  // 周末
  if (day === 0 || day === 6) return false

  // 交易时间: 9:30-11:30, 13:00-15:00
  const isMorning = (hour === 9 && minute >= 30) || hour === 10 || (hour === 11 && minute < 30)
  const isAfternoon = hour === 13 || hour === 14 || (hour === 15 && minute === 0)

  return isMorning || isAfternoon
}

/**
 * 获取市场状态文本
 */
export function getMarketStatusText(): string {
  if (isMarketOpen()) {
    return '交易中'
  }

  const now = new Date()
  const hour = now.getHours()

  if (hour < 9 || (hour === 9 && now.getMinutes() < 30)) {
    return '未开盘'
  }

  if (hour >= 15) {
    return '已收盘'
  }

  return '休市'
}