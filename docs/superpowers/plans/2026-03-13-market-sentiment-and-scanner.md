# 市场情绪看板与全市场扫描器实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为股票跟踪工具添加市场情绪看板和全市场扫描器，帮助用户主动发现投资机会。

**Architecture:** 市场情绪看板作为首页顶部组件，实时展示大盘指数、涨跌比、资金流向和热门板块。全市场扫描器作为独立页面，分批扫描全市场股票，检测买入信号，增量展示结果。

**Tech Stack:** Next.js 14, TypeScript, Zustand, TailwindCSS, shadcn/ui, ECharts

**Dependencies (复用现有):**
- `lib/api/stock.ts`: `getStockRealtime`, `getKLineData` - 获取实时行情和K线数据
- `lib/api/sector.ts`: `getSectors` - 获取板块数据
- `store/stockStore.ts`: `useWatchlistStore` - 自选股状态管理

---

## Chunk 1: 类型定义与 API 层

### Task 1: 创建市场数据类型定义

**Files:**
- Create: `types/market.ts`

- [ ] **Step 1: 创建市场数据类型文件**

```typescript
// types/market.ts

/**
 * 市场统计数据
 */
export interface MarketStats {
  upCount: number       // 上涨家数
  downCount: number     // 下跌家数
  limitUp: number       // 涨停数
  limitDown: number     // 跌停数
  netInflow: number     // 主力净流入（亿元）
}

/**
 * 市场强弱判断
 */
export type MarketStrength = 'strong' | 'neutral' | 'weak'

/**
 * 指数数据
 */
export interface IndexData {
  code: string          // 代码
  name: string          // 名称
  price: number         // 当前点位
  change: number        // 涨跌点数
  changePercent: number // 涨跌幅
}

/**
 * 热门板块
 */
export interface HotSector {
  code: string
  name: string
  changePercent: number
}
```

- [ ] **Step 2: 验证类型文件无语法错误**

Run: `npx tsc --noEmit types/market.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/market.ts
git commit -m "feat: add market data types"
```

---

### Task 2: 创建扫描器类型定义

**Files:**
- Create: `types/scan.ts`

- [ ] **Step 1: 创建扫描器类型文件**

```typescript
// types/scan.ts

/**
 * 扫描范围
 */
export type ScanScope = 'all' | 'watchlist' | 'hs300'

/**
 * 扫描状态
 */
export type ScanStatus = 'idle' | 'scanning' | 'completed'

/**
 * 信号类型标识
 */
export type SignalFlag = 'breakout' | 'volume' | 'sector'

/**
 * 扫描结果
 */
export interface ScanResult {
  code: string                    // 股票代码
  name: string                    // 股票名称
  price: number                   // 当前价格
  changePercent: number           // 涨跌幅
  signals: SignalFlag[]           // 触发的信号类型
  strength: number                // 信号强度 1-5
}

/**
 * 扫描进度
 */
export interface ScanProgress {
  current: number
  total: number
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  scope: ScanScope
  onProgress?: (progress: ScanProgress) => void
  onFound?: (result: ScanResult) => void
}
```

- [ ] **Step 2: 验证类型文件**

Run: `npx tsc --noEmit types/scan.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/scan.ts
git commit -m "feat: add scanner types"
```

---

### Task 3: 创建市场数据 API

**Files:**
- Create: `lib/api/market.ts`

- [ ] **Step 1: 创建市场数据 API 文件**

```typescript
// lib/api/market.ts

import type { MarketStats, IndexData, HotSector } from '@/types/market'

// 大盘指数代码
const INDEX_CODES = {
  SH: 'sh000001',    // 上证指数
  SZ: 'sz399001',    // 深证成指
  CY: 'sz399006',    // 创业板指
}

/**
 * 获取大盘指数数据（客户端调用）
 */
export async function getMarketIndexes(): Promise<IndexData[]> {
  const codes = Object.values(INDEX_CODES).join(',')
  try {
    const response = await fetch(`/api/stocks/realtime?codes=${codes}`)
    if (!response.ok) throw new Error('Failed to fetch index data')

    const result = await response.json()
    const data = result.data || []

    return data.map((item: { code: string; name: string; price: number; change: number; changePercent: number }) => ({
      code: item.code,
      name: getIndexName(item.code),
      price: item.price,
      change: item.change,
      changePercent: item.changePercent,
    }))
  } catch (error) {
    console.error('Error fetching market indexes:', error)
    return []
  }
}

/**
 * 获取市场统计数据（涨跌比、资金流向）
 */
export async function getMarketStats(): Promise<MarketStats> {
  try {
    const response = await fetch('/api/market/stats')
    if (!response.ok) throw new Error('Failed to fetch market stats')

    const result = await response.json()
    return result.data || {
      upCount: 0,
      downCount: 0,
      limitUp: 0,
      limitDown: 0,
      netInflow: 0,
    }
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return {
      upCount: 0,
      downCount: 0,
      limitUp: 0,
      limitDown: 0,
      netInflow: 0,
    }
  }
}

/**
 * 获取热门板块 TOP N
 */
export async function getHotSectors(limit: number = 3): Promise<HotSector[]> {
  try {
    const response = await fetch(`/api/sector?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch hot sectors')

    const result = await response.json()
    const sectors = result.data || []
    return sectors.slice(0, limit).map((item: { code: string; name: string; changePercent: number }) => ({
      code: item.code,
      name: item.name,
      changePercent: item.changePercent,
    }))
  } catch (error) {
    console.error('Error fetching hot sectors:', error)
    return []
  }
}

/**
 * 根据代码获取指数名称
 */
function getIndexName(code: string): string {
  const names: Record<string, string> = {
    [INDEX_CODES.SH]: '上证指数',
    [INDEX_CODES.SZ]: '深证成指',
    [INDEX_CODES.CY]: '创业板指',
  }
  return names[code] || code
}

// ============ 服务端函数 ============

const EASTMONEY_API = {
  MARKET_STATS: 'https://push2.eastmoney.com/api/qt/stock/get',
  CAPITAL_FLOW: 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get',
}

/**
 * 服务端：获取市场统计数据
 */
export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    // 获取涨跌统计数据
    const statsUrl = 'https://push2.eastmoney.com/api/qt/clist/get'
    const params = new URLSearchParams({
      pn: '1',
      pz: '5000',
      po: '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',  // A股
      fields: 'f3,f152,f153,f154',  // 涨跌幅、涨跌家数
    })

    const response = await fetch(`${statsUrl}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 30 }  // 30秒缓存
    })

    if (!response.ok) {
      return { upCount: 0, downCount: 0, limitUp: 0, limitDown: 0, netInflow: 0 }
    }

    const data = await response.json()
    const diff = data.data?.diff || []

    let upCount = 0
    let downCount = 0
    let limitUp = 0
    let limitDown = 0

    for (const item of diff) {
      const changePercent = Number(item.f3 || 0) / 100
      if (changePercent > 0) upCount++
      if (changePercent < 0) downCount++
      if (changePercent >= 9.9) limitUp++
      if (changePercent <= -9.9) limitDown++
    }

    // 获取主力资金净流入
    const netInflow = await fetchCapitalFlow()

    return { upCount, downCount, limitUp, limitDown, netInflow }
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return { upCount: 0, downCount: 0, limitUp: 0, limitDown: 0, netInflow: 0 }
  }
}

/**
 * 服务端：获取主力资金净流入
 */
async function fetchCapitalFlow(): Promise<number> {
  try {
    const url = 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get'
    const params = new URLSearchParams({
      lmt: '0',
      klt: '1',
      secid: '1.000001',  // 上证指数
      fields1: 'f1,f2,f3,f7',
      fields2: 'f62,f184,f66,f69,f72,f75,f78,f81,f84,f87',
    })

    const response = await fetch(`${url}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 30 }
    })

    if (!response.ok) return 0

    const data = await response.json()
    // f62: 主力净流入
    const netInflow = data.data?.klines?.[0]?.split(',')?.[0] || 0
    return Number(netInflow) / 100000000  // 转换为亿
  } catch (error) {
    console.error('Error fetching capital flow:', error)
    return 0
  }
}
```

- [ ] **Step 2: 验证 API 文件**

Run: `npx tsc --noEmit lib/api/market.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/api/market.ts
git commit -m "feat: add market data API"
```

---

### Task 4: 创建市场统计 API 路由

**Files:**
- Create: `app/api/market/stats/route.ts`

- [ ] **Step 1: 创建 API 路由文件**

```typescript
// app/api/market/stats/route.ts

import { NextResponse } from 'next/server'
import { fetchMarketStats } from '@/lib/api/market'

export async function GET() {
  try {
    const stats = await fetchMarketStats()
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Market stats API error:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取市场数据失败' },
    }, { status: 500 })
  }
}
```

- [ ] **Step 2: 验证 API 路由**

Run: `npx tsc --noEmit app/api/market/stats/route.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/market/stats/route.ts
git commit -m "feat: add market stats API route"
```

---

## Chunk 2: 扫描器引擎

### Task 5: 创建股票列表获取模块

**Files:**
- Create: `lib/scanner/stock-list.ts`

- [ ] **Step 1: 创建股票列表获取文件**

```typescript
// lib/scanner/stock-list.ts

/**
 * 获取可扫描的股票列表
 * 剔除 ST、停牌股票
 * 注：60天上市过滤需要额外API数据，当前版本暂不实现
 */
export async function fetchScanableStocks(): Promise<string[]> {
  try {
    const url = 'https://push2.eastmoney.com/api/qt/clist/get'
    const params = new URLSearchParams({
      pn: '1',
      pz: '6000',       // 获取足够多的股票
      po: '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',  // A股
      fields: 'f12,f14,f2,f3',  // 代码、名称、市场、涨跌幅
    })

    const response = await fetch(`${url}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 3600 }  // 1小时缓存
    })

    if (!response.ok) return []

    const data = await response.json()
    const diff = data.data?.diff || []

    const stocks: string[] = []

    for (const item of diff) {
      const code = String(item.f12 || '')
      const name = String(item.f14 || '')

      // 剔除 ST 股票
      if (name.includes('ST') || name.includes('*ST')) continue

      // 剔除停牌股票（涨跌幅为空）
      if (item.f3 === null || item.f3 === undefined) continue

      // 添加市场前缀
      const market = code.startsWith('6') ? 'sh' : 'sz'
      stocks.push(`${market}${code}`)
    }

    return stocks
  } catch (error) {
    console.error('Error fetching scanable stocks:', error)
    return []
  }
}

/**
 * 获取沪深300成分股列表
 */
export async function fetchHS300Stocks(): Promise<string[]> {
  try {
    const url = 'https://push3.eastmoney.com/api/qt/clist/get'
    const params = new URLSearchParams({
      fid: 'f3',
      po: '1',
      pz: '300',
      pn: '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fs: 'b:BK0500',  // 沪深300板块
      fields: 'f12',
    })

    const response = await fetch(`${url}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 3600 }
    })

    if (!response.ok) return []

    const data = await response.json()
    const diff = data.data?.diff || []

    return diff.map((item: { f12: string }) => {
      const code = String(item.f12 || '')
      const market = code.startsWith('6') ? 'sh' : 'sz'
      return `${market}${code}`
    })
  } catch (error) {
    console.error('Error fetching HS300 stocks:', error)
    return []
  }
}
```

- [ ] **Step 2: 验证文件**

Run: `npx tsc --noEmit lib/scanner/stock-list.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/scanner/stock-list.ts
git commit -m "feat: add stock list fetcher for scanner"
```

---

### Task 6: 创建信号检测模块

**Files:**
- Create: `lib/scanner/signal-detector.ts`

- [ ] **Step 1: 创建信号检测文件**

```typescript
// lib/scanner/signal-detector.ts

import type { Stock } from '@/types/stock'
import type { SignalFlag, ScanResult } from '@/types/scan'
import { getKLineData } from '@/lib/api/stock'
import { getSectors } from '@/lib/api/sector'

// 股票-板块映射缓存
let stockSectorMap: Record<string, string> = {}
let sectorData: { code: string; name: string; changePercent: number }[] = []

/**
 * 初始化股票-板块映射
 */
async function initStockSectorMap(): Promise<void> {
  if (Object.keys(stockSectorMap).length > 0) return

  try {
    const sectors = await getSectors()
    sectorData = sectors

    // 简化映射：这里使用行业板块作为主要归属
    // 实际项目中可能需要更精确的映射
    for (const sector of sectors) {
      // 这里可以扩展：获取每个板块的成分股并建立映射
    }
  } catch (error) {
    console.error('Error initializing stock-sector map:', error)
  }
}

/**
 * 检测单个股票的信号
 */
export async function detectSignals(stock: Stock): Promise<ScanResult | null> {
  const signals: SignalFlag[] = []
  const pureCode = stock.code.replace(/^(sh|sz)/, '')

  try {
    // 获取20日K线数据用于突破检测
    const klineData = await getKLineData(stock.code, 'daily')

    if (klineData.length < 20) return null

    // 计算技术指标
    const last20 = klineData.slice(-20)
    const high20d = Math.max(...last20.map(d => d.high))
    const volumes = last20.map(d => d.volume)
    const avgVolume5d = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5

    // 1. 突破信号：当前价 > 20日最高价
    if (stock.price >= high20d * 0.99) {  // 允许1%误差
      signals.push('breakout')
    }

    // 2. 量价配合：成交量 > 5日均量 × 2 且上涨
    if (stock.changePercent > 0 && stock.volume > avgVolume5d * 2) {
      signals.push('volume')
    }

    // 3. 板块共振：个股上涨 + 所属板块上涨 > 1%
    // 注意：当前简化处理，检查是否有热门板块上涨>1%，而非股票所属具体板块
    // 后续可扩展为精确的股票-板块映射
    await initStockSectorMap()
    const hotSectorUp = sectorData.some(s => s.changePercent > 1)
    if (stock.changePercent > 0 && hotSectorUp) {
      signals.push('sector')
    }

    // 如果没有信号，返回 null
    if (signals.length === 0) return null

    // 计算信号强度
    const strength = 2 + signals.length  // 3, 4, 或 5

    return {
      code: stock.code,
      name: stock.name,
      price: stock.price,
      changePercent: stock.changePercent,
      signals,
      strength,
    }
  } catch (error) {
    console.error(`Error detecting signals for ${stock.code}:`, error)
    return null
  }
}

/**
 * 批量检测股票信号
 */
export async function detectSignalsBatch(
  stocks: Stock[]
): Promise<ScanResult[]> {
  const results: ScanResult[] = []

  for (const stock of stocks) {
    const result = await detectSignals(stock)
    if (result) {
      results.push(result)
    }
  }

  return results
}
```

- [ ] **Step 2: 验证文件**

Run: `npx tsc --noEmit lib/scanner/signal-detector.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/scanner/signal-detector.ts
git commit -m "feat: add signal detector for scanner"
```

---

### Task 7: 创建扫描器主模块

**Files:**
- Create: `lib/scanner/index.ts`

- [ ] **Step 1: 创建扫描器入口文件**

```typescript
// lib/scanner/index.ts

import type { ScanOptions, ScanResult, ScanScope } from '@/types/scan'
import { getStockRealtime } from '@/lib/api/stock'
import { fetchScanableStocks, fetchHS300Stocks } from './stock-list'
import { detectSignals } from './signal-detector'

// 扫描状态
let isScanning = false
let shouldStop = false

/**
 * 开始扫描
 */
export async function startScan(options: ScanOptions): Promise<ScanResult[]> {
  if (isScanning) {
    console.warn('Scan already in progress')
    return []
  }

  isScanning = true
  shouldStop = false
  const results: ScanResult[] = []

  try {
    // 1. 获取股票列表
    const stocks = await getStockList(options.scope)
    const total = stocks.length

    options.onProgress?.({ current: 0, total })

    // 2. 分批扫描（每批50只）
    const batchSize = 50
    const batchDelay = 500  // 500ms 间隔

    for (let i = 0; i < stocks.length; i += batchSize) {
      if (shouldStop) break

      const batch = stocks.slice(i, i + batchSize)
      const current = Math.min(i + batchSize, total)

      // 获取实时行情
      const stockData = await getStockRealtime(batch)

      // 检测信号
      for (const stock of stockData) {
        if (shouldStop) break

        const result = await detectSignals(stock)
        if (result) {
          results.push(result)
          options.onFound?.(result)
        }
      }

      // 更新进度
      options.onProgress?.({ current, total })

      // 批次间延迟
      if (i + batchSize < stocks.length && !shouldStop) {
        await sleep(batchDelay)
      }
    }

    // 3. 按信号强度排序
    results.sort((a, b) => b.strength - a.strength)

    return results
  } catch (error) {
    console.error('Scan error:', error)
    return results
  } finally {
    isScanning = false
  }
}

/**
 * 停止扫描
 */
export function stopScan(): void {
  shouldStop = true
}

/**
 * 检查是否正在扫描
 */
export function isScanningInProgress(): boolean {
  return isScanning
}

/**
 * 获取股票列表
 */
async function getStockList(scope: ScanScope): Promise<string[]> {
  switch (scope) {
    case 'all':
      return fetchScanableStocks()
    case 'hs300':
      return fetchHS300Stocks()
    case 'watchlist':
      // 从 localStorage 获取自选股
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem('stock-tracker-watchlist')
      if (!stored) return []
      const data = JSON.parse(stored)
      // Zustand persist 存储结构: { state: { stocks: [...] }, version: ... }
      return data.state?.stocks || data.stocks || []
    default:
      return []
  }
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 导出类型
export type { ScanOptions, ScanResult, ScanScope }
```

- [ ] **Step 2: 验证文件**

Run: `npx tsc --noEmit lib/scanner/index.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/scanner/index.ts
git commit -m "feat: add scanner main module"
```

---

### Task 8: 创建扫描状态 Store

**Files:**
- Create: `store/scanStore.ts`

- [ ] **Step 1: 创建扫描状态管理文件**

```typescript
// store/scanStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanResult, ScanStatus, ScanScope, ScanProgress } from '@/types/scan'
import { startScan, stopScan as stopScanner } from '@/lib/scanner'

interface ScanState {
  status: ScanStatus
  progress: ScanProgress
  results: ScanResult[]
  scope: ScanScope

  // Actions
  startScan: (scope: ScanScope) => Promise<void>
  stopScan: () => void
  clearResults: () => void
  addResult: (result: ScanResult) => void
  setProgress: (progress: ScanProgress) => void
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      progress: { current: 0, total: 0 },
      results: [],
      scope: 'all',

      startScan: async (scope: ScanScope) => {
        set({ status: 'scanning', scope, results: [], progress: { current: 0, total: 0 } })

        try {
          const results = await startScan({
            scope,
            onProgress: (progress) => set({ progress }),
            onFound: (result) => {
              set((state) => ({
                results: [...state.results, result]
              }))
            }
          })

          set({ status: 'completed', results })
        } catch (error) {
          console.error('Scan failed:', error)
          set({ status: 'idle' })
        }
      },

      stopScan: () => {
        stopScanner()
        set((state) => ({
          status: state.progress.current > 0 ? 'completed' : 'idle'
        }))
      },

      clearResults: () => {
        set({ results: [], status: 'idle', progress: { current: 0, total: 0 } })
      },

      addResult: (result: ScanResult) => {
        set((state) => ({
          results: [...state.results, result]
        }))
      },

      setProgress: (progress: ScanProgress) => {
        set({ progress })
      }
    }),
    {
      name: 'stock-tracker-scan',
      partialize: (state) => ({
        results: state.results.slice(0, 100),  // 只缓存最近100条
        scope: state.scope
      })
    }
  )
)
```

- [ ] **Step 2: 验证文件**

Run: `npx tsc --noEmit store/scanStore.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add store/scanStore.ts
git commit -m "feat: add scan store for state management"
```

---

## Chunk 3: 市场情绪组件

### Task 9: 创建指数卡片组件

**Files:**
- Create: `components/market/IndexCard.tsx`

- [ ] **Step 1: 创建指数卡片组件**

```typescript
// components/market/IndexCard.tsx

'use client'

import { cn } from '@/lib/utils'

interface IndexCardProps {
  name: string
  price: number
  change: number
  changePercent: number
}

export function IndexCard({ name, price, change, changePercent }: IndexCardProps) {
  const isUp = changePercent >= 0

  return (
    <div className="flex flex-col items-center px-3 py-2">
      <span className="text-xs text-muted-foreground">{name}</span>
      <span className={cn(
        'text-sm font-bold tabular-nums',
        isUp ? 'text-red-600' : 'text-green-600'
      )}>
        {price.toFixed(2)}
      </span>
      <span className={cn(
        'text-xs tabular-nums',
        isUp ? 'text-red-600' : 'text-green-600'
      )}>
        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
      </span>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/market/IndexCard.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/market/IndexCard.tsx
git commit -m "feat: add IndexCard component"
```

---

### Task 10: 创建市场统计卡片组件

**Files:**
- Create: `components/market/MarketStats.tsx`

- [ ] **Step 1: 创建市场统计卡片组件**

```typescript
// components/market/MarketStats.tsx

'use client'

import { TrendingUp, TrendingDown, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketStats, MarketStrength } from '@/types/market'

interface MarketStatsProps {
  stats: MarketStats
}

/**
 * 计算市场强弱
 */
function getMarketStrength(stats: MarketStats): MarketStrength {
  const total = stats.upCount + stats.downCount
  if (total === 0) return 'neutral'

  const upRatio = stats.upCount / total
  if (upRatio > 0.6) return 'strong'
  if (upRatio < 0.4) return 'weak'
  return 'neutral'
}

/**
 * 获取资金流向标签
 */
function getFlowLabel(netInflow: number): { label: string; isPositive: boolean } {
  if (Math.abs(netInflow) < 50) {
    return { label: '平衡', isPositive: true }
  }
  return {
    label: netInflow > 0 ? '流入' : '流出',
    isPositive: netInflow > 0
  }
}

export function MarketStatsCard({ stats }: MarketStatsProps) {
  const strength = getMarketStrength(stats)
  const flow = getFlowLabel(stats.netInflow)
  const total = stats.upCount + stats.downCount

  const strengthConfig = {
    strong: { label: '强', color: 'text-red-600', bg: 'bg-red-50' },
    neutral: { label: '中', color: 'text-gray-600', bg: 'bg-gray-50' },
    weak: { label: '弱', color: 'text-green-600', bg: 'bg-green-50' },
  }

  return (
    <div className="flex items-center gap-4 px-3">
      {/* 涨跌比 */}
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
        <TrendingDown className="w-3.5 h-3.5 text-green-500" />
        <span className="text-sm tabular-nums">
          {stats.upCount}:{stats.downCount}
        </span>
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded',
          strengthConfig[strength].bg,
          strengthConfig[strength].color
        )}>
          {strengthConfig[strength].label}
        </span>
      </div>

      {/* 资金流向 */}
      <div className="flex items-center gap-1.5">
        <Coins className={cn(
          'w-3.5 h-3.5',
          flow.isPositive ? 'text-red-500' : 'text-green-500'
        )} />
        <span className={cn(
          'text-sm tabular-nums',
          flow.isPositive ? 'text-red-600' : 'text-green-600'
        )}>
          {stats.netInflow > 0 ? '+' : ''}{stats.netInflow.toFixed(0)}亿
        </span>
        <span className="text-xs text-muted-foreground">{flow.label}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/market/MarketStats.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/market/MarketStats.tsx
git commit -m "feat: add MarketStatsCard component"
```

---

### Task 11: 创建热门板块组件

**Files:**
- Create: `components/market/HotSectors.tsx`

- [ ] **Step 1: 创建热门板块组件**

```typescript
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
    <div className="flex items-center gap-2 px-3 py-2 border-t">
      <Flame className="w-4 h-4 text-orange-500" />
      <div className="flex items-center gap-3 text-sm">
        {sectors.map((sector, index) => (
          <span key={sector.code} className="flex items-center gap-1">
            <span className="font-medium">{sector.name}</span>
            <span className={cn(
              'tabular-nums',
              sector.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
            </span>
            {index < sectors.length - 1 && (
              <span className="text-muted-foreground">|</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/market/HotSectors.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/market/HotSectors.tsx
git commit -m "feat: add HotSectors component"
```

---

### Task 12: 创建市场情绪看板主组件

**Files:**
- Create: `components/market/MarketSentiment.tsx`

- [ ] **Step 1: 创建市场情绪看板主组件**

```typescript
// components/market/MarketSentiment.tsx

'use client'

import { useEffect, useState } from 'react'
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
  const loadData = async () => {
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
  }

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
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 animate-pulse">
        <div className="h-12 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* 第一行：指数 + 市场统计 */}
      <div className="flex items-center justify-between divide-x">
        {/* 指数卡片 */}
        <div className="flex items-center divide-x">
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
        <MarketStatsCard stats={stats} />
      </div>

      {/* 第二行：热门板块 */}
      <HotSectors sectors={sectors} />
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/market/MarketSentiment.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/market/MarketSentiment.tsx
git commit -m "feat: add MarketSentiment main component"
```

---

### Task 13: 导出市场组件

**Files:**
- Create: `components/market/index.ts`

- [ ] **Step 1: 创建导出文件**

```typescript
// components/market/index.ts

export { MarketSentiment } from './MarketSentiment'
export { IndexCard } from './IndexCard'
export { MarketStatsCard } from './MarketStats'
export { HotSectors } from './HotSectors'
```

- [ ] **Step 2: Commit**

```bash
git add components/market/index.ts
git commit -m "feat: add market components index"
```

---

## Chunk 4: 扫描器页面组件

### Task 14: 创建扫描控制栏组件

**Files:**
- Create: `components/scan/ScanControl.tsx`

- [ ] **Step 1: 创建扫描控制栏组件**

```typescript
// components/scan/ScanControl.tsx

'use client'

import { Play, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ScanScope, ScanStatus } from '@/types/scan'

interface ScanControlProps {
  status: ScanStatus
  scope: ScanScope
  onScopeChange: (scope: ScanScope) => void
  onStart: () => void
  onStop: () => void
}

const scopeOptions = [
  { value: 'all', label: '全市场', count: '~5000只' },
  { value: 'hs300', label: '沪深300', count: '300只' },
  { value: 'watchlist', label: '自选股', count: '自选' },
] as const

export function ScanControl({
  status,
  scope,
  onScopeChange,
  onStart,
  onStop,
}: ScanControlProps) {
  const isScanning = status === 'scanning'

  return (
    <div className="flex items-center gap-4">
      <Select
        value={scope}
        onValueChange={(value) => onScopeChange(value as ScanScope)}
        disabled={isScanning}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="选择范围" />
        </SelectTrigger>
        <SelectContent>
          {scopeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label} ({option.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isScanning ? (
        <Button variant="destructive" onClick={onStop}>
          <Square className="w-4 h-4 mr-2" />
          停止扫描
        </Button>
      ) : (
        <Button onClick={onStart}>
          <Play className="w-4 h-4 mr-2" />
          开始扫描
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/scan/ScanControl.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/scan/ScanControl.tsx
git commit -m "feat: add ScanControl component"
```

---

### Task 15: 创建扫描进度组件

**Files:**
- Create: `components/scan/ScanProgress.tsx`

- [ ] **Step 1: 创建扫描进度组件**

```typescript
// components/scan/ScanProgress.tsx

'use client'

import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { ScanProgress as ScanProgressType, ScanStatus } from '@/types/scan'

interface ScanProgressProps {
  progress: ScanProgressType
  status: ScanStatus
  foundCount: number
}

export function ScanProgress({ progress, status, foundCount }: ScanProgressProps) {
  if (status === 'idle') return null

  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'scanning' && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span>
            {status === 'scanning' ? '扫描中...' : '扫描完成'}
          </span>
        </div>
        <span className="text-muted-foreground">
          {progress.current} / {progress.total}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>发现 {foundCount} 只股票符合条件</span>
        <span>{percentage}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/scan/ScanProgress.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/scan/ScanProgress.tsx
git commit -m "feat: add ScanProgress component"
```

---

### Task 16: 创建扫描结果列表组件

**Files:**
- Create: `components/scan/ScanResults.tsx`

- [ ] **Step 1: 创建扫描结果列表组件**

```typescript
// components/scan/ScanResults.tsx

'use client'

import { Plus, Star, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWatchlistStore } from '@/store/stockStore'
import type { ScanResult } from '@/types/scan'

interface ScanResultsProps {
  results: ScanResult[]
}

const signalLabels: Record<string, string> = {
  breakout: '突破20日高',
  volume: '量价配合',
  sector: '板块共振',
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
        <Star className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">暂无扫描结果</p>
        <p className="text-sm mt-1">点击「开始扫描」发现投资机会</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">股票</th>
            <th className="px-4 py-3 text-right text-sm font-medium">现价</th>
            <th className="px-4 py-3 text-right text-sm font-medium">涨跌幅</th>
            <th className="px-4 py-3 text-left text-sm font-medium">信号</th>
            <th className="px-4 py-3 text-center text-sm font-medium">强度</th>
            <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const pureCode = result.code.replace(/^(sh|sz)/, '')
            const inWatchlist = isInWatchlist(result.code)

            return (
              <tr
                key={result.code}
                className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${result.code}`}
                    className="hover:underline flex items-center gap-1"
                  >
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-xs text-muted-foreground">{pureCode}</div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {result.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      result.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {result.changePercent >= 0 ? '+' : ''}
                    {result.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {result.signals.map((signal) => (
                      <span
                        key={signal}
                        className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary"
                      >
                        {signalLabels[signal]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < result.strength
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant={inWatchlist ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleAddToWatchlist(result.code)}
                    disabled={inWatchlist}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {inWatchlist ? '已添加' : '自选'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件**

Run: `npx tsc --noEmit components/scan/ScanResults.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/scan/ScanResults.tsx
git commit -m "feat: add ScanResults component"
```

---

### Task 17: 导出扫描组件

**Files:**
- Create: `components/scan/index.ts`

- [ ] **Step 1: 创建导出文件**

```typescript
// components/scan/index.ts

export { ScanControl } from './ScanControl'
export { ScanProgress } from './ScanProgress'
export { ScanResults } from './ScanResults'
```

- [ ] **Step 2: Commit**

```bash
git add components/scan/index.ts
git commit -m "feat: add scan components index"
```

---

## Chunk 5: 页面集成

### Task 18: 创建市场扫描页面

**Files:**
- Create: `app/scan/page.tsx`

- [ ] **Step 1: 创建市场扫描页面**

```typescript
// app/scan/page.tsx

'use client'

import { useEffect } from 'react'
import { ScanControl, ScanProgress, ScanResults } from '@/components/scan'
import { useScanStore } from '@/store/scanStore'
import type { ScanScope } from '@/types/scan'

export default function ScanPage() {
  const {
    status,
    progress,
    results,
    scope,
    startScan,
    stopScan,
    clearResults,
  } = useScanStore()

  // 页面卸载时清理
  useEffect(() => {
    return () => {
      if (status === 'scanning') {
        stopScan()
      }
    }
  }, [status, stopScan])

  const handleScopeChange = (newScope: ScanScope) => {
    useScanStore.setState({ scope: newScope })
  }

  const handleStart = () => {
    startScan(scope)
  }

  const handleStop = () => {
    stopScan()
  }

  const handleClear = () => {
    clearResults()
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">市场扫描</h1>
        <p className="text-muted-foreground mt-1">
          扫描全市场，发现符合策略的股票机会
        </p>
      </div>

      {/* 扫描控制 */}
      <div className="flex items-center justify-between">
        <ScanControl
          status={status}
          scope={scope}
          onScopeChange={handleScopeChange}
          onStart={handleStart}
          onStop={handleStop}
        />
        {results.length > 0 && status !== 'scanning' && (
          <button
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            清除结果
          </button>
        )}
      </div>

      {/* 扫描进度 */}
      {(status === 'scanning' || status === 'completed') && (
        <ScanProgress
          progress={progress}
          status={status}
          foundCount={results.length}
        />
      )}

      {/* 扫描结果 */}
      {results.length > 0 ? (
        <ScanResults results={results} />
      ) : status === 'idle' ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-lg">点击「开始扫描」发现投资机会</p>
          <p className="text-sm mt-2">
            {scope === 'all' && '预计扫描时间：5-10分钟'}
            {scope === 'hs300' && '预计扫描时间：约30秒'}
            {scope === 'watchlist' && '扫描您的自选股'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: 验证页面**

Run: `npx tsc --noEmit app/scan/page.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/scan/page.tsx
git commit -m "feat: add market scan page"
```

---

### Task 19: 更新导航栏添加扫描入口

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: 添加扫描页面导航项**

在 `navItems` 数组中添加新项：

```typescript
// components/layout/Header.tsx

// 在 import 中添加 ScanLine 图标
import {
  Home,
  Radar,
  TrendingUp,
  ClipboardList,
  PieChart,
  Bell,
  Menu,
  X,
  LineChart,
  ScanLine,  // 新增
} from 'lucide-react'

// 修改 navItems 数组
const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/strategy', label: '策略雷达', icon: Radar },
  { href: '/scan', label: '市场扫描', icon: ScanLine },  // 新增
  { href: '/sector', label: '板块雷达', icon: TrendingUp },
  { href: '/plans', label: '操作计划', icon: ClipboardList },
  { href: '/position', label: '持仓监控', icon: PieChart },
  { href: '/alerts', label: '提醒中心', icon: Bell },
]
```

- [ ] **Step 2: 验证修改**

Run: `npx tsc --noEmit components/layout/Header.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat: add scan page navigation"
```

---

### Task 20: 更新首页添加市场情绪看板

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 在首页顶部添加市场情绪看板**

```typescript
// app/page.tsx

'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { WatchlistTable } from '@/components/stock/WatchlistTable'
import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { MarketStatus } from '@/components/common/MarketStatus'
import { formatAmount } from '@/lib/utils/format'
import { StockSearch } from '@/components/stock'
import { MarketSentiment } from '@/components/market'  // 新增

export default function HomePage() {
  const { stocks, refreshData, addStock } = useWatchlistStore()
  const { getSummary } = usePositionStore()

  // 定时刷新数据
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 3000)
    return () => clearInterval(interval)
  }, [refreshData])

  const summary = getSummary()

  const handleAddStock = (stock: { code: string }) => {
    const pureCode = stock.code.replace(/^(sh|sz)/i, '')
    const market = stock.code.toLowerCase().startsWith('sh') ? 'sh' : 'sz'
    addStock(`${market}${pureCode}`)
  }

  return (
    <div className="space-y-6">
      {/* 市场情绪看板 - 新增 */}
      <MarketSentiment />

      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的自选股</h1>
          <div className="flex items-center gap-2 mt-1">
            <MarketStatus />
            <span className="text-sm text-muted-foreground">
              共 {stocks.length} 只股票
            </span>
          </div>
        </div>

        <StockSearch
          placeholder="添加自选股..."
          buttonVariant="default"
          className="gap-1"
          onSelect={handleAddStock}
        >
          <Plus className="w-4 h-4" />
          添加股票
        </StockSearch>
      </div>

      {/* 自选股列表 */}
      <WatchlistTable />

      {/* 底部统计 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">持仓市值</div>
          <div className="text-xl font-bold mt-1">
            {formatAmount(summary.totalValue)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">今日盈亏</div>
          <div className={`text-xl font-bold mt-1 ${
            summary.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summary.todayProfit >= 0 ? '+' : ''}{formatAmount(summary.todayProfit)}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证修改**

Run: `npx tsc --noEmit app/page.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add market sentiment to homepage"
```

---

## Chunk 6: 验收与测试

### Task 21: 运行类型检查

- [ ] **Step 1: 运行完整类型检查**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: 修复任何类型错误（如有）**

---

### Task 22: 运行构建

- [ ] **Step 1: 运行生产构建**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 2: 修复任何构建错误（如有）**

---

### Task 23: 手动测试验收

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev`

- [ ] **Step 2: 验证市场情绪看板**

1. 访问首页 `http://localhost:3000`
2. 确认顶部显示市场情绪看板
3. 确认显示三大指数及涨跌幅
4. 确认显示涨跌比和强弱标签
5. 确认显示资金流向
6. 确认显示热门板块 TOP3

- [ ] **Step 3: 验证市场扫描器**

1. 点击导航栏「市场扫描」
2. 确认页面正常显示
3. 选择「沪深300」范围
4. 点击「开始扫描」
5. 确认进度条正常显示
6. 确认扫描结果增量显示
7. 点击「加入自选」按钮
8. 确认股票已添加到自选股

---

### Task 24: 最终提交

- [ ] **Step 1: 检查所有文件已提交**

Run: `git status`
Expected: No untracked files

- [ ] **Step 2: 创建合并提交**

```bash
git add -A
git commit -m "feat: add market sentiment dashboard and market scanner

- Add MarketSentiment component with index cards, market stats, and hot sectors
- Add market scan page with batch scanning capability
- Add signal detection for breakout, volume, and sector resonance
- Add scan state management with Zustand
- Update navigation with scan page entry
- Update homepage with market sentiment dashboard at top"
```