'use client'

import type { Sector } from '@/types/sector'
import { formatChangePercent, formatAmount } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SectorCardProps {
  sector: Sector
  onAddStocks?: (codes: string[]) => void
}

export function SectorCard({ sector, onAddStocks }: SectorCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{sector.name}</h3>
          <p className="text-sm text-muted-foreground">{sector.code}</p>
        </div>
        <div className="text-right">
          <div className={cn('font-bold', sector.changePercent >= 0 ? 'text-up' : 'text-down')}>
            {formatChangePercent(sector.changePercent)}
          </div>
          <div className="text-sm text-muted-foreground">
            资金流入: {formatAmount(sector.capitalFlow * 100000000)}
          </div>
        </div>
      </div>

      {sector.leadingStocks.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 text-sm text-muted-foreground">龙头股</div>
          <div className="flex flex-wrap gap-2">
            {sector.leadingStocks.map((stock) => (
              <span
                key={stock.code}
                className="inline-flex items-center gap-1 rounded bg-muted px-2.5 py-1 text-sm"
              >
                {stock.name}
                <span className={cn(stock.changePercent >= 0 ? 'text-up' : 'text-down')}>
                  {formatChangePercent(stock.changePercent)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {onAddStocks && sector.leadingStocks.length > 0 && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddStocks(sector.leadingStocks.map((s) => s.code))}
          >
            添加龙头到自选
          </Button>
        </div>
      )}
    </div>
  )
}
