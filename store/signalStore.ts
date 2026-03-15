import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Signal } from '@/types/signal'

interface SignalState {
  // 活跃信号
  buySignals: Signal[]
  sellSignals: Signal[]

  // 历史信号
  signalHistory: Signal[]

  // 操作
  addSignal: (signal: Signal) => void
  addSignals: (signals: Signal[]) => void
  removeSignal: (id: string) => void
  markAsExecuted: (id: string) => void
  clearExpiredSignals: () => void
  setBuySignals: (signals: Signal[]) => void
  setSellSignals: (signals: Signal[]) => void
}

export const useSignalStore = create<SignalState>()(
  persist(
    (set, get) => ({
      buySignals: [],
      sellSignals: [],
      signalHistory: [],

      addSignal: (signal) => {
        if (signal.type === 'buy') {
          set((state) => ({
            buySignals: [...state.buySignals.filter(s => s.stockCode !== signal.stockCode), signal]
          }))
        } else {
          set((state) => ({
            sellSignals: [...state.sellSignals.filter(s => s.stockCode !== signal.stockCode), signal]
          }))
        }
      },

      addSignals: (signals) => {
        const buySignals = signals.filter(s => s.type === 'buy')
        const sellSignals = signals.filter(s => s.type === 'sell')
        set((state) => ({
          buySignals: [...state.buySignals, ...buySignals],
          sellSignals: [...state.sellSignals, ...sellSignals]
        }))
      },

      removeSignal: (id) => {
        set((state) => ({
          buySignals: state.buySignals.filter(s => s.id !== id),
          sellSignals: state.sellSignals.filter(s => s.id !== id)
        }))
      },

      markAsExecuted: (id) => {
        const signal = [...get().buySignals, ...get().sellSignals].find(s => s.id === id)
        if (signal) {
          set((state) => ({
            buySignals: state.buySignals.filter(s => s.id !== id),
            sellSignals: state.sellSignals.filter(s => s.id !== id),
            signalHistory: [...state.signalHistory, { ...signal, status: 'executed' }]
          }))
        }
      },

      clearExpiredSignals: () => {
        const now = new Date()
        set((state) => ({
          buySignals: state.buySignals.filter(s => new Date(s.expiresAt) > now),
          sellSignals: state.sellSignals.filter(s => new Date(s.expiresAt) > now)
        }))
      },

      setBuySignals: (signals) => {
        set({ buySignals: signals })
      },

      setSellSignals: (signals) => {
        set({ sellSignals: signals })
      }
    }),
    {
      name: 'stock-tracker-signals',
      partialize: (state) => ({
        signalHistory: state.signalHistory
      })
    }
  )
)