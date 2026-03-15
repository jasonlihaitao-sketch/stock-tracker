// lib/scanner/strategies/technical.ts
import type { StrategyDetector, StockDataContext, StrategySignal } from './types'
import { STRATEGIES } from '@/types/strategy'

/**
 * 检测价格突破策略
 * 股价接近 20 日新高
 */
export const detectBreakout: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_breakout')!
  const { kline, price } = context

  if (!kline || kline.high.length < 20) return null

  const high20d = Math.max(...kline.high.slice(-20))
  const threshold = high20d * 0.99 // 允许1%误差

  if (price >= threshold) {
    const strength = price >= high20d ? 'strong' : 'medium'
    return {
      strategyId: 'tech_breakout',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测量价配合策略
 * 成交量放大且股价上涨
 */
export const detectVolume: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_volume')!
  const { kline, changePercent } = context

  if (!kline || kline.volume.length < 5) return null

  const lastVolume = kline.volume[kline.volume.length - 1]
  const avgVolume5d =
    kline.volume.slice(-5).reduce((a, b) => a + b, 0) / 5

  // 成交量 > 5日均量 × 2 且上涨
  if (changePercent > 0 && lastVolume > avgVolume5d * 2) {
    const strength = lastVolume > avgVolume5d * 3 ? 'strong' : 'medium'
    return {
      strategyId: 'tech_volume',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测均线金叉策略
 * MA5 上穿 MA10
 */
export const detectMACross: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_ma_cross')!
  const { indicators } = context

  if (!indicators?.ma5 || !indicators?.ma10) return null

  // 简化检测：MA5 > MA10 且 MA5 呈上升趋势
  if (indicators.ma5 > indicators.ma10) {
    return {
      strategyId: 'tech_ma_cross',
      strategyName: strategy.name,
      category: 'technical',
      strength: 'medium',
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测 MACD 金叉策略
 * DIF 线上穿 DEA 线
 */
export const detectMACD: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_macd')!
  const { indicators } = context

  if (!indicators?.macd) return null

  const { dif, dea, macd } = indicators.macd

  // DIF > DEA 且 MACD 为正
  if (dif > dea && macd > 0) {
    const strength = macd > 0.5 ? 'strong' : 'medium'
    return {
      strategyId: 'tech_macd',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测 KDJ 金叉策略
 * K 线上穿 D 线
 */
export const detectKDJ: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_kdj')!
  const { indicators } = context

  if (!indicators?.kdj) return null

  const { k, d, j } = indicators.kdj

  // K > D 且 J > K（金叉确认）
  if (k > d && j > k) {
    const strength = j > 80 ? 'strong' : 'medium'
    return {
      strategyId: 'tech_kdj',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测 RSI 超卖策略
 * RSI < 30 且拐头向上
 */
export const detectRSIOversold: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_rsi_oversold')!
  const { indicators } = context

  if (!indicators?.rsi) return null

  const rsi = indicators.rsi

  // RSI < 30 超卖
  if (rsi < 30) {
    const strength = rsi < 20 ? 'strong' : 'medium'
    return {
      strategyId: 'tech_rsi_oversold',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测支撑位反弹策略
 * 股价触及重要支撑位后回升
 */
export const detectSupport: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_support')!
  const { kline, indicators, price } = context

  if (!kline || !indicators?.bollingerBands) return null

  const { lower } = indicators.bollingerBands
  const lows = kline.low.slice(-5)
  const minLow = Math.min(...lows)

  // 价格接近布林下轨或近期低点
  if (price <= lower * 1.02 || minLow <= lower * 1.01) {
    return {
      strategyId: 'tech_support',
      strategyName: strategy.name,
      category: 'technical',
      strength: 'medium',
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 检测压力位突破策略
 * 股价突破重要压力位
 */
export const detectResistance: StrategyDetector = (context): StrategySignal | null => {
  const strategy = STRATEGIES.find((s) => s.id === 'tech_resistance')!
  const { kline, indicators, price, volume } = context

  if (!kline || !indicators?.bollingerBands || kline.high.length < 20) return null

  const { upper } = indicators.bollingerBands
  const high20d = Math.max(...kline.high.slice(-20))

  // 价格突破布林上轨或20日高点
  if (price > upper || price >= high20d * 0.99) {
    const avgVolume = kline.volume.slice(-5).reduce((a, b) => a + b, 0) / 5
    const strength = volume > avgVolume * 1.5 ? 'strong' : 'medium'
    return {
      strategyId: 'tech_resistance',
      strategyName: strategy.name,
      category: 'technical',
      strength,
      warnings: strategy.warnings,
    }
  }

  return null
}

/**
 * 技术面策略检测器映射
 */
export const technicalDetectors: Record<string, StrategyDetector> = {
  tech_breakout: detectBreakout,
  tech_volume: detectVolume,
  tech_ma_cross: detectMACross,
  tech_macd: detectMACD,
  tech_kdj: detectKDJ,
  tech_rsi_oversold: detectRSIOversold,
  tech_support: detectSupport,
  tech_resistance: detectResistance,
}