import type { StockWithTechnical } from '@/types/technical'
import type { Position } from '@/types/position'
import type { Signal, SignalStrength } from '@/types/signal'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检测卖出信号
 */
export function detectSellSignals(
  position: Position,
  stock: StockWithTechnical
): Signal[] {
  const signals: Partial<Signal>[] = []
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4小时后过期

  // 1. 止损触发（最高优先级，直接返回）
  if (stock.price <= position.currentStopLoss) {
    return [{
      id: generateId(),
      stockCode: stock.code,
      stockName: stock.name,
      type: 'sell',
      strength: 5 as SignalStrength,
      triggerReason: `触发止损线 ${position.currentStopLoss.toFixed(2)}`,
      stopLoss: position.currentStopLoss,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active'
    }]
  }

  // 2. 止盈触发
  if (position.takeProfit && stock.price >= position.takeProfit) {
    signals.push({
      type: 'sell',
      strength: 4 as SignalStrength,
      triggerReason: `达到止盈目标 ${position.takeProfit.toFixed(2)}`,
      takeProfit: position.takeProfit
    })
  }

  // 3. 趋势走弱 - 跌破5日均线
  if (stock.price < stock.ma5) {
    signals.push({
      type: 'sell',
      strength: 3 as SignalStrength,
      triggerReason: '跌破5日均线'
    })
  }

  const baseSignal = {
    id: '',
    stockCode: stock.code,
    stockName: stock.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active' as const
  }

  return signals.map(s => ({
    ...baseSignal,
    ...s,
    id: generateId()
  })) as Signal[]
}