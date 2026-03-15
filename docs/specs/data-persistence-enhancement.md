# 数据持久化增强技术方案

> 创建日期: 2026-03-14
> 版本: 1.0
> 状态: 待实施

## 一、功能概述

### 1.1 功能范围

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 数据导出 | P2 | 将用户数据导出为 JSON 文件 |
| 数据导入 | P2 | 从 JSON 文件恢复用户数据 |
| 数据同步（可选） | P3 | 未来支持云端同步 |

### 1.2 当前数据存储状态

**现有存储方式：** Zustand persist + localStorage

| Store | localStorage Key | 数据内容 |
|-------|------------------|----------|
| stockStore | `stock-tracker-watchlist` | 自选股列表、分组 |
| positionStore | `stock-tracker-position` | 持仓信息 |
| portfolioStore | `stock-tracker-portfolio` | 持仓记录（旧版） |
| alertStore | `stock-tracker-alerts` | 预警规则、提醒日志 |
| operationPlanStore | `stock-tracker-operation-plan` | 操作计划 |
| signalStore | `stock-tracker-signal` | 信号记录 |

**存在的问题：**
1. localStorage 容量限制约 5MB
2. 数据仅在当前浏览器可用
3. 无法跨设备同步
4. 清除浏览器数据会丢失所有数据

---

## 二、数据模型设计

### 2.1 导出数据结构

```typescript
// types/export.ts

interface ExportData {
  // 元信息
  version: string              // 数据版本号
  exportedAt: string           // 导出时间
  appVersion: string           // 应用版本

  // 用户数据
  data: {
    watchlist: WatchlistExport
    positions: PositionExport
    alerts: AlertExport
    operationPlans: OperationPlanExport
  }
}

// 自选股导出数据
interface WatchlistExport {
  stocks: string[]             // 股票代码列表
  groups: WatchlistGroup[]     // 分组信息
}

interface WatchlistGroup {
  id: string
  name: string
  stocks: string[]
  sortOrder: number
}

// 持仓导出数据
interface PositionExport {
  positions: Position[]
}

interface Position {
  id: string
  stockCode: string
  stockName: string
  quantity: number
  buyPrice: number
  buyDate: string
  takeProfit?: number
  currentStopLoss?: number
  highestPrice?: number
  note?: string
}

// 预警导出数据
interface AlertExport {
  alerts: Alert[]
  smartAlerts: SmartAlert[]
  settings: AlertSettings
}

// 操作计划导出数据
interface OperationPlanExport {
  plans: OperationPlan[]
  history: OperationPlan[]
}
```

### 2.2 导入选项

```typescript
// types/export.ts

interface ImportOptions {
  // 导入模式
  mode: 'merge' | 'replace'

  // 选择性导入
  includeWatchlist: boolean
  includePositions: boolean
  includeAlerts: boolean
  includePlans: boolean
}

interface ImportResult {
  success: boolean
  imported: {
    watchlist: number
    positions: number
    alerts: number
    plans: number
  }
  errors: string[]
  warnings: string[]
}
```

---

## 三、导出功能实现

### 3.1 导出服务

**位置：** `lib/data/export.ts`

```typescript
// lib/data/export.ts

import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { useAlertStore } from '@/store/alertStore'
import { useOperationPlanStore } from '@/store/operationPlanStore'
import type { ExportData } from '@/types/export'

const CURRENT_VERSION = '1.0'
const APP_VERSION = process.env.npm_package_version || '1.0.0'

/**
 * 收集所有用户数据
 */
export function collectExportData(): ExportData {
  const watchlistState = useWatchlistStore.getState()
  const positionState = usePositionStore.getState()
  const alertState = useAlertStore.getState()
  const planState = useOperationPlanStore.getState()

  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,

    data: {
      watchlist: {
        stocks: watchlistState.stocks,
        groups: watchlistState.groups || [],
      },
      positions: {
        positions: positionState.positions,
      },
      alerts: {
        alerts: alertState.alerts,
        smartAlerts: alertState.smartAlerts,
        settings: alertState.settings,
      },
      operationPlans: {
        plans: planState.plans,
        history: planState.history,
      },
    },
  }
}

/**
 * 导出为 JSON 文件
 */
export function exportToFile(filename?: string): void {
  const data = collectExportData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || generateFilename()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 生成文件名
 */
function generateFilename(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `stock-tracker-backup-${y}${m}${d}.json`
}

/**
 * 导出为 Base64 字符串（用于分享）
 */
export function exportToBase64(): string {
  const data = collectExportData()
  const json = JSON.stringify(data)
  return btoa(encodeURIComponent(json))
}

/**
 * 从 Base64 字符串解析
 */
export function parseFromBase64(base64: string): ExportData {
  const json = decodeURIComponent(atob(base64))
  return JSON.parse(json)
}
```

### 3.2 导出按钮组件

**位置：** `components/settings/ExportButton.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Download, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToFile } from '@/lib/data/export'

export function ExportButton() {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done'>('idle')

  const handleExport = () => {
    setStatus('exporting')
    try {
      exportToFile()
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      console.error('Export failed:', error)
      setStatus('idle')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={status === 'exporting'}
    >
      {status === 'idle' && (
        <>
          <Download className="w-4 h-4 mr-2" />
          导出数据
        </>
      )}
      {status === 'exporting' && (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          导出中...
        </>
      )}
      {status === 'done' && (
        <>
          <Check className="w-4 h-4 mr-2 text-green-500" />
          导出成功
        </>
      )}
    </Button>
  )
}
```

---

## 四、导入功能实现

### 4.1 导入服务

**位置：** `lib/data/import.ts`

```typescript
// lib/data/import.ts

import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { useAlertStore } from '@/store/alertStore'
import { useOperationPlanStore } from '@/store/operationPlanStore'
import type { ExportData, ImportOptions, ImportResult } from '@/types/export'

const SUPPORTED_VERSIONS = ['1.0']

/**
 * 验证导入数据
 */
export function validateImportData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '无效的数据格式' }
  }

  const exportData = data as ExportData

  // 检查版本
  if (!exportData.version) {
    return { valid: false, error: '缺少版本信息' }
  }

  if (!SUPPORTED_VERSIONS.includes(exportData.version)) {
    return { valid: false, error: `不支持的版本: ${exportData.version}` }
  }

  // 检查数据结构
  if (!exportData.data) {
    return { valid: false, error: '缺少数据内容' }
  }

  return { valid: true }
}

/**
 * 执行数据导入
 */
export function executeImport(
  data: ExportData,
  options: ImportOptions
): ImportResult {
  const result: ImportResult = {
    success: true,
    imported: { watchlist: 0, positions: 0, alerts: 0, plans: 0 },
    errors: [],
    warnings: [],
  }

  const watchlistState = useWatchlistStore.getState()
  const positionState = usePositionStore.getState()
  const alertState = useAlertStore.getState()
  const planState = useOperationPlanStore.getState()

  // 替换模式：先清空现有数据
  if (options.mode === 'replace') {
    if (options.includeWatchlist) {
      // 清空自选股
      watchlistState.stocks.forEach(code => {
        watchlistState.removeStock(code)
      })
    }
    if (options.includePositions) {
      // 清空持仓
      positionState.positions.forEach(p => {
        positionState.removePosition(p.id)
      })
    }
    // 其他类似...
  }

  // 导入自选股
  if (options.includeWatchlist && data.data.watchlist) {
    try {
      const { stocks, groups } = data.data.watchlist

      for (const code of stocks) {
        if (options.mode === 'merge' && watchlistState.stocks.includes(code)) {
          result.warnings.push(`自选股 ${code} 已存在，跳过`)
          continue
        }
        watchlistState.addStock(code)
        result.imported.watchlist++
      }

      // 导入分组（合并模式）
      if (groups && groups.length > 0) {
        // 分组导入逻辑...
      }
    } catch (error) {
      result.errors.push(`自选股导入失败: ${error}`)
    }
  }

  // 导入持仓
  if (options.includePositions && data.data.positions) {
    try {
      for (const position of data.data.positions.positions) {
        if (options.mode === 'merge') {
          const exists = positionState.positions.some(
            p => p.stockCode === position.stockCode
          )
          if (exists) {
            result.warnings.push(`持仓 ${position.stockCode} 已存在，跳过`)
            continue
          }
        }
        positionState.addPosition(position)
        result.imported.positions++
      }
    } catch (error) {
      result.errors.push(`持仓导入失败: ${error}`)
    }
  }

  // 导入预警
  if (options.includeAlerts && data.data.alerts) {
    try {
      const { alerts, smartAlerts, settings } = data.data.alerts

      for (const alert of alerts) {
        alertState.addAlert(alert)
        result.imported.alerts++
      }

      // smartAlerts 和 settings 类似...
    } catch (error) {
      result.errors.push(`预警导入失败: ${error}`)
    }
  }

  // 导入操作计划
  if (options.includePlans && data.data.operationPlans) {
    try {
      for (const plan of data.data.operationPlans.plans) {
        planState.addPlan(plan)
        result.imported.plans++
      }
    } catch (error) {
      result.errors.push(`操作计划导入失败: ${error}`)
    }
  }

  result.success = result.errors.length === 0
  return result
}

/**
 * 从文件读取并导入
 */
export async function importFromFile(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        const validation = validateImportData(data)
        if (!validation.valid) {
          resolve({
            success: false,
            imported: { watchlist: 0, positions: 0, alerts: 0, plans: 0 },
            errors: [validation.error || '验证失败'],
            warnings: [],
          })
          return
        }

        const result = executeImport(data as ExportData, options)
        resolve(result)
      } catch (error) {
        reject(new Error('文件解析失败'))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
```

### 4.2 导入按钮组件

**位置：** `components/settings/ImportButton.tsx`

```tsx
'use client'

import { useState, useRef } from 'react'
import { Upload, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { importFromFile } from '@/lib/data/import'
import type { ImportOptions, ImportResult } from '@/types/export'

export function ImportButton() {
  const [step, setStep] = useState<'select' | 'config' | 'importing' | 'result'>('select')
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    mode: 'merge',
    includeWatchlist: true,
    includePositions: true,
    includeAlerts: true,
    includePlans: true,
  })
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStep('config')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setStep('importing')
    try {
      const importResult = await importFromFile(file, options)
      setResult(importResult)
      setStep('result')
    } catch (error) {
      setResult({
        success: false,
        imported: { watchlist: 0, positions: 0, alerts: 0, plans: 0 },
        errors: [String(error)],
        warnings: [],
      })
      setStep('result')
    }
  }

  const handleClose = () => {
    setDialogOpen(false)
    setStep('select')
    setFile(null)
    setResult(null)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        导入数据
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
          </DialogHeader>

          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                选择之前导出的备份文件（JSON 格式）
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                选择文件
              </Button>
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-4">
              <p className="text-sm">已选择: {file?.name}</p>

              {/* 导入模式 */}
              <div className="space-y-2">
                <Label>导入模式</Label>
                <RadioGroup
                  value={options.mode}
                  onValueChange={(v) => setOptions({ ...options, mode: v as 'merge' | 'replace' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge">合并（保留现有数据）</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace">替换（清空现有数据）</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 选择导入内容 */}
              <div className="space-y-2">
                <Label>导入内容</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-watchlist"
                      checked={options.includeWatchlist}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeWatchlist: !!c })
                      }
                    />
                    <Label htmlFor="import-watchlist">自选股</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-positions"
                      checked={options.includePositions}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includePositions: !!c })
                      }
                    />
                    <Label htmlFor="import-positions">持仓</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-alerts"
                      checked={options.includeAlerts}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includeAlerts: !!c })
                      }
                    />
                    <Label htmlFor="import-alerts">预警规则</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-plans"
                      checked={options.includePlans}
                      onCheckedChange={(c) =>
                        setOptions({ ...options, includePlans: !!c })
                      }
                    />
                    <Label htmlFor="import-plans">操作计划</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  取消
                </Button>
                <Button onClick={handleImport}>开始导入</Button>
              </DialogFooter>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">正在导入...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              {result.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>导入成功</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>导入完成，但有错误</span>
                </div>
              )}

              <div className="text-sm space-y-1">
                <p>自选股: {result.imported.watchlist} 条</p>
                <p>持仓: {result.imported.positions} 条</p>
                <p>预警规则: {result.imported.alerts} 条</p>
                <p>操作计划: {result.imported.plans} 条</p>
              </div>

              {result.warnings.length > 0 && (
                <div className="text-sm text-yellow-600">
                  <p className="font-medium">警告:</p>
                  <ul className="list-disc list-inside">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  <p className="font-medium">错误:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button onClick={handleClose}>完成</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## 五、设置页面集成

### 5.1 数据管理区块

**位置：** `app/settings/page.tsx`（新建）

```tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportButton } from '@/components/settings/ExportButton'
import { ImportButton } from '@/components/settings/ImportButton'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-1">
          管理应用设置和数据
        </p>
      </div>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>
            导出或导入您的自选股、持仓、预警等数据
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <ExportButton />
          <ImportButton />
        </CardContent>
      </Card>

      {/* 数据统计 */}
      <Card>
        <CardHeader>
          <CardTitle>数据统计</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 显示各类数据数量 */}
        </CardContent>
      </Card>

      {/* 清除数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">危险操作</CardTitle>
          <CardDescription>
            清除所有数据（不可恢复）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">清除所有数据</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 六、数据版本迁移

### 6.1 版本兼容策略

```typescript
// lib/data/migration.ts

import type { ExportData } from '@/types/export'

/**
 * 数据迁移器
 * 用于处理不同版本间的数据格式变化
 */
const migrations: Record<string, (data: any) => ExportData> = {
  // 示例：从 0.9 迁移到 1.0
  '0.9': (data: any): ExportData => {
    // 旧版本自选股格式可能是对象数组
    if (Array.isArray(data.stocks) && typeof data.stocks[0] === 'object') {
      data.data.watchlist.stocks = data.stocks.map((s: any) => s.code)
    }
    return data
  },
}

/**
 * 执行数据迁移
 */
export function migrateData(data: any): ExportData {
  const version = data.version || '1.0'

  // 从低版本逐步迁移到当前版本
  let currentData = data

  if (version !== CURRENT_VERSION && migrations[version]) {
    currentData = migrations[version](currentData)
  }

  return currentData as ExportData
}
```

---

## 七、实施计划

### Phase 1：导出功能（0.5天）

- [ ] 创建导出服务 `lib/data/export.ts`
- [ ] 实现 ExportButton 组件
- [ ] 添加文件名生成逻辑

### Phase 2：导入功能（1天）

- [ ] 创建导入服务 `lib/data/import.ts`
- [ ] 实现数据验证
- [ ] 实现 ImportButton 组件（含配置界面）
- [ ] 实现数据迁移逻辑

### Phase 3：设置页面（0.5天）

- [ ] 创建设置页面 `/settings`
- [ ] 集成导出/导入按钮
- [ ] 添加数据统计展示
- [ ] 添加清除数据功能

### Phase 4：测试（0.5天）

- [ ] 单元测试：导出/导入逻辑
- [ ] E2E 测试：完整流程
- [ ] 边界情况测试

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 导入恶意文件 | 数据损坏 | 严格验证文件格式，限制字段类型 |
| 大文件导入卡顿 | 用户体验差 | 分批导入，显示进度 |
| 版本不兼容 | 导入失败 | 实现数据迁移机制 |
| localStorage 容量不足 | 数据丢失 | 提示用户定期导出备份 |