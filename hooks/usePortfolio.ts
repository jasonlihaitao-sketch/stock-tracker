// hooks/usePortfolio.ts
import { useCallback, useMemo } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'
import type { Portfolio } from '@/types/portfolio'
import type { Stock } from '@/types/stock'

export interface PortfolioWithStock extends Portfolio {
  currentPrice: number
  marketValue: number
  profit: number
  profitPercent: number
  changePercent: number
}

export interface PortfolioSummary {
  totalCost: number
  totalValue: number
  totalProfit: number
  profitPercent: number
}

export interface UsePortfolioReturn {
  portfolios: Portfolio[]
  summary: PortfolioSummary

  // 操作
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void
  removePortfolio: (id: string) => void

  // 计算
  calculateWithRealtime: (stocks: Record<string, Stock>) => PortfolioWithStock[]
}

export function usePortfolio(): UsePortfolioReturn {
  const {
    portfolios,
    addPortfolio,
    updatePortfolio,
    removePortfolio
  } = usePortfolioStore()

  const summary = useMemo<PortfolioSummary>(() => {
    const totalCost = portfolios.reduce((sum, p) => sum + p.buyPrice * p.quantity, 0)
    return {
      totalCost,
      totalValue: totalCost, // 需要实时价格才能计算
      totalProfit: 0,
      profitPercent: 0,
    }
  }, [portfolios])

  const calculateWithRealtime = useCallback(
    (stocks: Record<string, Stock>): PortfolioWithStock[] => {
      return portfolios.map((p) => {
        const stock = stocks[p.stockCode]
        const currentPrice = stock?.price || 0
        const marketValue = currentPrice * p.quantity
        const cost = p.buyPrice * p.quantity
        const profit = marketValue - cost

        return {
          ...p,
          currentPrice,
          marketValue,
          profit,
          profitPercent: cost > 0 ? (profit / cost) * 100 : 0,
          changePercent: stock?.changePercent || 0,
        }
      })
    },
    [portfolios]
  )

  return {
    portfolios,
    summary,
    addPortfolio,
    updatePortfolio,
    removePortfolio,
    calculateWithRealtime,
  }
}