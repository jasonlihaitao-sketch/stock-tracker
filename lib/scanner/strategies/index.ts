// lib/scanner/strategies/index.ts
import type { StrategyId } from '@/types/strategy'
import type { ScanSignal, SignalStrength } from '@/types/scan'
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { technicalDetectors } from './technical'
import { fundamentalDetectors } from './fundamental'
import { growthDetectors } from './growth'
import { qualityDetectors } from './quality'
import { reversalDetectors } from './reversal'
import { eventDetectors } from './event'

// 导出类型
export type { StrategyDetector, StockDataContext, StrategySignal } from './types'

/**
 * 所有策略检测器的统一映射
 */
export const allDetectors: Record<string, StrategyDetector> = {
  ...technicalDetectors,
  ...fundamentalDetectors,
  ...growthDetectors,
  ...qualityDetectors,
  ...reversalDetectors,
  ...eventDetectors,
}

/**
 * 使用指定策略检测股票信号
 */
export function detectSignalsForStrategies(
  context: StockDataContext,
  strategyIds: StrategyId[]
): ScanSignal[] {
  const signals: ScanSignal[] = []

  for (const strategyId of strategyIds) {
    const detector = allDetectors[strategyId]
    if (detector) {
      const signal = detector(context)
      if (signal) {
        signals.push(signal)
      }
    }
  }

  return signals
}

/**
 * 计算综合信号强度
 */
export function calculateOverallStrength(signals: ScanSignal[]): number {
  if (signals.length === 0) return 0

  // 根据信号数量和强度计算综合得分
  const strengthWeights: Record<SignalStrength, number> = {
    strong: 3,
    medium: 2,
    weak: 1,
  }

  const totalScore = signals.reduce((sum, signal) => {
    return sum + strengthWeights[signal.strength]
  }, 0)

  // 归一化到 1-5 的范围
  // 1-2 分 = weak, 3-4 分 = medium, 5+ 分 = strong
  return Math.min(5, Math.max(1, Math.ceil(totalScore / 2)))
}

/**
 * 获取可用的策略 ID 列表
 */
export function getAvailableStrategyIds(): StrategyId[] {
  return Object.keys(allDetectors) as StrategyId[]
}

// 导出各类别检测器
export { technicalDetectors } from './technical'
export { fundamentalDetectors } from './fundamental'
export { growthDetectors } from './growth'
export { qualityDetectors } from './quality'
export { reversalDetectors } from './reversal'
export { eventDetectors } from './event'