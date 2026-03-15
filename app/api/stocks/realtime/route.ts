import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaRealtime } from '@/lib/api/stock'
import { dataCache } from '@/lib/cache'
import { CACHE_TIME } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const codes = searchParams.get('codes')

    if (!codes) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_CODES', message: 'Missing codes parameter' }
      })
    }

    const cacheKey = `realtime:${codes}`
    const cached = dataCache.get<ReturnType<typeof fetchSinaRealtime>>(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached
      })
    }

    const codeList = codes.split(',').filter(Boolean)
    const stocks = await fetchSinaRealtime(codeList)
    
    dataCache.set(cacheKey, stocks, CACHE_TIME.REALTIME)

    return NextResponse.json({
      success: true,
      data: stocks
    })
  } catch (error) {
    console.error('Error in realtime API:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stock data' }
    }, { status: 500 })
  }
}
