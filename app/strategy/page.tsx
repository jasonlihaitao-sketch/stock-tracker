'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { SignalCard } from '@/components/signal/SignalCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useSignalStore } from '@/store/signalStore'
import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { useOperationPlanStore } from '@/store/operationPlanStore'
import { getStockRealtime, getKLineData } from '@/lib/api/stock'
import { calculateTechnicalFromKline } from '@/lib/api/technical'
import { detectBuySignals } from '@/lib/strategy/buy-signals'
import { detectSellSignals } from '@/lib/strategy/sell-signals'
import type { StockWithTechnical } from '@/types/technical'
import type { Signal } from '@/types/signal'

export default function StrategyPage() {
  const { buySignals, sellSignals, setBuySignals, setSellSignals } = useSignalStore()
  const watchlistCodes = useWatchlistStore((state) => state.stocks)
  const positions = usePositionStore((state) => state.positions)
  const { addPlan, plans } = useOperationPlanStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const trackedCodes = useMemo(() => {
    const codes = new Set(watchlistCodes)
    positions.forEach((position) => codes.add(position.stockCode))
    return Array.from(codes)
  }, [positions, watchlistCodes])

  const refreshSignals = useCallback(async () => {
    if (trackedCodes.length === 0) {
      setBuySignals([])
      setSellSignals([])
      return
    }

    setIsRefreshing(true)
    setRefreshError(null)

    try {
      const stocks = await getStockRealtime(trackedCodes)
      const technicalStocks = (
        await Promise.all(
          stocks.map(async (stock) => {
            const klines = await getKLineData(stock.code, 'daily')
            if (klines.length < 20) {
              return null
            }

            const technical = calculateTechnicalFromKline(stock.code, klines)
            return { ...stock, ...technical } satisfies StockWithTechnical
          })
        )
      ).filter((item): item is StockWithTechnical => item !== null)

      const nextBuySignals = technicalStocks.flatMap((stock) => detectBuySignals(stock))
      const nextSellSignals = positions.flatMap((position) => {
        const stock = technicalStocks.find((item) => item.code === position.stockCode)
        return stock ? detectSellSignals(position, stock) : []
      })

      setBuySignals(nextBuySignals)
      setSellSignals(nextSellSignals)
    } catch (error) {
      setRefreshError('刷新策略信号失败，请稍后重试')
    } finally {
      setIsRefreshing(false)
    }
  }, [positions, setBuySignals, setSellSignals, trackedCodes])

  useEffect(() => {
    refreshSignals()
    const interval = setInterval(refreshSignals, 60000)
    return () => clearInterval(interval)
  }, [refreshSignals])

  const createPlanFromSignal = useCallback(
    (signal: Signal) => {
      const duplicated = plans.some(
        (plan) =>
          plan.status === 'pending' &&
          plan.stockCode === signal.stockCode &&
          plan.type === signal.type
      )

      if (duplicated) {
        setActionMessage(`${signal.stockName} 已存在待执行计划`)
        return
      }

      addPlan({
        stockCode: signal.stockCode,
        stockName: signal.stockName,
        type: signal.type,
        signalId: signal.id,
        targetPrice: signal.suggestPrice,
        stopLoss:
          signal.stopLoss ??
          (signal.suggestPrice ? Number((signal.suggestPrice * 0.92).toFixed(2)) : undefined),
        takeProfit: signal.takeProfit,
        positionRatio: signal.type === 'buy' ? 20 : undefined,
        note: signal.triggerReason,
      })

      setActionMessage(`${signal.stockName} 已加入${signal.type === 'buy' ? '买入' : '卖出'}计划`)
    },
    [addPlan, plans]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">策略雷达</h1>
          <p className="page-description">基于自选股和持仓实时检测买入、卖出信号</p>
        </div>

        <Button
          variant="outline"
          onClick={refreshSignals}
          disabled={isRefreshing || trackedCodes.length === 0}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? '刷新中...' : '刷新信号'}
        </Button>
      </div>

      {refreshError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {refreshError}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          {actionMessage}
        </div>
      )}

      {trackedCodes.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          请先添加自选股或录入持仓，策略雷达才能生成信号。
        </div>
      )}

      <Tabs defaultValue="buy">
        <TabsList>
          <TabsTrigger value="buy">买入信号 ({buySignals.length})</TabsTrigger>
          <TabsTrigger value="sell">卖出信号 ({sellSignals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-4">
          {buySignals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无买入信号</div>
          ) : (
            <div className="grid gap-4">
              {buySignals.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onPrimaryAction={createPlanFromSignal}
                  primaryActionLabel="加入买入计划"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="mt-4">
          {sellSignals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无卖出信号</div>
          ) : (
            <div className="grid gap-4">
              {sellSignals.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onPrimaryAction={createPlanFromSignal}
                  primaryActionLabel="加入卖出计划"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
