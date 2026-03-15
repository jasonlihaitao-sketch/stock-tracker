// components/scan/ScanResults.tsx

'use client'

import { Plus, Star, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useWatchlistStore } from '@/store/stockStore'
import type { ScanResult, ScanSignal } from '@/types/scan'

interface ScanResultsProps {
  results: ScanResult[]
}

const categoryStyles: Record<string, string> = {
  technical: 'bg-[hsl(var(--category-technical)/0.1)] text-[hsl(var(--category-technical))]',
  fundamental: 'bg-[hsl(var(--category-fundamental)/0.1)] text-[hsl(var(--category-fundamental))]',
  growth: 'bg-[hsl(var(--category-growth)/0.1)] text-[hsl(var(--category-growth))]',
  quality: 'bg-[hsl(var(--category-quality)/0.1)] text-[hsl(var(--category-quality))]',
  reversal: 'bg-[hsl(var(--category-reversal)/0.1)] text-[hsl(var(--category-reversal))]',
  event: 'bg-[hsl(var(--category-event)/0.1)] text-[hsl(var(--category-event))]',
}

export function ScanResults({ results }: ScanResultsProps) {
  const { addStock, stocks } = useWatchlistStore()

  const handleAddToWatchlist = (code: string) => {
    if (!stocks.includes(code)) {
      addStock(code)
    }
  }

  const isInWatchlist = (code: string) => stocks.includes(code)

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Star className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">暂无扫描结果</p>
        <p className="mt-1 text-sm">点击「开始扫描」发现投资机会</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-5 py-3 text-left text-sm font-medium">股票</th>
              <th className="px-5 py-3 text-right text-sm font-medium">现价</th>
              <th className="px-5 py-3 text-right text-sm font-medium">涨跌幅</th>
              <th className="px-5 py-3 text-left text-sm font-medium">信号</th>
              <th className="px-5 py-3 text-center text-sm font-medium">强度</th>
              <th className="px-5 py-3 text-center text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const pureCode = result.code.replace(/^(sh|sz)/, '')
              const inWatchlist = isInWatchlist(result.code)

              return (
                <tr
                  key={result.code}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/stock/${result.code}`}
                      className="flex items-center gap-1 hover:underline"
                    >
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-muted-foreground">{pureCode}</div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{result.price.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn(result.changePercent >= 0 ? 'text-up' : 'text-down')}>
                      {result.changePercent >= 0 ? '+' : ''}
                      {result.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {result.signals.map((signal: ScanSignal) => (
                        <Badge
                          key={signal.strategyId}
                          variant="outline"
                          className={cn('text-xs', categoryStyles[signal.category] || '')}
                        >
                          {signal.strategyName}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i < result.strength ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Button
                      variant={inWatchlist ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleAddToWatchlist(result.code)}
                      disabled={inWatchlist}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      {inWatchlist ? '已添加' : '自选'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
