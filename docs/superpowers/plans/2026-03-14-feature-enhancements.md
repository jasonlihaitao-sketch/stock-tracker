# Stock Tracker 功能完善实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善股票跟踪网站的核心功能，包括自定义 Hooks、API 路由完善、测试覆盖和性能优化。

**Architecture:** 采用分层架构，Hooks 作为业务逻辑层封装 Store 操作，API Routes 提供数据持久化选项，测试覆盖核心功能。

**Tech Stack:** Next.js 14, TypeScript 5, Zustand 4, SWR 2, Jest/Vitest, Testing Library

---

## 项目当前状态

### 已实现功能 ✅

| 功能模块 | 页面/组件 | Store | API Routes |
|---------|----------|-------|------------|
| 自选股列表 | `WatchlistTable`, `WatchlistGroupManager` | `stockStore` | `/api/stocks/*` |
| 股票详情 | `StockChart`, `MinuteChart`, `StockDiagnosis` | - | `/api/stocks/kline`, `/api/stocks/minute` |
| 持仓管理 | `PortfolioTable` | `portfolioStore` | - |
| 持仓监控 | `PositionCard` | `positionStore` | - |
| 预警管理 | `AlertList` | `alertStore` | - |
| 策略雷达 | `SignalCard` | `signalStore` | `/api/technical` |
| 市场扫描 | `ScanControl`, `ScanResults` | `scanStore` | `/api/screener` |
| 板块雷达 | `SectorCard` | - | `/api/sector` |
| AI助手 | `ChatInterface` | - | `/api/ai/*` |
| 操作计划 | `PlanCard` | `operationPlanStore` | - |

### 待完善功能 ❌

1. **自定义 Hooks 层** - CLAUDE.md 提到但未实现
2. **测试覆盖** - 无测试文件
3. **API Routes 完善** - alerts/portfolio 路由未实现
4. **错误边界组件** - 缺少统一错误处理
5. **数据导入导出** - localStorage 数据无备份机制

---

## Chunk 1: 自定义 Hooks 层

### 文件结构

```
hooks/
├── useStock.ts          # 股票数据相关
├── usePortfolio.ts      # 持仓管理相关
├── useAlert.ts          # 预警管理相关
├── useWatchlist.ts      # 自选股相关
├── usePosition.ts       # 持仓监控相关
├── useSignal.ts         # 策略信号相关
└── index.ts             # 导出
```

### Task 1.1: useStock Hook

**Files:**
- Create: `hooks/useStock.ts`
- Modify: `hooks/index.ts`

- [ ] **Step 1: 创建 useStock Hook**

```typescript
// hooks/useStock.ts
import { useCallback, useEffect } from 'react'
import { useWatchlistStore } from '@/store/stockStore'
import { getStockRealtime, searchStock } from '@/lib/api/stock'
import type { Stock } from '@/types/stock'

export interface UseStockReturn {
  // 状态
  stocks: string[]
  stockData: Record<string, Stock>
  loading: boolean

  // 操作
  addStock: (code: string) => void
  removeStock: (code: string) => void
  refreshData: () => Promise<void>

  // 查询
  getStockByCode: (code: string) => Stock | undefined
  searchStocks: (keyword: string) => Promise<Stock[]>
}

export function useStock(): UseStockReturn {
  const {
    stocks,
    stockData,
    loading,
    addStock,
    removeStock,
    refreshData
  } = useWatchlistStore()

  const getStockByCode = useCallback((code: string) => {
    return stockData[code]
  }, [stockData])

  const searchStocks = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return []
    return await searchStock(keyword)
  }, [])

  return {
    stocks,
    stockData,
    loading,
    addStock,
    removeStock,
    refreshData,
    getStockByCode,
    searchStocks,
  }
}
```

- [ ] **Step 2: 创建 usePortfolio Hook**

```typescript
// hooks/usePortfolio.ts
import { useCallback, useMemo } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'
import { getStockRealtime } from '@/lib/api/stock'
import type { Portfolio, PortfolioWithStock } from '@/types/portfolio'
import type { Stock } from '@/types/stock'

export interface PortfolioSummary {
  totalCost: number
  totalValue: number
  totalProfit: number
  profitPercent: number
  todayProfit: number
}

export interface UsePortfolioReturn {
  portfolios: Portfolio[]
  summary: PortfolioSummary

  // 操作
  addPortfolio: (portfolio: Omit<Portfolio, 'id'>) => void
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void
  removePortfolio: (id: string) => void

  // 计算
  calculateWithRealtime: (stocks: Record<string, Stock>) => PortfolioWithStock[]
}

export function usePortfolio(): UsePortfolioReturn {
  const {
    portfolios,
    addPortfolio,
    updatePortfolio,
    removePortfolio
  } = usePortfolioStore()

  const summary = useMemo<PortfolioSummary>(() => {
    // 默认汇总，无实时价格
    return {
      totalCost: 0,
      totalValue: 0,
      totalProfit: 0,
      profitPercent: 0,
      todayProfit: 0,
    }
  }, [])

  const calculateWithRealtime = useCallback(
    (stocks: Record<string, Stock>): PortfolioWithStock[] => {
      return portfolios.map((p) => {
        const stock = stocks[p.stockCode]
        const currentPrice = stock?.price || 0
        const marketValue = currentPrice * p.quantity
        const cost = p.buyPrice * p.quantity
        const profit = marketValue - cost

        return {
          ...p,
          currentPrice,
          marketValue,
          profit,
          profitPercent: cost > 0 ? (profit / cost) * 100 : 0,
          changePercent: stock?.changePercent || 0,
        }
      })
    },
    [portfolios]
  )

  return {
    portfolios,
    summary,
    addPortfolio,
    updatePortfolio,
    removePortfolio,
    calculateWithRealtime,
  }
}
```

- [ ] **Step 3: 创建 useAlert Hook**

```typescript
// hooks/useAlert.ts
import { useCallback, useEffect, useRef } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { getStockRealtime } from '@/lib/api/stock'
import type { Alert, AlertHistory, SmartAlert } from '@/types/alert'

export interface UseAlertReturn {
  // 状态
  alerts: Alert[]
  smartAlerts: SmartAlert[]
  alertHistory: AlertHistory[]

  // 操作
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void
  updateAlert: (id: string, updates: Partial<Alert>) => void
  removeAlert: (id: string) => void
  toggleAlert: (id: string) => void

  // 智能提醒
  addSmartAlert: (alert: Omit<SmartAlert, 'id' | 'createdAt'>) => void
  dismissAlert: (id: string) => void
  getTriggeredAlerts: () => SmartAlert[]

  // 检查
  checkAlerts: () => Promise<void>
}

export function useAlert(): UseAlertReturn {
  const {
    alerts,
    smartAlerts,
    alertHistory,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert,
    addSmartAlert,
    dismissAlert,
    getTriggeredAlerts,
    addHistory,
  } = useAlertStore()

  const lastCheckedRef = useRef<Record<string, number>>({})

  const checkAlerts = useCallback(async () => {
    const enabledAlerts = alerts.filter((a) => a.enabled)
    if (enabledAlerts.length === 0) return

    const codes = Array.from(new Set(enabledAlerts.map((a) => a.stockCode)))
    const stocks = await getStockRealtime(codes)
    const stockMap = new Map(stocks.map((s) => [s.code, s]))

    for (const alert of enabledAlerts) {
      const stock = stockMap.get(alert.stockCode)
      if (!stock) continue

      const lastTriggered = lastCheckedRef.current[alert.id] || 0
      const now = Date.now()
      if (now - lastTriggered < 5 * 60 * 1000) continue

      let triggered = false
      let conditionText = ''

      switch (alert.type) {
        case 'price_up':
          if (stock.price >= alert.value) {
            triggered = true
            conditionText = `价格突破 ${alert.value} 元`
          }
          break
        case 'price_down':
          if (stock.price <= alert.value) {
            triggered = true
            conditionText = `价格跌破 ${alert.value} 元`
          }
          break
        case 'change_up':
          if (stock.changePercent >= alert.value) {
            triggered = true
            conditionText = `涨幅超过 ${alert.value}%`
          }
          break
        case 'change_down':
          if (stock.changePercent <= -alert.value) {
            triggered = true
            conditionText = `跌幅超过 ${alert.value}%`
          }
          break
      }

      if (triggered) {
        lastCheckedRef.current[alert.id] = now
        addHistory({
          alertId: alert.id,
          stockCode: alert.stockCode,
          stockName: alert.stockName,
          condition: conditionText,
          triggerValue: alert.value,
          actualValue: alert.type.includes('price') ? stock.price : stock.changePercent,
          triggeredAt: new Date().toISOString(),
          read: false,
        })
      }
    }
  }, [alerts, addHistory])

  return {
    alerts,
    smartAlerts,
    alertHistory,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert,
    addSmartAlert,
    dismissAlert,
    getTriggeredAlerts,
    checkAlerts,
  }
}
```

- [ ] **Step 4: 创建 useWatchlist Hook**

```typescript
// hooks/useWatchlist.ts
import { useCallback, useMemo } from 'react'
import { useWatchlistStore, ALL_GROUP_ID } from '@/store/stockStore'
import type { WatchlistGroup } from '@/types/watchlistGroup'

export interface UseWatchlistReturn {
  // 状态
  stocks: string[]
  groups: WatchlistGroup[]
  activeGroupId: string

  // 操作
  addStock: (code: string) => void
  removeStock: (code: string) => void
  createGroup: (name: string) => void
  updateGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  setActiveGroup: (id: string) => void
  moveStockToGroup: (stockCode: string, groupId: string | null) => void

  // 查询
  getStocksInActiveGroup: () => string[]
  isAllGroup: boolean
}

export function useWatchlist(): UseWatchlistReturn {
  const {
    stocks,
    groups,
    activeGroupId,
    addStock,
    removeStock,
    createGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    moveStockToGroup,
    getStocksInActiveGroup,
  } = useWatchlistStore()

  const isAllGroup = activeGroupId === ALL_GROUP_ID

  return {
    stocks,
    groups,
    activeGroupId,
    addStock,
    removeStock,
    createGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    moveStockToGroup,
    getStocksInActiveGroup,
    isAllGroup,
  }
}
```

- [ ] **Step 5: 创建 usePosition Hook**

```typescript
// hooks/usePosition.ts
import { useCallback, useMemo } from 'react'
import { usePositionStore } from '@/store/positionStore'
import type { Position, PositionSummary } from '@/types/position'

export interface UsePositionReturn {
  positions: Position[]
  summary: PositionSummary

  // 操作
  addPosition: (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePosition: (id: string, updates: Partial<Position>) => void
  removePosition: (id: string) => void
  updatePrice: (stockCode: string, price: number) => void
}

export function usePosition(): UsePositionReturn {
  const {
    positions,
    addPosition,
    updatePosition,
    removePosition,
    updatePrice,
    getSummary,
  } = usePositionStore()

  const summary = useMemo(() => getSummary(), [positions, getSummary])

  return {
    positions,
    summary,
    addPosition,
    updatePosition,
    removePosition,
    updatePrice,
  }
}
```

- [ ] **Step 6: 创建 useSignal Hook**

```typescript
// hooks/useSignal.ts
import { useCallback } from 'react'
import { useSignalStore } from '@/store/signalStore'
import type { Signal } from '@/types/signal'

export interface UseSignalReturn {
  buySignals: Signal[]
  sellSignals: Signal[]

  // 操作
  setBuySignals: (signals: Signal[]) => void
  setSellSignals: (signals: Signal[]) => void
  clearSignals: () => void

  // 查询
  getSignalsByStock: (stockCode: string) => Signal[]
}

export function useSignal(): UseSignalReturn {
  const {
    buySignals,
    sellSignals,
    setBuySignals,
    setSellSignals,
  } = useSignalStore()

  const clearSignals = useCallback(() => {
    setBuySignals([])
    setSellSignals([])
  }, [setBuySignals, setSellSignals])

  const getSignalsByStock = useCallback(
    (stockCode: string) => {
      return [...buySignals, ...sellSignals].filter((s) => s.stockCode === stockCode)
    },
    [buySignals, sellSignals]
  )

  return {
    buySignals,
    sellSignals,
    setBuySignals,
    setSellSignals,
    clearSignals,
    getSignalsByStock,
  }
}
```

- [ ] **Step 7: 创建 hooks/index.ts 导出文件**

```typescript
// hooks/index.ts
export { useStock, type UseStockReturn } from './useStock'
export { usePortfolio, type UsePortfolioReturn, type PortfolioSummary } from './usePortfolio'
export { useAlert, type UseAlertReturn } from './useAlert'
export { useWatchlist, type UseWatchlistReturn } from './useWatchlist'
export { usePosition, type UsePositionReturn } from './usePosition'
export { useSignal, type UseSignalReturn } from './useSignal'
```

- [ ] **Step 8: 提交 Hooks 层代码**

```bash
git add hooks/
git commit -m "feat: add custom hooks layer for stock, portfolio, alert, watchlist, position, signal"
```

---

## Chunk 2: 错误边界组件

### Task 2.1: ErrorBoundary 组件

**Files:**
- Create: `components/common/ErrorBoundary.tsx`
- Create: `components/common/ErrorFallback.tsx`

- [ ] **Step 1: 创建 ErrorBoundary 组件**

```typescript
// components/common/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { ErrorFallback } from './ErrorFallback'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}
```

- [ ] **Step 2: 创建 ErrorFallback 组件**

```typescript
// components/common/ErrorFallback.tsx
'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">出错了</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error?.message || '页面加载时发生错误，请刷新重试'}
          </p>
          {onReset && (
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 更新 GlobalProviders 使用 ErrorBoundary**

```typescript
// 在 components/GlobalProviders.tsx 中添加 ErrorBoundary 包裹
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// 在返回的 JSX 中包裹关键组件
```

- [ ] **Step 4: 提交错误边界代码**

```bash
git add components/common/ErrorBoundary.tsx components/common/ErrorFallback.tsx
git commit -m "feat: add error boundary components for error handling"
```

---

## Chunk 3: 数据导入导出功能

### Task 3.1: 数据导出功能

**Files:**
- Create: `lib/utils/export.ts`
- Create: `components/settings/DataExport.tsx`
- Create: `app/settings/page.tsx`

- [ ] **Step 1: 创建数据导出工具函数**

```typescript
// lib/utils/export.ts
import type { Stock } from '@/types/stock'
import type { Portfolio } from '@/types/portfolio'
import type { Alert } from '@/types/alert'
import type { Position } from '@/types/position'

export interface ExportData {
  version: string
  exportedAt: string
  watchlist: {
    stocks: string[]
    groups: Array<{
      id: string
      name: string
      stockCodes: string[]
    }>
  }
  portfolios: Portfolio[]
  alerts: Alert[]
  positions: Position[]
}

export function exportAllData(): ExportData {
  // 从 localStorage 读取所有数据
  const watchlistData = localStorage.getItem('stock-tracker-watchlist')
  const portfolioData = localStorage.getItem('stock-tracker-portfolio')
  const alertData = localStorage.getItem('stock-tracker-alerts')
  const positionData = localStorage.getItem('stock-tracker-positions')

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    watchlist: watchlistData ? JSON.parse(watchlistData).state : { stocks: [], groups: [] },
    portfolios: portfolioData ? JSON.parse(portfolioData).state.portfolios : [],
    alerts: alertData ? JSON.parse(alertData).state.alerts : [],
    positions: positionData ? JSON.parse(positionData).state.positions : [],
  }
}

export function downloadAsJson(data: ExportData, filename: string = 'stock-tracker-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(jsonString: string): { success: boolean; message: string; data?: ExportData } {
  try {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.exportedAt) {
      return { success: false, message: '无效的备份文件格式' }
    }

    return { success: true, message: '数据解析成功', data }
  } catch (error) {
    return { success: false, message: 'JSON 解析失败，请检查文件格式' }
  }
}

export function restoreData(data: ExportData): void {
  if (data.watchlist) {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify({
      state: data.watchlist,
      version: 0
    }))
  }
  if (data.portfolios) {
    localStorage.setItem('stock-tracker-portfolio', JSON.stringify({
      state: { portfolios: data.portfolios },
      version: 0
    }))
  }
  if (data.alerts) {
    localStorage.setItem('stock-tracker-alerts', JSON.stringify({
      state: { alerts: data.alerts },
      version: 0
    }))
  }
  if (data.positions) {
    localStorage.setItem('stock-tracker-positions', JSON.stringify({
      state: { positions: data.positions },
      version: 0
    }))
  }
}
```

- [ ] **Step 2: 创建数据导出组件**

```typescript
// components/settings/DataExport.tsx
'use client'

import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportAllData, downloadAsJson, importData, restoreData } from '@/lib/utils/export'

export function DataExport() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportAllData()
    const filename = `stock-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    downloadAsJson(data, filename)
    setMessage({ type: 'success', text: '数据已导出' })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = importData(e.target?.result as string)
      if (result.success && result.data) {
        restoreData(result.data)
        setMessage({ type: 'success', text: '数据已恢复，页面将刷新' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据管理</CardTitle>
        <CardDescription>导出或导入您的自选股、持仓、预警等数据</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            导入数据
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          数据存储在浏览器本地，清除浏览器缓存将丢失所有数据。建议定期导出备份。
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: 创建设置页面**

```typescript
// app/settings/page.tsx
import { Metadata } from 'next'
import { DataExport } from '@/components/settings/DataExport'

export const metadata: Metadata = {
  title: '设置 - StockTracker',
  description: '管理应用设置和数据',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-1">
          管理应用设置和数据
        </p>
      </div>

      <DataExport />
    </div>
  )
}
```

- [ ] **Step 4: 更新 Header 添加设置链接**

```typescript
// 在 components/layout/Header.tsx 的 navItems 中添加
{ href: '/settings', label: '设置', icon: Settings },
```

- [ ] **Step 5: 提交数据导入导出功能**

```bash
git add lib/utils/export.ts components/settings/ app/settings/
git commit -m "feat: add data export/import functionality with settings page"
```

---

## Chunk 4: 测试基础设施

### Task 4.1: 配置测试环境

**Files:**
- Create: `vitest.config.ts`
- Create: `__tests__/setup.ts`
- Create: `__tests__/stores/stockStore.test.ts`

- [ ] **Step 1: 安装测试依赖**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: 创建 vitest 配置**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 3: 创建测试设置文件**

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock fetch
global.fetch = vi.fn()
```

- [ ] **Step 4: 创建 stockStore 测试**

```typescript
// __tests__/stores/stockStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWatchlistStore } from '@/store/stockStore'

describe('stockStore', () => {
  beforeEach(() => {
    // 重置 store
    useWatchlistStore.setState({
      stocks: [],
      stockData: {},
      loading: false,
      groups: [],
      activeGroupId: 'all',
    })
  })

  describe('addStock', () => {
    it('should add a stock code to the list', () => {
      const { addStock, stocks } = useWatchlistStore.getState()

      addStock('sz000001')

      expect(useWatchlistStore.getState().stocks).toContain('sz000001')
    })

    it('should not add duplicate stock codes', () => {
      const { addStock } = useWatchlistStore.getState()

      addStock('sz000001')
      addStock('sz000001')

      expect(useWatchlistStore.getState().stocks).toHaveLength(1)
    })
  })

  describe('removeStock', () => {
    it('should remove a stock code from the list', () => {
      const { addStock, removeStock } = useWatchlistStore.getState()

      addStock('sz000001')
      addStock('sz000002')
      removeStock('sz000001')

      const stocks = useWatchlistStore.getState().stocks
      expect(stocks).not.toContain('sz000001')
      expect(stocks).toContain('sz000002')
    })
  })

  describe('groups', () => {
    it('should create a new group', () => {
      const { createGroup } = useWatchlistStore.getState()

      createGroup('科技股')

      const groups = useWatchlistStore.getState().groups
      expect(groups).toHaveLength(1)
      expect(groups[0].name).toBe('科技股')
    })

    it('should delete a group', () => {
      const { createGroup, deleteGroup } = useWatchlistStore.getState()

      createGroup('科技股')
      const groupId = useWatchlistStore.getState().groups[0].id
      deleteGroup(groupId)

      expect(useWatchlistStore.getState().groups).toHaveLength(0)
    })
  })
})
```

- [ ] **Step 5: 创建 alertStore 测试**

```typescript
// __tests__/stores/alertStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAlertStore } from '@/store/alertStore'

describe('alertStore', () => {
  beforeEach(() => {
    useAlertStore.setState({
      alerts: [],
      alertHistory: [],
      settings: { notificationMethods: ['browser'] },
      smartAlerts: [],
      alertLogs: [],
    })
  })

  describe('addAlert', () => {
    it('should add a new alert', () => {
      const { addAlert } = useAlertStore.getState()

      addAlert({
        stockCode: 'sz000001',
        stockName: '平安银行',
        type: 'price_up',
        value: 15,
        enabled: true,
      })

      const alerts = useAlertStore.getState().alerts
      expect(alerts).toHaveLength(1)
      expect(alerts[0].stockCode).toBe('sz000001')
      expect(alerts[0].type).toBe('price_up')
      expect(alerts[0].value).toBe(15)
    })
  })

  describe('toggleAlert', () => {
    it('should toggle alert enabled status', () => {
      const { addAlert, toggleAlert } = useAlertStore.getState()

      addAlert({
        stockCode: 'sz000001',
        stockName: '平安银行',
        type: 'price_up',
        value: 15,
        enabled: true,
      })

      const alertId = useAlertStore.getState().alerts[0].id
      toggleAlert(alertId)

      expect(useAlertStore.getState().alerts[0].enabled).toBe(false)
    })
  })

  describe('removeAlert', () => {
    it('should remove an alert', () => {
      const { addAlert, removeAlert } = useAlertStore.getState()

      addAlert({
        stockCode: 'sz000001',
        stockName: '平安银行',
        type: 'price_up',
        value: 15,
        enabled: true,
      })

      const alertId = useAlertStore.getState().alerts[0].id
      removeAlert(alertId)

      expect(useAlertStore.getState().alerts).toHaveLength(0)
    })
  })
})
```

- [ ] **Step 6: 更新 package.json 添加测试脚本**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

- [ ] **Step 7: 提交测试配置和初始测试**

```bash
git add vitest.config.ts __tests__/ package.json
git commit -m "test: add vitest configuration and initial store tests"
```

---

## Chunk 5: 性能优化

### Task 5.1: 组件性能优化

**Files:**
- Modify: `components/stock/WatchlistTable.tsx`
- Modify: `components/stock/StockCard.tsx`
- Create: `hooks/useDebounce.ts`

- [ ] **Step 1: 创建 useDebounce Hook**

```typescript
// hooks/useDebounce.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}
```

- [ ] **Step 2: 使用 React.memo 优化 StockCard**

```typescript
// 在 components/stock/StockCard.tsx 中使用 React.memo
import { memo } from 'react'

export const StockCard = memo(function StockCard({ ... }) {
  // 组件实现
})

// 或使用自定义比较函数
export const StockCard = memo(StockCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.code === nextProps.code &&
    prevProps.price === nextProps.price &&
    prevProps.changePercent === nextProps.changePercent
  )
})
```

- [ ] **Step 3: 优化 WatchlistTable 渲染**

```typescript
// 在 components/stock/WatchlistTable.tsx 中
// 使用 useMemo 缓存排序后的数据
const sortedStocks = useMemo(() => {
  return [...stocks].sort((a, b) => {
    // 排序逻辑
  })
}, [stocks])

// 使用 useCallback 缓存事件处理函数
const handleRemove = useCallback((code: string) => {
  removeStock(code)
}, [removeStock])
```

- [ ] **Step 4: 提交性能优化**

```bash
git add hooks/useDebounce.ts components/stock/WatchlistTable.tsx components/stock/StockCard.tsx
git commit -m "perf: add debounce hook and memoize stock components"
```

---

## Chunk 6: 多策略可选扫描（完整版）

### 概述

当前市场扫描仅支持固定的 3 种技术信号检测，用户无法选择策略。本功能将扩展为 **6 大策略类别、20+ 种策略**，支持策略组合、经典模板一键加载，并提供风险提示避免单一指标陷阱。

### 设计原则

1. **策略分类清晰** - 按投资风格（短线/中长线/价值/成长）分类
2. **组合优于单一** - 鼓励多因子组合，避免单一指标陷阱
3. **经典模板内置** - CAN SLIM、巴菲特价值、彼得林奇成长等经典策略
4. **风险提示** - 显示策略的局限性和适用条件

### 策略分类体系

```
┌─────────────────────────────────────────────────────────────────┐
│                        扫描策略体系                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  技术面策略   │  │  基本面策略   │  │  高成长策略   │          │
│  │  (短线为主)   │  │ (中长线/价值) │  │  (成长投资)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │高质量/护城河  │  │超跌/均值回归 │  │ 事件驱动策略  │          │
│  │  (稳健投资)   │  │  (左侧交易)   │  │  (波段交易)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              综合多因子策略 (实战最常用)                   │    │
│  │         CAN SLIM | 巴菲特价值 | 彼得林奇成长              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 完整策略列表

#### 1. 技术面策略（短线为主）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `tech_breakout` | 价格突破 | 股价接近 20 日新高 | 中 | 可能假突破 |
| `tech_volume` | 量价配合 | 放量上涨，成交量 > 5日均量×2 | 短 | 放量可能是出货 |
| `tech_sector` | 板块共振 | 个股涨 + 板块涨 > 1% | 短 | 板块轮动快 |
| `tech_ma_cross` | 均线金叉 | MA5 上穿 MA10 | 短 | 震荡市频繁假信号 |
| `tech_macd` | MACD 金叉 | DIF 上穿 DEA | 中 | 滞后指标 |
| `tech_kdj` | KDJ 金叉 | K 上穿 D，K < 20 区间更可靠 | 短 | 超短线，信号多 |
| `tech_support` | 支撑位反弹 | 价格触及支撑位后回升 | 中 | 支撑可能失效 |
| `tech_resistance` | 压力位突破 | 价格突破阻力位 | 中 | 需成交量确认 |
| `tech_rsi_oversold` | RSI 超卖 | RSI < 30 且拐头向上 | 短 | 可能继续超卖 |

#### 2. 基本面策略（中长线/价值投资）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `fund_low_pe` | 低估值(PE) | PE < 行业平均 × 0.7 | 长 | 低 PE 可能是价值陷阱 |
| `fund_low_pb` | 低估值(PB) | PB < 1 且 ROE > 10% | 长 | 低 PB 可能资产质量差 |
| `fund_high_dividend` | 高股息 | 股息率 > 4% 且稳定 | 长 | 高股息可能是股价下跌 |
| `fund_roe` | 高 ROE | ROE > 15% 连续 3 年 | 长 | 需排除财务造假 |
| `fund_cash_flow` | 现金流健康 | 经营现金流 > 净利润 | 长 | 行业差异大 |

#### 3. 高成长策略（成长投资）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `growth_revenue` | 营收高增长 | 营收同比 > 30% 连续 2 季 | 中 | 增速不可持续 |
| `growth_profit` | 利润高增长 | 净利润同比 > 50% | 中 | 基数效应影响 |
| `growth_peg` | PEG 合理 | PEG < 1（PE/增长率） | 中 | 增长预测偏差 |
| `growth_expansion` | 业务扩张 | 研发投入占比 > 10% | 长 | 短期盈利压力大 |

#### 4. 高质量/宽护城河策略（稳健投资）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `quality_moat` | 护城河 | 毛利率 > 40% + ROE > 15% | 长 | 护城河可能被侵蚀 |
| `quality_leader` | 行业龙头 | 市占率前三 + 盈利稳定 | 长 | 行业天花板 |
| `quality_brand` | 品牌溢价 | 高毛利率 + 定价权 | 长 | 消费者偏好变化 |
| `quality_cash_cow` | 现金牛 | 自由现金流持续为正 | 长 | 成长性不足 |

#### 5. 超跌反弹/均值回归策略（左侧交易）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `reversal_oversold` | 超跌反弹 | 跌幅 > 30% + RSI < 30 | 中 | 可能继续下跌 |
| `reversal_support` | 历史支撑 | 价格接近历史低点 | 中 | 历史不一定重演 |
| `reversal_bb` | 布林下轨 | 价格触及布林下轨后回升 | 短 | 强势下跌穿透 |
| `reversal_gap` | 缺口回补 | 股价回补向上跳空缺口 | 中 | 缺口可能不补 |

#### 6. 事件驱动策略（波段交易）

| 策略 ID | 策略名称 | 检测逻辑 | 周期 | 风险提示 |
|---------|---------|---------|------|---------|
| `event_earnings` | 业绩预增 | 业绩预告增长 > 50% | 短 | 已Price in |
| `event_dividend` | 分红派息 | 高送转或特别分红 | 短 | 短期炒作风险 |
| `event_repurchase` | 股票回购 | 公司宣布回购计划 | 中 | 回购可能不执行 |
| `event_institution` | 机构调研 | 近期机构调研密集 | 短 | 调研不等于买入 |

### 经典策略组合模板

#### CAN SLIM（威廉·欧奈尔成长+动能策略）

```typescript
const CAN_SLIM_TEMPLATE: StrategyTemplate = {
  id: 'can_slim',
  name: 'CAN SLIM 法则',
  author: '威廉·欧奈尔',
  description: '结合基本面成长与技术面动能的经典策略',
  strategies: [
    'fund_roe',           // C: 当前季度盈利增长
    'growth_profit',      // A: 年度盈利增长
    'tech_breakout',      // N: 新高突破
    'tech_volume',        // S: 供给与需求（放量）
    'tech_sector',        // L: 领先或落后（板块龙头）
    'fund_low_pe',        // I: 机构认同
    'tech_ma_cross',      // M: 市场趋势
  ],
  timeFrame: 'medium',
  riskLevel: 'medium',
  successRate: '历史回测年化收益约 20-30%',
}
```

#### 巴菲特价值投资

```typescript
const BUFFETT_TEMPLATE: StrategyTemplate = {
  id: 'buffett_value',
  name: '巴菲特价值投资',
  author: '沃伦·巴菲特',
  description: '寻找具有护城河的优质企业，长期持有',
  strategies: [
    'quality_moat',       // 护城河
    'quality_cash_cow',   // 现金牛
    'fund_roe',           // 高 ROE
    'fund_cash_flow',     // 健康现金流
    'fund_high_dividend', // 分红稳定
  ],
  timeFrame: 'long',
  riskLevel: 'low',
  successRate: '长期年化收益约 15-20%',
}
```

#### 彼得林奇成长投资

```typescript
const LYNCH_TEMPLATE: StrategyTemplate = {
  id: 'lynch_growth',
  name: '彼得林奇成长投资',
  author: '彼得·林奇',
  description: '寻找 PEG 合理的高成长股',
  strategies: [
    'growth_peg',         // PEG < 1
    'growth_revenue',     // 营收增长
    'growth_profit',      // 利润增长
    'fund_low_pe',        // 相对低估
    'quality_leader',     // 细分龙头
  ],
  timeFrame: 'medium',
  riskLevel: 'medium',
  successRate: '麦哲伦基金年化收益约 29%',
}
```

#### 超跌反弹组合

```typescript
const REVERSAL_TEMPLATE: StrategyTemplate = {
  id: 'reversal_combo',
  name: '超跌反弹组合',
  author: '左侧交易者',
  description: '寻找被市场过度抛售的标的',
  strategies: [
    'reversal_oversold',  // 超跌
    'reversal_support',   // 历史支撑
    'fund_roe',           // 基本面尚可
    'fund_cash_flow',     // 现金流支撑
  ],
  timeFrame: 'medium',
  riskLevel: 'high',
  successRate: '需要严格止损',
}
```

### 单一指标风险提示系统

```typescript
const STRATEGY_WARNINGS: Record<StrategyId, string[]> = {
  fund_low_pe: [
    '低 PE 可能是价值陷阱，公司可能面临衰退',
    '建议结合 ROE、现金流等指标综合判断',
  ],
  tech_rsi_oversold: [
    'RSI 超卖后可能继续超卖',
    '建议等待拐头信号确认',
  ],
  reversal_oversold: [
    '超跌可能继续下跌，切勿盲目抄底',
    '建议分批建仓 + 严格止损',
  ],
  growth_revenue: [
    '高增长可能不可持续',
    '关注增长质量和行业天花板',
  ],
  // ...
}
```

### Task 6.1: 创建策略类型定义系统

**Files:**
- Create: `types/strategy.ts`
- Create: `types/strategy-template.ts`
- Modify: `types/scan.ts`

- [ ] **Step 1: 创建策略类型定义**

```typescript
// types/strategy.ts

// 策略分类
export type StrategyCategory =
  | 'technical'        // 技术面
  | 'fundamental'      // 基本面
  | 'growth'           // 高成长
  | 'quality'          // 高质量/护城河
  | 'reversal'         // 超跌反弹
  | 'event'            // 事件驱动

// 投资周期
export type StrategyTimeFrame = 'short' | 'medium' | 'long'

// 风险等级
export type RiskLevel = 'low' | 'medium' | 'high'

// 策略 ID（完整列表）
export type StrategyId =
  // 技术面策略
  | 'tech_breakout'
  | 'tech_volume'
  | 'tech_sector'
  | 'tech_ma_cross'
  | 'tech_macd'
  | 'tech_kdj'
  | 'tech_support'
  | 'tech_resistance'
  | 'tech_rsi_oversold'
  // 基本面策略
  | 'fund_low_pe'
  | 'fund_low_pb'
  | 'fund_high_dividend'
  | 'fund_roe'
  | 'fund_cash_flow'
  // 高成长策略
  | 'growth_revenue'
  | 'growth_profit'
  | 'growth_peg'
  | 'growth_expansion'
  // 高质量策略
  | 'quality_moat'
  | 'quality_leader'
  | 'quality_brand'
  | 'quality_cash_cow'
  // 超跌反弹策略
  | 'reversal_oversold'
  | 'reversal_support'
  | 'reversal_bb'
  | 'reversal_gap'
  // 事件驱动策略
  | 'event_earnings'
  | 'event_dividend'
  | 'event_repurchase'
  | 'event_institution'

// 策略定义
export interface Strategy {
  id: StrategyId
  name: string
  description: string
  category: StrategyCategory
  timeFrame: StrategyTimeFrame
  riskLevel: RiskLevel
  warnings: string[]  // 风险提示
  dataRequirements: string[]  // 需要的数据
  defaultEnabled: boolean
}

// 策略完整定义
export const STRATEGIES: Strategy[] = [
  // === 技术面策略 ===
  {
    id: 'tech_breakout',
    name: '价格突破',
    description: '股价接近 20 日新高，可能启动上升趋势',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['可能假突破，建议等待回踩确认'],
    dataRequirements: ['price', 'high20d'],
    defaultEnabled: true,
  },
  {
    id: 'tech_volume',
    name: '量价配合',
    description: '成交量放大且股价上涨，趋势得到确认',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['放量可能是出货，需结合股价位置判断'],
    dataRequirements: ['volume', 'avgVolume5d', 'changePercent'],
    defaultEnabled: true,
  },
  {
    id: 'tech_sector',
    name: '板块共振',
    description: '个股与所属板块同步上涨，热点效应明显',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['板块轮动快，追高需谨慎'],
    dataRequirements: ['sectorData', 'changePercent'],
    defaultEnabled: true,
  },
  {
    id: 'tech_ma_cross',
    name: '均线金叉',
    description: 'MA5 上穿 MA10，产生买入信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['震荡市频繁假信号，建议结合趋势判断'],
    dataRequirements: ['ma5', 'ma10', 'prevMa5', 'prevMa10'],
    defaultEnabled: false,
  },
  {
    id: 'tech_macd',
    name: 'MACD 金叉',
    description: 'DIF 线上穿 DEA 线，MACD 金叉',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['滞后指标，可能错过最佳买点'],
    dataRequirements: ['macd.dif', 'macd.dea'],
    defaultEnabled: false,
  },
  {
    id: 'tech_kdj',
    name: 'KDJ 金叉',
    description: 'K 线上穿 D 线，超短线买入信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['超短线指标，信号频繁，需结合其他指标'],
    dataRequirements: ['kdj.k', 'kdj.d'],
    defaultEnabled: false,
  },
  {
    id: 'tech_support',
    name: '支撑位反弹',
    description: '股价触及重要支撑位后回升，可能反弹',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['支撑可能失效，需设置止损'],
    dataRequirements: ['price', 'supportLevel'],
    defaultEnabled: false,
  },
  {
    id: 'tech_resistance',
    name: '压力位突破',
    description: '股价突破重要压力位，上涨空间打开',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['需成交量确认，假突破风险'],
    dataRequirements: ['price', 'resistanceLevel', 'volume'],
    defaultEnabled: false,
  },
  {
    id: 'tech_rsi_oversold',
    name: 'RSI 超卖',
    description: 'RSI < 30 且拐头向上，超卖反弹信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['RSI 超卖后可能继续超卖，建议等待拐头确认'],
    dataRequirements: ['rsi'],
    defaultEnabled: false,
  },

  // === 基本面策略 ===
  {
    id: 'fund_low_pe',
    name: '低估值(PE)',
    description: 'PE < 行业平均 × 0.7，相对低估',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: [
      '低 PE 可能是价值陷阱，公司可能面临衰退',
      '建议结合 ROE、现金流等指标综合判断',
    ],
    dataRequirements: ['pe', 'industryPe'],
    defaultEnabled: false,
  },
  {
    id: 'fund_low_pb',
    name: '低估值(PB)',
    description: 'PB < 1 且 ROE > 10%，资产价值低估',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: ['低 PB 可能资产质量差或面临困境'],
    dataRequirements: ['pb', 'roe'],
    defaultEnabled: false,
  },
  {
    id: 'fund_high_dividend',
    name: '高股息',
    description: '股息率 > 4% 且分红稳定',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['高股息可能是股价下跌导致，需检查分红可持续性'],
    dataRequirements: ['dividendYield', 'dividendHistory'],
    defaultEnabled: false,
  },
  {
    id: 'fund_roe',
    name: '高 ROE',
    description: 'ROE > 15% 连续 3 年，盈利能力强',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['需排除财务造假，关注 ROE 构成'],
    dataRequirements: ['roe', 'roeHistory'],
    defaultEnabled: false,
  },
  {
    id: 'fund_cash_flow',
    name: '现金流健康',
    description: '经营现金流 > 净利润，盈利质量高',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['行业差异大，重资产行业现金流通常较低'],
    dataRequirements: ['operatingCashFlow', 'netProfit'],
    defaultEnabled: false,
  },

  // === 高成长策略 ===
  {
    id: 'growth_revenue',
    name: '营收高增长',
    description: '营收同比 > 30% 连续 2 季',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['高增长可能不可持续，关注增长质量'],
    dataRequirements: ['revenue', 'revenueYoY'],
    defaultEnabled: false,
  },
  {
    id: 'growth_profit',
    name: '利润高增长',
    description: '净利润同比 > 50%',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['基数效应影响大，需看多季度趋势'],
    dataRequirements: ['netProfit', 'netProfitYoY'],
    defaultEnabled: false,
  },
  {
    id: 'growth_peg',
    name: 'PEG 合理',
    description: 'PEG < 1（PE/增长率），成长性被低估',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['增长预测存在偏差，需动态跟踪'],
    dataRequirements: ['pe', 'growthRate'],
    defaultEnabled: false,
  },
  {
    id: 'growth_expansion',
    name: '业务扩张',
    description: '研发投入占比 > 10%，积极扩张',
    category: 'growth',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: ['短期盈利压力大，需关注扩张效率'],
    dataRequirements: ['rdExpense', 'revenue'],
    defaultEnabled: false,
  },

  // === 高质量策略 ===
  {
    id: 'quality_moat',
    name: '护城河',
    description: '毛利率 > 40% + ROE > 15%，竞争优势明显',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['护城河可能被侵蚀，需持续跟踪竞争格局'],
    dataRequirements: ['grossMargin', 'roe'],
    defaultEnabled: false,
  },
  {
    id: 'quality_leader',
    name: '行业龙头',
    description: '市占率前三 + 盈利稳定',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['行业天花板可能限制增长'],
    dataRequirements: ['marketShare', 'profitStability'],
    defaultEnabled: false,
  },
  {
    id: 'quality_brand',
    name: '品牌溢价',
    description: '高毛利率 + 定价权',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['消费者偏好变化可能导致品牌贬值'],
    dataRequirements: ['grossMargin', 'pricingPower'],
    defaultEnabled: false,
  },
  {
    id: 'quality_cash_cow',
    name: '现金牛',
    description: '自由现金流持续为正，分红能力强',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['成长性可能不足'],
    dataRequirements: ['freeCashFlow'],
    defaultEnabled: false,
  },

  // === 超跌反弹策略 ===
  {
    id: 'reversal_oversold',
    name: '超跌反弹',
    description: '跌幅 > 30% + RSI < 30',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'high',
    warnings: [
      '超跌可能继续下跌，切勿盲目抄底',
      '建议分批建仓 + 严格止损',
    ],
    dataRequirements: ['price', 'priceDrop', 'rsi'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_support',
    name: '历史支撑',
    description: '价格接近历史低点',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'high',
    warnings: ['历史不一定重演，支撑可能失效'],
    dataRequirements: ['price', 'historicalLow'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_bb',
    name: '布林下轨',
    description: '价格触及布林下轨后回升',
    category: 'reversal',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['强势下跌可能穿透布林下轨'],
    dataRequirements: ['price', 'bbLower'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_gap',
    name: '缺口回补',
    description: '股价回补向上跳空缺口',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['缺口可能不补，强势股可能继续上涨'],
    dataRequirements: ['price', 'gapLevel'],
    defaultEnabled: false,
  },

  // === 事件驱动策略 ===
  {
    id: 'event_earnings',
    name: '业绩预增',
    description: '业绩预告增长 > 50%',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['市场可能已经 Price in，公告后反而下跌'],
    dataRequirements: ['earningsForecast'],
    defaultEnabled: false,
  },
  {
    id: 'event_dividend',
    name: '分红派息',
    description: '高送转或特别分红',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['短期炒作风险，除权后可能下跌'],
    dataRequirements: ['dividendAnnouncement'],
    defaultEnabled: false,
  },
  {
    id: 'event_repurchase',
    name: '股票回购',
    description: '公司宣布回购计划',
    category: 'event',
    timeFrame: 'medium',
    riskLevel: 'low',
    warnings: ['回购计划可能不执行或不达预期'],
    dataRequirements: ['repurchaseAnnouncement'],
    defaultEnabled: false,
  },
  {
    id: 'event_institution',
    name: '机构调研',
    description: '近期机构调研密集',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['调研不等于买入，可能只是了解情况'],
    dataRequirements: ['institutionVisits'],
    defaultEnabled: false,
  },
]

// 默认启用的策略
export const DEFAULT_ENABLED_STRATEGIES: StrategyId[] = [
  'tech_breakout',
  'tech_volume',
  'tech_sector',
]

// 按类别分组
export const STRATEGIES_BY_CATEGORY: Record<StrategyCategory, Strategy[]> = {
  technical: STRATEGIES.filter(s => s.category === 'technical'),
  fundamental: STRATEGIES.filter(s => s.category === 'fundamental'),
  growth: STRATEGIES.filter(s => s.category === 'growth'),
  quality: STRATEGIES.filter(s => s.category === 'quality'),
  reversal: STRATEGIES.filter(s => s.category === 'reversal'),
  event: STRATEGIES.filter(s => s.category === 'event'),
}
```

- [ ] **Step 2: 创建策略模板类型定义**

```typescript
// types/strategy-template.ts
import type { StrategyId, StrategyTimeFrame, RiskLevel } from './strategy'

export interface StrategyTemplate {
  id: string
  name: string
  author: string
  description: string
  strategies: StrategyId[]
  timeFrame: StrategyTimeFrame
  riskLevel: RiskLevel
  successRate?: string  // 历史表现说明
  icon?: string
}

// 经典策略模板
export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'can_slim',
    name: 'CAN SLIM 法则',
    author: '威廉·欧奈尔',
    description: '结合基本面成长与技术面动能的经典策略',
    strategies: [
      'fund_roe',
      'growth_profit',
      'tech_breakout',
      'tech_volume',
      'tech_sector',
      'fund_low_pe',
      'tech_ma_cross',
    ],
    timeFrame: 'medium',
    riskLevel: 'medium',
    successRate: '历史回测年化收益约 20-30%',
    icon: '📈',
  },
  {
    id: 'buffett_value',
    name: '巴菲特价值投资',
    author: '沃伦·巴菲特',
    description: '寻找具有护城河的优质企业，长期持有',
    strategies: [
      'quality_moat',
      'quality_cash_cow',
      'fund_roe',
      'fund_cash_flow',
      'fund_high_dividend',
    ],
    timeFrame: 'long',
    riskLevel: 'low',
    successRate: '长期年化收益约 15-20%',
    icon: '🏰',
  },
  {
    id: 'lynch_growth',
    name: '彼得林奇成长投资',
    author: '彼得·林奇',
    description: '寻找 PEG 合理的高成长股',
    strategies: [
      'growth_peg',
      'growth_revenue',
      'growth_profit',
      'fund_low_pe',
      'quality_leader',
    ],
    timeFrame: 'medium',
    riskLevel: 'medium',
    successRate: '麦哲伦基金年化收益约 29%',
    icon: '🚀',
  },
  {
    id: 'reversal_combo',
    name: '超跌反弹组合',
    author: '左侧交易者',
    description: '寻找被市场过度抛售的标的',
    strategies: [
      'reversal_oversold',
      'reversal_support',
      'fund_roe',
      'fund_cash_flow',
    ],
    timeFrame: 'medium',
    riskLevel: 'high',
    successRate: '需要严格止损',
    icon: '🔄',
  },
  {
    id: 'technical_short',
    name: '技术面短线组合',
    author: '短线交易者',
    description: '适合短线波段操作的技术指标组合',
    strategies: [
      'tech_ma_cross',
      'tech_macd',
      'tech_kdj',
      'tech_volume',
      'tech_breakout',
    ],
    timeFrame: 'short',
    riskLevel: 'high',
    successRate: '需要盯盘，风险较高',
    icon: '⚡',
  },
  {
    id: 'dividend_income',
    name: '红利投资组合',
    author: '稳健投资者',
    description: '追求稳定现金流的分红策略',
    strategies: [
      'fund_high_dividend',
      'fund_cash_flow',
      'quality_cash_cow',
      'fund_roe',
    ],
    timeFrame: 'long',
    riskLevel: 'low',
    successRate: '年化股息收益 4-6%',
    icon: '💰',
  },
]
```

- [ ] **Step 3: 更新 types/scan.ts**

```typescript
// types/scan.ts
export type ScanScope = 'all' | 'watchlist' | 'hs300'

// 扫描配置
export interface ScanConfig {
  scope: ScanScope
  strategies: string[]  // 选中的策略 ID
  templateId?: string   // 使用的模板 ID（可选）
}

// 扫描结果中的信号标记
export interface ScanSignal {
  strategyId: string
  strategyName: string
  category: string
  strength: 'strong' | 'medium' | 'weak'
  warnings: string[]
}

// 导出
export type { StrategyId, Strategy, StrategyCategory, StrategyTimeFrame, RiskLevel } from './strategy'
export type { StrategyTemplate } from './strategy-template'
export { STRATEGIES, DEFAULT_ENABLED_STRATEGIES, STRATEGIES_BY_CATEGORY } from './strategy'
export { STRATEGY_TEMPLATES } from './strategy-template'
```

- [ ] **Step 4: 提交类型定义**

```bash
git add types/strategy.ts types/strategy-template.ts types/scan.ts
git commit -m "feat(types): add comprehensive strategy system with 6 categories and 25+ strategies"
```

### Task 6.2: 更新 scanStore 支持完整策略系统

**Files:**
- Modify: `store/scanStore.ts`

- [ ] **Step 1: 更新 scanStore 添加策略状态和模板支持**

```typescript
// store/scanStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanScope, StrategyId } from '@/types/scan'
import { DEFAULT_ENABLED_STRATEGIES, STRATEGY_TEMPLATES } from '@/types/strategy'

interface ScanState {
  // 扫描范围
  scope: ScanScope

  // 策略选择
  enabledStrategies: StrategyId[]
  activeTemplateId: string | null

  // 扫描结果
  results: ScanResult[]
  lastScanTime: string | null

  // 范围操作
  setScope: (scope: ScanScope) => void

  // 策略操作
  toggleStrategy: (strategy: StrategyId) => void
  setEnabledStrategies: (strategies: StrategyId[]) => void
  applyTemplate: (templateId: string) => void
  clearTemplate: () => void
  resetStrategies: () => void

  // 结果操作
  setResults: (results: ScanResult[]) => void
  clearResults: () => void
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scope: 'watchlist',
      enabledStrategies: DEFAULT_ENABLED_STRATEGIES,
      activeTemplateId: null,
      results: [],
      lastScanTime: null,

      setScope: (scope) => set({ scope }),

      toggleStrategy: (strategy) =>
        set((state) => {
          const isEnabled = state.enabledStrategies.includes(strategy)
          if (isEnabled) {
            // 至少保留一个策略
            if (state.enabledStrategies.length <= 1) return state
            return {
              enabledStrategies: state.enabledStrategies.filter((s) => s !== strategy),
              activeTemplateId: null,  // 手动修改后清除模板
            }
          }
          return {
            enabledStrategies: [...state.enabledStrategies, strategy],
            activeTemplateId: null,
          }
        }),

      setEnabledStrategies: (strategies) =>
        set({
          enabledStrategies: strategies.length > 0 ? strategies : DEFAULT_ENABLED_STRATEGIES,
          activeTemplateId: null,
        }),

      applyTemplate: (templateId) => {
        const template = STRATEGY_TEMPLATES.find((t) => t.id === templateId)
        if (!template) return

        set({
          enabledStrategies: template.strategies,
          activeTemplateId: templateId,
        })
      },

      clearTemplate: () => set({ activeTemplateId: null }),

      resetStrategies: () =>
        set({
          enabledStrategies: DEFAULT_ENABLED_STRATEGIES,
          activeTemplateId: null,
        }),

      setResults: (results) =>
        set({
          results,
          lastScanTime: new Date().toISOString(),
        }),

      clearResults: () =>
        set({
          results: [],
          lastScanTime: null,
        }),
    }),
    {
      name: 'stock-tracker-scan',
      partialize: (state) => ({
        scope: state.scope,
        enabledStrategies: state.enabledStrategies,
        activeTemplateId: state.activeTemplateId,
      }),
    }
  )
)
```

- [ ] **Step 2: 提交 store 更新**

```bash
git add store/scanStore.ts
git commit -m "feat(store): add comprehensive strategy selection with template support"
```

### Task 6.3: 创建策略检测函数（模块化）

**Files:**
- Create: `lib/scanner/strategies/` 目录
- Create: 各策略检测函数文件

- [ ] **Step 1: 创建策略检测目录结构**

```
lib/scanner/strategies/
├── index.ts                    # 统一导出
├── types.ts                    # 检测参数类型
├── technical/                  # 技术面策略
│   ├── index.ts
│   ├── breakout.ts
│   ├── volume.ts
│   ├── sector.ts
│   ├── ma-cross.ts
│   ├── macd.ts
│   ├── kdj.ts
│   ├── support.ts
│   ├── resistance.ts
│   └── rsi.ts
├── fundamental/                # 基本面策略
│   ├── index.ts
│   ├── pe.ts
│   ├── pb.ts
│   ├── dividend.ts
│   ├── roe.ts
│   └── cash-flow.ts
├── growth/                     # 高成长策略
│   ├── index.ts
│   ├── revenue.ts
│   ├── profit.ts
│   ├── peg.ts
│   └── expansion.ts
├── quality/                    # 高质量策略
│   ├── index.ts
│   ├── moat.ts
│   ├── leader.ts
│   ├── brand.ts
│   └── cash-cow.ts
├── reversal/                   # 超跌反弹策略
│   ├── index.ts
│   ├── oversold.ts
│   ├── support.ts
│   ├── bollinger.ts
│   └── gap.ts
└── event/                      # 事件驱动策略
    ├── index.ts
    ├── earnings.ts
    ├── dividend.ts
    ├── repurchase.ts
    └── institution.ts
```

- [ ] **Step 2: 创建检测参数类型**

```typescript
// lib/scanner/strategies/types.ts
import type { StrategyId } from '@/types/strategy'

// 检测结果
export interface DetectionResult {
  strategyId: StrategyId
  matched: boolean
  strength: 'strong' | 'medium' | 'weak'
  value?: number
  reason: string
}

// 股票数据（检测所需）
export interface StockDataForDetection {
  // 基础信息
  code: string
  name: string
  price: number
  prevPrice: number
  changePercent: number
  volume: number

  // 技术指标
  high20d?: number
  low20d?: number
  avgVolume5d?: number
  ma5?: number
  ma10?: number
  ma20?: number
  prevMa5?: number
  prevMa10?: number
  macd?: {
    dif: number
    dea: number
    histogram: number
    prevDif?: number
    prevDea?: number
  }
  kdj?: {
    k: number
    d: number
    j: number
    prevK?: number
    prevD?: number
  }
  rsi?: number
  bbUpper?: number
  bbLower?: number
  supportLevel?: number
  resistanceLevel?: number

  // 基本面数据
  pe?: number
  pb?: number
  industryPe?: number
  roe?: number
  roeHistory?: number[]
  grossMargin?: number
  dividendYield?: number
  dividendHistory?: number[]
  operatingCashFlow?: number
  netProfit?: number
  freeCashFlow?: number
  revenue?: number
  revenueYoY?: number
  netProfitYoY?: number
  growthRate?: number
  rdExpense?: number
  marketShare?: number

  // 板块/行业数据
  sectorCode?: string
  sectorName?: string
  sectorChangePercent?: number
}

// 检测函数签名
export type StrategyDetector = (
  data: StockDataForDetection
) => DetectionResult | null
```

- [ ] **Step 3: 创建技术面策略检测函数**

```typescript
// lib/scanner/strategies/technical/breakout.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectBreakout(data: StockDataForDetection): DetectionResult | null {
  if (!data.high20d) return null

  const ratio = data.price / data.high20d
  const matched = ratio >= 0.99

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (ratio >= 1) strength = 'strong'  // 创新高
  else if (ratio < 0.995) strength = 'weak'

  return {
    strategyId: 'tech_breakout',
    matched: true,
    strength,
    value: ratio,
    reason: ratio >= 1
      ? '股价创 20 日新高'
      : `股价接近 20 日新高 ${(ratio * 100).toFixed(1)}%`,
  }
}
```

```typescript
// lib/scanner/strategies/technical/volume.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectVolume(data: StockDataForDetection): DetectionResult | null {
  if (!data.avgVolume5d) return null

  const volumeRatio = data.volume / data.avgVolume5d
  const matched = data.changePercent > 0 && volumeRatio >= 2

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (volumeRatio >= 3) strength = 'strong'
  else if (volumeRatio < 2.5) strength = 'weak'

  return {
    strategyId: 'tech_volume',
    matched: true,
    strength,
    value: volumeRatio,
    reason: `放量 ${volumeRatio.toFixed(1)} 倍上涨 ${data.changePercent.toFixed(2)}%`,
  }
}
```

```typescript
// lib/scanner/strategies/technical/sector.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectSector(data: StockDataForDetection): DetectionResult | null {
  if (!data.sectorChangePercent) return null

  const matched =
    data.changePercent > 0 &&
    data.sectorChangePercent > 1

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (data.sectorChangePercent > 2 && data.changePercent > data.sectorChangePercent) {
    strength = 'strong'
  }

  return {
    strategyId: 'tech_sector',
    matched: true,
    strength,
    reason: `板块 ${data.sectorName || ''} 上涨 ${data.sectorChangePercent.toFixed(2)}%，个股上涨 ${data.changePercent.toFixed(2)}%`,
  }
}
```

```typescript
// lib/scanner/strategies/technical/ma-cross.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectMACross(data: StockDataForDetection): DetectionResult | null {
  if (!data.ma5 || !data.ma10 || !data.prevMa5 || !data.prevMa10) return null

  // 金叉：当前 MA5 > MA10，之前 MA5 <= MA10
  const isCross = data.ma5 > data.ma10 && data.prevMa5 <= data.prevMa10

  if (!isCross) return null

  // 趋势确认：MA10 向上
  const trendUp = data.ma10 > data.prevMa10
  const strength: 'strong' | 'medium' | 'weak' = trendUp ? 'strong' : 'medium'

  return {
    strategyId: 'tech_ma_cross',
    matched: true,
    strength,
    reason: `MA5(${data.ma5.toFixed(2)}) 上穿 MA10(${data.ma10.toFixed(2)})`,
  }
}
```

```typescript
// lib/scanner/strategies/technical/rsi.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectRSIOversold(data: StockDataForDetection): DetectionResult | null {
  if (!data.rsi) return null

  // RSI < 30 为超卖
  if (data.rsi >= 30) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (data.rsi < 20) strength = 'strong'
  else if (data.rsi > 25) strength = 'weak'

  return {
    strategyId: 'tech_rsi_oversold',
    matched: true,
    strength,
    value: data.rsi,
    reason: `RSI(${data.rsi.toFixed(1)}) 进入超卖区`,
  }
}
```

- [ ] **Step 4: 创建基本面策略检测函数**

```typescript
// lib/scanner/strategies/fundamental/pe.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectLowPE(data: StockDataForDetection): DetectionResult | null {
  if (!data.pe || !data.industryPe) return null

  const ratio = data.pe / data.industryPe
  const matched = ratio < 0.7  // PE 低于行业平均 30%

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (ratio < 0.5) strength = 'strong'
  else if (ratio > 0.6) strength = 'weak'

  return {
    strategyId: 'fund_low_pe',
    matched: true,
    strength,
    value: data.pe,
    reason: `PE(${data.pe.toFixed(1)}) 低于行业平均(${data.industryPe.toFixed(1)}) ${(1 - ratio) * 100}%`,
  }
}
```

```typescript
// lib/scanner/strategies/fundamental/roe.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectHighROE(data: StockDataForDetection): DetectionResult | null {
  if (!data.roe) return null

  const matched = data.roe >= 15

  if (!matched) return null

  // 检查连续性
  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (data.roeHistory && data.roeHistory.length >= 3) {
    const consistent = data.roeHistory.every(r => r >= 15)
    if (consistent && data.roe >= 20) strength = 'strong'
    else if (!consistent) strength = 'weak'
  }

  return {
    strategyId: 'fund_roe',
    matched: true,
    strength,
    value: data.roe,
    reason: `ROE ${data.roe.toFixed(1)}%${data.roeHistory ? `，近${data.roeHistory.length}年平均` : ''}`,
  }
}
```

- [ ] **Step 5: 创建成长策略检测函数**

```typescript
// lib/scanner/strategies/growth/revenue.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectRevenueGrowth(data: StockDataForDetection): DetectionResult | null {
  if (!data.revenueYoY) return null

  const matched = data.revenueYoY >= 30

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (data.revenueYoY >= 50) strength = 'strong'
  else if (data.revenueYoY < 40) strength = 'weak'

  return {
    strategyId: 'growth_revenue',
    matched: true,
    strength,
    value: data.revenueYoY,
    reason: `营收同比增长 ${data.revenueYoY.toFixed(1)}%`,
  }
}
```

```typescript
// lib/scanner/strategies/growth/peg.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectPEG(data: StockDataForDetection): DetectionResult | null {
  if (!data.pe || !data.growthRate) return null
  if (data.growthRate <= 0) return null

  const peg = data.pe / data.growthRate
  const matched = peg < 1

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (peg < 0.5) strength = 'strong'
  else if (peg > 0.8) strength = 'weak'

  return {
    strategyId: 'growth_peg',
    matched: true,
    strength,
    value: peg,
    reason: `PEG ${peg.toFixed(2)}，PE(${data.pe})/增长率(${data.growthRate}%)`,
  }
}
```

- [ ] **Step 6: 创建高质量策略检测函数**

```typescript
// lib/scanner/strategies/quality/moat.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectMoat(data: StockDataForDetection): DetectionResult | null {
  if (!data.grossMargin || !data.roe) return null

  const matched = data.grossMargin >= 40 && data.roe >= 15

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (data.grossMargin >= 50 && data.roe >= 20) strength = 'strong'
  else if (data.grossMargin < 45 || data.roe < 18) strength = 'weak'

  return {
    strategyId: 'quality_moat',
    matched: true,
    strength,
    reason: `毛利率${data.grossMargin.toFixed(1)}% + ROE${data.roe.toFixed(1)}%，具备护城河特征`,
  }
}
```

- [ ] **Step 7: 创建超跌反弹策略检测函数**

```typescript
// lib/scanner/strategies/reversal/oversold.ts
import type { DetectionResult, StockDataForDetection } from '../types'

export function detectOversold(data: StockDataForDetection): DetectionResult | null {
  // 计算跌幅（需要历史数据）
  // 简化：使用当前价格与 20 日高点的跌幅
  if (!data.high20d) return null

  const dropPercent = ((data.high20d - data.price) / data.high20d) * 100
  const matched = dropPercent >= 30 && (data.rsi || 50) < 30

  if (!matched) return null

  let strength: 'strong' | 'medium' | 'weak' = 'medium'
  if (dropPercent >= 40) strength = 'strong'
  else if (dropPercent < 35) strength = 'weak'

  return {
    strategyId: 'reversal_oversold',
    matched: true,
    strength,
    value: dropPercent,
    reason: `较 20 日高点下跌 ${dropPercent.toFixed(1)}%，RSI ${data.rsi?.toFixed(1)}`,
  }
}
```

- [ ] **Step 8: 创建统一检测入口**

```typescript
// lib/scanner/strategies/index.ts
import type { StrategyId } from '@/types/strategy'
import type { DetectionResult, StockDataForDetection } from './types'

// 技术面
import { detectBreakout } from './technical/breakout'
import { detectVolume } from './technical/volume'
import { detectSector } from './technical/sector'
import { detectMACross } from './technical/ma-cross'
import { detectRSIOversold } from './technical/rsi'

// 基本面
import { detectLowPE } from './fundamental/pe'
import { detectHighROE } from './fundamental/roe'

// 成长
import { detectRevenueGrowth } from './growth/revenue'
import { detectPEG } from './growth/peg'

// 质量
import { detectMoat } from './quality/moat'

// 超跌
import { detectOversold } from './reversal/oversold'

// 策略检测函数映射
const DETECTORS: Partial<Record<StrategyId, (data: StockDataForDetection) => DetectionResult | null>> = {
  // 技术面
  tech_breakout: detectBreakout,
  tech_volume: detectVolume,
  tech_sector: detectSector,
  tech_ma_cross: detectMACross,
  tech_rsi_oversold: detectRSIOversold,

  // 基本面
  fund_low_pe: detectLowPE,
  fund_roe: detectHighROE,

  // 成长
  growth_revenue: detectRevenueGrowth,
  growth_peg: detectPEG,

  // 质量
  quality_moat: detectMoat,

  // 超跌
  reversal_oversold: detectOversold,
}

/**
 * 执行策略检测
 * @param data 股票数据
 * @param enabledStrategies 启用的策略列表
 * @returns 检测结果数组
 */
export function detectStrategies(
  data: StockDataForDetection,
  enabledStrategies: StrategyId[]
): DetectionResult[] {
  const results: DetectionResult[] = []

  for (const strategyId of enabledStrategies) {
    const detector = DETECTORS[strategyId]
    if (!detector) {
      console.warn(`Detector not implemented for strategy: ${strategyId}`)
      continue
    }

    try {
      const result = detector(data)
      if (result && result.matched) {
        results.push(result)
      }
    } catch (error) {
      console.error(`Error detecting strategy ${strategyId}:`, error)
    }
  }

  return results
}

export type { DetectionResult, StockDataForDetection }
```

- [ ] **Step 9: 提交策略检测逻辑**

```bash
git add lib/scanner/strategies/
git commit -m "feat(scanner): add comprehensive strategy detection system with 25+ strategies"
```

### Task 6.4: 创建策略选择 UI 组件

**Files:**
- Create: `components/scan/StrategySelector.tsx`
- Create: `components/scan/StrategyTemplateCard.tsx`
- Modify: `components/scan/ScanControl.tsx`

- [ ] **Step 1: 创建 StrategySelector 组件**

```typescript
// components/scan/StrategySelector.tsx
'use client'

import { useMemo, useState } from 'react'
import { Settings2, ChevronDown, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  STRATEGIES,
  STRATEGIES_BY_CATEGORY,
  type StrategyId,
  type StrategyCategory,
} from '@/types/strategy'

interface StrategySelectorProps {
  enabledStrategies: StrategyId[]
  onToggle: (strategy: StrategyId) => void
  onReset: () => void
}

const CATEGORY_CONFIG: Record<StrategyCategory, { label: string; icon: string; color: string }> = {
  technical: { label: '技术面策略', icon: '📊', color: 'text-blue-600' },
  fundamental: { label: '基本面策略', icon: '📈', color: 'text-green-600' },
  growth: { label: '高成长策略', icon: '🚀', color: 'text-purple-600' },
  quality: { label: '高质量策略', icon: '🏰', color: 'text-amber-600' },
  reversal: { label: '超跌反弹策略', icon: '🔄', color: 'text-orange-600' },
  event: { label: '事件驱动策略', icon: '📰', color: 'text-cyan-600' },
}

const TIME_FRAME_LABELS = {
  short: { label: '短线', color: 'bg-red-100 text-red-700' },
  medium: { label: '中线', color: 'bg-yellow-100 text-yellow-700' },
  long: { label: '长线', color: 'bg-green-100 text-green-700' },
}

const RISK_LABELS = {
  low: { label: '低风险', color: 'text-green-600' },
  medium: { label: '中风险', color: 'text-yellow-600' },
  high: { label: '高风险', color: 'text-red-600' },
}

export function StrategySelector({
  enabledStrategies,
  onToggle,
  onReset,
}: StrategySelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<StrategyCategory | null>(null)

  // 统计各类别选中数量
  const categoryCounts = useMemo(() => {
    const counts: Record<StrategyCategory, number> = {
      technical: 0,
      fundamental: 0,
      growth: 0,
      quality: 0,
      reversal: 0,
      event: 0,
    }
    for (const strategyId of enabledStrategies) {
      const strategy = STRATEGIES.find(s => s.id === strategyId)
      if (strategy) {
        counts[strategy.category]++
      }
    }
    return counts
  }, [enabledStrategies])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          策略选择
          <Badge variant="secondary" className="ml-1">
            {enabledStrategies.length}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] max-h-[70vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          {/* 标题栏 */}
          <div className="flex items-center justify-between sticky top-0 bg-background py-2">
            <h4 className="font-medium">选择扫描策略</h4>
            <Button variant="ghost" size="sm" onClick={onReset}>
              重置
            </Button>
          </div>

          {/* 单一指标风险提示 */}
          {enabledStrategies.length === 1 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>风险提示：</strong>单一指标容易陷入陷阱，建议组合使用多个策略。
              </div>
            </div>
          )}

          {/* 策略类别列表 */}
          <Accordion
            type="single"
            collapsible
            value={expandedCategory || ''}
            onValueChange={(v) => setExpandedCategory(v as StrategyCategory || null)}
          >
            {(Object.keys(STRATEGIES_BY_CATEGORY) as StrategyCategory[]).map((category) => {
              const config = CATEGORY_CONFIG[category]
              const strategies = STRATEGIES_BY_CATEGORY[category]
              const selectedCount = categoryCounts[category]

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span className={config.color}>{config.label}</span>
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedCount}/{strategies.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {strategies.map((strategy) => {
                        const isEnabled = enabledStrategies.includes(strategy.id)
                        return (
                          <div
                            key={strategy.id}
                            className={cn(
                              'flex items-start gap-3 rounded-md p-2 transition-colors',
                              isEnabled && 'bg-accent'
                            )}
                          >
                            <Checkbox
                              id={strategy.id}
                              checked={isEnabled}
                              onCheckedChange={() => onToggle(strategy.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Label
                                  htmlFor={strategy.id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {strategy.name}
                                </Label>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    TIME_FRAME_LABELS[strategy.timeFrame].color
                                  )}
                                >
                                  {TIME_FRAME_LABELS[strategy.timeFrame].label}
                                </Badge>
                                <span className={cn('text-xs', RISK_LABELS[strategy.riskLevel].color)}>
                                  {RISK_LABELS[strategy.riskLevel].label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {strategy.description}
                              </p>
                              {strategy.warnings.length > 0 && isEnabled && (
                                <div className="flex items-start gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{strategy.warnings[0]}</span>
                                </div>
                              )}
                            </div>
                            {strategy.warnings.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-medium">风险提示</p>
                                      {strategy.warnings.map((w, i) => (
                                        <p key={i} className="text-sm">• {w}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>

          {/* 底部统计 */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            已选择 {enabledStrategies.length} 个策略
            {enabledStrategies.length < 3 && enabledStrategies.length > 0 && (
              <span className="text-amber-600 ml-2">
                • 建议至少选择 3 个策略组合使用
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: 创建 StrategyTemplateCard 组件**

```typescript
// components/scan/StrategyTemplateCard.tsx
'use client'

import { Check, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STRATEGY_TEMPLATES, type StrategyTemplate } from '@/types/strategy-template'

interface StrategyTemplateCardProps {
  activeTemplateId: string | null
  onApply: (templateId: string) => void
}

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
}

const TIME_COLORS = {
  short: 'bg-purple-100 text-purple-700',
  medium: 'bg-blue-100 text-blue-700',
  long: 'bg-indigo-100 text-indigo-700',
}

export function StrategyTemplateCard({
  activeTemplateId,
  onApply,
}: StrategyTemplateCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="font-medium">经典策略模板</h4>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {STRATEGY_TEMPLATES.map((template) => {
          const isActive = activeTemplateId === template.id
          return (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isActive && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onApply(template.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{template.icon}</span>
                      <div>
                        <h5 className="font-medium text-sm">{template.name}</h5>
                        <p className="text-xs text-muted-foreground">{template.author}</p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn('text-xs', RISK_COLORS[template.riskLevel])}>
                      {template.riskLevel === 'low' ? '低风险' : template.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </Badge>
                    <Badge variant="outline" className={cn('text-xs', TIME_COLORS[template.timeFrame])}>
                      {template.timeFrame === 'short' ? '短线' : template.timeFrame === 'medium' ? '中线' : '长线'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {template.strategies.length} 个策略
                    </Badge>
                  </div>

                  {template.successRate && (
                    <p className="text-xs text-green-600">
                      📊 {template.successRate}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 更新 ScanControl 组件集成策略选择**

```typescript
// components/scan/ScanControl.tsx 修改
'use client'

import { useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StrategySelector } from './StrategySelector'
import { StrategyTemplateCard } from './StrategyTemplateCard'
import { useScanStore } from '@/store/scanStore'
import type { ScanScope } from '@/types/scan'

interface ScanControlProps {
  onScan: () => void
  isLoading?: boolean
}

const SCOPE_OPTIONS: { value: ScanScope; label: string; count: string }[] = [
  { value: 'watchlist', label: '自选股', count: '已关注' },
  { value: 'hs300', label: '沪深300', count: '300只' },
  { value: 'all', label: '全市场', count: '~5000只' },
]

export function ScanControl({ onScan, isLoading }: ScanControlProps) {
  const {
    scope,
    setScope,
    enabledStrategies,
    toggleStrategy,
    applyTemplate,
    resetStrategies,
    activeTemplateId,
  } = useScanStore()

  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 第一行：范围 + 策略选择 + 开始扫描 */}
          <div className="flex flex-wrap items-center gap-4">
            {/* 扫描范围 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">扫描范围</label>
              <Select value={scope} onValueChange={(v) => setScope(v as ScanScope)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 策略选择 */}
            <StrategySelector
              enabledStrategies={enabledStrategies}
              onToggle={toggleStrategy}
              onReset={resetStrategies}
            />

            {/* 开始扫描 */}
            <Button
              onClick={onScan}
              disabled={isLoading || enabledStrategies.length === 0}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  扫描中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  开始扫描
                </>
              )}
            </Button>
          </div>

          {/* 第二行：策略模板 */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-muted-foreground"
            >
              {showTemplates ? '收起模板' : '展开经典策略模板'}
            </Button>

            {showTemplates && (
              <div className="mt-4">
                <StrategyTemplateCard
                  activeTemplateId={activeTemplateId}
                  onApply={applyTemplate}
                />
              </div>
            )}
          </div>

          {/* 当前配置摘要 */}
          {activeTemplateId && (
            <div className="text-sm text-muted-foreground">
              当前使用模板：<strong>{
                STRATEGY_TEMPLATES.find(t => t.id === activeTemplateId)?.name
              }</strong>
              <Button
                variant="link"
                size="sm"
                onClick={resetStrategies}
                className="ml-2 h-auto p-0"
              >
                清除
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: 提交策略选择 UI**

```bash
git add components/scan/StrategySelector.tsx components/scan/StrategyTemplateCard.tsx components/scan/ScanControl.tsx
git commit -m "feat(ui): add comprehensive strategy selector with templates and risk warnings"
```

### Task 6.5: 更新 API 和页面集成

**Files:**
- Modify: `app/api/screener/route.ts`
- Modify: `app/scan/page.tsx` 或 `app/screener/page.tsx`

- [ ] **Step 1: 更新 screener API 支持策略过滤**

```typescript
// app/api/screener/route.ts 修改
import { NextRequest, NextResponse } from 'next/server'
import { detectStrategies } from '@/lib/scanner/strategies'
import type { StrategyId } from '@/types/strategy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conditions, scope, watchlist, enabledStrategies } = body as {
      conditions?: any
      scope: string
      watchlist?: string[]
      enabledStrategies?: string[]
    }

    // 验证策略列表
    const strategies = (enabledStrategies || []) as StrategyId[]
    if (strategies.length === 0) {
      return NextResponse.json({
        success: false,
        error: { message: '请至少选择一个策略' },
      }, { status: 400 })
    }

    // 获取股票列表...
    const stocks = await getStockList(scope, watchlist)

    // 对每只股票进行策略检测
    const results = []
    for (const stock of stocks) {
      const detectionResults = detectStrategies(stock, strategies)

      if (detectionResults.length > 0) {
        results.push({
          code: stock.code,
          name: stock.name,
          price: stock.price,
          changePercent: stock.changePercent,
          matchedStrategies: detectionResults.map(r => ({
            id: r.strategyId,
            name: r.reason,
            strength: r.strength,
          })),
          // 计算综合得分
          score: calculateScore(detectionResults),
        })
      }
    }

    // 按得分排序
    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
        scanned: stocks.length,
        strategiesUsed: strategies,
      },
    })
  } catch (error) {
    console.error('Screener error:', error)
    return NextResponse.json({
      success: false,
      error: { message: '扫描失败，请稍后重试' },
    }, { status: 500 })
  }
}

// 计算综合得分
function calculateScore(results: DetectionResult[]): number {
  const strengthScore = { strong: 3, medium: 2, weak: 1 }
  return results.reduce((sum, r) => sum + strengthScore[r.strength], 0)
}
```

- [ ] **Step 2: 更新扫描页面传递策略参数**

```typescript
// 在扫描页面中
import { useScanStore } from '@/store/scanStore'

export default function ScreenerPage() {
  const { scope, enabledStrategies } = useScanStore()

  const handleRunScreener = async () => {
    const response = await fetch('/api/screener', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conditions,
        scope,
        watchlist: stocks,
        enabledStrategies,  // 传递选中的策略
      }),
    })
    // 处理结果...
  }

  // ...
}
```

- [ ] **Step 3: 提交 API 和页面更新**

```bash
git add app/api/screener/route.ts app/screener/page.tsx
git commit -m "feat(api): integrate comprehensive strategy system with screener endpoint"
```

---

## 执行顺序建议（更新）

1. **先完成 Chunk 1** - 自定义 Hooks 层是基础设施，其他模块可复用
2. **然后完成 Chunk 2** - 错误边界提升应用健壮性
3. **接着完成 Chunk 3** - 数据导入导出保护用户数据
4. **然后完成 Chunk 4** - 测试覆盖确保代码质量
5. **接着完成 Chunk 5** - 性能优化提升用户体验
6. **最后完成 Chunk 6** - 多策略扫描增强功能性（最大改动，建议单独迭代）

---

## 验收标准（更新）

### 基础功能
- [ ] 所有 Hooks 创建完成并导出
- [ ] 错误边界组件能正确捕获和显示错误
- [ ] 数据导出生成有效 JSON 文件
- [ ] 数据导入能正确恢复数据
- [ ] 测试覆盖核心 Store 功能
- [ ] 组件性能优化后无明显卡顿

### 多策略扫描功能
- [ ] 支持 6 大策略类别（技术面、基本面、成长、质量、超跌、事件）
- [ ] 支持 25+ 种具体策略可选
- [ ] 每个策略显示风险提示和适用条件
- [ ] 单一策略选择时显示风险警告
- [ ] 策略选择状态持久化存储
- [ ] 扫描结果仅包含选中策略的信号

### 经典策略模板
- [ ] 内置 CAN SLIM、巴菲特价值、彼得林奇成长等 6+ 种模板
- [ ] 一键应用模板加载策略组合
- [ ] 模板显示历史表现说明和风险等级
- [ ] 手动修改策略后自动清除模板关联

### 数据需求
- [ ] 技术面策略：获取 K 线数据计算技术指标
- [ ] 基本面策略：集成财务数据 API
- [ ] 成长策略：获取营收、利润增长数据
- [ ] 质量策略：获取毛利率、ROE 等财务指标
- [ ] 事件策略：获取公告、调研等事件数据

---

## 后续扩展方向

1. **策略回测** - 添加策略历史表现回测功能
2. **自定义策略** - 允许用户创建自定义策略组合
3. **策略分享** - 分享和导入其他用户的策略模板
4. **AI 推荐** - 根据用户偏好推荐策略组合
5. **实时监控** - 对选中策略进行实时监控和推送