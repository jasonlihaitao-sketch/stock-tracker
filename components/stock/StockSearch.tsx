'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Search, X, Plus, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { searchStocks } from '@/lib/api/stock'
import type { StockSearchResult } from '@/types/stock'
import { cn } from '@/lib/utils'

interface StockSearchProps {
  onSelect?: (stock: StockSearchResult) => void
  placeholder?: string
  className?: string
  buttonVariant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link'
  children?: React.ReactNode
}

// 搜索结果项组件，带有平滑动画
function SearchResultItem({
  stock,
  onSelect,
  index,
}: {
  stock: StockSearchResult
  onSelect: () => void
  index: number
}) {
  const displayCode = stock.code.replace(/^(sh|sz)/, '')
  const marketLabel = stock.market === 'SH' ? '沪' : '深'

  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-center justify-between rounded-lg p-3
                 transition-all duration-200 ease-out
                 animate-in fade-in slide-in-from-left-2
                 hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-200',
            'bg-muted group-hover:bg-primary/10 group-hover:text-primary'
          )}
        >
          {marketLabel}
        </span>
        <div className="flex flex-col items-start">
          <span className="font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
            {displayCode}
          </span>
          <span className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground/80">
            {stock.name}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stock.changePercent !== undefined && (
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              stock.changePercent >= 0 ? 'text-up' : 'text-down'
            )}
          >
            {stock.changePercent >= 0 ? (
              <TrendingUp className="mr-0.5 inline h-3 w-3" />
            ) : (
              <TrendingDown className="mr-0.5 inline h-3 w-3" />
            )}
            {stock.changePercent >= 0 ? '+' : ''}
            {stock.changePercent.toFixed(2)}%
          </span>
        )}
        <Plus className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:rotate-90 group-hover:text-primary" />
      </div>
    </button>
  )
}

// 骨架加载动画
function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center justify-between rounded-lg p-3"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-5 w-6 rounded-md bg-muted" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="h-4 w-8 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function StockSearch({
  onSelect,
  placeholder = '搜索股票代码或名称...',
  className,
  buttonVariant = 'outline',
  children,
}: StockSearchProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // 防抖定时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 防抖搜索函数
  const debouncedSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await searchStocks(value)
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setKeyword(value)

      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // 如果输入为空，立即清空结果
      if (!value.trim()) {
        setResults([])
        return
      }

      // 设置新的防抖定时器 (300ms)
      debounceTimerRef.current = setTimeout(() => {
        debouncedSearch(value)
      }, 300)
    },
    [debouncedSearch]
  )

  const handleSelect = (stock: StockSearchResult) => {
    onSelect?.(stock)
    setOpen(false)
    setKeyword('')
    setResults([])
  }

  const handleClear = () => {
    setKeyword('')
    setResults([])
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        className={cn(
          'justify-start transition-all duration-200',
          className,
          !children && 'text-muted-foreground',
          !children && keyword && 'border-primary/50 text-foreground'
        )}
        onClick={() => setOpen(true)}
      >
        {children ? (
          children
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            {keyword || placeholder}
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>搜索股票</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200" />
              <Input
                placeholder={placeholder}
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9 transition-all duration-200 focus:ring-2"
                autoFocus
              />
              {keyword && (
                <button
                  aria-label="清除搜索"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent max-h-[320px] overflow-y-auto overflow-x-hidden">
              {loading ? (
                <SearchSkeleton />
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((stock, index) => (
                    <SearchResultItem
                      key={stock.code}
                      stock={stock}
                      onSelect={() => handleSelect(stock)}
                      index={index}
                    />
                  ))}
                </div>
              ) : keyword ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground duration-200 animate-in fade-in">
                  <Search className="mb-2 h-8 w-8 opacity-50" />
                  <p>未找到相关股票</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="mb-2 h-8 w-8 opacity-50" />
                  <p>输入股票代码或名称搜索</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
