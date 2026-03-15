# 持仓管理增强技术方案

> 创建日期: 2026-03-14
> 版本: 1.0
> 状态: 待实施

## 一、功能概述

### 1.1 功能范围

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 交易记录 | P3 | 买入/卖出流水记录 |
| 分批建仓 | P3 | 同一股票多次买入的成本计算优化 |
| 持仓历史 | P3 | 已清仓股票的历史记录 |
| 收益统计 | P3 | 按时间段统计收益 |

### 1.2 与现有功能的关系

**现有持仓管理：**
- `positionStore.ts` - 持仓状态管理
- `PortfolioTable.tsx` - 持仓表格组件
- `PositionCard.tsx` - 持仓卡片组件

**待增强：**
- 新增 `Transaction` 类型定义
- 新增 `transactionStore.ts` - 交易记录状态管理
- 增强 `positionStore.ts` - 支持分批建仓
- 新增 `TransactionHistory.tsx` - 交易记录组件

---

## 二、数据模型设计

### 2.1 交易记录模型

```typescript
// types/transaction.ts

/**
 * 交易类型
 */
type TransactionType = 'buy' | 'sell' | 'dividend' | 'split'

/**
 * 交易记录
 */
interface Transaction {
  id: string

  // 股票信息
  stockCode: string
  stockName: string

  // 交易详情
  type: TransactionType
  quantity: number          // 数量（正数）
  price: number             // 单价
  amount: number            // 总金额 = quantity * price
  fee: number               // 手续费

  // 时间
  executedAt: string        // 成交时间

  // 关联
  positionId?: string       // 关联的持仓ID

  // 备注
  note?: string

  // 元数据
  createdAt: string
  updatedAt: string
}

/**
 * 交易统计
 */
interface TransactionSummary {
  totalBuyAmount: number    // 总买入金额
  totalSellAmount: number   // 总卖出金额
  totalFees: number         // 总手续费
  realizedProfit: number    // 已实现收益
  transactionCount: number  // 交易次数
}
```

### 2.2 持仓模型扩展

```typescript
// types/position.ts - 扩展现有定义

interface Position {
  id: string
  stockCode: string
  stockName: string

  // 持仓信息
  quantity: number          // 总数量
  buyPrice: number          // 平均成本价
  totalCost: number         // 总成本 = sum(买入金额)

  // 止损止盈
  initialStopLoss?: number
  currentStopLoss?: number
  takeProfit?: number

  // 最高价追踪
  highestPrice: number

  // 当前状态
  currentPrice: number
  marketValue: number       // 市值 = currentPrice * quantity

  // 盈亏
  profit: number            // 浮动盈亏 = marketValue - totalCost
  profitPercent: number     // 盈亏比例

  // 买入日期（首次）
  buyDate: string

  // 交易记录关联
  transactionIds: string[]  // 关联的交易记录ID

  // 备注
  note?: string

  // 元数据
  createdAt: string
  updatedAt: string
}

/**
 * 持仓历史（已清仓）
 */
interface PositionHistory {
  id: string
  stockCode: string
  stockName: string

  // 持仓期间统计
  totalBuyAmount: number    // 总买入金额
  totalSellAmount: number   // 总卖出金额
  totalFees: number         // 总手续费
  realizedProfit: number    // 已实现收益
  realizedProfitPercent: number // 收益率

  // 时间
  firstBuyAt: string        // 首次买入时间
  lastSellAt: string        // 最后卖出时间
  holdingDays: number       // 持仓天数

  // 交易记录
  transactionIds: string[]
}
```

### 2.3 分批建仓计算

```typescript
// lib/position/calculator.ts

interface BuyTransaction {
  quantity: number
  price: number
  fee: number
}

/**
 * 计算分批建仓后的平均成本
 */
function calculateAverageCost(transactions: BuyTransaction[]): {
  totalQuantity: number
  totalCost: number
  averagePrice: number
} {
  let totalQuantity = 0
  let totalCost = 0

  for (const tx of transactions) {
    totalQuantity += tx.quantity
    totalCost += tx.quantity * tx.price + tx.fee
  }

  return {
    totalQuantity,
    totalCost,
    averagePrice: totalQuantity > 0 ? totalCost / totalQuantity : 0,
  }
}

/**
 * 计算卖出后的剩余成本
 * 使用先进先出（FIFO）或加权平均法
 */
function calculateSellImpact(
  position: Position,
  sellQuantity: number,
  sellPrice: number
): {
  remainingQuantity: number
  remainingCost: number
  realizedProfit: number
} {
  // 计算卖出部分的成本
  const sellCost = (position.totalCost / position.quantity) * sellQuantity
  const sellAmount = sellQuantity * sellPrice

  return {
    remainingQuantity: position.quantity - sellQuantity,
    remainingCost: position.totalCost - sellCost,
    realizedProfit: sellAmount - sellCost,
  }
}

/**
 * 使用 FIFO 计算已实现收益
 * 更精确但需要记录每笔买入
 */
function calculateRealizedProfitFIFO(
  buys: BuyTransaction[],
  sells: { quantity: number; price: number }[]
): number {
  const buyQueue = [...buys] // 复制买入队列
  let realizedProfit = 0

  for (const sell of sells) {
    let remainingSell = sell.quantity

    while (remainingSell > 0 && buyQueue.length > 0) {
      const firstBuy = buyQueue[0]
      const matchedQuantity = Math.min(remainingSell, firstBuy.quantity)

      // 计算这部分收益
      realizedProfit += matchedQuantity * (sell.price - firstBuy.price)

      // 更新队列
      firstBuy.quantity -= matchedQuantity
      remainingSell -= matchedQuantity

      if (firstBuy.quantity === 0) {
        buyQueue.shift()
      }
    }
  }

  return realizedProfit
}
```

---

## 三、状态管理

### 3.1 交易记录 Store

**位置：** `store/transactionStore.ts`

```typescript
// store/transactionStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction, TransactionSummary } from '@/types/transaction'

interface TransactionState {
  transactions: Transaction[]

  // CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  // 查询
  getTransactionsByStock: (stockCode: string) => Transaction[]
  getTransactionsByDateRange: (start: string, end: string) => Transaction[]
  getSummary: (stockCode?: string) => TransactionSummary
}

function generateId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (txData) => {
        const id = generateId()
        const now = new Date().toISOString()

        const tx: Transaction = {
          ...txData,
          id,
          amount: txData.quantity * txData.price,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          transactions: [...state.transactions, tx].sort(
            (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
          ),
        }))

        return id
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  ...updates,
                  amount: updates.quantity !== undefined && updates.price !== undefined
                    ? updates.quantity * updates.price
                    : tx.amount,
                  updatedAt: new Date().toISOString(),
                }
              : tx
          ),
        }))
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }))
      },

      getTransactionsByStock: (stockCode) => {
        return get().transactions.filter((tx) => tx.stockCode === stockCode)
      },

      getTransactionsByDateRange: (start, end) => {
        const startTime = new Date(start).getTime()
        const endTime = new Date(end).getTime()

        return get().transactions.filter((tx) => {
          const txTime = new Date(tx.executedAt).getTime()
          return txTime >= startTime && txTime <= endTime
        })
      },

      getSummary: (stockCode) => {
        let transactions = get().transactions

        if (stockCode) {
          transactions = transactions.filter((tx) => tx.stockCode === stockCode)
        }

        const summary: TransactionSummary = {
          totalBuyAmount: 0,
          totalSellAmount: 0,
          totalFees: 0,
          realizedProfit: 0,
          transactionCount: transactions.length,
        }

        for (const tx of transactions) {
          summary.totalFees += tx.fee

          if (tx.type === 'buy') {
            summary.totalBuyAmount += tx.amount + tx.fee
          } else if (tx.type === 'sell') {
            summary.totalSellAmount += tx.amount - tx.fee
          }
        }

        summary.realizedProfit = summary.totalSellAmount - summary.totalBuyAmount

        return summary
      },
    }),
    {
      name: 'stock-tracker-transactions',
    }
  )
)
```

### 3.2 持仓 Store 扩展

**位置：** `store/positionStore.ts`（扩展现有）

```typescript
// 在现有 positionStore.ts 中添加

interface PositionState {
  // ... 现有字段 ...

  // 新增：持仓历史
  positionHistory: PositionHistory[]

  // 新增：分批操作
  addBuyTransaction: (
    positionId: string,
    quantity: number,
    price: number,
    fee: number
  ) => void

  addSellTransaction: (
    positionId: string,
    quantity: number,
    price: number,
    fee: number
  ) => { realizedProfit: number; remainingQuantity: number }

  // 新增：移动到历史
  moveToHistory: (positionId: string) => void
}

// 实现扩展方法
addBuyTransaction: (positionId, quantity, price, fee) => {
  set((state) => {
    const position = state.positions.find(p => p.id === positionId)
    if (!position) return state

    const newTotalQuantity = position.quantity + quantity
    const newTotalCost = position.totalCost + (quantity * price + fee)
    const newAveragePrice = newTotalCost / newTotalQuantity

    return {
      positions: state.positions.map(p =>
        p.id === positionId
          ? {
              ...p,
              quantity: newTotalQuantity,
              totalCost: newTotalCost,
              buyPrice: newAveragePrice,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }
  })
},

addSellTransaction: (positionId, quantity, price, fee) => {
  const position = get().positions.find(p => p.id === positionId)
  if (!position) return { realizedProfit: 0, remainingQuantity: 0 }

  // 计算卖出收益
  const sellCost = (position.totalCost / position.quantity) * quantity
  const sellAmount = quantity * price - fee
  const realizedProfit = sellAmount - sellCost

  const remainingQuantity = position.quantity - quantity

  if (remainingQuantity <= 0) {
    // 全部卖出，移到历史
    get().moveToHistory(positionId)
  } else {
    // 部分卖出，更新持仓
    set((state) => ({
      positions: state.positions.map(p =>
        p.id === positionId
          ? {
              ...p,
              quantity: remainingQuantity,
              totalCost: position.totalCost - sellCost,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }))
  }

  return { realizedProfit, remainingQuantity }
},

moveToHistory: (positionId) => {
  const position = get().positions.find(p => p.id === positionId)
  if (!position) return

  // 计算收益
  const realizedProfit = position.marketValue - position.totalCost
  const realizedProfitPercent = (realizedProfit / position.totalCost) * 100

  // 计算持仓天数
  const holdingDays = Math.floor(
    (Date.now() - new Date(position.buyDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const history: PositionHistory = {
    id: `history-${positionId}`,
    stockCode: position.stockCode,
    stockName: position.stockName,
    totalBuyAmount: position.totalCost,
    totalSellAmount: position.marketValue,
    totalFees: 0, // 需要从交易记录中汇总
    realizedProfit,
    realizedProfitPercent,
    firstBuyAt: position.buyDate,
    lastSellAt: new Date().toISOString(),
    holdingDays,
    transactionIds: position.transactionIds || [],
  }

  set((state) => ({
    positions: state.positions.filter(p => p.id !== positionId),
    positionHistory: [history, ...state.positionHistory],
  }))
},
```

---

## 四、组件设计

### 4.1 交易记录组件

**位置：** `components/position/TransactionHistory.tsx`

```tsx
'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Filter, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTransactionStore } from '@/store/transactionStore'
import { formatPrice, formatAmount, formatDate, cn } from '@/lib/utils'
import type { Transaction } from '@/types/transaction'

interface TransactionHistoryProps {
  stockCode?: string  // 可选：筛选特定股票
}

export function TransactionHistory({ stockCode }: TransactionHistoryProps) {
  const { transactions, getSummary } = useTransactionStore()

  // 筛选条件
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // 筛选逻辑
  let filtered = stockCode
    ? transactions.filter(tx => tx.stockCode === stockCode)
    : transactions

  if (filterType !== 'all') {
    filtered = filtered.filter(tx => tx.type === filterType)
  }

  if (dateRange.start) {
    filtered = filtered.filter(tx =>
      new Date(tx.executedAt) >= new Date(dateRange.start)
    )
  }
  if (dateRange.end) {
    filtered = filtered.filter(tx =>
      new Date(tx.executedAt) <= new Date(dateRange.end + 'T23:59:59')
    )
  }

  const summary = getSummary(stockCode)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>交易记录</CardTitle>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="buy">买入</SelectItem>
              <SelectItem value="sell">卖出</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-2 rounded bg-muted">
            <div className="text-sm text-muted-foreground">买入金额</div>
            <div className="text-lg font-bold text-green-600">
              {formatAmount(summary.totalBuyAmount)}
            </div>
          </div>
          <div className="text-center p-2 rounded bg-muted">
            <div className="text-sm text-muted-foreground">卖出金额</div>
            <div className="text-lg font-bold text-red-600">
              {formatAmount(summary.totalSellAmount)}
            </div>
          </div>
          <div className="text-center p-2 rounded bg-muted">
            <div className="text-sm text-muted-foreground">手续费</div>
            <div className="text-lg font-bold">
              {formatAmount(summary.totalFees)}
            </div>
          </div>
          <div className="text-center p-2 rounded bg-muted">
            <div className="text-sm text-muted-foreground">已实现收益</div>
            <div className={cn(
              'text-lg font-bold',
              summary.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {summary.realizedProfit >= 0 ? '+' : ''}
              {formatAmount(summary.realizedProfit)}
            </div>
          </div>
        </div>

        {/* 日期筛选 */}
        <div className="flex gap-4">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-40"
            placeholder="开始日期"
          />
          <span className="self-center">至</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-40"
            placeholder="结束日期"
          />
        </div>

        {/* 记录列表 */}
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无交易记录
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>股票</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead className="text-right">手续费</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className={cn(
                      'flex items-center gap-1',
                      tx.type === 'buy' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {tx.type === 'buy' ? (
                        <ArrowDownCircle className="w-4 h-4" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4" />
                      )}
                      {tx.type === 'buy' ? '买入' : '卖出'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tx.stockName}</div>
                      <div className="text-xs text-muted-foreground">{tx.stockCode}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{tx.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(tx.price)}</TableCell>
                  <TableCell className="text-right">{formatAmount(tx.amount)}</TableCell>
                  <TableCell className="text-right">{formatPrice(tx.fee)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tx.executedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4.2 买入/卖出表单

**位置：** `components/position/TransactionForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { StockSearch } from '@/components/stock'
import { useTransactionStore } from '@/store/transactionStore'
import { usePositionStore } from '@/store/positionStore'
import type { TransactionType } from '@/types/transaction'

interface TransactionFormProps {
  defaultStockCode?: string
  defaultStockName?: string
  defaultType?: TransactionType
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({
  defaultStockCode,
  defaultStockName,
  defaultType = 'buy',
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [stockCode, setStockCode] = useState(defaultStockCode || '')
  const [stockName, setStockName] = useState(defaultStockName || '')
  const [type, setType] = useState<TransactionType>(defaultType)
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('5') // 默认手续费5元
  const [note, setNote] = useState('')

  const { addTransaction } = useTransactionStore()
  const {
    positions,
    addPosition,
    addBuyTransaction,
    addSellTransaction,
    updatePrice
  } = usePositionStore()

  const existingPosition = positions.find(p => p.stockCode === stockCode)

  const handleSubmit = () => {
    if (!stockCode || !quantity || !price) return

    const qty = parseInt(quantity)
    const p = parseFloat(price)
    const f = parseFloat(fee) || 0

    // 创建交易记录
    const txId = addTransaction({
      stockCode,
      stockName: stockName || stockCode,
      type,
      quantity: qty,
      price: p,
      fee: f,
      executedAt: new Date().toISOString(),
    })

    // 更新持仓
    if (type === 'buy') {
      if (existingPosition) {
        // 分批买入
        addBuyTransaction(existingPosition.id, qty, p, f)
      } else {
        // 新建持仓
        addPosition({
          stockCode,
          stockName: stockName || stockCode,
          quantity: qty,
          buyPrice: p,
          buyDate: new Date().toISOString(),
          transactionIds: [txId],
        })
      }
    } else if (type === 'sell' && existingPosition) {
      // 卖出
      addSellTransaction(existingPosition.id, qty, p, f)
    }

    // 更新当前价格
    if (stockCode) {
      updatePrice(stockCode, p)
    }

    onSuccess?.()
  }

  // 计算预览
  const preview = {
    amount: (parseInt(quantity) || 0) * (parseFloat(price) || 0),
    total: (parseInt(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fee) || 0),
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
        {existingPosition && (
          <p className="text-sm text-muted-foreground">
            现有持仓: {existingPosition.quantity}股, 成本价 {existingPosition.buyPrice.toFixed(2)}
          </p>
        )}
      </div>

      {/* 交易类型 */}
      <div className="space-y-2">
        <Label>交易类型</Label>
        <RadioGroup
          value={type}
          onValueChange={(v) => setType(v as TransactionType)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="buy" id="buy" />
            <Label htmlFor="buy" className="text-green-600">买入</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sell" id="sell" />
            <Label htmlFor="sell" className="text-red-600">卖出</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 数量和价格 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>数量（股）</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
          />
        </div>
        <div className="space-y-2">
          <Label>单价（元）</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="10.00"
          />
        </div>
      </div>

      {/* 手续费 */}
      <div className="space-y-2">
        <Label>手续费（元）</Label>
        <Input
          type="number"
          step="0.01"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="5.00"
        />
      </div>

      {/* 预览 */}
      <div className="p-4 rounded bg-muted space-y-1">
        <div className="flex justify-between text-sm">
          <span>成交金额</span>
          <span>{preview.amount.toFixed(2)} 元</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>手续费</span>
          <span>{fee} 元</span>
        </div>
        <div className="flex justify-between font-medium pt-1 border-t">
          <span>{type === 'buy' ? '总成本' : '总收款'}</span>
          <span>{preview.total.toFixed(2)} 元</span>
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
        <Button
          onClick={handleSubmit}
          disabled={!stockCode || !quantity || !price}
          className={type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          确认{type === 'buy' ? '买入' : '卖出'}
        </Button>
      </div>
    </div>
  )
}
```

---

## 五、页面集成

### 5.1 持仓管理页增强

```tsx
// app/portfolio/page.tsx - 增强

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PortfolioTable } from '@/components/portfolio'
import { TransactionHistory } from '@/components/position/TransactionHistory'
import { PositionHistoryList } from '@/components/position/PositionHistoryList'

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">持仓管理</h1>
        <p className="text-muted-foreground mt-2">
          记录和管理您的股票持仓，实时计算收益
        </p>
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">当前持仓</TabsTrigger>
          <TabsTrigger value="transactions">交易记录</TabsTrigger>
          <TabsTrigger value="history">历史持仓</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4">
          <PortfolioTable />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <PositionHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 六、实施计划

### Phase 1：交易记录基础（1天）

- [ ] 创建 `types/transaction.ts`
- [ ] 实现 `transactionStore.ts`
- [ ] 实现 `TransactionHistory.tsx` 组件

### Phase 2：分批建仓（1天）

- [ ] 扩展 `positionStore.ts`
- [ ] 实现买入/卖出成本计算
- [ ] 实现 `TransactionForm.tsx` 组件

### Phase 3：历史持仓（0.5天）

- [ ] 实现 `PositionHistory` 类型
- [ ] 实现 `PositionHistoryList.tsx` 组件

### Phase 4：集成与测试（0.5天）

- [ ] 更新持仓管理页
- [ ] 添加交易记录导出
- [ ] E2E 测试

---

## 七、注意事项

### 7.1 成本计算方法

**加权平均法（推荐）：**
- 简单易懂
- 自动计算平均成本
- 适合大多数场景

**FIFO 方法（可选）：**
- 更精确的收益计算
- 需要记录每笔买入
- 适合需要精确税务计算的场景

### 7.2 数据一致性

- 交易记录与持仓数据需要保持同步
- 建议在事务中同时更新两个 store
- 定期校验数据一致性

### 7.3 手续费计算

- 买入手续费 = 买入金额 × 费率（最低5元）
- 卖出手续费 = 卖出金额 × 费率（最低5元）
- 印花税 = 卖出金额 × 0.1%（仅卖出收取）