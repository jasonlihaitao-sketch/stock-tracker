'use client'

import useSWR from 'swr'
import { SectorCard } from '@/components/sector/SectorCard'
import { useWatchlistStore } from '@/store/stockStore'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SectorPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/sector', fetcher, {
    refreshInterval: 300000, // 5分钟刷新
  })

  const { addStock } = useWatchlistStore()

  const handleAddStocks = (codes: string[]) => {
    codes.forEach(addStock)
  }

  const sectors = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">板块雷达</h1>
          <p className="page-description">发现热门板块和龙头股</p>
        </div>

        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">加载中...</div>
      ) : error ? (
        <div className="py-8 text-center text-destructive">加载失败，请重试</div>
      ) : sectors.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">暂无板块数据</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sectors.map((sector: any) => (
            <SectorCard key={sector.code} sector={sector} onAddStocks={handleAddStocks} />
          ))}
        </div>
      )}
    </div>
  )
}
