'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { WatchlistTable } from '@/components/stock/WatchlistTable'
import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { MarketStatus } from '@/components/common/MarketStatus'
import { formatAmount } from '@/lib/utils/format'
import { StockSearch, WatchlistGroupManager } from '@/components/stock'
import { MarketSentiment } from '@/components/market'
import { KPICard } from '@/components/common/KPICard'
import { Wallet, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { stocks, refreshData, addStock } = useWatchlistStore()
  const { getSummary } = usePositionStore()

  // 定时刷新数据
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 3000)
    return () => clearInterval(interval)
  }, [refreshData])

  const summary = getSummary()

  const handleAddStock = (stock: { code: string }) => {
    // 添加股票代码到自选股（使用纯代码格式）
    const pureCode = stock.code.replace(/^(sh|sz)/i, '')
    const market = stock.code.toLowerCase().startsWith('sh') ? 'sh' : 'sz'
    addStock(`${market}${pureCode}`)
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* 市场情绪看板 */}
      <MarketSentiment />

      {/* 标题区 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">我的自选股</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <MarketStatus />
            <span className="text-sm text-muted-foreground">共 {stocks.length} 只股票</span>
          </div>
        </div>

        <StockSearch
          placeholder="添加自选股..."
          buttonVariant="default"
          className="gap-1"
          onSelect={handleAddStock}
        >
          <Plus className="h-4 w-4" />
          添加股票
        </StockSearch>
      </div>

      {/* 自选股列表 */}
      <div className="space-y-4">
        <WatchlistGroupManager />
        <WatchlistTable />
      </div>

      {/* 底部统计 - 使用新的 KPI 卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPICard
          label="持仓市值"
          value={formatAmount(summary.totalValue)}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        />
        <KPICard
          label="今日盈亏"
          value={formatAmount(Math.abs(summary.todayProfit))}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          valueClassName={cn(summary.todayProfit >= 0 ? 'text-up' : 'text-down')}
        />
      </div>
    </div>
  )
}
