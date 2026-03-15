'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
import type { Stock } from '@/types/stock'
import type { Position } from '@/types/position'

interface SellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stock: Stock
  position?: Position
}

export function SellDialog({ open, onOpenChange, stock, position }: SellDialogProps) {
  const { updatePosition, removePosition } = usePositionStore()

  // 表单状态
  const [sellPrice, setSellPrice] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 使用 ref 跟踪对话框是否已经初始化
  const initializedRef = useRef(false)

  // 仅在对话框打开时初始化，避免重置用户输入
  useEffect(() => {
    if (open && position && stock.price > 0 && !initializedRef.current) {
      setSellPrice(stock.price.toFixed(2))
      setQuantity(position.quantity.toString())
      initializedRef.current = true
    }
    // 对话框关闭时重置初始化标志
    if (!open) {
      initializedRef.current = false
    }
  }, [open])

  // 计算卖出金额
  const sellAmount = useMemo(() => {
    const price = parseFloat(sellPrice)
    const qty = parseInt(quantity)
    if (isNaN(price) || isNaN(qty)) return 0
    return price * qty
  }, [sellPrice, quantity])

  // 计算实现盈亏
  const realizedProfit = useMemo(() => {
    if (!position) return 0
    const price = parseFloat(sellPrice)
    const qty = parseInt(quantity)
    if (isNaN(price) || isNaN(qty)) return 0
    return (price - position.buyPrice) * qty
  }, [sellPrice, quantity, position])

  // 实现盈亏百分比
  const realizedProfitPercent = useMemo(() => {
    if (!position || position.buyPrice <= 0) return 0
    const price = parseFloat(sellPrice)
    if (isNaN(price)) return 0
    return ((price - position.buyPrice) / position.buyPrice) * 100
  }, [sellPrice, position])

  // 实时验证数量是否超过持仓
  const quantityError = useMemo(() => {
    if (!position || !quantity) return null
    const qty = parseInt(quantity)
    if (!isNaN(qty) && qty > position.quantity) {
      return `卖出数量不能超过持仓数量`
    }
    return null
  }, [quantity, position])

  // 设置快捷数量
  const handleQuickQuantity = (type: 'all' | 'half' | 'third') => {
    if (!position) return
    let newQuantity: number
    switch (type) {
      case 'all':
        newQuantity = position.quantity
        break
      case 'half':
        newQuantity = Math.floor(position.quantity / 2)
        break
      case 'third':
        newQuantity = Math.floor(position.quantity / 3)
        break
    }
    setQuantity(newQuantity.toString())
  }

  // 使用当前现价
  const handleUseCurrentPrice = () => {
    if (stock.price > 0) {
      setSellPrice(stock.price.toFixed(2))
    }
  }

  // 验证表单
  const validateForm = (): boolean => {
    if (!position) return false

    const newErrors: Record<string, string> = {}

    const price = parseFloat(sellPrice)
    const qty = parseInt(quantity)

    if (isNaN(price) || price <= 0) {
      newErrors.sellPrice = '请输入有效的卖出价格'
    }

    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = '请输入有效的卖出数量'
    } else if (qty > position.quantity) {
      newErrors.quantity = `卖出数量不能超过持仓数量 (${position.quantity}股)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 确认卖出
  const handleConfirm = () => {
    if (!validateForm() || !position) return

    const price = parseFloat(sellPrice)
    const qty = parseInt(quantity)

    if (qty >= position.quantity) {
      // 全部卖出：删除持仓
      removePosition(position.id)
    } else {
      // 部分卖出：更新持仓
      updatePosition(position.id, {
        quantity: position.quantity - qty,
        currentPrice: price,
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
      setSellPrice('')
      setQuantity('')
      setNote('')
      setErrors({})
    }
    onOpenChange(newOpen)
  }

  // 无持仓时显示空内容
  if (!position) {
    return null
  }

  const isAllSelling = position && parseInt(quantity) === position.quantity
  const exceedsPosition = position && parseInt(quantity) > position.quantity

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            卖出 {stock.code.replace(/^(sh|sz)/, '')} {stock.name}
          </DialogTitle>
          <DialogDescription>
            持仓: {position.quantity}股 | 成本价: ¥{formatPrice(position.buyPrice)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 当前持仓信息 */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">现价:</span>
                <span className="font-mono">¥{formatPrice(stock.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">今日涨跌:</span>
                <span
                  className={cn('font-mono', stock.changePercent >= 0 ? 'text-up' : 'text-down')}
                >
                  {stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">持仓盈亏:</span>
                <span className={cn('font-mono', position.profit >= 0 ? 'text-up' : 'text-down')}>
                  {position.profit >= 0 ? '+' : ''}
                  {formatAmount(position.profit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">收益率:</span>
                <span
                  className={cn('font-mono', position.profitPercent >= 0 ? 'text-up' : 'text-down')}
                >
                  {position.profitPercent >= 0 ? '+' : ''}
                  {position.profitPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* 卖出价格 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sellPrice">卖出价格</Label>
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
                id="sellPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className={cn('pl-7', errors.sellPrice && 'border-destructive')}
              />
            </div>
            {errors.sellPrice && <p className="text-xs text-destructive">{errors.sellPrice}</p>}
          </div>

          {/* 卖出数量 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">卖出数量（股）</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="数量"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={cn(quantityError && 'border-destructive')}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity('all')}
              >
                全部
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity('half')}
              >
                半仓
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleQuickQuantity('third')}
              >
                1/3
              </Button>
            </div>
            {quantityError && <p className="text-xs text-destructive">{quantityError}</p>}
          </div>

          {/* 卖出统计 */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">卖出金额:</span>
              <span className="font-medium">¥{formatAmount(sellAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">实现盈亏:</span>
              <span className={cn('font-medium', realizedProfit >= 0 ? 'text-up' : 'text-down')}>
                {realizedProfit >= 0 ? '+' : ''}¥{formatAmount(Math.abs(realizedProfit))}
                <span className="ml-1 text-xs">
                  ({realizedProfitPercent >= 0 ? '+' : ''}
                  {realizedProfitPercent.toFixed(2)}%)
                </span>
              </span>
            </div>
            {isAllSelling && (
              <div className="text-xs text-muted-foreground">* 全部卖出后将清空持仓</div>
            )}
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-muted-foreground">
              备注（可选）
            </Label>
            <Input
              id="note"
              placeholder="卖出理由..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            className="bg-down hover:bg-down/90"
            onClick={handleConfirm}
            disabled={exceedsPosition}
          >
            {isAllSelling ? '确认清仓' : '确认卖出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
