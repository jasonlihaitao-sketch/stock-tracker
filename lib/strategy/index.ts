export * from './buy-signals'
export * from './sell-signals'
export * from './signal-merger'
export * from './trailing-stop'

import type { StockWithTechnical } from '@/types/technical'
import type { Position } from '@/types/position'
import type { Sector } from '@/types/sector'
import type { Signal } from '@/types/signal'
import { detectBuySignals } from './buy-signals'
import { detectSellSignals } from './sell-signals'

export interface StrategyEngineResult {
  buySignals: Signal[]
  sellSignals: Signal[]
}

export function runStrategyEngine(
  stocks: StockWithTechnical[],
  positions: Position[],
  sectors?: Map<string, Sector>
): StrategyEngineResult {
  const buySignals: Signal[] = []
  const sellSignals: Signal[] = []

  // 检测买入信号（对所有股票）
  for (const stock of stocks) {
    const sector = sectors?.get(stock.code)
    const signals = detectBuySignals(stock, sector)
    buySignals.push(...signals)
  }

  // 检测卖出信号（只对持仓）
  for (const position of positions) {
    const stock = stocks.find(s => s.code === position.stockCode)
    if (stock) {
      const signals = detectSellSignals(position, stock)
      sellSignals.push(...signals)
    }
  }

  return { buySignals, sellSignals }
}