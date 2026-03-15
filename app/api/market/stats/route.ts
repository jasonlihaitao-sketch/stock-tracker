import { NextResponse } from 'next/server'
import { fetchMarketStats } from '@/lib/api/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await fetchMarketStats()
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Market stats API error:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取市场数据失败' },
    }, { status: 500 })
  }
}
