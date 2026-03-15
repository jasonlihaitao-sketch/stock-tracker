'use client'

import { useEffect, useState } from 'react'
import { isMarketOpen, getMarketStatusText } from '@/lib/utils/market'
import { cn } from '@/lib/utils'

export function MarketStatus() {
  const [status, setStatus] = useState(getMarketStatusText())
  const [isOpen, setIsOpen] = useState(isMarketOpen())

  useEffect(() => {
    // 每分钟更新一次状态
    const interval = setInterval(() => {
      setStatus(getMarketStatusText())
      setIsOpen(isMarketOpen())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isOpen ? 'text-up' : 'text-muted-foreground'
      )}
    >
      <span
        className={cn('h-2 w-2 rounded-full', isOpen ? 'animate-pulse bg-up' : 'bg-gray-400')}
      />
      {status}
    </span>
  )
}
