# 智能交易助手实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有股票跟踪网站扩展为智能交易助手，提供策略检测、信号提醒、持仓管理功能。

**Architecture:** 采用分层架构：数据层（API + Store）→ 策略引擎 → UI层。现有代码已有基础结构，主要通过扩展类型、新增Store、添加策略引擎模块来实现。

**Tech Stack:** Next.js 14, TypeScript, TailwindCSS, Zustand, SWR, ECharts, shadcn/ui

---

## 文件结构规划

### 新增文件
```
types/
├── signal.ts              # 信号模型
├── position.ts            # 扩展持仓模型
├── sector.ts              # 板块模型
├── technical.ts           # 技术指标模型
└── operationPlan.ts       # 操作计划模型

lib/
├── strategy/
│   ├── index.ts           # 策略引擎入口
│   ├── buy-signals.ts     # 买入信号检测
│   ├── sell-signals.ts    # 卖出信号检测
│   ├── signal-merger.ts   # 信号合并
│   └── trailing-stop.ts   # 移动止损
├── api/
│   ├── sector.ts          # 板块数据API
│   └── technical.ts       # 技术指标计算
└── utils/
    ├── market.ts          # 市场时间工具
    └── format.ts          # 格式化工具

store/
├── signalStore.ts         # 信号状态
├── positionStore.ts       # 持仓状态（扩展）
├── operationPlanStore.ts  # 操作计划状态
└── alertStore.ts          # 提醒状态（扩展）

components/
├── signal/
│   ├── SignalBadge.tsx    # 信号徽章
│   └── SignalCard.tsx     # 信号卡片
├── sector/
│   └── SectorCard.tsx     # 板块卡片
├── position/
│   └── PositionCard.tsx   # 持仓卡片
├── common/
│   ├── PriceDisplay.tsx   # 价格显示（动画）
│   └── MarketStatus.tsx   # 市场状态
└── stock/
    └── WatchlistTable.tsx # 自选股表格（列表布局）

app/
├── strategy/page.tsx      # 策略雷达页
├── sector/page.tsx        # 板块雷达页
├── plans/page.tsx         # 操作计划页
├── position/page.tsx      # 持仓监控页
└── api/
    ├── sector/route.ts    # 板块API
    └── technical/route.ts # 技术指标API
```

### 修改文件
```
types/stock.ts             # 添加 WatchlistItem 接口
types/alert.ts             # 添加 SmartAlert 类型
app/page.tsx               # 重构为列表布局
components/layout/Header.tsx # 更新导航菜单
tailwind.config.ts         # 添加设计系统颜色
```

---

## Chunk 1: 基础类型定义

### Task 1.1: 创建技术指标类型

**Files:**
- Create: `types/technical.ts`

- [ ] **Step 1: 创建技术指标接口**

```typescript
// types/technical.ts

import type { Stock } from './stock'

/**
 * 股票技术指标 - 用于策略引擎计算
 */
export interface StockTechnical {
  code: string

  // 价格指标
  high20d: number           // 20日最高价
  low20d: number            // 20日最低价
  ma5: number               // 5日均线
  ma10: number              // 10日均线
  ma20: number              // 20日均线

  // 成交量指标
  volume: number            // 当前成交量
  avgVolume5d: number       // 5日平均成交量
  avgVolume20d: number      // 20日平均成交量

  // 计算时间戳
  calculatedAt: string      // 计算时间
}

/**
 * 合并类型 - 策略引擎使用
 */
export interface StockWithTechnical extends Stock, StockTechnical {}
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/technical.ts
git commit -m "feat: add technical indicator types"
```

---

### Task 1.2: 创建信号类型

**Files:**
- Create: `types/signal.ts`

- [ ] **Step 1: 创建信号接口**

```typescript
// types/signal.ts

/**
 * 信号强度（1-5星）
 */
export type SignalStrength = 1 | 2 | 3 | 4 | 5

/**
 * 信号类型
 */
export type SignalType = 'buy' | 'sell'

/**
 * 信号状态
 */
export type SignalStatus = 'active' | 'expired' | 'executed'

/**
 * 信号模型
 */
export interface Signal {
  id: string
  stockCode: string
  stockName: string
  type: SignalType
  strength: SignalStrength
  triggerReason: string        // 触发原因
  suggestPrice?: number        // 建议价格（买入信号）
  stopLoss?: number           // 止损价（卖出信号）
  takeProfit?: number         // 止盈价
  createdAt: string
  expiresAt: string           // 信号过期时间
  status: SignalStatus
}

/**
 * 信号过期配置
 */
export const SIGNAL_EXPIRY_HOURS = {
  buy: 24,    // 买入信号24小时后过期
  sell: 4     // 卖出信号4小时后过期（更紧急）
} as const
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/signal.ts
git commit -m "feat: add signal types"
```

---

### Task 1.3: 创建扩展持仓类型

**Files:**
- Create: `types/position.ts`

- [ ] **Step 1: 创建 Position 接口**

```typescript
// types/position.ts

import type { Portfolio } from './portfolio'

/**
 * 扩展持仓模型 - 包含止损止盈
 */
export interface Position extends Portfolio {
  // 止损止盈
  initialStopLoss: number     // 初始止损价
  currentStopLoss: number     // 当前止损价（移动止损）
  takeProfit?: number         // 止盈价

  // 盈亏计算（实时）
  currentPrice: number        // 当前价格
  profit: number              // 盈亏金额
  profitPercent: number       // 盈亏百分比

  // 最高价追踪（用于移动止损）
  highestPrice: number        // 持仓期间最高价
}

/**
 * 持仓概览
 */
export interface PositionSummary {
  totalValue: number          // 总市值
  totalCost: number           // 总成本
  totalProfit: number         // 总盈亏金额
  totalProfitPercent: number  // 总盈亏百分比
  todayProfit: number         // 今日盈亏
  todayProfitPercent: number  // 今日盈亏百分比
}

/**
 * 止损配置
 */
export const STOP_LOSS_CONFIG = {
  defaultPercent: 0.08,       // 默认止损比例 8%
  trailingPercent: 0.05,      // 移动止损回撤比例 5%
} as const
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/position.ts
git commit -m "feat: add position types with stop-loss support"
```

---

### Task 1.4: 创建板块类型

**Files:**
- Create: `types/sector.ts`

- [ ] **Step 1: 创建板块接口**

```typescript
// types/sector.ts

/**
 * 板块龙头股
 */
export interface LeadingStock {
  code: string
  name: string
  changePercent: number
}

/**
 * 板块模型
 */
export interface Sector {
  code: string
  name: string
  changePercent: number
  capitalFlow: number         // 资金流入（亿）
  leadingStocks: LeadingStock[]
  stocks: string[]            // 板块内个股代码列表
}

/**
 * 板块排序方式
 */
export type SectorSortBy = 'change' | 'capital_flow'

/**
 * 热门板块配置
 */
export const HOT_SECTOR_THRESHOLD = {
  changePercent: 1,           // 涨幅超过1%视为热门
  capitalFlow: 5,             // 资金流入超过5亿视为热门
} as const
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/sector.ts
git commit -m "feat: add sector types"
```

---

### Task 1.5: 扩展股票类型 - 添加 WatchlistItem

**Files:**
- Modify: `types/stock.ts`

- [ ] **Step 1: 添加 WatchlistItem 接口**

在 `types/stock.ts` 文件末尾添加：

```typescript
// ... 现有内容保持不变 ...

import type { SignalStrength, SignalType } from './signal'

/**
 * 自选股列表项 - 首页表格使用
 */
export interface WatchlistItem {
  code: string                // 纯代码（无前缀）
  fullCode: string            // 带市场前缀（sh/sz）
  name: string
  market: 'SH' | 'SZ'

  // 行情数据
  price: number
  change: number
  changePercent: number

  // 信号（可选）
  signal?: {
    type: SignalType
    strength: SignalStrength
    triggerReason: string
  }

  // 持仓标记
  isHeld: boolean             // 是否持有

  // 时间戳
  updatedAt: string
}
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/stock.ts
git commit -m "feat: add WatchlistItem interface"
```

---

### Task 1.6: 创建操作计划类型

**Files:**
- Create: `types/operationPlan.ts`

- [ ] **Step 1: 创建操作计划接口**

```typescript
// types/operationPlan.ts

/**
 * 操作计划类型
 */
export type OperationType = 'buy' | 'sell'

/**
 * 操作计划状态
 */
export type OperationStatus = 'pending' | 'executed' | 'cancelled'

/**
 * 操作计划模型
 */
export interface OperationPlan {
  id: string
  signalId?: string           // 关联的信号
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice?: number        // 目标价格
  quantity?: number           // 数量
  positionRatio?: number      // 仓位比例（%）
  stopLoss?: number           // 止损价
  takeProfit?: number         // 止盈价
  status: OperationStatus
  executedAt?: string         // 执行时间
  executedPrice?: number      // 执行价格
  note?: string               // 备注
  createdAt: string
  updatedAt: string
}

/**
 * 创建操作计划参数
 */
export interface CreateOperationPlanParams {
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice?: number
  quantity?: number
  positionRatio?: number
  stopLoss?: number
  takeProfit?: number
  note?: string
  signalId?: string
}
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/operationPlan.ts
git commit -m "feat: add operation plan types"
```

---

### Task 1.7: 扩展提醒类型

**Files:**
- Modify: `types/alert.ts`

- [ ] **Step 1: 添加 SmartAlert 类型**

在 `types/alert.ts` 文件末尾添加：

```typescript
// ... 现有内容保持不变 ...

/**
 * 智能提醒类型
 */
export type SmartAlertType = 'price' | 'change' | 'signal' | 'stop_loss'

/**
 * 智能提醒状态
 */
export type SmartAlertStatus = 'active' | 'triggered' | 'dismissed'

/**
 * 智能提醒模型 - 扩展版
 */
export interface SmartAlert {
  id: string
  stockCode: string
  stockName: string
  type: SmartAlertType
  condition: {
    operator: 'above' | 'below'
    value: number
  }
  status: SmartAlertStatus
  triggeredAt?: string
  triggeredPrice?: number
  createdAt: string
}

/**
 * 提醒历史记录
 */
export interface AlertLog {
  id: string
  alertId: string
  stockCode: string
  stockName: string
  type: SmartAlertType
  message: string
  triggeredAt: string
  read: boolean
}
```

- [ ] **Step 2: 验证类型定义**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add types/alert.ts
git commit -m "feat: extend alert types with SmartAlert"
```

---

## Chunk 2: 策略引擎

### Task 2.1: 创建工具函数

**Files:**
- Create: `lib/utils/market.ts`
- Create: `lib/utils/format.ts`

- [ ] **Step 1: 创建市场时间工具**

```typescript
// lib/utils/market.ts

/**
 * 判断当前是否为交易时间
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDay()

  // 周末
  if (day === 0 || day === 6) return false

  // 交易时间: 9:30-11:30, 13:00-15:00
  const isMorning = (hour === 9 && minute >= 30) || hour === 10 || (hour === 11 && minute < 30)
  const isAfternoon = hour === 13 || hour === 14 || (hour === 15 && minute === 0)

  return isMorning || isAfternoon
}

/**
 * 获取市场状态文本
 */
export function getMarketStatusText(): string {
  if (isMarketOpen()) {
    return '交易中'
  }

  const now = new Date()
  const hour = now.getHours()

  if (hour < 9 || (hour === 9 && now.getMinutes() < 30)) {
    return '未开盘'
  }

  if (hour >= 15) {
    return '已收盘'
  }

  return '休市'
}
```

- [ ] **Step 2: 创建格式化工具**

```typescript
// lib/utils/format.ts

/**
 * 格式化价格
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toFixed(2)
  }
  return price.toFixed(2)
}

/**
 * 格式化涨跌幅
 */
export function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

/**
 * 格式化金额（万/亿）
 */
export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`
  }
  return amount.toFixed(2)
}

/**
 * 格式化时间
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

- [ ] **Step 3: 创建索引文件**

```typescript
// lib/utils/index.ts
export * from './market'
export * from './format'
```

- [ ] **Step 4: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 5: 提交**

```bash
git add lib/utils/
git commit -m "feat: add market and format utility functions"
```

---

### Task 2.2: 创建信号合并逻辑

**Files:**
- Create: `lib/strategy/signal-merger.ts`

- [ ] **Step 1: 创建信号合并函数**

```typescript
// lib/strategy/signal-merger.ts

import type { Signal, SignalStrength } from '@/types/signal'

/**
 * 合并同类型信号
 * 规则:
 * 1. 取最高星级
 * 2. 合并触发原因
 * 3. 多信号叠加时，星级+1（最高5星）
 */
export function mergeSignals(signals: Signal[]): Signal[] {
  if (signals.length === 0) return []
  if (signals.length === 1) return signals

  const buySignals = signals.filter(s => s.type === 'buy')
  const sellSignals = signals.filter(s => s.type === 'sell')

  const result: Signal[] = []

  if (buySignals.length > 1) {
    // 多个买入信号合并
    const maxStrength = Math.min(5, Math.max(...buySignals.map(s => s.strength)) + 1)
    const reasons = [...new Set(buySignals.map(s => s.triggerReason))].join(' + ')

    result.push({
      ...buySignals[0],
      strength: maxStrength as SignalStrength,
      triggerReason: reasons
    })
  } else if (buySignals.length === 1) {
    result.push(buySignals[0])
  }

  if (sellSignals.length > 1) {
    // 多个卖出信号合并
    const maxStrength = Math.min(5, Math.max(...sellSignals.map(s => s.strength)) + 1)
    const reasons = [...new Set(sellSignals.map(s => s.triggerReason))].join(' + ')

    result.push({
      ...sellSignals[0],
      strength: maxStrength as SignalStrength,
      triggerReason: reasons
    })
  } else if (sellSignals.length === 1) {
    result.push(sellSignals[0])
  }

  return result
}
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/strategy/signal-merger.ts
git commit -m "feat: add signal merger logic"
```

---

### Task 2.3: 创建买入信号检测

**Files:**
- Create: `lib/strategy/buy-signals.ts`

- [ ] **Step 1: 创建买入信号检测函数**

```typescript
// lib/strategy/buy-signals.ts

import type { StockWithTechnical } from '@/types/technical'
import type { Sector } from '@/types/sector'
import type { Signal, SignalStrength } from '@/types/signal'
import { mergeSignals } from './signal-merger'
import { v4 as uuidv4 } from 'uuid'

// 简单的 ID 生成（如果 uuid 未安装）
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检测买入信号
 */
export function detectBuySignals(
  stock: StockWithTechnical,
  sector?: Sector
): Signal[] {
  const signals: Partial<Signal>[] = []
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时后过期

  // 1. 突破信号 - 股价突破20日高点
  if (stock.price > stock.high20d) {
    signals.push({
      type: 'buy',
      strength: 3 as SignalStrength,
      triggerReason: '突破20日高点',
      suggestPrice: stock.price
    })
  }

  // 2. 量价配合 - 放量上涨，成交量>5日均量2倍
  if (stock.changePercent > 0 && stock.volume > stock.avgVolume5d * 2) {
    signals.push({
      type: 'buy',
      strength: 4 as SignalStrength,
      triggerReason: '量价配合',
      suggestPrice: stock.price
    })
  }

  // 3. 板块共振 - 个股上涨 + 所属板块上涨超1%
  if (stock.changePercent > 0 && sector && sector.changePercent > 1) {
    signals.push({
      type: 'buy',
      strength: 5 as SignalStrength,
      triggerReason: '板块共振',
      suggestPrice: stock.price
    })
  }

  // 合并信号并添加完整字段
  const baseSignal = {
    id: '',
    stockCode: stock.code,
    stockName: stock.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active' as const
  }

  return mergeSignals(
    signals.map(s => ({
      ...baseSignal,
      ...s,
      id: generateId()
    })) as Signal[]
  )
}
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/strategy/buy-signals.ts
git commit -m "feat: add buy signal detection logic"
```

---

### Task 2.4: 创建卖出信号检测

**Files:**
- Create: `lib/strategy/sell-signals.ts`

- [ ] **Step 1: 创建卖出信号检测函数**

```typescript
// lib/strategy/sell-signals.ts

import type { StockWithTechnical } from '@/types/technical'
import type { Position } from '@/types/position'
import type { Signal, SignalStrength } from '@/types/signal'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检测卖出信号
 */
export function detectSellSignals(
  position: Position,
  stock: StockWithTechnical
): Signal[] {
  const signals: Partial<Signal>[] = []
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4小时后过期

  // 1. 止损触发（最高优先级，直接返回）
  if (stock.price <= position.currentStopLoss) {
    return [{
      id: generateId(),
      stockCode: stock.code,
      stockName: stock.name,
      type: 'sell',
      strength: 5 as SignalStrength,
      triggerReason: `触发止损线 ${position.currentStopLoss.toFixed(2)}`,
      stopLoss: position.currentStopLoss,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active'
    }]
  }

  // 2. 止盈触发
  if (position.takeProfit && stock.price >= position.takeProfit) {
    signals.push({
      type: 'sell',
      strength: 4 as SignalStrength,
      triggerReason: `达到止盈目标 ${position.takeProfit.toFixed(2)}`,
      takeProfit: position.takeProfit
    })
  }

  // 3. 趋势走弱 - 跌破5日均线
  if (stock.price < stock.ma5) {
    signals.push({
      type: 'sell',
      strength: 3 as SignalStrength,
      triggerReason: '跌破5日均线'
    })
  }

  const baseSignal = {
    id: '',
    stockCode: stock.code,
    stockName: stock.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active' as const
  }

  return signals.map(s => ({
    ...baseSignal,
    ...s,
    id: generateId()
  })) as Signal[]
}
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/strategy/sell-signals.ts
git commit -m "feat: add sell signal detection logic"
```

---

### Task 2.5: 创建移动止损逻辑

**Files:**
- Create: `lib/strategy/trailing-stop.ts`

- [ ] **Step 1: 创建移动止损函数**

```typescript
// lib/strategy/trailing-stop.ts

import type { Position } from '@/types/position'
import { STOP_LOSS_CONFIG } from '@/types/position'

/**
 * 计算移动止损价
 */
export function updateTrailingStop(
  position: Position,
  currentPrice: number
): number {
  // 更新最高价
  const newHighest = Math.max(position.highestPrice, currentPrice)

  // 移动止损 = 最高价 * (1 - 回撤比例)
  let newStopLoss = newHighest * (1 - STOP_LOSS_CONFIG.trailingPercent)

  // 确保不低于初始止损
  newStopLoss = Math.max(newStopLoss, position.initialStopLoss)

  // 确保不低于买入价（保护本金）
  newStopLoss = Math.max(newStopLoss, position.buyPrice)

  return newStopLoss
}

/**
 * 计算初始止损价
 */
export function calculateInitialStopLoss(buyPrice: number): number {
  return buyPrice * (1 - STOP_LOSS_CONFIG.defaultPercent)
}

/**
 * 检查是否需要更新止损价
 */
export function shouldUpdateStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  // 只有盈利时才移动止损
  if (currentPrice <= position.buyPrice) {
    return false
  }

  // 检查是否创新高
  if (currentPrice > position.highestPrice) {
    const newStopLoss = updateTrailingStop(position, currentPrice)
    return newStopLoss > position.currentStopLoss
  }

  return false
}
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/strategy/trailing-stop.ts
git commit -m "feat: add trailing stop-loss logic"
```

---

### Task 2.6: 创建策略引擎入口

**Files:**
- Create: `lib/strategy/index.ts`

- [ ] **Step 1: 创建策略引擎索引**

```typescript
// lib/strategy/index.ts

export * from './buy-signals'
export * from './sell-signals'
export * from './signal-merger'
export * from './trailing-stop'

/**
 * 策略引擎主函数 - 检测所有信号
 */
import type { StockWithTechnical } from '@/types/technical'
import type { Position } from '@/types/position'
import type { Sector } from '@/types/sector'
import type { Signal } from '@/types/signal'
import { detectBuySignals } from './buy-signals'
import { detectSellSignals } from './sell-signals'

export interface StrategyEngineResult {
  buySignals: Signal[]
  sellSignals: Signal[]
}

export function runStrategyEngine(
  stocks: StockWithTechnical[],
  positions: Position[],
  sectors?: Map<string, Sector>
): StrategyEngineResult {
  const buySignals: Signal[] = []
  const sellSignals: Signal[] = []

  // 检测买入信号（对所有股票）
  for (const stock of stocks) {
    const sector = sectors?.get(stock.code)
    const signals = detectBuySignals(stock, sector)
    buySignals.push(...signals)
  }

  // 检测卖出信号（只对持仓）
  for (const position of positions) {
    const stock = stocks.find(s => s.code === position.stockCode)
    if (stock) {
      const signals = detectSellSignals(position, stock)
      sellSignals.push(...signals)
    }
  }

  return { buySignals, sellSignals }
}
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/strategy/index.ts
git commit -m "feat: add strategy engine entry point"
```

---

## Chunk 3: 状态管理

### Task 3.1: 创建信号 Store

**Files:**
- Create: `store/signalStore.ts`

- [ ] **Step 1: 创建信号状态管理**

```typescript
// store/signalStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Signal } from '@/types/signal'

interface SignalState {
  // 活跃信号
  buySignals: Signal[]
  sellSignals: Signal[]

  // 历史信号
  signalHistory: Signal[]

  // 操作
  addSignal: (signal: Signal) => void
  addSignals: (signals: Signal[]) => void
  removeSignal: (id: string) => void
  markAsExecuted: (id: string) => void
  clearExpiredSignals: () => void
  setBuySignals: (signals: Signal[]) => void
  setSellSignals: (signals: Signal[]) => void
}

export const useSignalStore = create<SignalState>()(
  persist(
    (set, get) => ({
      buySignals: [],
      sellSignals: [],
      signalHistory: [],

      addSignal: (signal) => {
        if (signal.type === 'buy') {
          set((state) => ({
            buySignals: [...state.buySignals.filter(s => s.stockCode !== signal.stockCode), signal]
          }))
        } else {
          set((state) => ({
            sellSignals: [...state.sellSignals.filter(s => s.stockCode !== signal.stockCode), signal]
          }))
        }
      },

      addSignals: (signals) => {
        const buySignals = signals.filter(s => s.type === 'buy')
        const sellSignals = signals.filter(s => s.type === 'sell')
        set((state) => ({
          buySignals: [...state.buySignals, ...buySignals],
          sellSignals: [...state.sellSignals, ...sellSignals]
        }))
      },

      removeSignal: (id) => {
        set((state) => ({
          buySignals: state.buySignals.filter(s => s.id !== id),
          sellSignals: state.sellSignals.filter(s => s.id !== id)
        }))
      },

      markAsExecuted: (id) => {
        const signal = [...get().buySignals, ...get().sellSignals].find(s => s.id === id)
        if (signal) {
          set((state) => ({
            buySignals: state.buySignals.filter(s => s.id !== id),
            sellSignals: state.sellSignals.filter(s => s.id !== id),
            signalHistory: [...state.signalHistory, { ...signal, status: 'executed' }]
          }))
        }
      },

      clearExpiredSignals: () => {
        const now = new Date()
        set((state) => ({
          buySignals: state.buySignals.filter(s => new Date(s.expiresAt) > now),
          sellSignals: state.sellSignals.filter(s => new Date(s.expiresAt) > now)
        }))
      },

      setBuySignals: (signals) => {
        set({ buySignals: signals })
      },

      setSellSignals: (signals) => {
        set({ sellSignals: signals })
      }
    }),
    {
      name: 'stock-tracker-signals',
      partialize: (state) => ({
        signalHistory: state.signalHistory
      })
    }
  )
)
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add store/signalStore.ts
git commit -m "feat: add signal store with persistence"
```

---

### Task 3.2: 扩展持仓 Store

**Files:**
- Create: `store/positionStore.ts`

- [ ] **Step 1: 创建持仓状态管理（支持止损止盈）**

```typescript
// store/positionStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Position, PositionSummary } from '@/types/position'
import { STOP_LOSS_CONFIG } from '@/types/position'
import { calculateInitialStopLoss, updateTrailingStop } from '@/lib/strategy/trailing-stop'

interface PositionState {
  positions: Position[]

  // 操作
  addPosition: (position: Omit<Position, 'id' | 'initialStopLoss' | 'currentStopLoss' | 'highestPrice' | 'profit' | 'profitPercent'>) => void
  removePosition: (id: string) => void
  updatePosition: (id: string, updates: Partial<Position>) => void
  updatePrice: (stockCode: string, currentPrice: number) => void

  // 计算
  getSummary: () => PositionSummary
  getPositionByCode: (stockCode: string) => Position | undefined
}

export const usePositionStore = create<PositionState>()(
  persist(
    (set, get) => ({
      positions: [],

      addPosition: (positionData) => {
        const id = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const initialStopLoss = calculateInitialStopLoss(positionData.buyPrice)

        const newPosition: Position = {
          ...positionData,
          id,
          initialStopLoss,
          currentStopLoss: initialStopLoss,
          highestPrice: positionData.buyPrice,
          currentPrice: positionData.buyPrice,
          profit: 0,
          profitPercent: 0,
        }

        set((state) => ({
          positions: [...state.positions, newPosition]
        }))
      },

      removePosition: (id) => {
        set((state) => ({
          positions: state.positions.filter(p => p.id !== id)
        }))
      },

      updatePosition: (id, updates) => {
        set((state) => ({
          positions: state.positions.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
      },

      updatePrice: (stockCode, currentPrice) => {
        set((state) => ({
          positions: state.positions.map(p => {
            if (p.stockCode !== stockCode) return p

            // 更新最高价和移动止损
            const newHighest = Math.max(p.highestPrice, currentPrice)
            let newStopLoss = p.currentStopLoss

            if (currentPrice > p.buyPrice && currentPrice > p.highestPrice) {
              newStopLoss = updateTrailingStop({ ...p, highestPrice: newHighest }, currentPrice)
            }

            const profit = (currentPrice - p.buyPrice) * p.quantity
            const profitPercent = ((currentPrice - p.buyPrice) / p.buyPrice) * 100

            return {
              ...p,
              currentPrice,
              highestPrice: newHighest,
              currentStopLoss: newStopLoss,
              profit,
              profitPercent,
            }
          })
        }))
      },

      getSummary: () => {
        const positions = get().positions

        if (positions.length === 0) {
          return {
            totalValue: 0,
            totalCost: 0,
            totalProfit: 0,
            totalProfitPercent: 0,
            todayProfit: 0,
            todayProfitPercent: 0,
          }
        }

        const totalCost = positions.reduce((sum, p) => sum + p.buyPrice * p.quantity, 0)
        const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
        const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0)
        const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

        // 今日盈亏简化计算（实际应基于昨日收盘价）
        const todayProfit = totalProfit
        const todayProfitPercent = totalProfitPercent

        return {
          totalValue,
          totalCost,
          totalProfit,
          totalProfitPercent,
          todayProfit,
          todayProfitPercent,
        }
      },

      getPositionByCode: (stockCode) => {
        return get().positions.find(p => p.stockCode === stockCode)
      },
    }),
    {
      name: 'stock-tracker-positions',
    }
  )
)
```

- [ ] **Step 2: 验证**

Run: `pnpm type-check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add store/positionStore.ts
git commit -m "feat: add position store with stop-loss support"
```

---

### Task 3.3: 创建操作计划 Store

**Files:**
- Create: `store/operationPlanStore.ts`

- [ ] **Step 1: 创建操作计划状态管理**

```typescript
// store/operationPlanStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationPlan, CreateOperationPlanParams } from '@/types/operationPlan'

interface OperationPlanState {
  plans: OperationPlan[]
  history: OperationPlan[]

  // 操作
  addPlan: (params: CreateOperationPlanParams) => string
  updatePlan: (id: string, updates: Partial<OperationPlan>) => void
  removePlan: (id: string) => void
  markAsExecuted: (id: string, executedPrice: number) => void
  cancelPlan: (id: string) => void

  // 查询
  getPendingPlans: () => OperationPlan[]
  getPlansByStock: (stockCode: string) => OperationPlan[]
}

export const useOperationPlanStore = create<OperationPlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      history: [],

      addPlan: (params) => {
        const id = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const newPlan: OperationPlan = {
          ...params,
          id,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          plans: [...state.plans, newPlan]
        }))

        return id
      },

      updatePlan: (id, updates) => {
        set((state) => ({
          plans: state.plans.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
      },

      removePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter(p => p.id !== id)
        }))
      },

      markAsExecuted: (id, executedPrice) => {
        const plan = get().plans.find(p => p.id === id)
        if (!plan) return

        const now = new Date().toISOString()
        const executedPlan: OperationPlan = {
          ...plan,
          status: 'executed',
          executedAt: now,
          executedPrice,
          updatedAt: now,
        }

        set((state) => ({
          plans: state.plans.filter(p => p.id !== id),
          history: [executedPlan, ...state.history]
        }))
      },

      cancelPlan: (id) => {
        const plan = get().plans.find(p => p.id === id)
        if (!plan) return

        const cancelledPlan: OperationPlan = {
          ...plan,
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          plans: state.plans.filter(p => p.id !== id),
          history: [cancelledPlan, ...state.history]
        }))
      },

      getPendingPlans: () => {
        return get().plans.filter(p => p.status === 'pending')
      },

      getPlansByStock: (stockCode) => {
        return get().plans.filter(p => p.stockCode === stockCode)
      },
    }),
    {
      name: 'stock-tracker-operation-plans',
    }
  )
)
```

- [ ] **Step 2: 验证并提交**

```bash
git add store/operationPlanStore.ts
git commit -m "feat: add operation plan store"
```

---

### Task 3.4: 扩展提醒 Store

**Files:**
- Modify: `store/alertStore.ts`

- [ ] **Step 1: 读取现有 alertStore**

先读取 `store/alertStore.ts` 的现有实现。

- [ ] **Step 2: 扩展提醒 Store 支持 SmartAlert**

```typescript
// store/alertStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Alert, AlertHistory } from '@/types/alert'
import type { SmartAlert, AlertLog } from '@/types/alert'

interface AlertState {
  // 传统预警
  alerts: Alert[]
  alertHistory: AlertHistory[]

  // 智能提醒
  smartAlerts: SmartAlert[]
  alertLogs: AlertLog[]

  // 传统预警操作
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void
  removeAlert: (id: string) => void
  toggleAlert: (id: string) => void

  // 智能提醒操作
  addSmartAlert: (alert: Omit<SmartAlert, 'id' | 'createdAt'>) => void
  updateSmartAlertStatus: (id: string, status: SmartAlert['status']) => void
  dismissAlert: (id: string) => void

  // 提醒日志
  addAlertLog: (log: Omit<AlertLog, 'id'>) => void
  markLogAsRead: (id: string) => void

  // 查询
  getTriggeredAlerts: () => SmartAlert[]
  getTodayLogs: () => AlertLog[]
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      alertHistory: [],
      smartAlerts: [],
      alertLogs: [],

      // 传统预警
      addAlert: (alertData) => {
        const alert: Alert = {
          ...alertData,
          id: `alert-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ alerts: [...state.alerts, alert] }))
      },

      removeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter(a => a.id !== id)
        }))
      },

      toggleAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          )
        }))
      },

      // 智能提醒
      addSmartAlert: (alertData) => {
        const alert: SmartAlert = {
          ...alertData,
          id: `smart-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ smartAlerts: [...state.smartAlerts, alert] }))
      },

      updateSmartAlertStatus: (id, status) => {
        set((state) => ({
          smartAlerts: state.smartAlerts.map(a =>
            a.id === id ? { ...a, status, triggeredAt: status === 'triggered' ? new Date().toISOString() : a.triggeredAt } : a
          )
        }))
      },

      dismissAlert: (id) => {
        set((state) => ({
          smartAlerts: state.smartAlerts.map(a =>
            a.id === id ? { ...a, status: 'dismissed' } : a
          )
        }))
      },

      // 提醒日志
      addAlertLog: (logData) => {
        const log: AlertLog = {
          ...logData,
          id: `log-${Date.now()}`,
        }
        set((state) => ({ alertLogs: [log, ...state.alertLogs] }))
      },

      markLogAsRead: (id) => {
        set((state) => ({
          alertLogs: state.alertLogs.map(l =>
            l.id === id ? { ...l, read: true } : l
          )
        }))
      },

      // 查询
      getTriggeredAlerts: () => {
        return get().smartAlerts.filter(a => a.status === 'triggered')
      },

      getTodayLogs: () => {
        const today = new Date().toDateString()
        return get().alertLogs.filter(l =>
          new Date(l.triggeredAt).toDateString() === today
        )
      },
    }),
    {
      name: 'stock-tracker-alerts',
      partialize: (state) => ({
        alerts: state.alerts,
        smartAlerts: state.smartAlerts,
        alertLogs: state.alertLogs,
      })
    }
  )
)
```

- [ ] **Step 3: 验证并提交**

```bash
git add store/alertStore.ts
git commit -m "feat: extend alert store with SmartAlert support"
```

---

## Chunk 4: API 层

### Task 4.1: 创建技术指标计算 API

**Files:**
- Create: `lib/api/technical.ts`
- Create: `app/api/technical/route.ts`

- [ ] **Step 1: 创建技术指标计算函数**

```typescript
// lib/api/technical.ts

import type { KLineData } from '@/types/stock'
import type { StockTechnical } from '@/types/technical'

/**
 * 计算移动平均线
 */
function calculateMA(data: number[], period: number): number {
  if (data.length < period) {
    return data.length > 0 ? data[data.length - 1] : 0
  }
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

/**
 * 从 K 线数据计算技术指标
 */
export function calculateTechnicalFromKline(
  code: string,
  klines: KLineData[]
): StockTechnical {
  if (klines.length === 0) {
    throw new Error('No kline data available')
  }

  const closes = klines.map(k => k.close)
  const volumes = klines.map(k => k.volume)
  const highs = klines.map(k => k.high)
  const lows = klines.map(k => k.low)

  return {
    code,
    high20d: Math.max(...highs.slice(-20)),
    low20d: Math.min(...lows.slice(-20)),
    ma5: calculateMA(closes, 5),
    ma10: calculateMA(closes, 10),
    ma20: calculateMA(closes, 20),
    volume: volumes[volumes.length - 1],
    avgVolume5d: calculateMA(volumes, 5),
    avgVolume20d: calculateMA(volumes, 20),
    calculatedAt: new Date().toISOString()
  }
}

/**
 * 获取股票技术指标（通过 K 线数据计算）
 */
export async function getStockTechnical(code: string): Promise<StockTechnical> {
  const response = await fetch(`/api/stocks/kline?code=${code}&period=day&limit=20`)
  if (!response.ok) {
    throw new Error('Failed to fetch kline data')
  }

  const klines = await response.json()
  return calculateTechnicalFromKline(code, klines)
}
```

- [ ] **Step 2: 创建 API 路由**

```typescript
// app/api/technical/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaKline } from '@/lib/api/stock'
import { calculateTechnicalFromKline } from '@/lib/api/technical'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_CODE', message: '股票代码不能为空' } },
      { status: 400 }
    )
  }

  try {
    const klines = await fetchSinaKline(code, 'day', 20)
    const technical = calculateTechnicalFromKline(code, klines)

    return NextResponse.json({
      success: true,
      data: technical
    })
  } catch (error) {
    console.error('Error calculating technical indicators:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CALCULATION_ERROR', message: '技术指标计算失败' } },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add lib/api/technical.ts app/api/technical/route.ts
git commit -m "feat: add technical indicator calculation API"
```

---

### Task 4.2: 创建板块数据 API

**Files:**
- Create: `lib/api/sector.ts`
- Create: `app/api/sector/route.ts`

- [ ] **Step 1: 创建板块数据获取函数**

```typescript
// lib/api/sector.ts

import type { Sector } from '@/types/sector'

/**
 * 获取热门板块数据
 * 数据来源：东方财富
 */
export async function fetchSectors(): Promise<Sector[]> {
  // 东方财富板块数据接口
  const url = 'https://push2.eastmoney.com/api/qt/clist/get'
  const params = new URLSearchParams({
    fid: 'f3',  // 按涨跌幅排序
    po: '1',
    pz: '20',   // 获取20个板块
    pn: '1',
    np: '1',
    fltt: '2',
    invt: '2',
    fs: 'm:90+t:2',  // 板块
    fields: 'f1,f2,f3,f4,f5,f6,f7,f12,f14'
  })

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Referer': 'https://quote.eastmoney.com/'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch sector data')
  }

  const data = await response.json()

  if (!data.data?.diff) {
    return []
  }

  return data.data.diff.map((item: Record<string, unknown>) => ({
    code: String(item.f12 || ''),
    name: String(item.f14 || ''),
    changePercent: Number(item.f3 || 0) / 100,  // 东方财富返回的是百分比*100
    capitalFlow: Number(item.f6 || 0) / 100000000,  // 转换为亿
    leadingStocks: [],  // 需要单独获取
    stocks: []
  }))
}
```

- [ ] **Step 2: 创建板块 API 路由**

```typescript
// app/api/sector/route.ts

import { NextResponse } from 'next/server'
import { fetchSectors } from '@/lib/api/sector'

export async function GET() {
  try {
    const sectors = await fetchSectors()

    return NextResponse.json({
      success: true,
      data: sectors
    })
  } catch (error) {
    console.error('Error fetching sectors:', error)
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: '获取板块数据失败' } },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add lib/api/sector.ts app/api/sector/route.ts
git commit -m "feat: add sector data API"
```

---

## Chunk 5: UI 组件

### Task 5.1: 创建信号徽章组件

**Files:**
- Create: `components/signal/SignalBadge.tsx`

- [ ] **Step 1: 创建信号徽章组件**

```tsx
// components/signal/SignalBadge.tsx

'use client'

import { cn } from '@/lib/utils'
import type { SignalType, SignalStrength } from '@/types/signal'

interface SignalBadgeProps {
  type: SignalType
  strength: SignalStrength
  className?: string
}

const STAR_CHARS = {
  full: '★',
  empty: '☆'
}

export function SignalBadge({ type, strength, className }: SignalBadgeProps) {
  const stars = STAR_CHARS.full.repeat(strength)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium',
        type === 'buy'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700',
        className
      )}
    >
      <span>{type === 'buy' ? '买' : '卖'}</span>
      <span className="text-xs">{stars}</span>
    </span>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add components/signal/SignalBadge.tsx
git commit -m "feat: add SignalBadge component"
```

---

### Task 5.2: 创建信号卡片组件

**Files:**
- Create: `components/signal/SignalCard.tsx`

- [ ] **Step 1: 创建信号卡片组件**

```tsx
// components/signal/SignalCard.tsx

'use client'

import { SignalBadge } from './SignalBadge'
import type { Signal } from '@/types/signal'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SignalCardProps {
  signal: Signal
  onAddToPlan?: (signal: Signal) => void
}

export function SignalCard({ signal, onAddToPlan }: SignalCardProps) {
  const isBuy = signal.type === 'buy'

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/stock/${signal.stockCode}`} className="hover:underline">
            <h3 className="font-medium">{signal.stockName}</h3>
            <p className="text-sm text-muted-foreground">{signal.stockCode}</p>
          </Link>
        </div>
        <SignalBadge type={signal.type} strength={signal.strength} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">触发原因:</span>
          <span>{signal.triggerReason}</span>
        </div>

        {isBuy && signal.suggestPrice && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">建议价格:</span>
            <span className="font-mono">{formatPrice(signal.suggestPrice)}</span>
          </div>
        )}

        {!isBuy && signal.stopLoss && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">止损价:</span>
            <span className="font-mono text-red-600">{formatPrice(signal.stopLoss)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">生成时间:</span>
          <span>{formatTime(signal.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {isBuy && onAddToPlan && (
          <Button size="sm" onClick={() => onAddToPlan(signal)}>
            加入计划
          </Button>
        )}
        {!isBuy && (
          <Button size="sm" variant="destructive">
            立即卖出
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/stock/${signal.stockCode}`}>查看详情</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add components/signal/SignalCard.tsx
git commit -m "feat: add SignalCard component"
```

---

### Task 5.3: 创建市场状态组件

**Files:**
- Create: `components/common/MarketStatus.tsx`

- [ ] **Step 1: 创建市场状态组件**

```tsx
// components/common/MarketStatus.tsx

'use client'

import { useEffect, useState } from 'react'
import { isMarketOpen, getMarketStatusText } from '@/lib/utils/market'
import { cn } from '@/lib/utils'

export function MarketStatus() {
  const [status, setStatus] = useState(getMarketStatusText())
  const [isOpen, setIsOpen] = useState(isMarketOpen())

  useEffect(() => {
    // 每分钟更新一次状态
    const interval = setInterval(() => {
      setStatus(getMarketStatusText())
      setIsOpen(isMarketOpen())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isOpen ? 'text-green-600' : 'text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        )}
      />
      {status}
    </span>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add components/common/MarketStatus.tsx
git commit -m "feat: add MarketStatus component"
```

---

### Task 5.4: 创建价格显示组件（带动画）

**Files:**
- Create: `components/common/PriceDisplay.tsx`

- [ ] **Step 1: 创建价格显示组件**

```tsx
// components/common/PriceDisplay.tsx

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  value: number
  previousValue?: number
  className?: string
  showSign?: boolean
}

export function PriceDisplay({
  value,
  previousValue,
  className,
  showSign = false
}: PriceDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setDirection(value > previousValue ? 'up' : 'down')
      setIsAnimating(true)

      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [value, previousValue])

  const formatPrice = (p: number): string => {
    return showSign && p > 0 ? `+${p.toFixed(2)}` : p.toFixed(2)
  }

  return (
    <span
      className={cn(
        'transition-colors duration-300',
        isAnimating && direction === 'up' && 'text-green-500',
        isAnimating && direction === 'down' && 'text-red-500',
        !isAnimating && direction === 'up' && 'text-green-600',
        !isAnimating && direction === 'down' && 'text-red-600',
        className
      )}
    >
      {formatPrice(value)}
    </span>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add components/common/PriceDisplay.tsx
git commit -m "feat: add PriceDisplay component with animation"
```

---

### Task 5.5: 创建自选股表格组件

**Files:**
- Create: `components/stock/WatchlistTable.tsx`

- [ ] **Step 1: 创建自选股表格组件**

```tsx
// components/stock/WatchlistTable.tsx

'use client'

import { useWatchlistStore } from '@/store/stockStore'
import { useSignalStore } from '@/store/signalStore'
import { SignalBadge } from '@/components/signal/SignalBadge'
import { PriceDisplay } from '@/components/common/PriceDisplay'
import { formatChangePercent } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function WatchlistTable() {
  const { stocks, stockData, loading } = useWatchlistStore()
  const { buySignals, sellSignals } = useSignalStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">加载中...</span>
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>暂无自选股</p>
        <p className="text-sm">请搜索并添加您关注的股票</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">名称</th>
            <th className="px-4 py-3 text-right text-sm font-medium">价格</th>
            <th className="px-4 py-3 text-right text-sm font-medium">涨跌</th>
            <th className="px-4 py-3 text-center text-sm font-medium">信号</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((code) => {
            const stock = stockData[code]
            if (!stock) return null

            const buySignal = buySignals.find(s => s.stockCode === code)
            const sellSignal = sellSignals.find(s => s.stockCode === code)
            const signal = buySignal || sellSignal

            return (
              <tr
                key={code}
                className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link href={`/stock/${code}`} className="hover:underline">
                    <div className="font-medium">{stock.name}</div>
                    <div className="text-xs text-muted-foreground">{code}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {stock.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatChangePercent(stock.changePercent)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {signal ? (
                    <SignalBadge type={signal.type} strength={signal.strength} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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

- [ ] **Step 2: 验证并提交**

```bash
git add components/stock/WatchlistTable.tsx
git commit -m "feat: add WatchlistTable component with signal display"
```

---

## Chunk 6: 页面重构

### Task 6.1: 重构首页为列表布局

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 重构首页**

```tsx
// app/page.tsx

'use client'

import { useEffect } from 'react'
import { WatchlistTable } from '@/components/stock/WatchlistTable'
import { StockSearch } from '@/components/stock/StockSearch'
import { useWatchlistStore } from '@/store/stockStore'
import { usePositionStore } from '@/store/positionStore'
import { MarketStatus } from '@/components/common/MarketStatus'
import { formatAmount } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export default function HomePage() {
  const { stocks, refreshData } = useWatchlistStore()
  const { getSummary } = usePositionStore()
  const [searchOpen, setSearchOpen] = useState(false)

  // 定时刷新数据
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 3000)
    return () => clearInterval(interval)
  }, [refreshData])

  const summary = getSummary()

  return (
    <div className="space-y-6">
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

        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              添加股票
            </Button>
          </DialogTrigger>
          <DialogContent>
            <StockSearch onSelect={() => setSearchOpen(false)} />
          </DialogContent>
        </Dialog>
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

- [ ] **Step 2: 验证并提交**

```bash
git add app/page.tsx
git commit -m "feat: refactor homepage to list layout with signals"
```

---

### Task 6.2: 创建策略雷达页面

**Files:**
- Create: `app/strategy/page.tsx`

- [ ] **Step 1: 创建策略雷达页面**

```tsx
// app/strategy/page.tsx

'use client'

import { useSignalStore } from '@/store/signalStore'
import { SignalCard } from '@/components/signal/SignalCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function StrategyPage() {
  const { buySignals, sellSignals } = useSignalStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">策略雷达</h1>
        <p className="text-muted-foreground mt-1">
          实时检测买入和卖出信号
        </p>
      </div>

      <Tabs defaultValue="buy">
        <TabsList>
          <TabsTrigger value="buy">
            📈 买入信号 ({buySignals.length})
          </TabsTrigger>
          <TabsTrigger value="sell">
            📉 卖出信号 ({sellSignals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-4">
          {buySignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无买入信号
            </div>
          ) : (
            <div className="grid gap-4">
              {buySignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="mt-4">
          {sellSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无卖出信号
            </div>
          ) : (
            <div className="grid gap-4">
              {sellSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add app/strategy/page.tsx
git commit -m "feat: add strategy radar page"
```

---

### Task 6.3: 创建持仓监控页面

**Files:**
- Create: `app/position/page.tsx`
- Create: `components/position/PositionCard.tsx`

- [ ] **Step 1: 创建持仓卡片组件**

```tsx
// components/position/PositionCard.tsx

'use client'

import type { Position } from '@/types/position'
import { formatPrice, formatChangePercent, formatAmount } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PositionCardProps {
  position: Position
  onAdjust?: (position: Position) => void
  onSell?: (position: Position) => void
}

export function PositionCard({ position, onAdjust, onSell }: PositionCardProps) {
  const isProfit = position.profit >= 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/stock/${position.stockCode}`} className="hover:underline">
            <h3 className="font-medium">{position.stockName}</h3>
            <p className="text-sm text-muted-foreground">{position.stockCode}</p>
          </Link>
        </div>
        <div className="text-right">
          <div className={cn(
            'font-bold',
            isProfit ? 'text-green-600' : 'text-red-600'
          )}>
            {isProfit ? '+' : ''}{formatChangePercent(position.profitPercent)}
          </div>
          <div className={cn(
            'text-sm',
            isProfit ? 'text-green-600' : 'text-red-600'
          )}>
            {isProfit ? '+' : ''}{formatAmount(position.profit)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">成本: </span>
          <span className="font-mono">{formatPrice(position.buyPrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">现价: </span>
          <span className="font-mono">{formatPrice(position.currentPrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">数量: </span>
          <span className="font-mono">{position.quantity}</span>
        </div>
        <div>
          <span className="text-muted-foreground">市值: </span>
          <span className="font-mono">{formatAmount(position.currentPrice * position.quantity)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">止损: </span>
            <span className="font-mono text-red-600">{formatPrice(position.currentStopLoss)}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({((position.currentStopLoss - position.buyPrice) / position.buyPrice * 100).toFixed(1)}%)
            </span>
          </div>
          {position.takeProfit && (
            <div>
              <span className="text-muted-foreground">止盈: </span>
              <span className="font-mono text-green-600">{formatPrice(position.takeProfit)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onAdjust?.(position)}>
          调整
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onSell?.(position)}>
          卖出
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建持仓监控页面**

```tsx
// app/position/page.tsx

'use client'

import { usePositionStore } from '@/store/positionStore'
import { PositionCard } from '@/components/position/PositionCard'
import { formatAmount } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export default function PositionPage() {
  const { positions, getSummary } = usePositionStore()
  const summary = getSummary()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">持仓监控</h1>
        <p className="text-muted-foreground mt-1">
          实时监控持仓盈亏和止损状态
        </p>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">总市值</div>
          <div className="text-xl font-bold mt-1">{formatAmount(summary.totalValue)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">总成本</div>
          <div className="text-xl font-bold mt-1">{formatAmount(summary.totalCost)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">总盈亏</div>
          <div className={cn(
            'text-xl font-bold mt-1',
            summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {summary.totalProfit >= 0 ? '+' : ''}{formatAmount(summary.totalProfit)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">今日盈亏</div>
          <div className={cn(
            'text-xl font-bold mt-1',
            summary.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {summary.todayProfit >= 0 ? '+' : ''}{formatAmount(summary.todayProfit)}
          </div>
        </div>
      </div>

      {/* 持仓列表 */}
      {positions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无持仓
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add app/position/page.tsx components/position/PositionCard.tsx
git commit -m "feat: add position monitoring page"
```

---

### Task 6.4: 创建操作计划页面

**Files:**
- Create: `app/plans/page.tsx`

- [ ] **Step 1: 创建操作计划页面**

```tsx
// app/plans/page.tsx

'use client'

import { useOperationPlanStore } from '@/store/operationPlanStore'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { OperationPlan } from '@/types/operationPlan'

function PlanCard({ plan, onExecute, onCancel }: {
  plan: OperationPlan
  onExecute?: (plan: OperationPlan) => void
  onCancel?: (plan: OperationPlan) => void
}) {
  const isBuy = plan.type === 'buy'

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{plan.stockName}</h3>
          <p className="text-sm text-muted-foreground">{plan.stockCode}</p>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded text-sm',
          isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {isBuy ? '买入' : '卖出'}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        {plan.targetPrice && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">目标价:</span>
            <span className="font-mono">{formatPrice(plan.targetPrice)}</span>
          </div>
        )}
        {plan.positionRatio && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">仓位:</span>
            <span>{plan.positionRatio}%</span>
          </div>
        )}
        {plan.stopLoss && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">止损:</span>
            <span className="font-mono text-red-600">{formatPrice(plan.stopLoss)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">创建时间:</span>
          <span>{formatTime(plan.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => onExecute?.(plan)}>
          已执行
        </Button>
        <Button size="sm" variant="outline" onClick={() => onCancel?.(plan)}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const { plans, history, markAsExecuted, cancelPlan } = useOperationPlanStore()

  const pendingPlans = plans.filter(p => p.status === 'pending')
  const todayHistory = history.filter(h => {
    const today = new Date().toDateString()
    return new Date(h.executedAt || h.updatedAt).toDateString() === today
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">操作计划</h1>
        <p className="text-muted-foreground mt-1">
          管理待执行的操作计划
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待执行 ({pendingPlans.length})</TabsTrigger>
          <TabsTrigger value="history">今日已完成 ({todayHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无待执行计划
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onExecute={(p) => markAsExecuted(p.id, p.targetPrice || 0)}
                  onCancel={(p) => cancelPlan(p.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {todayHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              今日暂无已完成操作
            </div>
          ) : (
            <div className="space-y-4">
              {todayHistory.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div>
                    <span className={cn(
                      'mr-2',
                      plan.type === 'buy' ? 'text-green-600' : 'text-red-600'
                    )}>
                      [{plan.type === 'buy' ? '已买入' : '已卖出'}]
                    </span>
                    <span className="font-medium">{plan.stockName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(plan.executedAt || plan.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add app/plans/page.tsx
git commit -m "feat: add operation plan page"
```

---

### Task 6.5: 创建板块雷达页面

**Files:**
- Create: `app/sector/page.tsx`
- Create: `components/sector/SectorCard.tsx`

- [ ] **Step 1: 创建板块卡片组件**

```tsx
// components/sector/SectorCard.tsx

'use client'

import type { Sector } from '@/types/sector'
import { formatChangePercent, formatAmount } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SectorCardProps {
  sector: Sector
  onAddStocks?: (codes: string[]) => void
}

export function SectorCard({ sector, onAddStocks }: SectorCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{sector.name}</h3>
          <p className="text-sm text-muted-foreground">{sector.code}</p>
        </div>
        <div className="text-right">
          <div className={cn(
            'font-bold',
            sector.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatChangePercent(sector.changePercent)}
          </div>
          <div className="text-sm text-muted-foreground">
            资金流入: {formatAmount(sector.capitalFlow * 100000000)}
          </div>
        </div>
      </div>

      {sector.leadingStocks.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">龙头股</div>
          <div className="flex flex-wrap gap-2">
            {sector.leadingStocks.map((stock) => (
              <span
                key={stock.code}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-sm"
              >
                {stock.name}
                <span className={cn(
                  stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatChangePercent(stock.changePercent)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {onAddStocks && sector.leadingStocks.length > 0 && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddStocks(sector.leadingStocks.map(s => s.code))}
          >
            添加龙头到自选
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建板块雷达页面**

```tsx
// app/sector/page.tsx

'use client'

import useSWR from 'swr'
import { SectorCard } from '@/components/sector/SectorCard'
import { useWatchlistStore } from '@/store/stockStore'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SectorPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/sector', fetcher, {
    refreshInterval: 300000 // 5分钟刷新
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
          <h1 className="text-2xl font-bold">板块雷达</h1>
          <p className="text-muted-foreground mt-1">
            发现热门板块和龙头股
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-1" />
          刷新
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          加载中...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          加载失败，请重试
        </div>
      ) : sectors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无板块数据
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sectors.map((sector: any) => (
            <SectorCard
              key={sector.code}
              sector={sector}
              onAddStocks={handleAddStocks}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add app/sector/page.tsx components/sector/SectorCard.tsx
git commit -m "feat: add sector radar page"
```

---

### Task 6.6: 更新提醒中心页面

**Files:**
- Modify: `app/alerts/page.tsx`

- [ ] **Step 1: 读取现有提醒中心页面**

先读取 `app/alerts/page.tsx` 的现有实现。

- [ ] **Step 2: 重构提醒中心页面支持 SmartAlert**

```tsx
// app/alerts/page.tsx

'use client'

import { useAlertStore } from '@/store/alertStore'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bell, Settings, X, Check } from 'lucide-react'
import Link from 'next/link'

export default function AlertsPage() {
  const {
    getTriggeredAlerts,
    getTodayLogs,
    dismissAlert,
    markLogAsRead
  } = useAlertStore()

  const triggeredAlerts = getTriggeredAlerts()
  const todayLogs = getTodayLogs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">提醒中心</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有提醒
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-1" />
          设置
        </Button>
      </div>

      {/* 触发中的提醒 */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            触发中 ({triggeredAlerts.length})
          </h2>
          <div className="space-y-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/stock/${alert.stockCode}`} className="hover:underline">
                      <span className="font-medium">{alert.stockName}</span>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.type === 'stop_loss' && '触发止损线'}
                      {alert.type === 'signal' && '收到交易信号'}
                      {alert.type === 'price' && `${alert.condition.operator === 'above' ? '突破' : '跌破'}价格 ${alert.condition.value}`}
                      {alert.type === 'change' && `涨跌幅超过 ${alert.condition.value}%`}
                    </p>
                    {alert.triggeredPrice && (
                      <p className="text-sm text-muted-foreground">
                        当前价: {formatPrice(alert.triggeredPrice)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/stock/${alert.stockCode}`}>查看</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今日提醒历史 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          今日提醒历史 ({todayLogs.length})
        </h2>
        {todayLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            今日暂无提醒
          </div>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border bg-card p-3',
                  !log.read && 'border-blue-200 bg-blue-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{log.stockName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {log.message}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(log.triggeredAt)}
                  </span>
                  {!log.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markLogAsRead(log.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add app/alerts/page.tsx
git commit -m "feat: update alert center with SmartAlert support"
```

---

## Chunk 7: 导航与布局

### Task 7.1: 更新导航菜单

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: 读取现有 Header 组件**

先读取 `components/layout/Header.tsx` 的现有实现。

- [ ] **Step 2: 更新导航菜单添加新页面链接**

```tsx
// components/layout/Header.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Radar,
  TrendingUp,
  ClipboardList,
  PieChart,
  Bell
} from 'lucide-react'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/strategy', label: '策略雷达', icon: Radar },
  { href: '/sector', label: '板块雷达', icon: TrendingUp },
  { href: '/plans', label: '操作计划', icon: ClipboardList },
  { href: '/position', label: '持仓监控', icon: PieChart },
  { href: '/alerts', label: '提醒中心', icon: Bell },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">智能交易助手</span>
        </Link>

        <nav className="flex items-center space-x-1 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: 验证并提交**

```bash
git add components/layout/Header.tsx
git commit -m "feat: update navigation with new pages"
```

---

### Task 7.2: 更新 Tailwind 配置

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 添加设计系统颜色**

```typescript
// tailwind.config.ts 添加主题色
const colors = {
  // ... 现有配置
  stock: {
    up: '#16a34a',      // 涨/买入
    down: '#dc2626',    // 跌/卖出
    primary: '#0f172a', // 主色
    accent: '#3b82f6',  // 强调色
    muted: '#64748b',   // 辅助色
  }
}
```

- [ ] **Step 2: 验证并提交**

```bash
git add tailwind.config.ts
git commit -m "feat: add stock theme colors to tailwind config"
```

---

## Chunk 8: 测试与完善

### Task 8.1: 运行完整测试

- [ ] **Step 1: 运行类型检查**

Run: `pnpm type-check`
Expected: 无错误

- [ ] **Step 2: 运行 lint 检查**

Run: `pnpm lint`
Expected: 无严重错误

- [ ] **Step 3: 构建测试**

Run: `pnpm build`
Expected: 构建成功

- [ ] **Step 4: 本地运行测试**

Run: `pnpm dev`
Expected: 应用正常运行

---

### Task 8.2: 最终提交

- [ ] **Step 1: 提交所有变更**

```bash
git add -A
git commit -m "feat: complete smart trading assistant implementation"
```

---

## 验收清单

### 功能验收
- [ ] 自选股列表显示正常，支持信号显示
- [ ] 买入信号检测功能正常
- [ ] 卖出信号检测功能正常
- [ ] 移动止损计算正确
- [ ] 板块雷达数据加载正常
- [ ] 策略雷达页面正常工作
- [ ] 页面导航正常

### 性能验收
- [ ] 首页加载时间 < 2秒
- [ ] 数据轮询正常工作
- [ ] 无明显性能问题

### 用户体验
- [ ] 价格变化有动效反馈
- [ ] 信号显示清晰
- [ ] 操作响应及时