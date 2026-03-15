'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Copy } from 'lucide-react'
import { useOperationPlanStore } from '@/store/operationPlanStore'
import { usePositionStore } from '@/store/positionStore'
import { useWatchlistStore } from '@/store/stockStore'
import { getStockRealtime } from '@/lib/api/stock'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { OperationPlanDialog, type StockSelectItem } from '@/components/operation-plan'
import type { OperationPlan } from '@/types/operationPlan'
import type { CreateOperationPlanParams } from '@/hooks/useOperationPlanForm'

function PlanCard({
  plan,
  onExecute,
  onCancel,
  onEdit,
  onCopy,
}: {
  plan: OperationPlan
  onExecute?: (plan: OperationPlan) => void
  onCancel?: (plan: OperationPlan) => void
  onEdit?: (plan: OperationPlan) => void
  onCopy?: (plan: OperationPlan) => void
}) {
  const isBuy = plan.type === 'buy'

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{plan.stockName}</h3>
          <p className="text-sm text-muted-foreground">{plan.stockCode}</p>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-sm',
            isBuy ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
          )}
        >
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
            <span className="font-mono text-down">{formatPrice(plan.stopLoss)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">创建时间:</span>
          <span>{formatTime(plan.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onExecute?.(plan)}>
          已执行
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit?.(plan)}>
          <Pencil className="mr-1 h-3 w-3" />
          编辑
        </Button>
        <Button size="sm" variant="outline" onClick={() => onCopy?.(plan)}>
          <Copy className="mr-1 h-3 w-3" />
          复制
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onCancel?.(plan)}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const { plans, history, addPlan, updatePlan, markAsExecuted, cancelPlan } = useOperationPlanStore()
  const { positions, addPosition, updatePosition, removePosition, updatePrice } = usePositionStore()
  const [feedback, setFeedback] = useState<string | null>(null)

  // 价格输入对话框状态
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [executingPlan, setExecutingPlan] = useState<OperationPlan | null>(null)
  const [inputPrice, setInputPrice] = useState<string>('')
  const [priceError, setPriceError] = useState<string>('')

  // 操作计划对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'copy'>('create')
  const [selectedPlan, setSelectedPlan] = useState<OperationPlan | null>(null)
  const [availableStocks, setAvailableStocks] = useState<StockSelectItem[]>([])

  // 获取可选股票列表（自选股 + 持仓）
  const watchlistCodes = useWatchlistStore((state) => state.stocks)

  // 合并自选股和持仓
  useEffect(() => {
    const fetchStocks = async () => {
      const codes = new Set([...watchlistCodes, ...positions.map((p) => p.stockCode)])
      if (codes.size === 0) {
        setAvailableStocks([])
        return
      }

      try {
        const stocks = await getStockRealtime(Array.from(codes))
        setAvailableStocks(
          stocks.map((s) => ({
            code: s.code,
            name: s.name,
            market: s.market,
            price: s.price,
            changePercent: s.changePercent,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch stocks for dialog:', error)
        // 使用持仓数据作为备选
        setAvailableStocks(
          positions.map((p) => ({
            code: p.stockCode,
            name: p.stockName,
            market: 'SZ' as const,
            price: p.currentPrice,
            changePercent: 0,
          }))
        )
      }
    }

    fetchStocks()
  }, [watchlistCodes, positions])

  const pendingPlans = plans.filter((p) => p.status === 'pending')
  const todayHistory = history.filter((h) => {
    const today = new Date().toDateString()
    return new Date(h.executedAt || h.updatedAt).toDateString() === today
  })

  const handleExecutePlan = (plan: OperationPlan) => {
    const existingPosition = positions.find((position) => position.stockCode === plan.stockCode)
    const defaultPrice =
      plan.targetPrice || existingPosition?.currentPrice || existingPosition?.buyPrice

    setExecutingPlan(plan)
    setInputPrice(defaultPrice ? defaultPrice.toFixed(2) : '')
    setPriceError('')
    setPriceDialogOpen(true)
  }

  const confirmExecutePlan = () => {
    if (!executingPlan) return

    const executedPrice = Number(inputPrice)
    if (!Number.isFinite(executedPrice) || executedPrice <= 0) {
      setPriceError('请输入有效的成交价格')
      return
    }

    const plan = executingPlan
    const existingPosition = positions.find((position) => position.stockCode === plan.stockCode)

    if (plan.type === 'buy') {
      const quantity = plan.quantity || 100

      if (existingPosition) {
        const totalQuantity = existingPosition.quantity + quantity
        const averagePrice =
          (existingPosition.buyPrice * existingPosition.quantity + executedPrice * quantity) /
          totalQuantity

        updatePosition(existingPosition.id, {
          buyPrice: averagePrice,
          quantity: totalQuantity,
          currentPrice: executedPrice,
          highestPrice: Math.max(existingPosition.highestPrice, executedPrice),
          takeProfit: plan.takeProfit ?? existingPosition.takeProfit,
          currentStopLoss: plan.stopLoss ?? existingPosition.currentStopLoss,
        })
        updatePrice(existingPosition.stockCode, executedPrice)
      } else {
        const now = new Date().toISOString()
        addPosition({
          stockCode: plan.stockCode,
          stockName: plan.stockName,
          buyPrice: executedPrice,
          quantity,
          buyDate: now,
          note: plan.note,
          createdAt: now,
          updatedAt: now,
          takeProfit: plan.takeProfit,
        })
      }
    } else {
      if (!existingPosition) {
        setFeedback(`未找到 ${plan.stockName} 的持仓，无法执行卖出计划`)
        return
      }

      const sellQuantity = plan.quantity || existingPosition.quantity
      if (sellQuantity >= existingPosition.quantity) {
        removePosition(existingPosition.id)
      } else {
        updatePosition(existingPosition.id, {
          quantity: existingPosition.quantity - sellQuantity,
          currentPrice: executedPrice,
        })
        updatePrice(existingPosition.stockCode, executedPrice)
      }
    }

    markAsExecuted(plan.id, executedPrice)
    setFeedback(`${plan.stockName} 已按 ${formatPrice(executedPrice)} 记录为已执行`)
    setPriceDialogOpen(false)
    setExecutingPlan(null)
  }

  const handleOpenCreateDialog = () => {
    setDialogMode('create')
    setSelectedPlan(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (plan: OperationPlan) => {
    setDialogMode('edit')
    setSelectedPlan(plan)
    setDialogOpen(true)
  }

  const handleOpenCopyDialog = (plan: OperationPlan) => {
    setDialogMode('copy')
    setSelectedPlan(plan)
    setDialogOpen(true)
  }

  const handleDialogSubmit = (data: CreateOperationPlanParams) => {
    if (dialogMode === 'edit' && selectedPlan) {
      updatePlan(selectedPlan.id, data)
      setFeedback(`${data.stockName} 计划已更新`)
    } else {
      addPlan(data)
      setFeedback(`${data.stockName} 已加入${data.type === 'buy' ? '买入' : '卖出'}计划`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">操作计划</h1>
          <p className="page-description">管理待执行的操作计划</p>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建计划
        </Button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          {feedback}
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待执行 ({pendingPlans.length})</TabsTrigger>
          <TabsTrigger value="history">今日已完成 ({todayHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingPlans.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无待执行计划</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onExecute={handleExecutePlan}
                  onCancel={(p) => cancelPlan(p.id)}
                  onEdit={handleOpenEditDialog}
                  onCopy={handleOpenCopyDialog}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {todayHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">今日暂无已完成操作</div>
          ) : (
            <div className="space-y-4">
              {todayHistory.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div>
                    <span className={cn('mr-2', plan.type === 'buy' ? 'text-up' : 'text-down')}>
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

      {/* 价格输入对话框 */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{executingPlan?.type === 'buy' ? '确认买入' : '确认卖出'}</DialogTitle>
            <DialogDescription>
              请输入 <span className="font-medium text-foreground">{executingPlan?.stockName}</span>{' '}
              的成交价格
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="请输入成交价格"
              value={inputPrice}
              onChange={(e) => {
                setInputPrice(e.target.value)
                setPriceError('')
              }}
              className={cn(priceError && 'border-destructive')}
            />
            {priceError && <p className="mt-2 text-sm text-destructive">{priceError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmExecutePlan}>确认执行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 操作计划对话框 */}
      <OperationPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        plan={selectedPlan ?? undefined}
        positions={positions}
        stocks={availableStocks}
        onSubmit={handleDialogSubmit}
      />
    </div>
  )
}