// lib/scanner/strategies/fundamental.ts
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { STRATEGIES } from '@/types/strategy'

/**
 * 检测低估值(PE)策略
 * PE < 行业平均 × 0.7
 */
export const detectLowPE: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'fund_low_pe')!
  const { fundamental } = context

  if (!fundamental?.pe || !fundamental?.industryPe) return null

  const threshold = fundamental.industryPe * 0.7

  if (fundamental.pe < threshold) {
    const strength = fundamental.pe < fundamental.industryPe * 0.5 ? 'strong' : 'medium'
    return {
      strategyId: 'fund_low_pe',
      strategyName: strategy.name,
      category: 'fundamental',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测低估值(PB)策略
 * PB < 1 且 ROE > 10%
 */
export const detectLowPB: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'fund_low_pb')!
  const { fundamental } = context

  if (!fundamental?.pb || !fundamental?.roe) return null

  if (fundamental.pb < 1 && fundamental.roe > 10) {
    const strength = fundamental.pb < 0.7 && fundamental.roe > 15 ? 'strong' : 'medium'
    return {
      strategyId: 'fund_low_pb',
      strategyName: strategy.name,
      category: 'fundamental',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测高股息策略
 * 股息率 > 4%
 */
export const detectHighDividend: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'fund_high_dividend')!
  const { fundamental } = context

  if (!fundamental?.dividendYield) return null

  if (fundamental.dividendYield > 4) {
    const strength = fundamental.dividendYield > 6 ? 'strong' : 'medium'
    return {
      strategyId: 'fund_high_dividend',
      strategyName: strategy.name,
      category: 'fundamental',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测高 ROE 策略
 * ROE > 15% 连续 3 年
 */
export const detectHighROE: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'fund_roe')!
  const { fundamental } = context

  if (!fundamental?.roe || !fundamental?.roeHistory) return null

  const { roe, roeHistory } = fundamental

  // 当前 ROE > 15% 且过去3年ROE都 > 15%
  if (roe > 15 && roeHistory.length >= 3 && roeHistory.every((r) => r > 15)) {
    const strength = roe > 20 && roeHistory.every((r) => r > 20) ? 'strong' : 'medium'
    return {
      strategyId: 'fund_roe',
      strategyName: strategy.name,
      category: 'fundamental',
      strength,
      warnings: strategy.warnings,
    }
  }

  // 简化检测：仅当前 ROE > 15%
  if (roe > 15) {
    return {
      strategyId: 'fund_roe',
      strategyName: strategy.name,
      category: 'fundamental',
      strength: 'weak',
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测现金流健康策略
 * 经营现金流 > 净利润
 */
export const detectCashFlow: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'fund_cash_flow')!
  const { fundamental } = context

  if (!fundamental?.operatingCashFlow || !fundamental?.netProfit) return null

  const { operatingCashFlow, netProfit } = fundamental

  if (netProfit > 0 && operatingCashFlow > netProfit) {
    const strength = operatingCashFlow > netProfit * 1.5 ? 'strong' : 'medium'
    return {
      strategyId: 'fund_cash_flow',
      strategyName: strategy.name,
      category: 'fundamental',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 基本面策略检测器映射
 */
export const fundamentalDetectors: Record<string, StrategyDetector> = {
  fund_low_pe: detectLowPE,
  fund_low_pb: detectLowPB,
  fund_high_dividend: detectHighDividend,
  fund_roe: detectHighROE,
  fund_cash_flow: detectCashFlow,
}