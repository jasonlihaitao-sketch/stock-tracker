'use client'

import { memo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Trash2,
  Bell,
  ExternalLink,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Stock } from '@/types/stock'
import { formatPrice, formatChangePercent, formatVolume, cn } from '@/lib/utils'

interface StockCardProps {
  stock: Stock
  fullCode?: string // 带市场前缀的完整代码，用于删除和详情链接
  onRemove?: (code: string) => void
  onSetAlert?: (code: string, name: string) => void
}

const StockCardComponent = ({ stock, fullCode, onRemove, onSetAlert }: StockCardProps) => {
  const isUp = stock.change > 0
  const isDown = stock.change < 0
  const isFlat = stock.change === 0

  // 用于链接和删除的代码
  const linkCode = fullCode || stock.code
  // 显示的代码（去掉市场前缀）
  const displayCode = stock.code

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <Link href={`/stock/${linkCode}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{displayCode}</span>
            {isUp && <TrendingUp className="h-4 w-4 text-up" />}
            {isDown && <TrendingDown className="h-4 w-4 text-down" />}
            {isFlat && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="truncate text-muted-foreground">{stock.name}</div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/stock/${linkCode}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                查看详情
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetAlert?.(linkCode, stock.name)}>
              <Bell className="mr-2 h-4 w-4" />
              设置预警
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove?.(linkCode)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              移除自选
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="text-2xl font-bold">{formatPrice(stock.price)}</div>
          <div className={cn('text-sm', isUp && 'text-up', isDown && 'text-down')}>
            {formatChangePercent(stock.changePercent)}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>成交量: {formatVolume(stock.volume)}</div>
          <div>最高: {formatPrice(stock.high)}</div>
          <div>最低: {formatPrice(stock.low)}</div>
        </div>
      </div>
    </Card>
  )
}

// 使用自定义比较函数优化渲染
export const StockCard = memo(StockCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.stock.code === nextProps.stock.code &&
    prevProps.stock.price === nextProps.stock.price &&
    prevProps.stock.changePercent === nextProps.stock.changePercent &&
    prevProps.fullCode === nextProps.fullCode
  )
})
