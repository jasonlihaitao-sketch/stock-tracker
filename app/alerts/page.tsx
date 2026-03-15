'use client'

import { useAlertStore } from '@/store/alertStore'
import { formatPrice, formatTime } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bell, Settings, X, Check } from 'lucide-react'
import Link from 'next/link'

export default function AlertsPage() {
  const { getTriggeredAlerts, getTodayLogs, dismissAlert, markLogAsRead } = useAlertStore()

  const triggeredAlerts = getTriggeredAlerts()
  const todayLogs = getTodayLogs()

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">提醒中心</h1>
          <p className="page-description">查看和管理所有提醒</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-1.5 h-4 w-4" />
          设置
        </Button>
      </div>

      {/* 触发中的提醒 */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
            触发中 ({triggeredAlerts.length})
          </h2>
          <div className="space-y-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/stock/${alert.stockCode}`} className="hover:underline">
                      <span className="font-medium">{alert.stockName}</span>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alert.type === 'stop_loss' && '触发止损线'}
                      {alert.type === 'signal' && '收到交易信号'}
                      {alert.type === 'price' &&
                        `${alert.condition.operator === 'above' ? '突破' : '跌破'}价格 ${alert.condition.value}`}
                      {alert.type === 'change' && `涨跌幅超过 ${alert.condition.value}%`}
                    </p>
                    {alert.triggeredPrice && (
                      <p className="text-sm text-muted-foreground">
                        当前价: {formatPrice(alert.triggeredPrice)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => dismissAlert(alert.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/stock/${alert.stockCode}`}>查看</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今日提醒历史 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">今日提醒历史 ({todayLogs.length})</h2>
        {todayLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-lg font-medium">今日暂无提醒</p>
            <p className="mt-1 text-sm">设置预警后会在此显示</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-xl border bg-card p-3.5 transition-colors',
                  !log.read && 'border-primary/50 bg-primary/5'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <span className="font-medium">{log.stockName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{log.message}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(log.triggeredAt)}
                  </span>
                  {!log.read && (
                    <Button size="sm" variant="ghost" onClick={() => markLogAsRead(log.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
