'use client'

import { useMemo, useCallback, useState } from 'react'
import { useWatchlistStore, ALL_GROUP_ID } from '@/store/stockStore'
import { useSignalStore } from '@/store/signalStore'
import { SignalBadge } from '@/components/signal/SignalBadge'
import { formatChangePercent } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { MoreHorizontal, FolderInput, Trash2, AlertTriangle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function WatchlistTable() {
  const { stocks, stockData, loading, groups, activeGroupId, moveStockToGroup, removeStock } =
    useWatchlistStore()
  const { buySignals, sellSignals } = useSignalStore()

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<{ code: string; name: string } | null>(null)

  // 使用 useMemo 缓存显示的股票列表
  const displayedStocks = useMemo(
    () =>
      activeGroupId === ALL_GROUP_ID
        ? stocks
        : groups.find((g) => g.id === activeGroupId)?.stockCodes || [],
    [activeGroupId, stocks, groups]
  )

  // 使用 useCallback 缓存事件处理函数
  const handleMoveToGroup = useCallback(
    (stockCode: string, groupId: string | null) => {
      moveStockToGroup(stockCode, groupId)
    },
    [moveStockToGroup]
  )

  const handleRemove = useCallback(
    (code: string) => {
      const stock = stockData[code]
      setStockToDelete({ code, name: stock?.name || code })
      setDeleteDialogOpen(true)
    },
    [stockData]
  )

  const confirmDelete = useCallback(() => {
    if (stockToDelete) {
      removeStock(stockToDelete.code)
      setDeleteDialogOpen(false)
      setStockToDelete(null)
    }
  }, [stockToDelete, removeStock])

  const getCurrentGroupName = useCallback(
    (stockCode: string) => {
      const group = groups.find((g) => g.stockCodes.includes(stockCode))
      return group ? group.name : '未分组'
    },
    [groups]
  )

  if (displayedStocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>{activeGroupId === ALL_GROUP_ID ? '暂无自选股' : '该分组暂无股票'}</p>
        <p className="text-sm">
          {activeGroupId === ALL_GROUP_ID
            ? '请搜索并添加您关注的股票'
            : '请从"全部"列表中将股票移入此分组'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* 加载指示器 - 不影响数据显示 */}
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-muted">
          <div className="h-full w-full animate-pulse bg-primary" />
        </div>
      )}

      {/* 桌面端表格视图 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-5 py-3 text-left text-sm font-medium">名称</th>
              <th className="px-5 py-3 text-right text-sm font-medium">价格</th>
              <th className="px-5 py-3 text-right text-sm font-medium">涨跌</th>
              <th className="px-5 py-3 text-center text-sm font-medium">信号</th>
              <th className="w-10 px-5 py-3 text-center text-sm font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {displayedStocks.map((code) => {
              const stock = stockData[code]
              // 提取纯代码用于匹配信号
              const pureCode = code.replace(/^(sh|sz)/, '')
              const buySignal = buySignals.find(
                (s) => s.stockCode === pureCode || s.stockCode === code
              )
              const sellSignal = sellSignals.find(
                (s) => s.stockCode === pureCode || s.stockCode === code
              )
              const signal = buySignal || sellSignal

              // 如果没有数据，显示骨架屏而不是空白
              if (!stock) {
                return (
                  <tr key={code} className="border-b last:border-b-0">
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="ml-auto h-4 w-12 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={code}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    <Link href={`/stock/${code}`} className="hover:underline">
                      <div className="font-medium">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">{code}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{stock.price.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'font-medium tabular-nums',
                        stock.changePercent >= 0 ? 'text-up' : 'text-down'
                      )}
                    >
                      {formatChangePercent(stock.changePercent)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {signal ? (
                      <SignalBadge type={signal.type} strength={signal.strength} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="更多操作"
                          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          当前: {getCurrentGroupName(code)}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {groups.length > 0 && (
                          <>
                            <DropdownMenuLabel className="text-xs">移动到分组</DropdownMenuLabel>
                            {groups.map((group) => (
                              <DropdownMenuItem
                                key={group.id}
                                onClick={() => handleMoveToGroup(code, group.id)}
                                disabled={group.stockCodes.includes(code)}
                              >
                                <FolderInput className="mr-2 h-4 w-4" />
                                {group.name}
                                {group.stockCodes.includes(code) && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    当前
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleMoveToGroup(code, null)}
                          disabled={!groups.some((g) => g.stockCodes.includes(code))}
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          移出分组
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemove(code)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片视图 */}
      <div className="divide-y md:hidden">
        {displayedStocks.map((code) => {
          const stock = stockData[code]
          const pureCode = code.replace(/^(sh|sz)/, '')
          const buySignal = buySignals.find((s) => s.stockCode === pureCode || s.stockCode === code)
          const sellSignal = sellSignals.find(
            (s) => s.stockCode === pureCode || s.stockCode === code
          )
          const signal = buySignal || sellSignal

          if (!stock) {
            return (
              <div key={code} className="p-4">
                <div className="flex animate-pulse items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="h-4 w-16 rounded bg-muted" />
                    <div className="h-3 w-12 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
              </div>
            )
          }

          return (
            <Link
              key={code}
              href={`/stock/${code}`}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="font-medium">{stock.name}</div>
                <div className="text-xs text-muted-foreground">{code}</div>
              </div>
              <div className="text-right">
                <div className="font-mono">{stock.price.toFixed(2)}</div>
                <div
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    stock.changePercent >= 0 ? 'text-up' : 'text-down'
                  )}
                >
                  {formatChangePercent(stock.changePercent)}
                </div>
              </div>
              {signal && (
                <div className="ml-3">
                  <SignalBadge type={signal.type} strength={signal.strength} />
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要将 <span className="font-medium text-foreground">{stockToDelete?.name}</span>{' '}
              从自选股中删除吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
