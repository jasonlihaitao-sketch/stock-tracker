import type { MarketStats, IndexData, HotSector } from '@/types/market'

// 大盘指数代码
const INDEX_CODES = {
  SH: 'sh000001',    // 上证指数
  SZ: 'sz399001',    // 深证成指
  CY: 'sz399006',    // 创业板指
}

/**
 * 根据代码获取指数名称
 */
function getIndexName(code: string): string {
  const names: Record<string, string> = {
    [INDEX_CODES.SH]: '上证指数',
    [INDEX_CODES.SZ]: '深证成指',
    [INDEX_CODES.CY]: '创业板指',
  }
  return names[code] || code
}

// ============ 客户端函数 ============

/**
 * 获取大盘指数数据（客户端调用）
 */
export async function getMarketIndexes(): Promise<IndexData[]> {
  const codes = Object.values(INDEX_CODES).join(',')
  try {
    const response = await fetch(`/api/stocks/realtime?codes=${codes}`)
    if (!response.ok) throw new Error('Failed to fetch index data')

    const result = await response.json()
    const data = result.data || []

    return data.map((item: { code: string; name: string; price: number; change: number; changePercent: number }) => ({
      code: item.code,
      name: getIndexName(item.code),
      price: item.price,
      change: item.change,
      changePercent: item.changePercent,
    }))
  } catch (error) {
    console.error('Error fetching market indexes:', error)
    return []
  }
}

/**
 * 获取市场统计数据（涨跌比、资金流向）
 */
export async function getMarketStats(): Promise<MarketStats> {
  try {
    const response = await fetch('/api/market/stats')
    if (!response.ok) throw new Error('Failed to fetch market stats')

    const result = await response.json()
    return result.data || {
      upCount: 0,
      downCount: 0,
      limitUp: 0,
      limitDown: 0,
      netInflow: 0,
    }
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return {
      upCount: 0,
      downCount: 0,
      limitUp: 0,
      limitDown: 0,
      netInflow: 0,
    }
  }
}

/**
 * 获取热门板块 TOP N
 */
export async function getHotSectors(limit: number = 3): Promise<HotSector[]> {
  try {
    const response = await fetch(`/api/sector?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch hot sectors')

    const result = await response.json()
    const sectors = result.data || []
    return sectors.slice(0, limit).map((item: { code: string; name: string; changePercent: number }) => ({
      code: item.code,
      name: item.name,
      changePercent: item.changePercent,
    }))
  } catch (error) {
    console.error('Error fetching hot sectors:', error)
    return []
  }
}

// ============ 服务端函数 ============

/**
 * 服务端：获取市场统计数据
 */
export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    // 获取涨跌统计数据
    const statsUrl = 'https://push2.eastmoney.com/api/qt/clist/get'
    const params = new URLSearchParams({
      pn: '1',
      pz: '5000',
      po: '1',
      np: '1',
      fltt: '2',
      invt: '2',
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',  // A股
      fields: 'f3,f152,f153,f154',  // 涨跌幅、涨跌家数
    })

    const response = await fetch(`${statsUrl}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 30 }  // 30秒缓存
    })

    if (!response.ok) {
      return { upCount: 0, downCount: 0, limitUp: 0, limitDown: 0, netInflow: 0 }
    }

    const data = await response.json()
    const diff = data.data?.diff || []

    let upCount = 0
    let downCount = 0
    let limitUp = 0
    let limitDown = 0

    for (const item of diff) {
      const changePercent = Number(item.f3 || 0) / 100
      if (changePercent > 0) upCount++
      if (changePercent < 0) downCount++
      if (changePercent >= 9.9) limitUp++
      if (changePercent <= -9.9) limitDown++
    }

    // 获取主力资金净流入
    const netInflow = await fetchCapitalFlow()

    return { upCount, downCount, limitUp, limitDown, netInflow }
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return { upCount: 0, downCount: 0, limitUp: 0, limitDown: 0, netInflow: 0 }
  }
}

/**
 * 服务端：获取主力资金净流入
 */
async function fetchCapitalFlow(): Promise<number> {
  try {
    const url = 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get'
    const params = new URLSearchParams({
      lmt: '0',
      klt: '1',
      secid: '1.000001',  // 上证指数
      fields1: 'f1,f2,f3,f7',
      fields2: 'f62,f184,f66,f69,f72,f75,f78,f81,f84,f87',
    })

    const response = await fetch(`${url}?${params}`, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 30 }
    })

    if (!response.ok) return 0

    const data = await response.json()
    // f62: 主力净流入
    const netInflow = data.data?.klines?.[0]?.split(',')?.[0] || 0
    return Number(netInflow) / 100000000  // 转换为亿
  } catch (error) {
    console.error('Error fetching capital flow:', error)
    return 0
  }
}