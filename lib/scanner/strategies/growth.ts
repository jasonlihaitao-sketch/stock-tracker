// lib/scanner/strategies/growth.ts
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { STRATEGIES } from '@/types/strategy'

/**
 * 检测营收高增长策略
 * 营收同比 > 30%
 */
export const detectRevenueGrowth: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'growth_revenue')!
  const { fundamental } = context

  if (!fundamental?.revenueYoY) return null

  if (fundamental.revenueYoY > 30) {
    const strength = fundamental.revenueYoY > 50 ? 'strong' : 'medium'
    return {
      strategyId: 'growth_revenue',
      strategyName: strategy.name,
      category: 'growth',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测利润高增长策略
 * 净利润同比 > 50%
 */
export const detectProfitGrowth: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'growth_profit')!
  const { fundamental } = context

  if (!fundamental?.netProfitYoY) return null

  if (fundamental.netProfitYoY > 50) {
    const strength = fundamental.netProfitYoY > 100 ? 'strong' : 'medium'
    return {
      strategyId: 'growth_profit',
      strategyName: strategy.name,
      category: 'growth',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测 PEG 合理策略
 * PEG < 1
 */
export const detectPEG: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'growth_peg')!
  const { fundamental } = context

  if (!fundamental?.pe || !fundamental?.netProfitYoY) return null

  // PEG = PE / 增长率
  const peg = fundamental.pe / fundamental.netProfitYoY

  if (peg < 1 && fundamental.netProfitYoY > 0) {
    const strength = peg < 0.5 ? 'strong' : 'medium'
    return {
      strategyId: 'growth_peg',
      strategyName: strategy.name,
      category: 'growth',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测业务扩张策略
 * 研发投入占比 > 10%
 * 注意：当前简化处理，需要额外数据支持
 */
export const detectExpansion: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'growth_expansion')!
  // 当前数据不足，返回 null
  // 后续可添加研发投入数据
  return null
}

/**
 * 成长策略检测器映射
 */
export const growthDetectors: Record<string, StrategyDetector> = {
  growth_revenue: detectRevenueGrowth,
  growth_profit: detectProfitGrowth,
  growth_peg: detectPEG,
  growth_expansion: detectExpansion,
}