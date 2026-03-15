// app/scan/page.tsx

'use client'

import { useEffect } from 'react'
import {
  ScanControl,
  ScanProgress,
  ScanResults,
  StrategySelector,
  StrategyTemplateCard,
} from '@/components/scan'
import { useScanStore } from '@/store/scanStore'
import type { ScanScope } from '@/types/scan'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ScanPage() {
  const {
    status,
    progress,
    results,
    scope,
    selectedStrategies,
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
    <div className="animate-slide-up space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="page-title">市场扫描</h1>
        <p className="page-description">扫描全市场，发现符合策略的股票机会</p>
      </div>

      {/* 策略选择区域 */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="templates">经典模板</TabsTrigger>
          <TabsTrigger value="custom">自定义策略</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-4">
          <StrategyTemplateCard />
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <StrategySelector />
        </TabsContent>
      </Tabs>

      {/* 扫描控制 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            清除结果
          </button>
        )}
      </div>

      {/* 扫描进度 */}
      {(status === 'scanning' || status === 'completed') && (
        <ScanProgress progress={progress} status={status} foundCount={results.length} />
      )}

      {/* 扫描结果 */}
      {results.length > 0 ? (
        <ScanResults results={results} />
      ) : status === 'idle' ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-muted-foreground">
          <p className="text-lg font-medium">点击「开始扫描」发现投资机会</p>
          <p className="mt-2 text-sm">
            {scope === 'all' && '预计扫描时间：5-10分钟'}
            {scope === 'hs300' && '预计扫描时间：约30秒'}
            {scope === 'watchlist' && '扫描您的自选股'}
          </p>
          <p className="mt-1 text-xs">已选择 {selectedStrategies.length} 个策略</p>
        </div>
      ) : null}
    </div>
  )
}
