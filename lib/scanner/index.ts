// lib/scanner/index.ts

import type { ScanOptions, ScanResult, ScanScope, ScanSignal } from '@/types/scan'
import type { StrategyId } from '@/types/strategy'
import { DEFAULT_ENABLED_STRATEGIES } from '@/types/strategy'
import { fetchScanableStocks, fetchHS300Stocks } from './stock-list'
import {
  detectSignalsForStrategies,
  calculateOverallStrength,
  type StockDataContext,
} from './strategies'

// 扫描状态
let isScanning = false
let shouldStop = false

/**
 * 开始扫描 - 优化版本
 * 使用后端批量 API 并行获取数据
 */
export async function startScan(options: ScanOptions): Promise<ScanResult[]> {
  if (isScanning) {
    console.warn('Scan already in progress')
    return []
  }

  isScanning = true
  shouldStop = false
  const allResults: ScanResult[] = []
  const strategies = options.strategies || DEFAULT_ENABLED_STRATEGIES

  try {
    // 1. 获取股票列表
    const stocks = await getStockList(options.scope)
    const total = stocks.length

    console.log(`[Scanner] Starting scan for ${total} stocks with ${strategies.length} strategies`)
    options.onProgress?.({ current: 0, total })

    // 2. 使用批量扫描 API（每批 500 只）
    const batchSize = 500
    let offset = 0

    while (offset < total && !shouldStop) {
      try {
        const response = await fetch('/api/scan/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codes: stocks,
            offset,
            strategies,
          }),
        })

        if (!response.ok) {
          console.error('Batch scan failed:', response.status)
          break
        }

        const data = await response.json()

        // 添加找到的信号
        if (data.signals && data.signals.length > 0) {
          for (const signal of data.signals) {
            // 使用新的策略信号格式
            const scanSignals: ScanSignal[] =
              signal.strategies?.map((s: any) => ({
                strategyId: s.strategyId,
                strategyName: s.strategyName,
                category: s.category,
                strength: s.strength,
                warnings: s.warnings || [],
              })) || []

            const result: ScanResult = {
              code: signal.code,
              name: signal.name,
              price: signal.price,
              changePercent: signal.changePercent,
              signals: scanSignals,
              strength: signal.strength || calculateOverallStrength(scanSignals),
            }
            allResults.push(result)
            options.onFound?.(result)
          }
        }

        // 更新进度
        offset = data.nextOffset || total
        options.onProgress?.({ current: Math.min(offset, total), total })

        console.log(
          `[Scanner] Batch progress: ${Math.min(offset, total)}/${total}, found: ${allResults.length}`
        )
      } catch (error) {
        console.error('Batch scan error:', error)
        // 继续下一批
        offset += batchSize
      }
    }

    // 3. 按信号强度排序
    allResults.sort((a, b) => b.strength - a.strength)

    console.log(`[Scanner] Completed. Found ${allResults.length} signals`)
    return allResults
  } catch (error) {
    console.error('Scan error:', error)
    return allResults
  } finally {
    isScanning = false
  }
}

/**
 * 停止扫描
 */
export function stopScan(): void {
  shouldStop = true
}

/**
 * 检查是否正在扫描
 */
export function isScanningInProgress(): boolean {
  return isScanning
}

/**
 * 获取股票列表
 */
async function getStockList(scope: ScanScope): Promise<string[]> {
  switch (scope) {
    case 'all':
      return fetchScanableStocks()
    case 'hs300':
      return fetchHS300Stocks()
    case 'watchlist':
      // 从 localStorage 获取自选股
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem('stock-tracker-watchlist')
      if (!stored) return []
      const data = JSON.parse(stored)
      // Zustand persist 存储结构: { state: { stocks: [...] }, version: ... }
      return data.state?.stocks || data.stocks || []
    default:
      return []
  }
}

// 导出类型
export type { ScanOptions, ScanResult, ScanScope }
