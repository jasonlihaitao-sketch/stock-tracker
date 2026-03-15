import type { Sector } from '@/types/sector'

/**
 * 获取热门板块数据（服务端调用）
 * 数据来源：东方财富
 */
export async function fetchSectors(): Promise<Sector[]> {
  // 东方财富板块数据接口
  const url = 'https://push2.eastmoney.com/api/qt/clist/get'
  const params = new URLSearchParams({
    fid: 'f3',  // 按涨跌幅排序
    po: '1',
    pz: '20',   // 获取20个板块
    pn: '1',
    np: '1',
    fltt: '2',
    invt: '2',
    fs: 'm:90+t:2',  // 板块
    fields: 'f1,f2,f3,f4,f5,f6,f7,f12,f14'
  })

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Referer': 'https://quote.eastmoney.com/'
      },
      next: { revalidate: 300 } // 5分钟缓存
    })

    if (!response.ok) {
      throw new Error('Failed to fetch sector data')
    }

    const data = await response.json()

    if (!data.data?.diff) {
      return []
    }

    return data.data.diff.map((item: Record<string, unknown>) => ({
      code: String(item.f12 || ''),
      name: String(item.f14 || ''),
      changePercent: Number(item.f3 || 0) / 100,  // 东方财富返回的是百分比*100
      capitalFlow: Number(item.f6 || 0) / 100000000,  // 转换为亿
      leadingStocks: [],  // 需要单独获取
      stocks: []
    }))
  } catch (error) {
    console.error('Error fetching sectors:', error)
    return []
  }
}

/**
 * 获取板块数据（客户端调用）
 */
export async function getSectors(): Promise<Sector[]> {
  const response = await fetch('/api/sector')
  if (!response.ok) {
    throw new Error('Failed to fetch sector data')
  }

  const result = await response.json()
  return result.data || []
}