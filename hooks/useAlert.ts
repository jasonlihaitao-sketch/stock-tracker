// hooks/useAlert.ts
import { useCallback, useRef } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { getStockRealtime } from '@/lib/api/stock'
import type { Alert, AlertHistory, SmartAlert } from '@/types/alert'

export interface UseAlertReturn {
  // 状态
  alerts: Alert[]
  smartAlerts: SmartAlert[]
  alertHistory: AlertHistory[]

  // 操作
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void
  updateAlert: (id: string, updates: Partial<Alert>) => void
  removeAlert: (id: string) => void
  toggleAlert: (id: string) => void

  // 智能提醒
  addSmartAlert: (alert: Omit<SmartAlert, 'id' | 'createdAt'>) => void
  dismissAlert: (id: string) => void
  getTriggeredAlerts: () => SmartAlert[]

  // 检查
  checkAlerts: () => Promise<void>
}

export function useAlert(): UseAlertReturn {
  const {
    alerts,
    smartAlerts,
    alertHistory,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert,
    addSmartAlert,
    dismissAlert,
    getTriggeredAlerts,
    addHistory,
  } = useAlertStore()

  const lastCheckedRef = useRef<Record<string, number>>({})

  const checkAlerts = useCallback(async () => {
    const enabledAlerts = alerts.filter((a) => a.enabled)
    if (enabledAlerts.length === 0) return

    const codes = Array.from(new Set(enabledAlerts.map((a) => a.stockCode)))
    const stocks = await getStockRealtime(codes)
    const stockMap = new Map(stocks.map((s) => [s.code, s]))

    for (const alert of enabledAlerts) {
      const stock = stockMap.get(alert.stockCode)
      if (!stock) continue

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
      }
    }
  }, [alerts, addHistory])

  return {
    alerts,
    smartAlerts,
    alertHistory,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert,
    addSmartAlert,
    dismissAlert,
    getTriggeredAlerts,
    checkAlerts,
  }
}