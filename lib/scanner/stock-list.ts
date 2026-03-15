// lib/scanner/stock-list.ts

/**
 * 获取可扫描的股票列表
 * 通过后端 API 代理，解决 CORS 问题
 */
export async function fetchScanableStocks(): Promise<string[]> {
  try {
    const response = await fetch('/api/stocks/list?type=all', {
      cache: 'force-cache',
    })

    if (!response.ok) {
      console.error('Failed to fetch stock list:', response.status)
      return []
    }

    const data = await response.json()
    console.log(`[Scanner] Fetched ${data.total} scanable stocks`)
    return data.stocks || []
  } catch (error) {
    console.error('Error fetching scanable stocks:', error)
    return []
  }
}

/**
 * 获取沪深300成分股列表
 */
export async function fetchHS300Stocks(): Promise<string[]> {
  try {
    const response = await fetch('/api/stocks/list?type=hs300', {
      cache: 'force-cache',
    })

    if (!response.ok) {
      console.error('Failed to fetch HS300 list:', response.status)
      return []
    }

    const data = await response.json()
    console.log(`[Scanner] Fetched ${data.total} HS300 stocks`)
    return data.stocks || []
  } catch (error) {
    console.error('Error fetching HS300 stocks:', error)
    return []
  }
}
