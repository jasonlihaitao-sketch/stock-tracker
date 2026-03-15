'use client'

import { useEffect } from 'react'
import { AlertMonitor } from '@/hooks/useAlertMonitor'
import { useThemeStore } from '@/store/themeStore'
import { usePositionStore } from '@/store/positionStore'
import { getStockRealtime } from '@/lib/api/stock'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ToastContainer } from '@/components/ui/toast'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useThemeStore.persist.rehydrate()
  }, [])

  return <>{children}</>
}

function PositionPriceSync() {
  const positions = usePositionStore((state) => state.positions)
  const updatePrice = usePositionStore((state) => state.updatePrice)

  useEffect(() => {
    if (positions.length === 0) {
      return
    }

    let cancelled = false

    const syncPrices = async () => {
      const stocks = await getStockRealtime(positions.map((position) => position.stockCode))
      if (cancelled) {
        return
      }

      stocks.forEach((stock) => {
        updatePrice(stock.code, stock.price)
      })
    }

    syncPrices()
    const interval = setInterval(syncPrices, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [positions, updatePrice])

  return null
}

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AlertMonitor />
        <PositionPriceSync />
        <ToastContainer />
        {children}
      </ThemeProvider>
    </ErrorBoundary>
  )
}
