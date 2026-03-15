'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePositionStore } from '@/store/positionStore'
import { formatPrice, formatAmount, cn } from '@/lib/utils'
import { STOP_LOSS_CONFIG } from '@/types/position'
import type { Stock } from '@/types/stock'
import type { Position } from '@/types/position'

interface BuyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stock: Stock
  existingPosition?: Position
}

export function BuyDialog({ open, onOpenChange, stock, existingPosition }: BuyDialogProps) {
  const { addPosition, updatePosition } = usePositionStore()

  // 表单状态
  const [buyPrice, setBuyPrice] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('100')
  const [stopLoss, setStopLoss] = useState<string>('')
  const [takeProfit, setTakeProfit] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化价格
  useEffect(() => {
    if (open && stock.price > 0) {
      setBuyPrice(stock.price.toFixed(2))
      // 默认止损价: 买入价 - 8%
      const defaultStopLoss = (stock.price * (1 - STOP_LOSS_CONFIG.defaultPercent)).toFixed(2)
      setStopLoss(defaultStopLoss)
    }
  }, [open, stock.price])

  // 计算预估金额
  const estimatedAmount = useMemo(() => {
    const price = parseFloat(buyPrice)
    const qty = parseInt(quantity)
    if (isNaN(price) || isNaN(qty)) return 0
    return price * qty
  }, [buyPrice, quantity])

  // 计算止损百分比
  const stopLossPercent = useMemo(() => {
    const price = parseFloat(buyPrice)
    const sl = parseFloat(stopLoss)
    if (isNaN(price) || price <= 0 || isNaN(sl)) return null
    return ((sl - price) / price) * 100
  }, [buyPrice, stopLoss])

  // 设置快捷数量
  const handleQuickQuantity = (qty: number) => {
    setQuantity(qty.toString())
  }

  // 设置快捷止损百分比
  const handleQuickStopLoss = (percent: number) => {
    const price = parseFloat(buyPrice)
    if (!isNaN(price) && price > 0) {
      const sl = price * (1 - percent / 100)
      setStopLoss(sl.toFixed(2))
    }
  }

  // 使用当前现价
  const handleUseCurrentPrice = () => {
    if (stock.price > 0) {
      setBuyPrice(stock.price.toFixed(2))
    }
  }

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const price = parseFloat(buyPrice)
    const qty = parseInt(quantity)
    const sl = parseFloat(stopLoss)

    if (isNaN(price) || price <= 0) {
      newErrors.buyPrice = '请输入有效的买入价格'
    }

    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = '请输入有效的买入数量'
    }

    if (!isNaN(sl) && sl >= price) {
      newErrors.stopLoss = '止损价必须低于买入价'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 确认买入
  const handleConfirm = () => {
    if (!validateForm()) return

    const price = parseFloat(buyPrice)
    const qty = parseInt(quantity)
    const sl = parseFloat(stopLoss) || undefined
    const tp = parseFloat(takeProfit) || undefined

    if (existingPosition) {
      // 加仓：计算新的平均成本
      const totalQuantity = existingPosition.quantity + qty
      const averagePrice =
        (existingPosition.buyPrice * existingPosition.quantity + price * qty) / totalQuantity

      // 重新计算止损价（基于新的平均成本）
      const newStopLoss = sl || averagePrice * (1 - STOP_LOSS_CONFIG.defaultPercent)

      updatePosition(existingPosition.id, {
        buyPrice: averagePrice,
        quantity: totalQuantity,
        currentPrice: price,
        highestPrice: Math.max(existingPosition.highestPrice, price),
        currentStopLoss: newStopLoss,
        takeProfit: tp || existingPosition.takeProfit,
      })
    } else {
      // 新建仓位
      const now = new Date().toISOString()
      addPosition({
        stockCode: stock.code,
        stockName: stock.name,
        buyPrice: price,
        quantity: qty,
        buyDate: now,
        note: note || undefined,
        takeProfit: tp,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 重置表单
    setNote('')
    setErrors({})
    onOpenChange(false)
  }

  // 关闭时重置
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 重置所有表单状态
      setBuyPrice('')
      setQuantity('100')
      setStopLoss('')
      setTakeProfit('')
      setNote('')
      setErrors({})
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {existingPosition ? '加仓' : '买入'} {stock.code.replace(/^(sh|sz)/, '')} {stock.name}
          </DialogTitle>
          <DialogDescription>
            当前现价: ¥{formatPrice(stock.price)} | 今日涨跌:{' '}
            <span className={cn(stock.changePercent >= 0 ? 'text-up' : 'text-down')}>
              {stock.changePercent >= 0 ? '+' : ''}
              {stock.changePercent.toFixed(2)}%
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 买入价格 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="buyPrice">买入价格</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleUseCurrentPrice}
              >
                使用现价
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="buyPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className={cn('pl-7', errors.buyPrice && 'border-destructive')}
              />
            </div>
            {errors.buyPrice && <p className="text-xs text-destructive">{errors.buyPrice}</p>}
          </div>

          {/* 买入数量 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">买入数量（股）</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={errors.quantity && 'border-destructive'}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity(100)}
              >
                100股
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity(500)}
              >
                500股
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity(1000)}
              >
                1000股
              </Button>
            </div>
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
          </div>

          {/* 预估金额 */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">预估金额:</span>
              <span className="font-medium">¥{formatAmount(estimatedAmount)}</span>
            </div>
          </div>

          {/* 止损止盈 */}
          <div className="space-y-3">
            <div className="text-sm font-medium">止损止盈（可选）</div>
            <div className="grid grid-cols-2 gap-4">
              {/* 止损价 */}
              <div className="space-y-2">
                <Label htmlFor="stopLoss" className="text-muted-foreground">
                  止损价
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className={cn('pl-7', errors.stopLoss && 'border-destructive')}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleQuickStopLoss(5)}
                  >
                    -5%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleQuickStopLoss(8)}
                  >
                    -8%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleQuickStopLoss(10)}
                  >
                    -10%
                  </Button>
                </div>
                {stopLossPercent !== null && (
                  <p className="text-xs text-down">止损幅度: {stopLossPercent.toFixed(1)}%</p>
                )}
                {errors.stopLoss && <p className="text-xs text-destructive">{errors.stopLoss}</p>}
              </div>

              {/* 止盈价 */}
              <div className="space-y-2">
                <Label htmlFor="takeProfit" className="text-muted-foreground">
                  止盈价
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="可选"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-muted-foreground">
              备注（可选）
            </Label>
            <Input
              id="note"
              placeholder="买入理由..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button className="bg-up hover:bg-up/90" onClick={handleConfirm}>
            确认买入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
