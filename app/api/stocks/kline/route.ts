import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaKLine } from '@/lib/api/stock'
import { dataCache } from '@/lib/cache'
import { CACHE_TIME } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly'

    if (!code) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_CODE', message: 'Missing code parameter' }
      })
    }

    const cacheKey = `kline:${code}:${period}`
    const cached = dataCache.get<Awaited<ReturnType<typeof fetchSinaKLine>>>(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached
      })
    }

    const data = await fetchSinaKLine(code, period)
    
    dataCache.set(cacheKey, data, CACHE_TIME.KLINE)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in kline API:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch kline data' }
    }, { status: 500 })
  }
}
