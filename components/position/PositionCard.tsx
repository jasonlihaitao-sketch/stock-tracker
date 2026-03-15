'use client'

import type { Position } from '@/types/position'
import { formatPrice, formatChangePercent, formatAmount } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PositionCardProps {
  position: Position
  onAdjust?: (position: Position) => void
  onSell?: (position: Position) => void
}

export function PositionCard({ position, onAdjust, onSell }: PositionCardProps) {
  const isProfit = position.profit >= 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/stock/${position.stockCode}`} className="hover:underline">
            <h3 className="font-medium">{position.stockName}</h3>
            <p className="text-sm text-muted-foreground">{position.stockCode}</p>
          </Link>
        </div>
        <div className="text-right">
          <div className={cn('font-bold', isProfit ? 'text-up' : 'text-down')}>
            {formatChangePercent(position.profitPercent)}
          </div>
          <div className={cn('text-sm', isProfit ? 'text-up' : 'text-down')}>
            {isProfit ? '+' : ''}
            {formatAmount(position.profit)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">成本: </span>
          <span className="font-mono">{formatPrice(position.buyPrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">现价: </span>
          <span className="font-mono">{formatPrice(position.currentPrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">数量: </span>
          <span className="font-mono">{position.quantity}</span>
        </div>
        <div>
          <span className="text-muted-foreground">市值: </span>
          <span className="font-mono">
            {formatAmount(position.currentPrice * position.quantity)}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">止损: </span>
            <span className="font-mono text-down">{formatPrice(position.currentStopLoss)}</span>
            <span className="ml-1 text-xs text-muted-foreground">
              (
              {(((position.currentStopLoss - position.buyPrice) / position.buyPrice) * 100).toFixed(
                1
              )}
              %)
            </span>
          </div>
          {position.takeProfit && (
            <div>
              <span className="text-muted-foreground">止盈: </span>
              <span className="font-mono text-up">{formatPrice(position.takeProfit)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onAdjust?.(position)}>
          调整
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onSell?.(position)}>
          卖出
        </Button>
      </div>
    </div>
  )
}
