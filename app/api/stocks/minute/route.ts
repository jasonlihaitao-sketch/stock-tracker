import { NextRequest, NextResponse } from 'next/server'
import { SINA_API } from '@/lib/constants'
import type { MinuteData } from '@/types/stock'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_CODE', message: 'Missing code parameter' }
      })
    }

    // 如果代码已经带有市场前缀，提取纯代码
    const pureCode = code.replace(/^(sh|sz)/, '')
    // 如果代码带有市场前缀，使用它；否则根据代码第一位判断市场
    const marketPrefix = code.startsWith('sh') ? 'sh' : code.startsWith('sz') ? 'sz' : (pureCode.startsWith('6') ? 'sh' : 'sz')
    const symbol = `${marketPrefix}${pureCode}`

    const params = new URLSearchParams({
      symbol,
      scale: '5',
      datalen: '48',
    })

    const response = await fetch(
      `${SINA_API.MINUTE}?${params}`,
      {
        headers: {
          Referer: 'https://finance.sina.com.cn',
        },
      }
    )

    const data = await response.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const minuteData: MinuteData[] = data.map((item: Record<string, string | number>) => ({
      time: String(item.day || ''),
      price: parseFloat(String(item.close || 0)),
      avgPrice: parseFloat(String(item.avg_price || item.close || 0)),
      volume: parseInt(String(item.volume || 0)),
    }))

    return NextResponse.json({
      success: true,
      data: minuteData
    })
  } catch (error) {
    console.error('Error in minute API:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch minute data' }
    }, { status: 500 })
  }
}
