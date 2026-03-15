'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-muted-foreground',
        className
      )}
    >
      {Icon && <Icon className="mb-3 h-12 w-12 opacity-30" />}
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}