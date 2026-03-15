// components/market/MarketStats.tsx

'use client'

import { TrendingUp, TrendingDown, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketStats, MarketStrength } from '@/types/market'

interface MarketStatsProps {
  stats: MarketStats
}

/**
 * 计算市场强弱
 */
function getMarketStrength(stats: MarketStats): MarketStrength {
  const total = stats.upCount + stats.downCount
  if (total === 0) return 'neutral'

  const upRatio = stats.upCount / total
  if (upRatio > 0.6) return 'strong'
  if (upRatio < 0.4) return 'weak'
  return 'neutral'
}

/**
 * 获取资金流向标签
 */
function getFlowLabel(netInflow: number): { label: string; isPositive: boolean } {
  if (Math.abs(netInflow) < 50) {
    return { label: '平衡', isPositive: true }
  }
  return {
    label: netInflow > 0 ? '流入' : '流出',
    isPositive: netInflow > 0,
  }
}

export function MarketStatsCard({ stats }: MarketStatsProps) {
  const strength = getMarketStrength(stats)
  const flow = getFlowLabel(stats.netInflow)

  const strengthConfig = {
    strong: { label: '强', color: 'text-up', bg: 'bg-up/10' },
    neutral: { label: '中', color: 'text-muted-foreground', bg: 'bg-muted' },
    weak: { label: '弱', color: 'text-down', bg: 'bg-down/10' },
  }

  return (
    <div className="flex items-center gap-6 px-5 py-3">
      {/* 涨跌比 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-up" />
          <span className="text-sm font-medium tabular-nums text-up">{stats.upCount}</span>
        </div>
        <span className="text-muted-foreground">:</span>
        <div className="flex items-center gap-1">
          <TrendingDown className="h-4 w-4 text-down" />
          <span className="text-sm font-medium tabular-nums text-down">{stats.downCount}</span>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-xs font-medium',
            strengthConfig[strength].bg,
            strengthConfig[strength].color
          )}
        >
          {strengthConfig[strength].label}
        </span>
      </div>

      {/* 资金流向 */}
      <div className="flex items-center gap-2">
        <Coins className={cn('h-4 w-4', flow.isPositive ? 'text-up' : 'text-down')} />
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            flow.isPositive ? 'text-up' : 'text-down'
          )}
        >
          {stats.netInflow > 0 ? '+' : ''}
          {stats.netInflow.toFixed(0)}亿
        </span>
        <span className="text-xs text-muted-foreground">{flow.label}</span>
      </div>
    </div>
  )
}
