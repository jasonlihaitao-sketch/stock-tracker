import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Position, PositionSummary } from '@/types/position'
import { calculateInitialStopLoss, updateTrailingStop } from '@/lib/strategy/trailing-stop'

interface PositionState {
  positions: Position[]

  // 操作
  addPosition: (position: Omit<Position, 'id' | 'initialStopLoss' | 'currentStopLoss' | 'highestPrice' | 'profit' | 'profitPercent' | 'currentPrice'>) => void
  removePosition: (id: string) => void
  updatePosition: (id: string, updates: Partial<Position>) => void
  updatePrice: (stockCode: string, currentPrice: number) => void

  // 计算
  getSummary: () => PositionSummary
  getPositionByCode: (stockCode: string) => Position | undefined
}

export const usePositionStore = create<PositionState>()(
  persist(
    (set, get) => ({
      positions: [],

      addPosition: (positionData) => {
        const id = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const initialStopLoss = calculateInitialStopLoss(positionData.buyPrice)

        const newPosition: Position = {
          ...positionData,
          id,
          initialStopLoss,
          currentStopLoss: initialStopLoss,
          highestPrice: positionData.buyPrice,
          currentPrice: positionData.buyPrice,
          profit: 0,
          profitPercent: 0,
        }

        set((state) => ({
          positions: [...state.positions, newPosition]
        }))
      },

      removePosition: (id) => {
        set((state) => ({
          positions: state.positions.filter(p => p.id !== id)
        }))
      },

      updatePosition: (id, updates) => {
        set((state) => ({
          positions: state.positions.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
      },

      updatePrice: (stockCode, currentPrice) => {
        set((state) => ({
          positions: state.positions.map(p => {
            if (p.stockCode !== stockCode) return p

            // 更新最高价和移动止损
            const newHighest = Math.max(p.highestPrice, currentPrice)
            let newStopLoss = p.currentStopLoss

            if (currentPrice > p.buyPrice && currentPrice > p.highestPrice) {
              newStopLoss = updateTrailingStop({ ...p, highestPrice: newHighest }, currentPrice)
            }

            const profit = (currentPrice - p.buyPrice) * p.quantity
            const profitPercent = ((currentPrice - p.buyPrice) / p.buyPrice) * 100

            return {
              ...p,
              currentPrice,
              highestPrice: newHighest,
              currentStopLoss: newStopLoss,
              profit,
              profitPercent,
            }
          })
        }))
      },

      getSummary: () => {
        const positions = get().positions

        if (positions.length === 0) {
          return {
            totalValue: 0,
            totalCost: 0,
            totalProfit: 0,
            totalProfitPercent: 0,
            todayProfit: 0,
            todayProfitPercent: 0,
          }
        }

        const totalCost = positions.reduce((sum, p) => sum + p.buyPrice * p.quantity, 0)
        const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
        const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0)
        const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

        // 今日盈亏简化计算（实际应基于昨日收盘价）
        const todayProfit = totalProfit
        const todayProfitPercent = totalProfitPercent

        return {
          totalValue,
          totalCost,
          totalProfit,
          totalProfitPercent,
          todayProfit,
          todayProfitPercent,
        }
      },

      getPositionByCode: (stockCode) => {
        return get().positions.find(p => p.stockCode === stockCode)
      },
    }),
    {
      name: 'stock-tracker-positions',
    }
  )
)