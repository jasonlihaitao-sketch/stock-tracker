// components/market/MarketSentiment.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { IndexCard } from './IndexCard'
import { MarketStatsCard } from './MarketStats'
import { HotSectors } from './HotSectors'
import { getMarketIndexes, getMarketStats, getHotSectors } from '@/lib/api/market'
import type { IndexData, MarketStats as MarketStatsType, HotSector } from '@/types/market'

export function MarketSentiment() {
  const [indexes, setIndexes] = useState<IndexData[]>([])
  const [stats, setStats] = useState<MarketStatsType>({
    upCount: 0,
    downCount: 0,
    limitUp: 0,
    limitDown: 0,
    netInflow: 0,
  })
  const [sectors, setSectors] = useState<HotSector[]>([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const [indexData, statsData, sectorData] = await Promise.all([
        getMarketIndexes(),
        getMarketStats(),
        getHotSectors(3),
      ])
      setIndexes(indexData)
      setStats(statsData)
      setSectors(sectorData)
    } catch (error) {
      console.error('Error loading market data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // 指数 3 秒刷新
    const indexInterval = setInterval(() => {
      getMarketIndexes().then(setIndexes)
    }, 3000)

    // 统计数据 30 秒刷新
    const statsInterval = setInterval(() => {
      getMarketStats().then(setStats)
    }, 30000)

    // 板块 5 分钟刷新
    const sectorInterval = setInterval(() => {
      getHotSectors(3).then(setSectors)
    }, 300000)

    return () => {
      clearInterval(indexInterval)
      clearInterval(statsInterval)
      clearInterval(sectorInterval)
    }
  }, [loadData])

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border bg-card p-4">
        <div className="h-16 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* 第一行：指数 + 市场统计 */}
      <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
        {/* 指数卡片 */}
        <div className="flex flex-1 items-center divide-x overflow-x-auto">
          {indexes.map((index) => (
            <IndexCard
              key={index.code}
              name={index.name}
              price={index.price}
              change={index.change}
              changePercent={index.changePercent}
            />
          ))}
        </div>

        {/* 市场统计 */}
        <div className="flex-shrink-0 sm:w-auto">
          <MarketStatsCard stats={stats} />
        </div>
      </div>

      {/* 第二行：热门板块 */}
      <HotSectors sectors={sectors} />
    </div>
  )
}
