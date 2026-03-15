// hooks/useStock.ts
import { useCallback } from 'react'
import { useWatchlistStore } from '@/store/stockStore'
import { searchStocks } from '@/lib/api/stock'
import type { Stock } from '@/types/stock'

export interface UseStockReturn {
  // 状态
  stocks: string[]
  stockData: Record<string, Stock>
  loading: boolean

  // 操作
  addStock: (code: string) => void
  removeStock: (code: string) => void
  refreshData: () => Promise<void>

  // 查询
  getStockByCode: (code: string) => Stock | undefined
  searchStocksByKeyword: (keyword: string) => Promise<Stock[]>
}

export function useStock(): UseStockReturn {
  const {
    stocks,
    stockData,
    loading,
    addStock,
    removeStock,
    refreshData
  } = useWatchlistStore()

  const getStockByCode = useCallback((code: string) => {
    return stockData[code]
  }, [stockData])

  const searchStocksByKeyword = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return []
    const results = await searchStocks(keyword)
    return results.map(r => ({
      code: r.code,
      name: r.name,
      market: r.market,
      price: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      volume: 0,
      turnover: 0,
    })) as Stock[]
  }, [])

  return {
    stocks,
    stockData,
    loading,
    addStock,
    removeStock,
    refreshData,
    getStockByCode,
    searchStocksByKeyword,
  }
}