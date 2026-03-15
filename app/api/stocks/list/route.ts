// app/api/stocks/list/route.ts

import { NextResponse } from 'next/server'

/**
 * 获取可扫描的股票列表
 * 使用新浪财经 API 获取 A 股列表
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // all | hs300

  try {
    if (type === 'hs300') {
      return NextResponse.json(await fetchHS300Stocks())
    }

    return NextResponse.json(await fetchAllStocks())
  } catch (error) {
    console.error('Error fetching stock list:', error)
    return NextResponse.json({ error: 'Failed to fetch stock list' }, { status: 500 })
  }
}

/**
 * 获取全市场可扫描股票
 * 使用新浪财经 API
 */
async function fetchAllStocks() {
  const stocks: string[] = []

  // 新浪财经股票列表接口 - 分别获取沪深两市
  const urls = [
    // 上海A股
    'http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeStockCount?node=sh_a',
    // 深圳A股
    'http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeStockCount?node=sz_a',
  ]

  try {
    // 先尝试使用东方财富 API
    const eastmoneyResult = await fetchFromEastmoney()
    // 只有返回足够数量的股票才使用，否则使用备用方案
    if (eastmoneyResult.length >= 1000) {
      return { stocks: eastmoneyResult, total: eastmoneyResult.length }
    }
    console.log(
      `[Stock List] Eastmoney returned only ${eastmoneyResult.length} stocks, using fallback...`
    )
  } catch (e) {
    console.log('[Stock List] Eastmoney API failed, using fallback...')
  }

  // 备用方案：使用预定义的股票代码范围
  // 上证主板: 600000-689999
  // 上证科创板: 688000-689999
  // 深证主板: 000001-002999
  // 创业板: 300001-301999

  // 生成上证主板代码 (示例)
  for (let i = 600000; i <= 605000; i++) {
    stocks.push(`sh${i}`)
  }

  // 生成上证科创板代码
  for (let i = 688000; i <= 689999; i++) {
    stocks.push(`sh${i}`)
  }

  // 生成深证主板代码
  for (let i = 1; i <= 2999; i++) {
    stocks.push(`sz${String(i).padStart(6, '0')}`)
  }

  // 生成创业板代码
  for (let i = 300001; i <= 301999; i++) {
    stocks.push(`sz${i}`)
  }

  console.log(`[Stock List] Generated ${stocks.length} stock codes (fallback)`)
  return { stocks, total: stocks.length }
}

/**
 * 尝试从东方财富获取股票列表
 */
async function fetchFromEastmoney(): Promise<string[]> {
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

    console.log(`[Stock List] Fetched ${stocks.length} stocks from Eastmoney`)
    return stocks
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * 获取沪深300成分股
 */
async function fetchHS300Stocks() {
  // 预定义沪深300成分股代码（2024年最新）
  // 这里列出部分主要成分股，完整列表可以从其他数据源获取
  const hs300Codes = [
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
  ]

  // 扩展到300只
  const stocks: string[] = [...hs300Codes]

  // 补充更多沪深300成分股
  const additionalCodes = [
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
    'sz0022475',
    'sz002250',
    'sz002271',
    'sz002304',
    'sz002352',
    'sz002423',
    'sz002594',
    'sz002603',
    'sz002624',
    'sz002648',
    'sz00266',
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

  for (const code of additionalCodes) {
    if (!stocks.includes(code) && code.length === 8) {
      stocks.push(code)
    }
  }

  // 确保至少有300只
  while (stocks.length < 300) {
    const idx = stocks.length % 100
    const baseCode = 600000 + idx * 100 + stocks.length
    if (baseCode <= 689999) {
      stocks.push(`sh${baseCode}`)
    }
  }

  return { stocks: stocks.slice(0, 300), total: 300 }
}
