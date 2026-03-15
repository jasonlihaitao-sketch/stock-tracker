'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { getStockRealtime } from '@/lib/api/stock'

// 请求浏览器通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 发送浏览器通知
export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    })
  }
}

// 预警检查 Hook
export function useAlertChecker() {
  const { alerts, addHistory } = useAlertStore()
  const lastCheckedRef = useRef<Record<string, number>>({})

  const checkAlerts = useCallback(async () => {
    const enabledAlerts = alerts.filter((a) => a.enabled)
    if (enabledAlerts.length === 0) return

    // 获取所有需要检查的股票代码
    const codes = Array.from(new Set(enabledAlerts.map((a) => a.stockCode)))
    const stocks = await getStockRealtime(codes)
    const stockMap = new Map(stocks.map((s) => [s.code, s]))

    for (const alert of enabledAlerts) {
      const stock = stockMap.get(alert.stockCode)
      if (!stock) continue

      // 防止重复触发：同一预警5分钟内不重复触发
      const lastTriggered = lastCheckedRef.current[alert.id] || 0
      const now = Date.now()
      if (now - lastTriggered < 5 * 60 * 1000) continue

      let triggered = false
      let conditionText = ''

      switch (alert.type) {
        case 'price_up':
          if (stock.price >= alert.value) {
            triggered = true
            conditionText = `价格突破 ${alert.value} 元`
          }
          break
        case 'price_down':
          if (stock.price <= alert.value) {
            triggered = true
            conditionText = `价格跌破 ${alert.value} 元`
          }
          break
        case 'change_up':
          if (stock.changePercent >= alert.value) {
            triggered = true
            conditionText = `涨幅超过 ${alert.value}%`
          }
          break
        case 'change_down':
          if (stock.changePercent <= -alert.value) {
            triggered = true
            conditionText = `跌幅超过 ${alert.value}%`
          }
          break
      }

      if (triggered) {
        lastCheckedRef.current[alert.id] = now

        // 添加历史记录
        addHistory({
          alertId: alert.id,
          stockCode: alert.stockCode,
          stockName: alert.stockName,
          condition: conditionText,
          triggerValue: alert.value,
          actualValue: alert.type.includes('price') ? stock.price : stock.changePercent,
          triggeredAt: new Date().toISOString(),
          read: false,
        })

        // 发送浏览器通知
        const hasPermission = await requestNotificationPermission()
        if (hasPermission) {
          sendNotification(`${alert.stockName} 预警触发`, {
            body: `${conditionText}，当前价格 ${stock.price.toFixed(2)} 元`,
            tag: alert.id,
          })
        }
      }
    }
  }, [alerts, addHistory])

  return { checkAlerts }
}

// 预警监控组件
export function AlertMonitor() {
  const { checkAlerts } = useAlertChecker()

  useEffect(() => {
    // 每30秒检查一次预警
    const interval = setInterval(checkAlerts, 30000)
    // 立即执行一次
    checkAlerts()

    return () => clearInterval(interval)
  }, [checkAlerts])

  return null
}