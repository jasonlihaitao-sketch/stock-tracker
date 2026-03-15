import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Alert, AlertHistory, AlertSettings, SmartAlert, AlertLog } from '@/types/alert'

interface AlertState {
  // 传统预警
  alerts: Alert[]
  alertHistory: AlertHistory[]
  settings: AlertSettings

  // 智能提醒
  smartAlerts: SmartAlert[]
  alertLogs: AlertLog[]

  // 传统预警操作
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void
  updateAlert: (id: string, alert: Partial<Alert>) => void
  removeAlert: (id: string) => void
  toggleAlert: (id: string) => void
  addHistory: (history: Omit<AlertHistory, 'id'>) => void
  markHistoryRead: (id: string) => void
  updateSettings: (settings: Partial<AlertSettings>) => void

  // 智能提醒操作
  addSmartAlert: (alert: Omit<SmartAlert, 'id' | 'createdAt'>) => void
  updateSmartAlertStatus: (id: string, status: SmartAlert['status']) => void
  dismissAlert: (id: string) => void

  // 提醒日志
  addAlertLog: (log: Omit<AlertLog, 'id'>) => void
  markLogAsRead: (id: string) => void

  // 查询
  getTriggeredAlerts: () => SmartAlert[]
  getTodayLogs: () => AlertLog[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const DEFAULT_SETTINGS: AlertSettings = {
  notificationMethods: ['browser'],
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      alertHistory: [],
      settings: DEFAULT_SETTINGS,
      smartAlerts: [],
      alertLogs: [],

      // 传统预警
      addAlert: (alertData) => {
        const alert: Alert = {
          ...alertData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ alerts: [...state.alerts, alert] }))
      },

      updateAlert: (id, updates) => {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }))
      },

      removeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id)
        }))
      },

      toggleAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }))
      },

      addHistory: (history) => {
        const newHistory: AlertHistory = {
          ...history,
          id: generateId(),
        }
        set((state) => ({
          alertHistory: [newHistory, ...state.alertHistory].slice(0, 100)
        }))
      },

      markHistoryRead: (id) => {
        set((state) => ({
          alertHistory: state.alertHistory.map((h) =>
            h.id === id ? { ...h, read: true } : h
          ),
        }))
      },

      updateSettings: (settings) => {
        set((state) => ({ settings: { ...state.settings, ...settings } }))
      },

      // 智能提醒
      addSmartAlert: (alertData) => {
        const alert: SmartAlert = {
          ...alertData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ smartAlerts: [...state.smartAlerts, alert] }))
      },

      updateSmartAlertStatus: (id, status) => {
        set((state) => ({
          smartAlerts: state.smartAlerts.map(a =>
            a.id === id ? {
              ...a,
              status,
              triggeredAt: status === 'triggered' ? new Date().toISOString() : a.triggeredAt
            } : a
          )
        }))
      },

      dismissAlert: (id) => {
        set((state) => ({
          smartAlerts: state.smartAlerts.map(a =>
            a.id === id ? { ...a, status: 'dismissed' } : a
          )
        }))
      },

      // 提醒日志
      addAlertLog: (logData) => {
        const log: AlertLog = {
          ...logData,
          id: generateId(),
        }
        set((state) => ({ alertLogs: [log, ...state.alertLogs] }))
      },

      markLogAsRead: (id) => {
        set((state) => ({
          alertLogs: state.alertLogs.map(l =>
            l.id === id ? { ...l, read: true } : l
          )
        }))
      },

      // 查询
      getTriggeredAlerts: () => {
        return get().smartAlerts.filter(a => a.status === 'triggered')
      },

      getTodayLogs: () => {
        const today = new Date().toDateString()
        return get().alertLogs.filter(l =>
          new Date(l.triggeredAt).toDateString() === today
        )
      },
    }),
    {
      name: 'stock-tracker-alerts',
      partialize: (state) => ({
        alerts: state.alerts,
        smartAlerts: state.smartAlerts,
        alertLogs: state.alertLogs,
        settings: state.settings,
      })
    }
  )
)