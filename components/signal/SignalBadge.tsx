'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SignalType, SignalStrength } from '@/types/signal'

interface SignalBadgeProps {
  type: SignalType
  strength: SignalStrength
  className?: string
}

export function SignalBadge({ type, strength, className }: SignalBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium',
        type === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down',
        className
      )}
    >
      <span>{type === 'buy' ? '买' : '卖'}</span>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i <= strength ? 'fill-current text-yellow-500' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </span>
    </span>
  )
}
