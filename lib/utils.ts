import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化价格
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) return '--'
  return price.toFixed(2)
}

// 格式化涨跌幅
export function formatChangePercent(percent: number | undefined | null): string {
  if (percent === undefined || percent === null || isNaN(percent)) return '--'
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

// 格式化成交量
export function formatVolume(volume: number | undefined | null): string {
  if (volume === undefined || volume === null || isNaN(volume)) return '--'
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  }
  if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}

// 格式化金额
export function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '--'
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  }
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化日期时间
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// 获取涨跌颜色类名
export function getChangeColorClass(value: number): string {
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return 'text-muted-foreground'
}

// 获取涨跌背景色类名
export function getChangeBgClass(value: number): string {
  if (value > 0) return 'bg-up/10'
  if (value < 0) return 'bg-down/10'
  return 'bg-muted'
}

// 获取CSS变量的HSL值
function getCSSVariable(varName: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// HSL字符串转换为标准格式
function hslStringToHex(hslString: string): string {
  const parts = hslString.split(/\s+/).map(Number)
  if (parts.length !== 3) return '#000000'
  const [h, s, l] = parts
  return hslToHex(h, s, l)
}

// HSL转换为Hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// 图表颜色配置接口
export interface ChartColors {
  up: string // 涨（红色）
  down: string // 跌（绿色）
  flat: string // 平（灰色）
  border: string // 边框色
  text: string // 文字色
  muted: string // 次要文字色
}

// 获取图表颜色配置（用于ECharts）
export function getChartColors(): ChartColors {
  const upHsl = getCSSVariable('--stock-up') || '0 72% 51%'
  const downHsl = getCSSVariable('--stock-down') || '142 76% 36%'
  const flatHsl = getCSSVariable('--stock-flat') || '215 16% 47%'
  const borderHsl = getCSSVariable('--border') || '214 32% 91%'
  const textHsl = getCSSVariable('--foreground') || '222 84% 5%'
  const mutedHsl = getCSSVariable('--muted-foreground') || '215 16% 47%'

  return {
    up: hslStringToHex(upHsl),
    down: hslStringToHex(downHsl),
    flat: hslStringToHex(flatHsl),
    border: hslStringToHex(borderHsl),
    text: hslStringToHex(textHsl),
    muted: hslStringToHex(mutedHsl),
  }
}
