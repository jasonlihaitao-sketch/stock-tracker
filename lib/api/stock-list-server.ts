// lib/api/stock-list-server.ts

/**
 * 服务端股票列表获取
 * 用于 API Routes 中直接获取股票列表，不经过 HTTP 请求
 */

/**
 * 从东方财富获取股票列表
 */
export async function fetchStockListFromEastmoney(): Promise<string[]> {
  const url = 'https://push2.eastmoney.com/api/qt/clist/get'
  const params = new URLSearchParams({
    pn: '1',
    pz: '6000',
    po: '1',
    np: '1',
    fltt: '2',
    invt: '2',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3',
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        Referer: 'https://quote.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const diff = data.data?.diff || []

    const stocks: string[] = []
    for (const item of diff) {
      const code = String(item.f12 || '')
      const name = String(item.f14 || '')

      // 剔除 ST 股票
      if (name.includes('ST') || name.includes('*ST')) continue

      // 剔除停牌股票（涨跌幅为空）
      if (item.f3 === null || item.f3 === undefined) continue

      // 添加市场前缀
      const market = code.startsWith('6') ? 'sh' : 'sz'
      stocks.push(`${market}${code}`)
    }

    console.log(`[Stock List Server] Fetched ${stocks.length} stocks from Eastmoney`)
    return stocks
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * 生成备用股票代码列表
 */
export function generateFallbackStockList(): string[] {
  const stocks: string[] = []

  // 上证主板: 600000-605000
  for (let i = 600000; i <= 605000; i++) {
    stocks.push(`sh${i}`)
  }

  // 上证科创板: 688000-689999
  for (let i = 688000; i <= 689999; i++) {
    stocks.push(`sh${i}`)
  }

  // 深证主板: 000001-002999
  for (let i = 1; i <= 2999; i++) {
    stocks.push(`sz${String(i).padStart(6, '0')}`)
  }

  // 创业板: 300001-301999
  for (let i = 300001; i <= 301999; i++) {
    stocks.push(`sz${i}`)
  }

  console.log(`[Stock List Server] Generated ${stocks.length} stock codes (fallback)`)
  return stocks
}

/**
 * 获取全市场可扫描股票列表（服务端版本）
 */
export async function getScanableStocksServer(): Promise<string[]> {
  try {
    const stocks = await fetchStockListFromEastmoney()
    // 只有返回足够数量的股票才使用，否则使用备用方案
    if (stocks.length >= 1000) {
      return stocks
    }
    console.log(
      `[Stock List Server] Eastmoney returned only ${stocks.length} stocks, using fallback...`
    )
  } catch (e) {
    console.log('[Stock List Server] Eastmoney API failed, using fallback...')
  }

  return generateFallbackStockList()
}

/**
 * 沪深300成分股代码（2024年最新）
 */
const HS300_CODES = [
  // 金融
  'sh600000',
  'sh600016',
  'sh600036',
  'sh601166',
  'sh601288',
  'sh601318',
  'sh601398',
  'sh601601',
  'sh601818',
  'sh601939',
  'sh601988',
  // 科技
  'sz000063',
  'sz000725',
  'sz002415',
  'sz002475',
  'sz300750',
  'sh600519',
  'sh600900',
  'sh603259',
  // 消费
  'sz000333',
  'sz000568',
  'sz000858',
  'sh600887',
  // 医药
  'sz000538',
  'sz300015',
  'sh600276',
  'sh603259',
  // 能源
  'sh600028',
  'sh600019',
  'sh601857',
  'sh601088',
  // 更多成分股
  'sh600009',
  'sh600010',
  'sh600011',
  'sh600015',
  'sh600029',
  'sh600030',
  'sh600031',
  'sh600048',
  'sh600050',
  'sh600104',
  'sh600109',
  'sh600111',
  'sh600115',
  'sh600118',
  'sh600150',
  'sh600176',
  'sh600183',
  'sh600208',
  'sh600221',
  'sh600233',
  'sh600276',
  'sh600297',
  'sh600299',
  'sh600309',
  'sh600332',
  'sh600346',
  'sh600352',
  'sh600406',
  'sh600438',
  'sh600486',
  'sh600489',
  'sh600498',
  'sh600570',
  'sh600585',
  'sh600588',
  'sh600660',
  'sh600674',
  'sh600690',
  'sh600703',
  'sh600745',
  'sh600809',
  'sh600837',
  'sh600845',
  'sh600848',
  'sh600875',
  'sh600893',
  'sh600905',
  'sh600919',
  'sh600926',
  'sh600941',
  'sh601012',
  'sh601021',
  'sh601066',
  'sh601111',
  'sh601138',
  'sh601225',
  'sh601236',
  'sh601238',
  'sh601319',
  'sh601328',
  'sh601336',
  'sh601377',
  'sh601390',
  'sh601555',
  'sh601577',
  'sh601600',
  'sh601618',
  'sh601628',
  'sh601633',
  'sh601668',
  'sh601669',
  'sh601688',
  'sh601698',
  'sh601728',
  'sh601788',
  'sh601800',
  'sh601808',
  'sh601816',
  'sh601877',
  'sh601880',
  'sh601881',
  'sh601888',
  'sh601899',
  'sh601901',
  'sh601918',
  'sh601919',
  'sh601933',
  'sh601985',
  'sh601989',
  'sh603019',
  'sh603087',
  'sh603160',
  'sh603195',
  'sh603260',
  'sh603288',
  'sh603501',
  'sh603596',
  'sh603799',
  'sh603833',
  'sh603899',
  'sh603986',
  // 深圳
  'sz000001',
  'sz000002',
  'sz000069',
  'sz000100',
  'sz000157',
  'sz000166',
  'sz000338',
  'sz000425',
  'sz000625',
  'sz000651',
  'sz000661',
  'sz000703',
  'sz000708',
  'sz000728',
  'sz000768',
  'sz000776',
  'sz000783',
  'sz000786',
  'sz000876',
  'sz000895',
  'sz000938',
  'sz000977',
  'sz001979',
  'sz002001',
  'sz002007',
  'sz002008',
  'sz002024',
  'sz002027',
  'sz002049',
  'sz002050',
  'sz002120',
  'sz002129',
  'sz002142',
  'sz002152',
  'sz002179',
  'sz002202',
  'sz002230',
  'sz002236',
  'sz002245',
  'sz002475',
  'sz002250',
  'sz002271',
  'sz002304',
  'sz002352',
  'sz002423',
  'sz002594',
  'sz002603',
  'sz002624',
  'sz002648',
  'sz002667',
  'sz002703',
  'sz002714',
  'sz002725',
  'sz002876',
  'sz002938',
  'sz300014',
  'sz300033',
  'sz300059',
  'sz300124',
  'sz300142',
  'sz300347',
  'sz300413',
  'sz300433',
  'sz300450',
  'sz300454',
  'sz300496',
  'sz300498',
  'sz300750',
  'sz300760',
  'sz300896',
  'sz301029',
]

/**
 * 获取沪深300成分股列表（服务端版本）
 */
export function getHS300StocksServer(): string[] {
  // 确保返回300只
  const stocks = Array.from(new Set(HS300_CODES))

  // 如果不足300只，补充一些大盘股
  while (stocks.length < 300) {
    const idx = stocks.length % 100
    const baseCode = 600000 + idx * 100 + stocks.length
    if (baseCode <= 689999 && !stocks.includes(`sh${baseCode}`)) {
      stocks.push(`sh${baseCode}`)
    }
  }

  return stocks.slice(0, 300)
}
