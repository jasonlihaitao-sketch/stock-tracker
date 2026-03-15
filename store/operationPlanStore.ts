import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationPlan, CreateOperationPlanParams } from '@/types/operationPlan'

interface OperationPlanState {
  plans: OperationPlan[]
  history: OperationPlan[]

  // 操作
  addPlan: (params: CreateOperationPlanParams) => string
  updatePlan: (id: string, updates: Partial<OperationPlan>) => void
  removePlan: (id: string) => void
  markAsExecuted: (id: string, executedPrice: number) => void
  cancelPlan: (id: string) => void

  // 查询
  getPendingPlans: () => OperationPlan[]
  getPlansByStock: (stockCode: string) => OperationPlan[]
}

export const useOperationPlanStore = create<OperationPlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      history: [],

      addPlan: (params) => {
        const id = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const newPlan: OperationPlan = {
          ...params,
          id,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          plans: [...state.plans, newPlan]
        }))

        return id
      },

      updatePlan: (id, updates) => {
        set((state) => ({
          plans: state.plans.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
      },

      removePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter(p => p.id !== id)
        }))
      },

      markAsExecuted: (id, executedPrice) => {
        const plan = get().plans.find(p => p.id === id)
        if (!plan) return

        const now = new Date().toISOString()
        const executedPlan: OperationPlan = {
          ...plan,
          status: 'executed',
          executedAt: now,
          executedPrice,
          updatedAt: now,
        }

        set((state) => ({
          plans: state.plans.filter(p => p.id !== id),
          history: [executedPlan, ...state.history]
        }))
      },

      cancelPlan: (id) => {
        const plan = get().plans.find(p => p.id === id)
        if (!plan) return

        const cancelledPlan: OperationPlan = {
          ...plan,
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          plans: state.plans.filter(p => p.id !== id),
          history: [cancelledPlan, ...state.history]
        }))
      },

      getPendingPlans: () => {
        return get().plans.filter(p => p.status === 'pending')
      },

      getPlansByStock: (stockCode) => {
        return get().plans.filter(p => p.stockCode === stockCode)
      },
    }),
    {
      name: 'stock-tracker-operation-plans',
    }
  )
)