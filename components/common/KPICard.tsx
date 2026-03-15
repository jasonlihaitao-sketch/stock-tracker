'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
  variant?: 'default' | 'gradient'
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
  valueClassName,
  variant = 'default',
}: KPICardProps) {
  const isUp = change !== undefined && change > 0
  const isDown = change !== undefined && change < 0
  const isFlat = change !== undefined && change === 0

  return (
    <div
      className={cn(
        'kpi-card group',
        variant === 'gradient' && 'bg-gradient-to-br from-card to-muted/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="kpi-label truncate">{label}</p>
          <p className={cn('kpi-value mt-1.5', valueClassName)}>{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {isUp && (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-up" />
                  <span className="kpi-change text-up">+{change.toFixed(2)}%</span>
                </>
              )}
              {isDown && (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-down" />
                  <span className="kpi-change text-down">{change.toFixed(2)}%</span>
                </>
              )}
              {isFlat && (
                <>
                  <Minus className="text-flat h-3.5 w-3.5" />
                  <span className="kpi-change text-flat">0.00%</span>
                </>
              )}
              {changeLabel && (
                <span className="ml-0.5 text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-muted/50 p-2.5 transition-colors group-hover:bg-muted/80">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface KPICardCompactProps {
  label: string
  value: string | number
  change?: number
  className?: string
}

export function KPICardCompact({ label, value, change, className }: KPICardCompactProps) {
  const isUp = change !== undefined && change > 0
  const isDown = change !== undefined && change < 0

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-3.5 transition-all duration-200 hover:shadow-sm',
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            'mt-1.5 text-xs font-semibold tabular-nums',
            isUp && 'text-up',
            isDown && 'text-down',
            !isUp && !isDown && 'text-flat'
          )}
        >
          {isUp ? '+' : ''}
          {change.toFixed(2)}%
        </p>
      )}
    </div>
  )
}
