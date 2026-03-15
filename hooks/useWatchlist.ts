// hooks/useWatchlist.ts
import { useCallback } from 'react'
import { useWatchlistStore, ALL_GROUP_ID } from '@/store/stockStore'
import type { WatchlistGroup } from '@/types/watchlistGroup'

export interface UseWatchlistReturn {
  // 状态
  stocks: string[]
  groups: WatchlistGroup[]
  activeGroupId: string

  // 操作
  addStock: (code: string) => void
  removeStock: (code: string) => void
  createGroup: (name: string) => void
  updateGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  setActiveGroup: (id: string) => void
  moveStockToGroup: (stockCode: string, groupId: string | null) => void

  // 查询
  getStocksInActiveGroup: () => string[]
  isAllGroup: boolean
}

export function useWatchlist(): UseWatchlistReturn {
  const {
    stocks,
    groups,
    activeGroupId,
    addStock,
    removeStock,
    createGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    moveStockToGroup,
    getStocksInActiveGroup,
  } = useWatchlistStore()

  const isAllGroup = activeGroupId === ALL_GROUP_ID

  return {
    stocks,
    groups,
    activeGroupId,
    addStock,
    removeStock,
    createGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    moveStockToGroup,
    getStocksInActiveGroup,
    isAllGroup,
  }
}