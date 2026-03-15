import type { Signal, SignalStrength } from '@/types/signal'

/**
 * 合并同类型信号
 * 规则:
 * 1. 取最高星级
 * 2. 合并触发原因
 * 3. 多信号叠加时，星级+1（最高5星）
 */
export function mergeSignals(signals: Signal[]): Signal[] {
  if (signals.length === 0) return []
  if (signals.length === 1) return signals

  const buySignals = signals.filter(s => s.type === 'buy')
  const sellSignals = signals.filter(s => s.type === 'sell')

  const result: Signal[] = []

  if (buySignals.length > 1) {
    // 多个买入信号合并
    const maxStrength = Math.min(5, Math.max(...buySignals.map(s => s.strength)) + 1)
    const reasons = Array.from(new Set(buySignals.map(s => s.triggerReason))).join(' + ')

    result.push({
      ...buySignals[0],
      strength: maxStrength as SignalStrength,
      triggerReason: reasons
    })
  } else if (buySignals.length === 1) {
    result.push(buySignals[0])
  }

  if (sellSignals.length > 1) {
    // 多个卖出信号合并
    const maxStrength = Math.min(5, Math.max(...sellSignals.map(s => s.strength)) + 1)
    const reasons = Array.from(new Set(sellSignals.map(s => s.triggerReason))).join(' + ')

    result.push({
      ...sellSignals[0],
      strength: maxStrength as SignalStrength,
      triggerReason: reasons
    })
  } else if (sellSignals.length === 1) {
    result.push(sellSignals[0])
  }

  return result
}