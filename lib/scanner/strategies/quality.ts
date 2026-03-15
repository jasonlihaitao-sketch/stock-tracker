// lib/scanner/strategies/quality.ts
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { STRATEGIES } from '@/types/strategy'

/**
 * 检测护城河策略
 * 毛利率 > 40% + ROE > 15%
 */
export const detectMoat: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'quality_moat')!
  const { fundamental } = context

  if (!fundamental?.grossMargin || !fundamental?.roe) return null

  if (fundamental.grossMargin > 40 && fundamental.roe > 15) {
    const strength =
      fundamental.grossMargin > 50 && fundamental.roe > 20 ? 'strong' : 'medium'
    return {
      strategyId: 'quality_moat',
      strategyName: strategy.name,
      category: 'quality',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测行业龙头策略
 * 市占率前三 + 盈利稳定
 * 注意：需要额外市场数据支持
 */
export const detectLeader: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'quality_leader')!
  // 当前数据不足，返回 null
  // 后续可添加市占率数据
  return null
}

/**
 * 检测品牌溢价策略
 * 高毛利率 + 定价权
 * 注意：需要额外品牌数据支持
 */
export const detectBrand: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'quality_brand')!
  const { fundamental } = context

  if (!fundamental?.grossMargin) return null

  // 简化检测：高毛利率作为品牌溢价指标
  if (fundamental.grossMargin > 50) {
    return {
      strategyId: 'quality_brand',
      strategyName: strategy.name,
      category: 'quality',
      strength: 'medium',
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测现金牛策略
 * 自由现金流持续为正
 */
export const detectCashCow: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'quality_cash_cow')!
  const { fundamental } = context

  if (!fundamental?.operatingCashFlow || !fundamental?.netProfit) return null

  // 经营现金流持续为正
  if (fundamental.operatingCashFlow > 0 && fundamental.netProfit > 0) {
    const strength = fundamental.operatingCashFlow > fundamental.netProfit ? 'strong' : 'medium'
    return {
      strategyId: 'quality_cash_cow',
      strategyName: strategy.name,
      category: 'quality',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 质量策略检测器映射
 */
export const qualityDetectors: Record<string, StrategyDetector> = {
  quality_moat: detectMoat,
  quality_leader: detectLeader,
  quality_brand: detectBrand,
  quality_cash_cow: detectCashCow,
}