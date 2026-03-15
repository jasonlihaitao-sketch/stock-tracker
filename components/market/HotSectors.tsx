// components/market/HotSectors.tsx

'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HotSector } from '@/types/market'

interface HotSectorsProps {
  sectors: HotSector[]
}

export function HotSectors({ sectors }: HotSectorsProps) {
  if (sectors.length === 0) return null

  return (
    <div className="flex items-center gap-3 border-t bg-muted/30 px-5 py-3">
      <Flame className="h-4 w-4 flex-shrink-0 text-orange-500" />
      <div className="flex items-center gap-4 overflow-x-auto text-sm">
        {sectors.map((sector, index) => (
          <span key={sector.code} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-medium">{sector.name}</span>
            <span
              className={cn(
                'font-medium tabular-nums',
                sector.changePercent >= 0 ? 'text-up' : 'text-down'
              )}
            >
              {sector.changePercent >= 0 ? '+' : ''}
              {sector.changePercent.toFixed(2)}%
            </span>
            {index < sectors.length - 1 && <span className="text-muted-foreground/50">|</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
