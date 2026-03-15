// lib/scanner/signal-detector.ts

import type { Stock, StockDetail } from '@/types/stock'
import type { ScanResult } from '@/types/scan'
import type { StrategyId } from '@/types/strategy'
import type { StockDataContext } from './strategies/types'
import { getKLineData } from '@/lib/api/stock'
import {
  detectSignalsForStrategies,
  calculateOverallStrength,
  getAvailableStrategyIds,
} from './strategies'

/**
 * 检查股票是否有基本面数据
 */
function hasFundamentalData(stock: Stock): stock is StockDetail {
  return 'pe' in stock || 'pb' in stock
}

/**
 * 构建股票数据上下文
 */
async function buildStockDataContext(stock: Stock): Promise<StockDataContext> {
  const context: StockDataContext = {
    code: stock.code,
    name: stock.name,
    price: stock.price,
    changePercent: stock.changePercent,
    volume: stock.volume,
    turnover: stock.turnover,
    high: stock.high,
    low: stock.low,
    open: stock.open,
    prevClose: stock.price - stock.change,
  }

  // 获取K线数据
  try {
    const klineData = await getKLineData(stock.code, 'daily')
    if (klineData.length > 0) {
      context.kline = {
        open: klineData.map((d) => d.open),
        high: klineData.map((d) => d.high),
        low: klineData.map((d) => d.low),
        close: klineData.map((d) => d.close),
        volume: klineData.map((d) => d.volume),
        dates: klineData.map((d) => d.date),
      }
    }
  } catch (error) {
    console.error(`Error fetching kline for ${stock.code}:`, error)
  }

  // 添加基本面数据（如果有）
  if (hasFundamentalData(stock)) {
    context.fundamental = {
      pe: stock.pe,
      pb: stock.pb,
      roe: stock.roe,
      dividendYield: stock.dividendYield,
    }
  }

  return context
}

/**
 * 检测单个股票的信号
 * @param stock 股票数据
 * @param strategyIds 要检测的策略ID列表，默认使用所有可用策略
 */
export async function detectSignals(
  stock: Stock,
  strategyIds?: StrategyId[]
): Promise<ScanResult | null> {
  try {
    // 构建数据上下文
    const context = await buildStockDataContext(stock)

    // 使用指定策略或所有策略
    const strategies = strategyIds || getAvailableStrategyIds()

    // 检测信号
    const signals = detectSignalsForStrategies(context, strategies)

    // 如果没有信号，返回 null
    if (signals.length === 0) return null

    // 计算信号强度
    const strength = calculateOverallStrength(signals)

    return {
      code: stock.code,
      name: stock.name,
      price: stock.price,
      changePercent: stock.changePercent,
      signals,
      strength,
    }
  } catch (error) {
    console.error(`Error detecting signals for ${stock.code}:`, error)
    return null
  }
}

/**
 * 批量检测股票信号
 * @param stocks 股票列表
 * @param strategyIds 要检测的策略ID列表，默认使用所有可用策略
 */
export async function detectSignalsBatch(
  stocks: Stock[],
  strategyIds?: StrategyId[]
): Promise<ScanResult[]> {
  const results: ScanResult[] = []

  for (const stock of stocks) {
    const result = await detectSignals(stock, strategyIds)
    if (result) {
      results.push(result)
    }
  }

  return results
}
