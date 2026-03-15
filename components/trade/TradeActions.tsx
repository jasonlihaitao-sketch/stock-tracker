'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BuyDialog } from './BuyDialog'
import { SellDialog } from './SellDialog'
import { usePositionStore } from '@/store/positionStore'
import { formatPrice, formatAmount, cn } from '@/lib/utils'
import type { Stock } from '@/types/stock'

interface TradeActionsProps {
  stock: Stock
}

export function TradeActions({ stock }: TradeActionsProps) {
  const [buyDialogOpen, setBuyDialogOpen] = useState(false)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)

  // 直接订阅 positions 数组，确保组件在持仓变化时重新渲染
  const position = usePositionStore((state) =>
    state.positions.find((p) => p.stockCode === stock.code)
  )

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 交易按钮 */}
            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 bg-up hover:bg-up/90 md:flex-none"
                onClick={() => setBuyDialogOpen(true)}
              >
                <TrendingUp className="h-4 w-4" />
                {position ? '加仓' : '买入'}
              </Button>
              <Button
                className="flex-1 gap-2 bg-down hover:bg-down/90 md:flex-none"
                onClick={() => setSellDialogOpen(true)}
                disabled={!position}
              >
                <TrendingDown className="h-4 w-4" />
                卖出
              </Button>
            </div>

            {/* 持仓信息 */}
            {position && (
              <div className="rounded-lg bg-muted/50 p-3 md:min-w-[280px]">
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">持仓:</span>
                  <span className="font-medium">{position.quantity}股</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">成本:</span>
                    <span className="font-mono">{formatPrice(position.buyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">现价:</span>
                    <span className="font-mono">{formatPrice(stock.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">盈亏:</span>
                    <span
                      className={cn('font-mono', position.profit >= 0 ? 'text-up' : 'text-down')}
                    >
                      {position.profit >= 0 ? '+' : ''}
                      {formatAmount(position.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">收益率:</span>
                    <span
                      className={cn(
                        'font-mono',
                        position.profitPercent >= 0 ? 'text-up' : 'text-down'
                      )}
                    >
                      {position.profitPercent >= 0 ? '+' : ''}
                      {position.profitPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 无持仓提示 */}
            {!position && (
              <div className="text-sm text-muted-foreground">当前无持仓，点击「买入」开始建仓</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 买入对话框 */}
      <BuyDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        stock={stock}
        existingPosition={position}
      />

      {/* 卖出对话框 */}
      <SellDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        stock={stock}
        position={position}
      />
    </>
  )
}
