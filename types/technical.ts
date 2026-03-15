import type { Stock } from './stock'

export interface MACDResult {
  dif: number
  dea: number
  macd: number
}

export interface KDJResult {
  k: number
  d: number
  j: number
}

export interface BOLLResult {
  upper: number
  middle: number
  lower: number
}

export interface StockTechnical {
  code: string
  high20d: number
  low20d: number
  ma5: number
  ma10: number
  ma20: number
  volume: number
  avgVolume5d: number
  avgVolume20d: number
  calculatedAt: string
}

export interface ExtendedTechnical extends StockTechnical {
  rsi: number
  macd: MACDResult
  kdj: KDJResult
  boll: BOLLResult
  atr: number
  ema12: number
  ema26: number
}

export type StockWithTechnical = Stock & StockTechnical
export type StockWithExtendedTechnical = Stock & ExtendedTechnical