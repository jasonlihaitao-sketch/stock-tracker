'use client'

import { usePositionStore } from '@/store/positionStore'
import { PositionCard } from '@/components/position/PositionCard'
import { formatAmount } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { KPICard } from '@/components/common/KPICard'
import { Wallet, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'

export default function PositionPage() {
  const { positions, getSummary } = usePositionStore()
  const summary = getSummary()

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h1 className="page-title">持仓监控</h1>
        <p className="page-description">实时监控持仓盈亏和止损状态</p>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KPICard
          label="总市值"
          value={formatAmount(summary.totalValue)}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        />
        <KPICard
          label="总成本"
          value={formatAmount(summary.totalCost)}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <KPICard
          label="总盈亏"
          value={formatAmount(Math.abs(summary.totalProfit))}
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
          valueClassName={cn(summary.totalProfit >= 0 ? 'text-up' : 'text-down')}
        />
        <KPICard
          label="今日盈亏"
          value={formatAmount(Math.abs(summary.todayProfit))}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          valueClassName={cn(summary.todayProfit >= 0 ? 'text-up' : 'text-down')}
        />
      </div>

      {/* 持仓列表 */}
      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-muted-foreground">
          <p className="text-lg font-medium">暂无持仓</p>
          <p className="mt-1 text-sm">添加持仓后开始监控盈亏</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}
    </div>
  )
}
