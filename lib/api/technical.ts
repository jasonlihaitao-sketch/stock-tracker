import type { KLineData } from '@/types/stock'
import type { StockTechnical, ExtendedTechnical } from '@/types/technical'
import { calculateAllIndicators, type KLine } from '@/lib/technical/indicators'

function calculateMA(data: number[], period: number): number {
  if (data.length < period) {
    return data.length > 0 ? data[data.length - 1] : 0
  }
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export function calculateTechnicalFromKline(
  code: string,
  klines: KLineData[]
): StockTechnical {
  if (klines.length === 0) {
    throw new Error('No kline data available')
  }

  const closes = klines.map(k => k.close)
  const volumes = klines.map(k => k.volume)
  const highs = klines.map(k => k.high)
  const lows = klines.map(k => k.low)

  return {
    code,
    high20d: Math.max(...highs.slice(-20)),
    low20d: Math.min(...lows.slice(-20)),
    ma5: calculateMA(closes, 5),
    ma10: calculateMA(closes, 10),
    ma20: calculateMA(closes, 20),
    volume: volumes[volumes.length - 1],
    avgVolume5d: calculateMA(volumes, 5),
    avgVolume20d: calculateMA(volumes, 20),
    calculatedAt: new Date().toISOString()
  }
}

export function calculateExtendedTechnicalFromKline(
  code: string,
  klines: KLineData[]
): ExtendedTechnical {
  const basic = calculateTechnicalFromKline(code, klines)
  
  const klineData: KLine[] = klines.map(k => ({
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume
  }))
  
  const indicators = calculateAllIndicators(klineData)
  
  return {
    ...basic,
    rsi: indicators.rsi,
    macd: indicators.macd,
    kdj: indicators.kdj,
    boll: indicators.boll,
    atr: indicators.atr,
    ema12: indicators.ema12,
    ema26: indicators.ema26
  }
}

export async function getStockTechnical(code: string): Promise<StockTechnical> {
  const response = await fetch(`/api/technical?code=${code}`)
  if (!response.ok) {
    throw new Error('Failed to fetch technical data')
  }

  const result = await response.json()
  return result.data
}

export async function getStockExtendedTechnical(code: string): Promise<ExtendedTechnical> {
  const response = await fetch(`/api/technical?code=${code}&extended=true`)
  if (!response.ok) {
    throw new Error('Failed to fetch extended technical data')
  }

  const result = await response.json()
  return result.data
}