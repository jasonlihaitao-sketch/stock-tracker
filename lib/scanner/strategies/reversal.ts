// lib/scanner/strategies/reversal.ts
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { STRATEGIES } from '@/types/strategy'

/**
 * 检测超跌反弹策略
 * 跌幅 > 30% + RSI < 30
 */
export const detectOversold: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'reversal_oversold')!
  const { kline, indicators, changePercent } = context

  if (!kline || kline.close.length < 60 || !indicators?.rsi) return null

  // 计算60日跌幅
  const close60d = kline.close.slice(-60)
  const highestPrice = Math.max(...close60d)
  const currentPrice = close60d[close60d.length - 1]
  const dropPercent = ((highestPrice - currentPrice) / highestPrice) * 100

  if (dropPercent > 30 && indicators.rsi < 30) {
    const strength = dropPercent > 50 && indicators.rsi < 20 ? 'strong' : 'medium'
    return {
      strategyId: 'reversal_oversold',
      strategyName: strategy.name,
      category: 'reversal',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测历史支撑策略
 * 价格接近历史低点
 */
export const detectSupport: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'reversal_support')!
  const { kline, price } = context

  if (!kline || kline.low.length < 120) return null

  // 计算历史低点（120日）
  const historicalLow = Math.min(...kline.low.slice(-120))
  const threshold = historicalLow * 1.05 // 5%误差范围

  if (price <= threshold) {
    const strength = price <= historicalLow * 1.02 ? 'strong' : 'medium'
    return {
      strategyId: 'reversal_support',
      strategyName: strategy.name,
      category: 'reversal',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测布林下轨策略
 * 价格触及布林下轨后回升
 */
export const detectBollingerBand: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'reversal_bb')!
  const { kline, indicators, price } = context

  if (!kline || !indicators?.bollingerBands || kline.low.length < 5) return null

  const { lower } = indicators.bollingerBands
  const recentLows = kline.low.slice(-5)
  const touchedLower = recentLows.some((low) => low <= lower * 1.02)

  if (touchedLower && price > lower) {
    return {
      strategyId: 'reversal_bb',
      strategyName: strategy.name,
      category: 'reversal',
      strength: 'medium',
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测缺口回补策略
 * 股价回补向上跳空缺口
 * 注意：需要更详细的缺口分析
 */
export const detectGap: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'reversal_gap')!
  const { kline } = context

  if (!kline || kline.open.length < 5) return null

  // 简化检测：寻找向上跳空缺口（当日开盘 > 前日最高）
  for (let i = 1; i < Math.min(5, kline.open.length); i++) {
    const prevHigh = kline.high[kline.high.length - 1 - i]
    const currOpen = kline.open[kline.open.length - i]

    if (currOpen > prevHigh * 1.02) {
      // 发现跳空缺口
      return {
        strategyId: 'reversal_gap',
        strategyName: strategy.name,
        category: 'reversal',
        strength: 'medium',
        warnings: strategy.warnings,
      }
    }
  }

  return null
}

/**
 * 反转策略检测器映射
 */
export const reversalDetectors: Record<string, StrategyDetector> = {
  reversal_oversold: detectOversold,
  reversal_support: detectSupport,
  reversal_bb: detectBollingerBand,
  reversal_gap: detectGap,
}