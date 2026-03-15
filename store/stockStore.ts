import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Stock } from '@/types/stock'
import type { WatchlistGroup } from '@/types/watchlistGroup'
import { getStockRealtime } from '@/lib/api/stock'

const ALL_GROUP_ID = 'all'

interface WatchlistState {
  stocks: string[]
  stockData: Record<string, Stock>
  loading: boolean
  groups: WatchlistGroup[]
  activeGroupId: string
  addStock: (code: string) => void
  removeStock: (code: string) => void
  setStockData: (data: Record<string, Stock>) => void
  refreshData: () => Promise<void>
  createGroup: (name: string) => void
  updateGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  setActiveGroup: (id: string) => void
  moveStockToGroup: (stockCode: string, groupId: string | null) => void
  getStocksInActiveGroup: () => string[]
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      stocks: [],
      stockData: {},
      loading: false,
      groups: [],
      activeGroupId: ALL_GROUP_ID,

      addStock: (code: string) => {
        const stocks = get().stocks
        if (!stocks.includes(code)) {
          set({ stocks: [...stocks, code] })
        }
      },

      removeStock: (code: string) => {
        const stocks = get().stocks
        const stockData = get().stockData
        const groups = get().groups
        const newStockData = { ...stockData }
        delete newStockData[code]

        const updatedGroups = groups.map((group) => ({
          ...group,
          stockCodes: group.stockCodes.filter((c) => c !== code),
        }))

        set({
          stocks: stocks.filter((s) => s !== code),
          stockData: newStockData,
          groups: updatedGroups,
        })
      },

      setStockData: (data: Record<string, Stock>) => {
        set({ stockData: data })
      },

      refreshData: async () => {
        const stocks = get().stocks
        if (stocks.length === 0) return

        set({ loading: true })
        try {
          const data = await getStockRealtime(stocks)
          const stockDataMap: Record<string, Stock> = {}
          data.forEach((stock) => {
            stockDataMap[stock.code] = stock
          })
          set({ stockData: stockDataMap, loading: false })
        } catch (error) {
          console.error('Error refreshing stock data:', error)
          set({ loading: false })
        }
      },

      createGroup: (name: string) => {
        const now = new Date().toISOString()
        const newGroup: WatchlistGroup = {
          id: `group_${Date.now()}`,
          name,
          stockCodes: [],
          createdAt: now,
          updatedAt: now,
        }
        set({ groups: [...get().groups, newGroup] })
      },

      updateGroup: (id: string, name: string) => {
        const groups = get().groups
        const updatedGroups = groups.map((group) =>
          group.id === id
            ? { ...group, name, updatedAt: new Date().toISOString() }
            : group
        )
        set({ groups: updatedGroups })
      },

      deleteGroup: (id: string) => {
        const groups = get().groups
        const updatedGroups = groups.filter((group) => group.id !== id)
        const newActiveGroupId =
          get().activeGroupId === id ? ALL_GROUP_ID : get().activeGroupId
        set({ groups: updatedGroups, activeGroupId: newActiveGroupId })
      },

      setActiveGroup: (id: string) => {
        set({ activeGroupId: id })
      },

      moveStockToGroup: (stockCode: string, groupId: string | null) => {
        const groups = get().groups
        const updatedGroups = groups.map((group) => {
          const hasStock = group.stockCodes.includes(stockCode)

          if (groupId === null) {
            return {
              ...group,
              stockCodes: group.stockCodes.filter((c) => c !== stockCode),
            }
          }

          if (group.id === groupId) {
            if (!hasStock) {
              return {
                ...group,
                stockCodes: [...group.stockCodes, stockCode],
                updatedAt: new Date().toISOString(),
              }
            }
          } else {
            return {
              ...group,
              stockCodes: group.stockCodes.filter((c) => c !== stockCode),
            }
          }

          return group
        })

        set({ groups: updatedGroups })
      },

      getStocksInActiveGroup: () => {
        const { stocks, groups, activeGroupId } = get()

        if (activeGroupId === ALL_GROUP_ID) {
          return stocks
        }

        const activeGroup = groups.find((g) => g.id === activeGroupId)
        return activeGroup ? activeGroup.stockCodes : stocks
      },
    }),
    {
      name: 'stock-tracker-watchlist',
      partialize: (state) => ({
        stocks: state.stocks,
        groups: state.groups,
        activeGroupId: state.activeGroupId,
      }),
    }
  )
)

export { ALL_GROUP_ID }