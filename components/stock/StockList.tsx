'use client'

import { useEffect, useState } from 'react'
import { StockCard } from './StockCard'
import { StockSearch } from './StockSearch'
import { useWatchlistStore } from '@/store/stockStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from 'lucide-react'
import type { StockSearchResult } from '@/types/stock'
import { cn } from '@/lib/utils'

export function StockList() {
  const { stocks, stockData, loading, addStock, removeStock, refreshData } = useWatchlistStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [refreshData])

  useEffect(() => {
    if (mounted && stocks.length > 0) {
      const interval = setInterval(refreshData, 5000)
      return () => clearInterval(interval)
    }
  }, [mounted, stocks.length, refreshData])

  const handleAddStock = (stock: StockSearchResult) => {
    addStock(stock.code)
    refreshData()
  }

  if (!mounted) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">我的自选股</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            刷新
          </Button>
          <StockSearch
            onSelect={handleAddStock}
            placeholder="添加自选股..."
          />
        </div>
      </CardHeader>
      <CardContent>
        {stocks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              暂无自选股，添加一只股票开始跟踪吧
            </div>
            <StockSearch
              onSelect={handleAddStock}
              placeholder="搜索股票..."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((fullCode) => {
              const stock = stockData[fullCode]
              // 从完整代码中提取显示用的代码（去掉市场前缀）
              const displayCode = fullCode.replace(/^(sh|sz)/, '')
              if (!stock) {
                return (
                  <Card key={fullCode} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-6 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-8 bg-muted rounded w-16 mt-3"></div>
                    </div>
                  </Card>
                )
              }
              return (
                <StockCard
                  key={fullCode}
                  stock={{ ...stock, code: displayCode }}
                  fullCode={fullCode}
                  onRemove={removeStock}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}