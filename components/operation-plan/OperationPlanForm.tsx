'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { StockSearchSelect, type StockSelectItem } from './StockSearchSelect'
import { useOperationPlanForm, type CreateOperationPlanParams } from '@/hooks/useOperationPlanForm'
import type { Position } from '@/types/position'
import type { OperationPlan } from '@/types/operationPlan'

interface OperationPlanFormProps {
  mode: 'create' | 'edit' | 'copy'
  initialData?: OperationPlan
  positions: Position[]
  stocks: StockSelectItem[]
  onSubmit: (result: { success: boolean; data?: CreateOperationPlanParams }) => void
  onCancel: () => void
}

export function OperationPlanForm({
  mode,
  initialData,
  positions,
  stocks,
  onSubmit,
  onCancel,
}: OperationPlanFormProps) {
  const {
    formState,
    errors,
    suggestions,
    selectedStock,
    hasPosition,
    positionInfo,
    isSubmitting,
    updateField,
    submit,
  } = useOperationPlanForm({
    mode,
    initialData,
    positions,
    stocks,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = submit()
    if (result.success && result.data) {
      onSubmit(result as { success: true; data: NonNullable<typeof result.data> })
    }
  }

  const handleStockChange = (stock: StockSelectItem) => {
    updateField('stockCode', stock.code)
    updateField('stockName', stock.name)
    // 自动填入当前价格作为目标价
    if (stock.price) {
      updateField('targetPrice', stock.price)
    }
  }

  const handleTypeChange = (type: 'buy' | 'sell') => {
    updateField('type', type)
    // 切换到卖出时，清空止损止盈
    if (type === 'sell') {
      updateField('stopLoss', undefined)
      updateField('takeProfit', undefined)
    }
  }

  const applyStopLossSuggestion = () => {
    if (suggestions.stopLoss) {
      updateField('stopLoss', suggestions.stopLoss)
    }
  }

  const isBuy = formState.type === 'buy'
  const isEditMode = mode === 'edit'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 股票选择 */}
      <div className="space-y-2">
        <Label htmlFor="stock">
          股票 <span className="text-destructive">*</span>
        </Label>
        <StockSearchSelect
          value={formState.stockCode}
          onChange={handleStockChange}
          stocks={stocks}
          disabled={isEditMode}
          hasPosition={(code) => positions.some((p) => p.stockCode === code)}
        />
        {errors.stockCode && (
          <p className="text-sm text-destructive">{errors.stockCode}</p>
        )}
        {selectedStock && (
          <p className="text-sm text-muted-foreground">
            当前价: {formatPrice(selectedStock.price)}
          </p>
        )}
        {!hasPosition && formState.stockCode && (
          <p className="text-sm text-muted-foreground">
            该股票当前无持仓，仅可创建买入计划
          </p>
        )}
      </div>

      {/* 操作类型 */}
      <div className="space-y-2">
        <Label>
          操作类型 <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isBuy ? 'default' : 'outline'}
            onClick={() => handleTypeChange('buy')}
            className="flex-1"
          >
            买入
          </Button>
          <Button
            type="button"
            variant={!isBuy ? 'destructive' : 'outline'}
            onClick={() => handleTypeChange('sell')}
            className="flex-1"
            disabled={!hasPosition}
          >
            卖出
          </Button>
        </div>
      </div>

      {/* 目标价格 */}
      <div className="space-y-2">
        <Label htmlFor="targetPrice">
          目标价格 <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="targetPrice"
            type="number"
            step="0.01"
            min="0"
            value={formState.targetPrice || ''}
            onChange={(e) => updateField('targetPrice', parseFloat(e.target.value) || 0)}
            className={cn(errors.targetPrice && 'border-destructive')}
          />
          <span className="text-sm text-muted-foreground">元</span>
        </div>
        {errors.targetPrice && (
          <p className="text-sm text-destructive">{errors.targetPrice}</p>
        )}
        {positionInfo && !isBuy && (
          <p className="text-sm text-muted-foreground">
            成本价: {formatPrice(positionInfo.buyPrice)}
          </p>
        )}
      </div>

      {/* 止损价（仅买入模式） */}
      {isBuy && (
        <div className="space-y-2">
          <Label htmlFor="stopLoss">止损价</Label>
          <div className="flex items-center gap-2">
            <Input
              id="stopLoss"
              type="number"
              step="0.01"
              min="0"
              value={formState.stopLoss ?? ''}
              onChange={(e) => updateField('stopLoss', parseFloat(e.target.value) || undefined)}
              placeholder={suggestions.stopLoss?.toString()}
              className={cn(errors.stopLoss && 'border-destructive')}
            />
            <span className="text-sm text-muted-foreground">元</span>
          </div>
          {errors.stopLoss && (
            <p className="text-sm text-destructive">{errors.stopLoss}</p>
          )}
          {suggestions.stopLoss && (
            <button
              type="button"
              onClick={applyStopLossSuggestion}
              className="text-sm text-primary hover:underline"
            >
              建议: {formatPrice(suggestions.stopLoss)} (目标价 -8%)
            </button>
          )}
        </div>
      )}

      {/* 止盈价（仅买入模式） */}
      {isBuy && (
        <div className="space-y-2">
          <Label htmlFor="takeProfit">止盈价</Label>
          <div className="flex items-center gap-2">
            <Input
              id="takeProfit"
              type="number"
              step="0.01"
              min="0"
              value={formState.takeProfit ?? ''}
              onChange={(e) => updateField('takeProfit', parseFloat(e.target.value) || undefined)}
              className={cn(errors.takeProfit && 'border-destructive')}
            />
            <span className="text-sm text-muted-foreground">元</span>
          </div>
          {errors.takeProfit && (
            <p className="text-sm text-destructive">{errors.takeProfit}</p>
          )}
        </div>
      )}

      {/* 仓位比例 */}
      <div className="space-y-2">
        <Label htmlFor="positionRatio">仓位比例</Label>
        <div className="flex items-center gap-2">
          <Input
            id="positionRatio"
            type="number"
            min="1"
            max="100"
            value={formState.positionRatio ?? ''}
            onChange={(e) => updateField('positionRatio', parseInt(e.target.value) || undefined)}
            placeholder={suggestions.positionRatio.toString()}
            className={cn(errors.positionRatio && 'border-destructive')}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        {errors.positionRatio && (
          <p className="text-sm text-destructive">{errors.positionRatio}</p>
        )}
        <p className="text-sm text-muted-foreground">
          建议仓位: {suggestions.positionRatio}%
        </p>
      </div>

      {/* 数量 */}
      <div className="space-y-2">
        <Label htmlFor="quantity">数量</Label>
        <div className="flex items-center gap-2">
          <Input
            id="quantity"
            type="number"
            step="100"
            min="100"
            value={formState.quantity ?? ''}
            onChange={(e) => updateField('quantity', parseInt(e.target.value) || undefined)}
            className={cn(errors.quantity && 'border-destructive')}
          />
          <span className="text-sm text-muted-foreground">股</span>
        </div>
        {errors.quantity && (
          <p className="text-sm text-destructive">{errors.quantity}</p>
        )}
        {positionInfo && !isBuy && (
          <p className="text-sm text-muted-foreground">
            持仓: {positionInfo.quantity} 股
          </p>
        )}
      </div>

      {/* 备注 */}
      <div className="space-y-2">
        <Label htmlFor="note">备注</Label>
        <Input
          id="note"
          type="text"
          value={formState.note ?? ''}
          onChange={(e) => updateField('note', e.target.value || undefined)}
          placeholder="可选备注"
        />
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : mode === 'edit' ? '保存修改' : mode === 'copy' ? '创建计划' : '确认创建'}
        </Button>
      </div>
    </form>
  )
}