// components/market/IndexCard.tsx

'use client'

import { cn } from '@/lib/utils'

interface IndexCardProps {
  name: string
  price: number
  change: number
  changePercent: number
}

export function IndexCard({ name, price, change, changePercent }: IndexCardProps) {
  const isUp = changePercent >= 0

  return (
    <div className="flex min-w-[100px] flex-col items-center px-5 py-3 transition-colors hover:bg-muted/30">
      <span className="text-xs font-medium text-muted-foreground">{name}</span>
      <span
        className={cn(
          'mt-1 text-base font-bold tabular-nums transition-colors',
          isUp ? 'text-up' : 'text-down'
        )}
      >
        {price.toFixed(2)}
      </span>
      <span className={cn('text-xs font-semibold tabular-nums', isUp ? 'text-up' : 'text-down')}>
        {isUp ? '+' : ''}
        {changePercent.toFixed(2)}%
      </span>
    </div>
  )
}
