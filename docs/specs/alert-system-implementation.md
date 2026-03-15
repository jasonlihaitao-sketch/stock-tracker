# 预警系统技术实施方案

> 创建日期: 2026-03-14
> 版本: 1.0
> 状态: 待实施

## 一、功能概述

### 1.1 功能范围

本文档涵盖以下预警相关功能的技术实施方案：

| 功能 | 优先级 | 描述 |
|------|--------|------|
| AlertForm 组件 | P0 | 创建预警规则的表单组件 |
| 预警规则管理 | P0 | 查看/编辑/删除预警规则 |
| 预警触发监控 | P0 | 实时监控价格触发预警条件 |
| 浏览器通知 | P1 | Web Notification API 集成 |
| 预警 API 端点 | P1 | RESTful API 设计与实现 |

### 1.2 与现有代码的关系

**已有基础设施：**
- `store/alertStore.ts` - Zustand store 已实现基本状态管理
- `types/alert.ts` - 类型定义已存在
- `app/alerts/page.tsx` - 提醒中心页面已实现（只读展示）

**待实现：**
- `components/alert/AlertForm.tsx` - 预警创建表单
- `components/alert/AlertRuleList.tsx` - 预警规则列表
- `app/api/alerts/route.ts` - API 端点
- `lib/alert/monitor.ts` - 预警监控逻辑
- `lib/alert/notification.ts` - 浏览器通知封装

---

## 二、数据模型

### 2.1 Alert 类型定义（已存在，需扩展）

```typescript
// types/alert.ts - 现有定义

interface Alert {
  id: string
  stockCode: string
  stockName: string
  type: 'price_up' | 'price_down' | 'change_up' | 'change_down'
  targetValue: number      // 目标值（价格或涨跌幅）
  enabled: boolean
  createdAt: string
  triggeredAt?: string
}

// 扩展：SmartAlert（智能提醒，已存在）
interface SmartAlert {
  id: string
  stockCode: string
  stockName: string
  type: 'price' | 'change' | 'signal' | 'stop_loss'
  condition: {
    operator: 'above' | 'below'
    value: number
  }
  status: 'active' | 'triggered' | 'dismissed'
  triggeredAt?: string
  triggeredPrice?: number
  createdAt: string
}

// 扩展：AlertLog（提醒日志，已存在）
interface AlertLog {
  id: string
  stockCode: string
  stockName: string
  type: string
  message: string
  triggeredAt: string
  read: boolean
}
```

### 2.2 预警规则配置

```typescript
// types/alert.ts - 新增

interface AlertRuleConfig {
  // 价格预警
  price: {
    above?: number    // 价格高于 X 元时触发
    below?: number    // 价格低于 X 元时触发
  }

  // 涨跌幅预警
  change: {
    up?: number       // 涨幅超过 X% 时触发
    down?: number     // 跌幅超过 X% 时触发
  }

  // 成交量预警
  volume: {
    multiplier?: number // 成交量超过 N 倍均量时触发
  }
}

// 创建预警表单数据
interface AlertFormData {
  stockCode: string
  stockName: string
  alertType: 'price_up' | 'price_down' | 'change_up' | 'change_down'
  targetValue: number
  note?: string
}
```

---

## 三、组件设计

### 3.1 AlertForm 组件

**位置：** `components/alert/AlertForm.tsx`

**功能：**
- 选择股票（支持搜索）
- 选择预警类型
- 设置目标值
- 添加备注（可选）
- 提交创建预警

**Props 定义：**

```typescript
interface AlertFormProps {
  // 预设股票代码（从股票详情页进入时）
  defaultStockCode?: string
  defaultStockName?: string

  // 成功回调
  onSuccess?: (alert: Alert) => void

  // 取消回调
  onCancel?: () => void

  // 模式：创建或编辑
  mode?: 'create' | 'edit'
  initialData?: Alert
}
```

**组件结构：**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StockSearch } from '@/components/stock'
import { useAlertStore } from '@/store/alertStore'
import type { Alert, AlertFormData } from '@/types/alert'

const ALERT_TYPES = [
  { value: 'price_up', label: '价格高于', unit: '元', placeholder: '输入目标价格' },
  { value: 'price_down', label: '价格低于', unit: '元', placeholder: '输入目标价格' },
  { value: 'change_up', label: '涨幅超过', unit: '%', placeholder: '输入涨跌幅' },
  { value: 'change_down', label: '跌幅超过', unit: '%', placeholder: '输入涨跌幅' },
] as const

export function AlertForm({
  defaultStockCode,
  defaultStockName,
  onSuccess,
  onCancel,
  mode = 'create',
  initialData,
}: AlertFormProps) {
  const { addAlert, updateAlert } = useAlertStore()

  const [stockCode, setStockCode] = useState(defaultStockCode || '')
  const [stockName, setStockName] = useState(defaultStockName || '')
  const [alertType, setAlertType] = useState<AlertFormData['alertType']>(
    initialData?.type || 'price_up'
  )
  const [targetValue, setTargetValue] = useState(
    initialData?.targetValue?.toString() || ''
  )
  const [note, setNote] = useState(initialData?.note || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedType = ALERT_TYPES.find(t => t.value === alertType)

  const handleSubmit = async () => {
    if (!stockCode || !targetValue) return

    setIsSubmitting(true)
    try {
      const alertData: Omit<Alert, 'id' | 'createdAt'> = {
        stockCode,
        stockName: stockName || stockCode,
        type: alertType,
        targetValue: parseFloat(targetValue),
        enabled: true,
        note,
      }

      if (mode === 'edit' && initialData) {
        updateAlert(initialData.id, alertData)
      } else {
        addAlert(alertData)
      }

      onSuccess?.({
        id: initialData?.id || '',
        createdAt: initialData?.createdAt || new Date().toISOString(),
        ...alertData,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 股票选择 */}
      <div className="space-y-2">
        <Label>股票</Label>
        {defaultStockCode ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">{stockName}</span>
            <span className="text-muted-foreground">{stockCode}</span>
          </div>
        ) : (
          <StockSearch
            placeholder="搜索股票..."
            onSelect={(stock) => {
              setStockCode(stock.code)
              setStockName(stock.name)
            }}
          />
        )}
      </div>

      {/* 预警类型 */}
      <div className="space-y-2">
        <Label>预警类型</Label>
        <Select value={alertType} onValueChange={(v) => setAlertType(v as typeof alertType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALERT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 目标值 */}
      <div className="space-y-2">
        <Label>目标值</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={selectedType?.placeholder}
            className="flex-1"
          />
          <span className="text-muted-foreground w-8">{selectedType?.unit}</span>
        </div>
      </div>

      {/* 备注 */}
      <div className="space-y-2">
        <Label>备注（可选）</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加备注"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!stockCode || !targetValue || isSubmitting}>
          {mode === 'edit' ? '保存' : '创建预警'}
        </Button>
      </div>
    </div>
  )
}
```

### 3.2 AlertRuleList 组件

**位置：** `components/alert/AlertRuleList.tsx`

**功能：**
- 展示所有预警规则
- 支持启用/禁用
- 支持编辑/删除
- 显示触发状态

```typescript
interface AlertRuleListProps {
  // 筛选条件
  stockCode?: string

  // 编辑回调
  onEdit?: (alert: Alert) => void
}
```

### 3.3 AlertTriggerIndicator 组件

**位置：** `components/alert/AlertTriggerIndicator.tsx`

**功能：**
- 显示预警规则与当前价格的相对位置
- 可视化进度条

```tsx
// 价格预警进度指示器
// 例如：当前价 15 元，预警价 20 元
// 显示: [=====>    ] 75%

interface AlertTriggerIndicatorProps {
  alert: Alert
  currentPrice: number
}
```

---

## 四、预警触发监控

### 4.1 监控服务设计

**位置：** `lib/alert/monitor.ts`

```typescript
// lib/alert/monitor.ts

import { useAlertStore } from '@/store/alertStore'
import { getStockRealtime } from '@/lib/api/stock'
import type { Alert, SmartAlert, AlertLog } from '@/types/alert'

interface MonitorConfig {
  interval: number      // 检查间隔（毫秒）
  onTrigger?: (alert: Alert, stock: Stock) => void
}

class AlertMonitor {
  private intervalId: NodeJS.Timeout | null = null
  private config: MonitorConfig

  constructor(config: MonitorConfig) {
    this.config = config
  }

  /**
   * 启动监控
   */
  start() {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.checkAlerts()
    }, this.config.interval)

    // 立即执行一次
    this.checkAlerts()
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 检查所有活跃预警
   */
  private async checkAlerts() {
    const { alerts, smartAlerts, addAlertLog, updateSmartAlertStatus } = useAlertStore.getState()

    // 筛选启用的预警
    const activeAlerts = alerts.filter(a => a.enabled && !a.triggeredAt)
    const activeSmartAlerts = smartAlerts.filter(a => a.status === 'active')

    if (activeAlerts.length === 0 && activeSmartAlerts.length === 0) return

    // 获取相关股票的实时价格
    const codes = [...new Set([
      ...activeAlerts.map(a => a.stockCode),
      ...activeSmartAlerts.map(a => a.stockCode)
    ])]

    const stocks = await getStockRealtime(codes)
    const stockMap = new Map(stocks.map(s => [s.code, s]))

    // 检查传统预警
    for (const alert of activeAlerts) {
      const stock = stockMap.get(alert.stockCode)
      if (!stock) continue

      const triggered = this.checkAlertCondition(alert, stock)
      if (triggered) {
        this.handleTrigger(alert, stock)
      }
    }

    // 检查智能提醒
    for (const alert of activeSmartAlerts) {
      const stock = stockMap.get(alert.stockCode)
      if (!stock) continue

      const triggered = this.checkSmartAlertCondition(alert, stock)
      if (triggered) {
        updateSmartAlertStatus(alert.id, 'triggered')
        this.config.onTrigger?.(alert as any, stock)
      }
    }
  }

  /**
   * 检查传统预警条件
   */
  private checkAlertCondition(alert: Alert, stock: Stock): boolean {
    switch (alert.type) {
      case 'price_up':
        return stock.price >= alert.targetValue
      case 'price_down':
        return stock.price <= alert.targetValue
      case 'change_up':
        return stock.changePercent >= alert.targetValue
      case 'change_down':
        return stock.changePercent <= -alert.targetValue
      default:
        return false
    }
  }

  /**
   * 检查智能提醒条件
   */
  private checkSmartAlertCondition(alert: SmartAlert, stock: Stock): boolean {
    const { operator, value } = alert.condition

    let currentValue: number
    switch (alert.type) {
      case 'price':
        currentValue = stock.price
        break
      case 'change':
        currentValue = stock.changePercent
        break
      default:
        return false
    }

    return operator === 'above'
      ? currentValue >= value
      : currentValue <= value
  }

  /**
   * 处理触发事件
   */
  private handleTrigger(alert: Alert, stock: Stock) {
    const { addAlertLog, updateAlert } = useAlertStore.getState()

    // 更新预警状态
    updateAlert(alert.id, {
      triggeredAt: new Date().toISOString()
    })

    // 添加日志
    const log: Omit<AlertLog, 'id'> = {
      stockCode: alert.stockCode,
      stockName: alert.stockName,
      type: alert.type,
      message: this.generateTriggerMessage(alert, stock),
      triggeredAt: new Date().toISOString(),
      read: false,
    }
    addAlertLog(log)

    // 触发回调
    this.config.onTrigger?.(alert, stock)

    // 发送浏览器通知
    this.sendNotification(alert, stock)
  }

  /**
   * 生成触发消息
   */
  private generateTriggerMessage(alert: Alert, stock: Stock): string {
    const typeMessages = {
      price_up: `价格突破 ${alert.targetValue} 元`,
      price_down: `价格跌破 ${alert.targetValue} 元`,
      change_up: `涨幅超过 ${alert.targetValue}%`,
      change_down: `跌幅超过 ${alert.targetValue}%`,
    }
    return typeMessages[alert.type]
  }

  /**
   * 发送浏览器通知
   */
  private async sendNotification(alert: Alert, stock: Stock) {
    // 检查权限
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const title = `${alert.stockName} 预警触发`
    const body = this.generateTriggerMessage(alert, stock) +
      `\n当前价: ${stock.price} 元`

    new Notification(title, {
      body,
      icon: '/icons/alert.png',
      tag: alert.id, // 相同 ID 的通知会替换
    })
  }
}

// 单例导出
export const alertMonitor = new AlertMonitor({
  interval: 3000, // 3秒检查一次
})
```

### 4.2 在应用中启动监控

```typescript
// app/layout.tsx 或 GlobalProviders.tsx

'use client'

import { useEffect } from 'react'
import { alertMonitor } from '@/lib/alert/monitor'

export function AlertMonitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // 启动监控
    alertMonitor.start()

    return () => {
      alertMonitor.stop()
    }
  }, [])

  return <>{children}</>
}
```

---

## 五、浏览器通知封装

### 5.1 通知服务

**位置：** `lib/alert/notification.ts`

```typescript
// lib/alert/notification.ts

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

class NotificationService {
  private permission: NotificationPermissionState

  constructor() {
    this.permission = this.getPermissionState()
  }

  /**
   * 获取当前权限状态
   */
  getPermissionState(): NotificationPermissionState {
    if (!('Notification' in window)) {
      return 'unsupported'
    }
    return Notification.permission as NotificationPermissionState
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (this.permission === 'unsupported') {
      console.warn('浏览器不支持通知')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission as NotificationPermissionState
    return permission === 'granted'
  }

  /**
   * 发送通知
   */
  async send(options: NotificationOptions): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return null
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/notification.png',
      tag: options.tag,
    })

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.()
        notification.close()
        // 聚焦窗口
        window.focus()
      }
    }

    return notification
  }

  /**
   * 发送预警通知
   */
  async sendAlertNotification(alert: {
    stockName: string
    message: string
    stockCode: string
  }): Promise<Notification | null> {
    return this.send({
      title: `${alert.stockName} 预警触发`,
      body: alert.message,
      tag: alert.stockCode,
      onClick: () => {
        // 跳转到股票详情页
        window.location.href = `/stock/${alert.stockCode}`
      },
    })
  }
}

export const notificationService = new NotificationService()
```

---

## 六、API 端点设计

### 6.1 RESTful API 规范

**基础路径：** `/api/alerts`

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/alerts` | 获取所有预警规则 |
| POST | `/api/alerts` | 创建预警规则 |
| GET | `/api/alerts/[id]` | 获取单个预警规则 |
| PUT | `/api/alerts/[id]` | 更新预警规则 |
| DELETE | `/api/alerts/[id]` | 删除预警规则 |
| PATCH | `/api/alerts/[id]/toggle` | 启用/禁用预警规则 |

### 6.2 API 实现

**位置：** `app/api/alerts/route.ts`

```typescript
// app/api/alerts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { useAlertStore } from '@/store/alertStore'
import type { Alert } from '@/types/alert'

// GET /api/alerts
export async function GET(request: NextRequest) {
  const { alerts } = useAlertStore.getState()

  // 支持查询参数筛选
  const { searchParams } = new URL(request.url)
  const stockCode = searchParams.get('stockCode')
  const enabled = searchParams.get('enabled')

  let filtered = alerts

  if (stockCode) {
    filtered = filtered.filter(a => a.stockCode === stockCode)
  }
  if (enabled !== null) {
    filtered = filtered.filter(a => a.enabled === (enabled === 'true'))
  }

  return NextResponse.json({
    success: true,
    data: filtered,
  })
}

// POST /api/alerts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.stockCode || !body.type || body.targetValue === undefined) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '缺少必填字段' },
      }, { status: 400 })
    }

    const { addAlert } = useAlertStore.getState()

    const alertData: Omit<Alert, 'id' | 'createdAt'> = {
      stockCode: body.stockCode,
      stockName: body.stockName || body.stockCode,
      type: body.type,
      targetValue: parseFloat(body.targetValue),
      enabled: body.enabled ?? true,
      note: body.note,
    }

    // 在实际应用中，这里应该保存到数据库
    // 目前使用 Zustand persist 保存到 localStorage
    addAlert(alertData)

    return NextResponse.json({
      success: true,
      data: { message: '预警规则创建成功' },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' },
    }, { status: 500 })
  }
}
```

### 6.3 单个预警 API

**位置：** `app/api/alerts/[id]/route.ts`

```typescript
// app/api/alerts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { useAlertStore } from '@/store/alertStore'

// GET /api/alerts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { alerts } = useAlertStore.getState()
  const alert = alerts.find(a => a.id === params.id)

  if (!alert) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '预警规则不存在' },
    }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: alert,
  })
}

// PUT /api/alerts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { alerts, updateAlert } = useAlertStore.getState()
  const existingAlert = alerts.find(a => a.id === params.id)

  if (!existingAlert) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '预警规则不存在' },
    }, { status: 404 })
  }

  const body = await request.json()
  updateAlert(params.id, body)

  return NextResponse.json({
    success: true,
    data: { message: '预警规则更新成功' },
  })
}

// DELETE /api/alerts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { alerts, removeAlert } = useAlertStore.getState()
  const existingAlert = alerts.find(a => a.id === params.id)

  if (!existingAlert) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '预警规则不存在' },
    }, { status: 404 })
  }

  removeAlert(params.id)

  return NextResponse.json({
    success: true,
    data: { message: '预警规则删除成功' },
  })
}
```

### 6.4 切换预警状态 API

**位置：** `app/api/alerts/[id]/toggle/route.ts`

```typescript
// app/api/alerts/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { useAlertStore } from '@/store/alertStore'

// PATCH /api/alerts/[id]/toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { alerts, toggleAlert } = useAlertStore.getState()
  const existingAlert = alerts.find(a => a.id === params.id)

  if (!existingAlert) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '预警规则不存在' },
    }, { status: 404 })
  }

  toggleAlert(params.id)

  return NextResponse.json({
    success: true,
    data: { enabled: !existingAlert.enabled },
  })
}
```

---

## 七、集成方案

### 7.1 股票详情页集成

在股票详情页添加"设置预警"按钮：

```tsx
// app/stock/[code]/page.tsx

import { AlertForm } from '@/components/alert'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

// 在页面中添加
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">
      <Bell className="w-4 h-4 mr-1" />
      设置预警
    </Button>
  </DialogTrigger>
  <DialogContent>
    <AlertForm
      defaultStockCode={stock.code}
      defaultStockName={stock.name}
      onSuccess={() => {
        // 关闭弹窗，显示成功提示
      }}
    />
  </DialogContent>
</Dialog>
```

### 7.2 提醒中心页扩展

在提醒中心添加预警规则管理入口：

```tsx
// app/alerts/page.tsx

import { AlertRuleList } from '@/components/alert'

// 添加预警规则管理区块
<Tabs defaultValue="triggered">
  <TabsList>
    <TabsTrigger value="triggered">触发中</TabsTrigger>
    <TabsTrigger value="history">今日历史</TabsTrigger>
    <TabsTrigger value="rules">预警规则</TabsTrigger>
  </TabsList>

  <TabsContent value="rules">
    <AlertRuleList />
  </TabsContent>
</Tabs>
```

### 7.3 首页自选股表格集成

在自选股表格行内显示预警状态和快捷入口：

```tsx
// components/stock/WatchlistTable.tsx

// 在每行添加预警图标
{hasAlert && (
  <Bell className="w-4 h-4 text-yellow-500" />
)}
```

---

## 八、测试方案

### 8.1 单元测试

| 测试项 | 测试内容 |
|--------|----------|
| AlertForm 组件 | 表单验证、提交逻辑 |
| AlertMonitor | 条件检测逻辑 |
| NotificationService | 权限请求、通知发送 |

### 8.2 集成测试

| 测试项 | 测试内容 |
|--------|----------|
| 预警创建流程 | 从表单提交到 store 更新 |
| 预警触发流程 | 价格变化到通知发送 |
| API 端点 | CRUD 操作正确性 |

### 8.3 E2E 测试

```typescript
// tests/e2e/alert.spec.ts

test('创建价格预警', async ({ page }) => {
  // 1. 进入股票详情页
  await page.goto('/stock/sz000001')

  // 2. 点击设置预警按钮
  await page.click('text=设置预警')

  // 3. 填写表单
  await page.selectOption('[data-testid="alert-type"]', 'price_up')
  await page.fill('[data-testid="target-value"]', '15')

  // 4. 提交
  await page.click('text=创建预警')

  // 5. 验证成功提示
  await expect(page.locator('text=预警创建成功')).toBeVisible()
})
```

---

## 九、实施计划

### Phase 1：核心组件（1天）

- [ ] 实现 AlertForm 组件
- [ ] 实现 AlertRuleList 组件
- [ ] 在提醒中心页集成

### Phase 2：监控服务（1天）

- [ ] 实现 AlertMonitor 类
- [ ] 实现 NotificationService
- [ ] 在 GlobalProviders 中启动监控

### Phase 3：API 端点（0.5天）

- [ ] 实现 /api/alerts CRUD
- [ ] 实现 /api/alerts/[id]/toggle

### Phase 4：集成与测试（0.5天）

- [ ] 股票详情页集成
- [ ] 首页表格集成
- [ ] E2E 测试

---

## 十、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 浏览器通知权限被拒绝 | 用户无法收到推送 | 提供页面内提醒作为降级方案 |
| 高频轮询影响性能 | 页面卡顿 | 仅在交易时段开启监控，非交易时段暂停 |
| 价格数据延迟 | 预警触发不及时 | 显示数据更新时间，提示可能延迟 |