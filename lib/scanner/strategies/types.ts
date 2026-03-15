// lib/scanner/strategies/types.ts
import type { StrategyId, StrategyCategory } from '@/types/strategy'
import type { SignalStrength } from '@/types/scan'

/**
 * 策略检测结果
 */
export interface StrategySignal {
  strategyId: StrategyId
  strategyName: string
  category: StrategyCategory
  strength: SignalStrength
  warnings: string[]
}

/**
 * 股票数据上下文 - 用于策略检测
 */
export interface StockDataContext {
  code: string
  name: string
  price: number
  changePercent: number
  volume: number
  turnover: number
  high: number
  low: number
  open: number
  prevClose: number

  // K线数据
  kline?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
    volume: number[]
    dates: string[]
  }

  // 基本面数据
  fundamental?: {
    pe?: number
    pb?: number
    roe?: number
    roeHistory?: number[]
    dividendYield?: number
    operatingCashFlow?: number
    netProfit?: number
    revenue?: number
    revenueYoY?: number
    netProfitYoY?: number
    grossMargin?: number
    industryPe?: number
  }

  // 技术指标
  indicators?: {
    ma5?: number
    ma10?: number
    ma20?: number
    ma60?: number
    macd?: {
      dif: number
      dea: number
      macd: number
    }
    kdj?: {
      k: number
      d: number
      j: number
    }
    rsi?: number
    bollingerBands?: {
      upper: number
      middle: number
      lower: number
    }
  }
}

/**
 * 策略检测函数类型
 */
export type StrategyDetector = (context: StockDataContext) => StrategySignal | null