'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Filter, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { ScreenerFilters } from '@/components/screener/ScreenerFilters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { defaultConditions } from '@/lib/screener/conditions'
import type { ScreenerConditions, ScreenerResultItem } from '@/lib/screener/conditions'
import type { ScanScope } from '@/types/scan'
import { useWatchlistStore } from '@/store/stockStore'

interface ScreenerResponse {
  success: boolean
  data?: {
    results: ScreenerResultItem[]
    total: number
    scanned: number
    scope: ScanScope
  }
  error?: {
    message: string
  }
}

export default function ScreenerPage() {
  const [conditions, setConditions] = useState<ScreenerConditions>(defaultConditions)
  const [scope, setScope] = useState<ScanScope>('watchlist')
  const [results, setResults] = useState<ScreenerResultItem[]>([])
  const [scanned, setScanned] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { stocks, addStock } = useWatchlistStore()

  const resultSummary = useMemo(() => {
    const rising = results.filter((item) => item.changePercent >= 0).length
    const falling = results.length - rising
    return { rising, falling }
  }, [results])

  const handleRunScreener = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditions,
          scope,
          watchlist: stocks,
        }),
      })

      const result: ScreenerResponse = await response.json()

      if (!response.ok || !result.success || !result.data) {
        setError(result.error?.message || '筛选失败，请稍后重试')
        setResults([])
        setScanned(0)
        return
      }

      setResults(result.data.results)
      setScanned(result.data.scanned)
    } catch (fetchError) {
      setError('网络异常，暂时无法完成筛选')
      setResults([])
      setScanned(0)
    } finally {
      setIsLoading(false)
    }
  }

  const scopeDescription = {
    watchlist: '优先筛选已关注标的，速度快，也更贴近你的观察池。',
    hs300: '在沪深 300 中找相对更稳健的候选股票。',
    all: '扫描更大范围市场，耗时更长，但覆盖最全。',
  } satisfies Record<ScanScope, string>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">股票筛选</h1>
          <p className="page-description">
            按价格、涨跌幅、市值、成交量和技术条件快速筛出候选股票。
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <div className="text-sm font-medium">筛选范围</div>
          <Select value={scope} onValueChange={(value) => setScope(value as ScanScope)}>
            <SelectTrigger>
              <SelectValue placeholder="选择筛选范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="watchlist">自选股</SelectItem>
              <SelectItem value="hs300">沪深300</SelectItem>
              <SelectItem value="all">全市场</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{scopeDescription[scope]}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ScreenerFilters
          conditions={conditions}
          onConditionsChange={setConditions}
          onRunScreener={handleRunScreener}
          isLoading={isLoading}
        />

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">命中结果</div>
                <div className="mt-1 text-2xl font-bold">{results.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">已扫描股票</div>
                <div className="mt-1 text-2xl font-bold">{scanned}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">上涨 / 下跌</div>
                <div className="mt-1 text-2xl font-bold">
                  {resultSummary.rising} / {resultSummary.falling}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="h-4 w-4" />
                筛选结果
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {scope === 'watchlist' && `当前自选股 ${stocks.length} 只`}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!error && results.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center text-muted-foreground">
                  <Search className="mb-4 h-10 w-10 opacity-40" />
                  <p className="text-lg font-medium">暂无筛选结果</p>
                  <p className="mt-2 max-w-md text-sm">
                    设置条件后点击“开始筛选”。如果当前范围是“自选股”，请先在首页添加自选股。
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="px-3 py-3 font-medium">股票</th>
                        <th className="px-3 py-3 text-right font-medium">现价</th>
                        <th className="px-3 py-3 text-right font-medium">涨跌幅</th>
                        <th className="px-3 py-3 text-right font-medium">市值(亿)</th>
                        <th className="px-3 py-3 text-right font-medium">PE</th>
                        <th className="px-3 py-3 font-medium">命中条件</th>
                        <th className="px-3 py-3 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item) => {
                        const fullCode =
                          item.code.startsWith('sh') || item.code.startsWith('sz')
                            ? item.code
                            : item.code.startsWith('6')
                              ? `sh${item.code}`
                              : `sz${item.code}`
                        const inWatchlist = stocks.includes(fullCode)

                        return (
                          <tr key={item.code} className="border-b last:border-b-0">
                            <td className="px-3 py-4">
                              <Link
                                href={`/stock/${fullCode}`}
                                className="inline-flex items-center gap-1 hover:underline"
                              >
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-xs text-muted-foreground">{item.code}</div>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </Link>
                            </td>
                            <td className="px-3 py-4 text-right font-mono">
                              {item.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-4 text-right">
                              <span
                                className={cn(
                                  'font-medium tabular-nums',
                                  item.changePercent >= 0 ? 'text-up' : 'text-down'
                                )}
                              >
                                {item.changePercent >= 0 ? '+' : ''}
                                {item.changePercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-3 py-4 text-right">
                              {item.marketCap ? item.marketCap.toFixed(0) : '--'}
                            </td>
                            <td className="px-3 py-4 text-right">
                              {item.pe ? item.pe.toFixed(1) : '--'}
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {item.matchedConditions.map((condition) => (
                                  <Badge key={condition} variant="secondary">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <Button
                                size="sm"
                                variant={inWatchlist ? 'secondary' : 'outline'}
                                disabled={inWatchlist}
                                onClick={() => addStock(fullCode)}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                {inWatchlist ? '已在自选' : '加入自选'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4 animate-pulse" />
                  正在执行筛选，请稍候...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
