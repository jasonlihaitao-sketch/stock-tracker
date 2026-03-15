import { MARKET_PREFIX, SINA_API } from '@/lib/constants'
import type { Stock, StockSearchResult, KLineData, MinuteData } from '@/types/stock'

// 解析新浪实时行情数据
function parseSinaRealtimeData(data: string, fullCode: string): Stock | null {
  try {
    const match = data.match(/="([^"]+)"/)
    if (!match || !match[1]) return null

    const parts = match[1].split(',')
    if (parts.length < 33) return null

    return {
      code: fullCode, // 保持完整代码（如 sz000001）
      name: parts[0],
      market: fullCode.startsWith('sh') ? 'SH' : 'SZ',
      open: parseFloat(parts[1]) || 0,
      preClose: parseFloat(parts[2]) || 0,
      price: parseFloat(parts[3]) || 0,
      high: parseFloat(parts[4]) || 0,
      low: parseFloat(parts[5]) || 0,
      volume: parseInt(parts[8]) || 0,
      turnover: parseFloat(parts[9]) || 0,
      change: parseFloat(parts[3]) - parseFloat(parts[2]) || 0,
      changePercent: ((parseFloat(parts[3]) - parseFloat(parts[2])) / parseFloat(parts[2])) * 100 || 0,
      time: parts[30] + ' ' + parts[31],
    }
  } catch {
    return null
  }
}

// 获取股票实时行情
export async function getStockRealtime(codes: string[]): Promise<Stock[]> {
  if (codes.length === 0) return []

  try {
    const codeList = codes.map((code) => {
      // 如果代码已经带有市场前缀，直接使用
      if (code.startsWith('sh') || code.startsWith('sz')) {
        return code
      }
      // 否则根据代码第一位判断市场
      const market = code.startsWith('6') ? 'sh' : 'sz'
      return `${market}${code}`
    }).join(',')

    const response = await fetch(`/api/stocks/realtime?codes=${codeList}`)
    if (!response.ok) throw new Error('Failed to fetch stock data')

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching stock realtime data:', error)
    return []
  }
}

// 获取单个股票详情
export async function getStockDetail(code: string): Promise<Stock | null> {
  const stocks = await getStockRealtime([code])
  return stocks[0] || null
}

// 搜索股票
export async function searchStocks(keyword: string): Promise<StockSearchResult[]> {
  if (!keyword.trim()) return []

  try {
    const response = await fetch(`/api/stocks/search?keyword=${encodeURIComponent(keyword)}`)
    if (!response.ok) throw new Error('Failed to search stocks')

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error searching stocks:', error)
    return []
  }
}

// 获取K线数据
export async function getKLineData(
  code: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<KLineData[]> {
  try {
    const response = await fetch(`/api/stocks/kline?code=${code}&period=${period}`)
    if (!response.ok) throw new Error('Failed to fetch kline data')

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching kline data:', error)
    return []
  }
}

// 获取分时数据
export async function getMinuteData(code: string): Promise<MinuteData[]> {
  try {
    const response = await fetch(`/api/stocks/minute?code=${code}`)
    if (!response.ok) throw new Error('Failed to fetch minute data')

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching minute data:', error)
    return []
  }
}

// 服务端：直接请求新浪API
export async function fetchSinaRealtime(codes: string[]): Promise<Stock[]> {
  if (codes.length === 0) return []

  const codeList = codes.map((code) => {
    // 如果代码已经带有市场前缀，直接使用
    if (code.startsWith('sh') || code.startsWith('sz')) {
      return code
    }
    // 否则根据代码第一位判断市场
    const market = code.startsWith('6') ? 'sh' : 'sz'
    return `${market}${code}`
  }).join(',')

  try {
    const response = await fetch(
      `${SINA_API.REALTIME}${codeList}`,
      {
        headers: {
          Referer: 'https://finance.sina.com.cn',
        },
      }
    )

    // 新浪财经返回 GBK 编码，需要正确解码
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)
    const lines = text.split('\n').filter((line) => line.trim())

    const stocks: Stock[] = []
    for (const line of lines) {
      const codeMatch = line.match(/(sh|sz)(\d{6})/)
      if (codeMatch) {
        const fullCode = codeMatch[1] + codeMatch[2]
        const stock = parseSinaRealtimeData(line, fullCode)
        if (stock) {
          // 返回的 stock.code 保持为完整代码（如 sz000001）
          stocks.push(stock)
        }
      }
    }

    return stocks
  } catch (error) {
    console.error('Error fetching from Sina:', error)
    return []
  }
}

// 服务端：搜索股票
export async function fetchSinaSearch(keyword: string): Promise<StockSearchResult[]> {
  if (!keyword.trim()) return []

  try {
    const response = await fetch(
      `${SINA_API.SEARCH}${encodeURIComponent(keyword)}`,
      {
        headers: {
          Referer: 'https://finance.sina.com.cn',
        },
      }
    )

    // 新浪财经返回 GBK 编码，需要正确解码
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)

    // 解析 JSONP 响应: var params._cb="xxx;xxx;";
    const match = text.match(/var params\._cb="(.+)";/)
    if (!match || !match[1]) return []

    // 数据格式: 证券名称,type,证券代码,市场代码,证券简称,...
    // 例如: 中国平安,11,601318,sh601318,中国平安,,中国平安,99,1,ESG,,;
    const items = match[1].split(';').filter((item) => item.trim())

    return items
      .map((item) => {
        const parts = item.split(',')
        // parts[0]: 名称, parts[1]: type, parts[2]: 代码, parts[3]: 市场代码, parts[4]: 简称
        if (parts.length < 5) return null

        const name = parts[0] || ''
        const type = parts[1] || ''
        const code = parts[2] || ''
        const marketCode = parts[3] || '' // 如 sh601318, sz000001
        const shortName = parts[4] || name

        // 只返回股票和指数
        if (!code || !name) return null

        // 从市场代码提取市场前缀
        const marketPrefix = marketCode.startsWith('sh') ? 'sh' : marketCode.startsWith('sz') ? 'sz' : code.startsWith('6') ? 'sh' : 'sz'

        return {
          code: `${marketPrefix}${code}`, // 返回带市场前缀的完整代码，如 sh601318, sz000001
          name: shortName || name,
          market: marketPrefix === 'sh' ? 'SH' : 'SZ',
          type: type === '11' ? '股票' : type === '12' ? '指数' : '其他',
        }
      })
      .filter((item): item is StockSearchResult => item !== null)
      .slice(0, 10)
  } catch (error) {
    console.error('Error searching from Sina:', error)
    return []
  }
}

// 服务端：获取K线数据
export async function fetchSinaKLine(
  code: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<KLineData[]> {
  // 如果代码已经带有市场前缀，提取纯代码
  const pureCode = code.replace(/^(sh|sz)/, '')
  // 如果代码带有市场前缀，使用它；否则根据代码第一位判断市场
  const marketPrefix = code.startsWith('sh') ? 'sh' : code.startsWith('sz') ? 'sz' : (pureCode.startsWith('6') ? 'sh' : 'sz')
  const symbol = `${marketPrefix}${pureCode}`

  try {
    const params = new URLSearchParams({
      symbol,
      scale: period === 'daily' ? '240' : period === 'weekly' ? '5' : '21',
      datalen: '1000',
    })

    const response = await fetch(
      `${SINA_API.KLINE}?${params}`,
      {
        headers: {
          Referer: 'https://finance.sina.com.cn',
        },
      }
    )

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data.map((item: Record<string, string | number>) => ({
      date: String(item.day || item.date || ''),
      open: parseFloat(String(item.open || 0)),
      close: parseFloat(String(item.close || 0)),
      high: parseFloat(String(item.high || 0)),
      low: parseFloat(String(item.low || 0)),
      volume: parseInt(String(item.volume || 0)),
      turnover: parseFloat(String(item.amount || 0)),
      changePercent: parseFloat(String(item.changePercent || 0)),
    }))
  } catch (error) {
    console.error('Error fetching KLine from Sina:', error)
    return []
  }
}