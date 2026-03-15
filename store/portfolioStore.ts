import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Portfolio } from '@/types/portfolio'
import { generateId } from '@/lib/utils'

interface PortfolioState {
  portfolios: Portfolio[]
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePortfolio: (id: string, portfolio: Partial<Portfolio>) => void
  removePortfolio: (id: string) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolios: [],

      addPortfolio: (portfolio) => {
        const newPortfolio: Portfolio = {
          ...portfolio,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ portfolios: [...get().portfolios, newPortfolio] })
      },

      updatePortfolio: (id, updates) => {
        set({
          portfolios: get().portfolios.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })
      },

      removePortfolio: (id) => {
        set({ portfolios: get().portfolios.filter((p) => p.id !== id) })
      },
    }),
    {
      name: 'stock-tracker-portfolio',
    }
  )
)