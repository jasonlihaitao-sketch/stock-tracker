import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaKLine } from '@/lib/api/stock'
import { calculateTechnicalFromKline } from '@/lib/api/technical'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_CODE', message: '股票代码不能为空' } },
      { status: 400 }
    )
  }

  try {
    const klines = await fetchSinaKLine(code, 'daily')
    const technical = calculateTechnicalFromKline(code, klines)

    return NextResponse.json({
      success: true,
      data: technical
    })
  } catch (error) {
    console.error('Error calculating technical indicators:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CALCULATION_ERROR', message: '技术指标计算失败' } },
      { status: 500 }
    )
  }
}
