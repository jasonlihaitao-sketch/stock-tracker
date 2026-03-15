'use client'

import { useState } from 'react'
import { useOperationPlanStore } from '@/store/operationPlanStore'
import { usePositionStore } from '@/store/positionStore'
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
import type { OperationPlan } from '@/types/operationPlan'

function PlanCard({
  plan,
  onExecute,
  onCancel,
}: {
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
  const { positions, addPosition, updatePosition, removePosition, updatePrice } = usePositionStore()
  const [feedback, setFeedback] = useState<string | null>(null)

  // 价格输入对话框状态
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [executingPlan, setExecutingPlan] = useState<OperationPlan | null>(null)
  const [inputPrice, setInputPrice] = useState<string>('')
  const [priceError, setPriceError] = useState<string>('')

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">操作计划</h1>
        <p className="page-description">管理待执行的操作计划</p>
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
    </div>
  )
}
