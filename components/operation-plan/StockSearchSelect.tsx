'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { formatPrice, formatChangePercent } from '@/lib/utils/format'
import type { Stock } from '@/types/stock'

export type StockSelectItem = Pick<Stock, 'code' | 'name' | 'market' | 'price' | 'changePercent'>

interface StockSearchSelectProps {
  value?: string
  onChange: (stock: StockSelectItem) => void
  stocks: StockSelectItem[]
  loading?: boolean
  emptyText?: string
  disabled?: boolean
  hasPosition?: (code: string) => boolean
}

export function StockSearchSelect({
  value,
  onChange,
  stocks,
  loading = false,
  emptyText = '暂无可选股票',
  disabled = false,
  hasPosition,
}: StockSearchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredStocks = React.useMemo(() => {
    if (!search.trim()) return stocks
    const keyword = search.toLowerCase()
    return stocks.filter(
      (stock) =>
        stock.code.toLowerCase().includes(keyword) ||
        stock.name.toLowerCase().includes(keyword)
    )
  }, [stocks, search])

  const selectedStock = stocks.find((s) => s.code === value)

  const handleSelect = (stock: StockSelectItem) => {
    onChange(stock)
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selectedStock && 'text-muted-foreground'
        )}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4 opacity-50" />
          {selectedStock ? (
            <span>
              {selectedStock.name} ({selectedStock.code})
            </span>
          ) : (
            '搜索或选择股票'
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="输入股票名称或代码搜索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {filteredStocks.length > 0 && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg"
          role="listbox"
        >
          {filteredStocks.map((stock) => {
            const hasPos = hasPosition?.(stock.code)
            return (
              <button
                key={stock.code}
                type="button"
                onClick={() => handleSelect(stock)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-sm',
                  'hover:bg-muted focus:bg-muted focus:outline-none',
                  value === stock.code && 'bg-muted',
                  !hasPos && 'opacity-60'
                )}
                role="option"
                aria-selected={value === stock.code}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stock.name}</span>
                  <span className="text-muted-foreground">{stock.code}</span>
                  {stock.price !== undefined && (
                    <span className="font-mono text-xs">{formatPrice(stock.price)}</span>
                  )}
                </div>
                {stock.changePercent !== undefined && (
                  <span
                    className={cn(
                      'font-mono text-xs',
                      stock.changePercent >= 0 ? 'text-up' : 'text-down'
                    )}
                  >
                    {formatChangePercent(stock.changePercent)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {filteredStocks.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background p-3 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}

      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
    </div>
  )
}