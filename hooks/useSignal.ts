// hooks/useSignal.ts
import { useCallback } from 'react'
import { useSignalStore } from '@/store/signalStore'
import type { Signal } from '@/types/signal'

export interface UseSignalReturn {
  buySignals: Signal[]
  sellSignals: Signal[]

  // 操作
  setBuySignals: (signals: Signal[]) => void
  setSellSignals: (signals: Signal[]) => void
  clearSignals: () => void

  // 查询
  getSignalsByStock: (stockCode: string) => Signal[]
}

export function useSignal(): UseSignalReturn {
  const {
    buySignals,
    sellSignals,
    setBuySignals,
    setSellSignals,
  } = useSignalStore()

  const clearSignals = useCallback(() => {
    setBuySignals([])
    setSellSignals([])
  }, [setBuySignals, setSellSignals])

  const getSignalsByStock = useCallback(
    (stockCode: string) => {
      return [...buySignals, ...sellSignals].filter((s) => s.stockCode === stockCode)
    },
    [buySignals, sellSignals]
  )

  return {
    buySignals,
    sellSignals,
    setBuySignals,
    setSellSignals,
    clearSignals,
    getSignalsByStock,
  }
}