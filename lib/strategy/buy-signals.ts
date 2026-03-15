import type { StockWithTechnical } from '@/types/technical'
import type { Sector } from '@/types/sector'
import type { Signal, SignalStrength } from '@/types/signal'
import { mergeSignals } from './signal-merger'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检测买入信号
 */
export function detectBuySignals(
  stock: StockWithTechnical,
  sector?: Sector
): Signal[] {
  const signals: Partial<Signal>[] = []
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时后过期

  // 1. 突破信号 - 股价突破20日高点
  if (stock.price > stock.high20d) {
    signals.push({
      type: 'buy',
      strength: 3 as SignalStrength,
      triggerReason: '突破20日高点',
      suggestPrice: stock.price
    })
  }

  // 2. 量价配合 - 放量上涨，成交量>5日均量2倍
  if (stock.changePercent > 0 && stock.volume > stock.avgVolume5d * 2) {
    signals.push({
      type: 'buy',
      strength: 4 as SignalStrength,
      triggerReason: '量价配合',
      suggestPrice: stock.price
    })
  }

  // 3. 板块共振 - 个股上涨 + 所属板块上涨超1%
  if (stock.changePercent > 0 && sector && sector.changePercent > 1) {
    signals.push({
      type: 'buy',
      strength: 5 as SignalStrength,
      triggerReason: '板块共振',
      suggestPrice: stock.price
    })
  }

  // 合并信号并添加完整字段
  const baseSignal = {
    id: '',
    stockCode: stock.code,
    stockName: stock.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active' as const
  }

  return mergeSignals(
    signals.map(s => ({
      ...baseSignal,
      ...s,
      id: generateId()
    })) as Signal[]
  )
}