'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  value: number
  previousValue?: number
  className?: string
  showSign?: boolean
}

export function PriceDisplay({
  value,
  previousValue,
  className,
  showSign = false,
}: PriceDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setDirection(value > previousValue ? 'up' : 'down')
      setIsAnimating(true)

      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [value, previousValue])

  const formatPrice = (p: number): string => {
    return showSign && p > 0 ? `+${p.toFixed(2)}` : p.toFixed(2)
  }

  return (
    <span
      className={cn(
        'transition-colors duration-300',
        isAnimating && direction === 'up' && 'text-up',
        isAnimating && direction === 'down' && 'text-down',
        !isAnimating && direction === 'up' && 'text-up',
        !isAnimating && direction === 'down' && 'text-down',
        className
      )}
    >
      {formatPrice(value)}
    </span>
  )
}
