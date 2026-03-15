import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaRealtime, fetchSinaKLine } from '@/lib/api/stock'
import { calculateTechnicalFromKline } from '@/lib/api/technical'
import { filterStocks, ScreenerConditions } from '@/lib/screener/conditions'
import { getScanableStocksServer, getHS300StocksServer } from '@/lib/api/stock-list-server'
import type { Stock } from '@/types/stock'
import type { StockTechnical } from '@/types/technical'

export const dynamic = 'force-dynamic'

/**
 * 获取股票列表（服务端版本）
 */
async function getStockList(
  scope: 'all' | 'hs300' | 'watchlist',
  watchlist?: string[]
): Promise<string[]> {
  switch (scope) {
    case 'all':
      return getScanableStocksServer()
    case 'hs300':
      return getHS300StocksServer()
    case 'watchlist':
      return watchlist || []
    default:
      return []
  }
}

/**
 * 批量获取股票技术指标
 */
async function getStocksWithTechnical(
  codes: string[]
): Promise<Array<{ stock: Stock; technical: StockTechnical; pe?: number; marketCap?: number }>> {
  const results = []
  const batchSize = 50

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize)

    // 获取实时行情
    const stocks = await fetchSinaRealtime(batch)

    // 获取技术指标
    for (const stock of stocks) {
      try {
        const klines = await fetchSinaKLine(stock.code, 'daily')
        if (klines.length >= 20) {
          const technical = calculateTechnicalFromKline(stock.code, klines)
          results.push({
            stock,
            technical,
            // 模拟PE和市值数据（实际应从基本面API获取）
            pe: Math.random() * 50 + 5, // 模拟PE: 5-55
            marketCap: Math.random() * 1000 + 10, // 模拟市值: 10-1010亿
          })
        }
      } catch (error) {
        console.error(`Error getting technical data for ${stock.code}:`, error)
      }
    }

    // 批次间延迟，避免请求过快
    if (i + batchSize < codes.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * POST /api/screener
 * 执行股票筛选
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conditions,
      scope = 'all',
      watchlist = [],
    }: {
      conditions: ScreenerConditions
      scope: 'all' | 'hs300' | 'watchlist'
      watchlist?: string[]
    } = body

    if (!conditions) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_CONDITIONS', message: '筛选条件不能为空' } },
        { status: 400 }
      )
    }

    // 1. 获取股票列表
    const stockCodes = await getStockList(scope, watchlist)

    if (stockCodes.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
          scope,
        },
      })
    }

    // 2. 获取股票数据和技术指标
    const stocksWithTechnical = await getStocksWithTechnical(stockCodes)

    // 3. 执行筛选
    const results = filterStocks(stocksWithTechnical, conditions)

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
        scope,
        scanned: stockCodes.length,
      },
    })
  } catch (error) {
    console.error('Screener API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '筛选服务内部错误' } },
      { status: 500 }
    )
  }
}

/**
 * GET /api/screener
 * 获取筛选预设模板
 */
export async function GET() {
  const { screenerPresets } = await import('@/lib/screener/conditions')

  return NextResponse.json({
    success: true,
    data: {
      presets: Object.entries(screenerPresets).map(([key, value]) => ({
        id: key,
        name: value.name,
        conditions: value.conditions,
      })),
    },
  })
}
