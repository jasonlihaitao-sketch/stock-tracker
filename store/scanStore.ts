// store/scanStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanResult, ScanStatus, ScanScope, ScanProgress, ScanConfig } from '@/types/scan'
import type { StrategyId } from '@/types/strategy'
import { DEFAULT_ENABLED_STRATEGIES, STRATEGIES } from '@/types/strategy'
import { STRATEGY_TEMPLATES } from '@/types/strategy-template'
import { startScan, stopScan as stopScanner } from '@/lib/scanner'

interface ScanState {
  status: ScanStatus
  progress: ScanProgress
  results: ScanResult[]
  scope: ScanScope
  selectedStrategies: StrategyId[]
  activeTemplateId: string | null

  // Actions
  startScan: (scope: ScanScope) => Promise<void>
  stopScan: () => void
  clearResults: () => void
  addResult: (result: ScanResult) => void
  setProgress: (progress: ScanProgress) => void

  // Strategy Selection
  toggleStrategy: (strategyId: StrategyId) => void
  setStrategies: (strategies: StrategyId[]) => void
  resetStrategies: () => void
  applyTemplate: (templateId: string) => void
  getScanConfig: () => ScanConfig
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      progress: { current: 0, total: 0 },
      results: [],
      scope: 'all',
      selectedStrategies: DEFAULT_ENABLED_STRATEGIES,
      activeTemplateId: null,

      startScan: async (scope: ScanScope) => {
        set({ status: 'scanning', scope, results: [], progress: { current: 0, total: 0 } })

        try {
          const config = get().getScanConfig()
          const results = await startScan({
            scope,
            strategies: config.strategies,
            onProgress: (progress) => set({ progress }),
            onFound: (result) => {
              set((state) => ({
                results: [...state.results, result],
              }))
            },
          })

          set({ status: 'completed', results })
        } catch (error) {
          console.error('Scan failed:', error)
          set({ status: 'idle' })
        }
      },

      stopScan: () => {
        stopScanner()
        set((state) => ({
          status: state.progress.current > 0 ? 'completed' : 'idle',
        }))
      },

      clearResults: () => {
        set({ results: [], status: 'idle', progress: { current: 0, total: 0 } })
      },

      addResult: (result: ScanResult) => {
        set((state) => ({
          results: [...state.results, result],
        }))
      },

      setProgress: (progress: ScanProgress) => {
        set({ progress })
      },

      toggleStrategy: (strategyId: StrategyId) => {
        set((state) => {
          const isSelected = state.selectedStrategies.includes(strategyId)
          const newStrategies = isSelected
            ? state.selectedStrategies.filter((id) => id !== strategyId)
            : [...state.selectedStrategies, strategyId]
          return {
            selectedStrategies: newStrategies,
            activeTemplateId: null, // 手动选择策略时清除模板
          }
        })
      },

      setStrategies: (strategies: StrategyId[]) => {
        set({ selectedStrategies: strategies, activeTemplateId: null })
      },

      resetStrategies: () => {
        set({
          selectedStrategies: DEFAULT_ENABLED_STRATEGIES,
          activeTemplateId: null,
        })
      },

      applyTemplate: (templateId: string) => {
        const template = STRATEGY_TEMPLATES.find((t) => t.id === templateId)
        if (template) {
          set({
            selectedStrategies: template.strategies as StrategyId[],
            activeTemplateId: templateId,
          })
        }
      },

      getScanConfig: (): ScanConfig => ({
        scope: get().scope,
        strategies: get().selectedStrategies,
        templateId: get().activeTemplateId ?? undefined,
      }),
    }),
    {
      name: 'stock-tracker-scan',
      partialize: (state) => ({
        results: state.results.slice(0, 100), // 只缓存最近100条
        scope: state.scope,
        selectedStrategies: state.selectedStrategies,
        activeTemplateId: state.activeTemplateId,
      }),
    }
  )
)
