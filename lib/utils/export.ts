// lib/utils/export.ts
import type { Portfolio } from '@/types/portfolio'
import type { Alert } from '@/types/alert'
import type { Position } from '@/types/position'

export interface ExportData {
  version: string
  exportedAt: string
  watchlist: {
    stocks: string[]
    groups: Array<{
      id: string
      name: string
      stockCodes: string[]
    }>
  }
  portfolios: Portfolio[]
  alerts: Alert[]
  positions: Position[]
}

export function exportAllData(): ExportData {
  // 从 localStorage 读取所有数据
  const watchlistData = localStorage.getItem('stock-tracker-watchlist')
  const portfolioData = localStorage.getItem('stock-tracker-portfolio')
  const alertData = localStorage.getItem('stock-tracker-alerts')
  const positionData = localStorage.getItem('stock-tracker-positions')

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    watchlist: watchlistData ? JSON.parse(watchlistData).state : { stocks: [], groups: [] },
    portfolios: portfolioData ? JSON.parse(portfolioData).state.portfolios : [],
    alerts: alertData ? JSON.parse(alertData).state.alerts : [],
    positions: positionData ? JSON.parse(positionData).state.positions : [],
  }
}

export function downloadAsJson(data: ExportData, filename: string = 'stock-tracker-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(jsonString: string): { success: boolean; message: string; data?: ExportData } {
  try {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.exportedAt) {
      return { success: false, message: '无效的备份文件格式' }
    }

    return { success: true, message: '数据解析成功', data }
  } catch (error) {
    return { success: false, message: 'JSON 解析失败，请检查文件格式' }
  }
}

export function restoreData(data: ExportData): void {
  if (data.watchlist) {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify({
      state: data.watchlist,
      version: 0
    }))
  }
  if (data.portfolios) {
    localStorage.setItem('stock-tracker-portfolio', JSON.stringify({
      state: { portfolios: data.portfolios },
      version: 0
    }))
  }
  if (data.alerts) {
    localStorage.setItem('stock-tracker-alerts', JSON.stringify({
      state: { alerts: data.alerts },
      version: 0
    }))
  }
  if (data.positions) {
    localStorage.setItem('stock-tracker-positions', JSON.stringify({
      state: { positions: data.positions },
      version: 0
    }))
  }
}