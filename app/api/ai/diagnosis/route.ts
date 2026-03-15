import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaRealtime, fetchSinaKLine } from '@/lib/api/stock'
import { calculateTechnicalFromKline } from '@/lib/api/technical'
import { generateDiagnosis } from '@/lib/ai/diagnosis'
import type { DiagnosisRequest } from '@/types/ai-diagnosis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_CODE', message: '股票代码不能为空' } },
        { status: 400 }
      )
    }

    const stocks = await fetchSinaRealtime([code])
    const stock = stocks[0]

    if (!stock) {
      return NextResponse.json(
        { success: false, error: { code: 'STOCK_NOT_FOUND', message: '股票不存在' } },
        { status: 404 }
      )
    }

    const klines = await fetchSinaKLine(code, 'daily')
    const technical = calculateTechnicalFromKline(code, klines)

    const diagnosisRequest: DiagnosisRequest = {
      code: stock.code,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      high: stock.high,
      low: stock.low,
      volume: stock.volume,
      technical: {
        high20d: technical.high20d,
        low20d: technical.low20d,
        ma5: technical.ma5,
        ma10: technical.ma10,
        ma20: technical.ma20,
        avgVolume5d: technical.avgVolume5d,
        avgVolume20d: technical.avgVolume20d,
      },
    }

    const diagnosis = generateDiagnosis(diagnosisRequest)

    return NextResponse.json({
      success: true,
      data: diagnosis,
    })
  } catch (error) {
    console.error('Error generating diagnosis:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DIAGNOSIS_ERROR', message: '诊断生成失败' } },
      { status: 500 }
    )
  }
}
