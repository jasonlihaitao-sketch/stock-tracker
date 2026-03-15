// hooks/usePosition.ts
import { useMemo } from 'react'
import { usePositionStore } from '@/store/positionStore'
import type { Position, PositionSummary } from '@/types/position'

export interface UsePositionReturn {
  positions: Position[]
  summary: PositionSummary

  // 操作
  addPosition: (
    position: Omit<
      Position,
      | 'id'
      | 'initialStopLoss'
      | 'currentStopLoss'
      | 'highestPrice'
      | 'profit'
      | 'profitPercent'
      | 'currentPrice'
    >
  ) => void
  updatePosition: (id: string, updates: Partial<Position>) => void
  removePosition: (id: string) => void
  updatePrice: (stockCode: string, price: number) => void
}

export function usePosition(): UsePositionReturn {
  const { positions, addPosition, updatePosition, removePosition, updatePrice, getSummary } =
    usePositionStore()

  const summary = useMemo(() => getSummary(), [positions, getSummary])

  return {
    positions,
    summary,
    addPosition,
    updatePosition,
    removePosition,
    updatePrice,
  }
}
