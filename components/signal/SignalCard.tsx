'use client'

import { SignalBadge } from './SignalBadge'
import type { Signal } from '@/types/signal'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SignalCardProps {
  signal: Signal
  onAddToPlan?: (signal: Signal) => void
  onPrimaryAction?: (signal: Signal) => void
  primaryActionLabel?: string
}

export function SignalCard({
  signal,
  onAddToPlan,
  onPrimaryAction,
  primaryActionLabel,
}: SignalCardProps) {
  const isBuy = signal.type === 'buy'
  const actionHandler = onPrimaryAction || (isBuy ? onAddToPlan : undefined)
  const actionLabel = primaryActionLabel || (isBuy ? '加入计划' : '加入卖出计划')

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/stock/${signal.stockCode}`} className="hover:underline">
            <h3 className="font-medium">{signal.stockName}</h3>
            <p className="text-sm text-muted-foreground">{signal.stockCode}</p>
          </Link>
        </div>
        <SignalBadge type={signal.type} strength={signal.strength} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">触发原因:</span>
          <span>{signal.triggerReason}</span>
        </div>

        {isBuy && signal.suggestPrice && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">建议价格:</span>
            <span className="font-mono">{formatPrice(signal.suggestPrice)}</span>
          </div>
        )}

        {!isBuy && signal.stopLoss && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">止损价:</span>
            <span className="font-mono text-down">{formatPrice(signal.stopLoss)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">生成时间:</span>
          <span>{formatTime(signal.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {actionHandler && (
          <Button
            size="sm"
            variant={isBuy ? 'default' : 'destructive'}
            onClick={() => actionHandler(signal)}
          >
            {actionLabel}
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/stock/${signal.stockCode}`}>查看详情</Link>
        </Button>
      </div>
    </div>
  )
}
