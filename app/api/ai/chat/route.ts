import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaRealtime } from '@/lib/api/stock'
import { detectSignalsBatch } from '@/lib/scanner/signal-detector'
import { generateAIResponse } from '@/lib/ai/stock-recommender'
import type { AIResponse } from '@/lib/ai/stock-recommender'

export const dynamic = 'force-dynamic'

interface ChatRequest {
  question: string
  watchlistCodes?: string[]
}

interface ChatResponse {
  success: boolean
  data?: AIResponse
  error?: {
    code: string
    message: string
  }
}

const MARKET_SAMPLE_CODES = [
  '000001', '000002', '000063', '000100', '000333',
  '000538', '000568', '000651', '000725', '000768',
  '000858', '002001', '002007', '002024', '002027',
  '002049', '002120', '002142', '002230', '002236',
  '002271', '002304', '002352', '002415', '002460',
  '002475', '002594', '002714', '002812', '300003',
  '300014', '300015', '300033', '300059', '300122',
  '300124', '300142', '300274', '300408', '300413',
  '300433', '300498', '300750', '600000', '600009',
  '600016', '600028', '600030', '600031', '600036',
]

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json()
    const { question, watchlistCodes = [] } = body

    if (!question || question.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_QUESTION', message: '问题不能为空' }
        },
        { status: 400 }
      )
    }

    const marketCodes = MARKET_SAMPLE_CODES.slice(0, 30)
    const allCodes = Array.from(new Set([...marketCodes, ...watchlistCodes]))

    const stocks = await fetchSinaRealtime(allCodes)

    const scanResults = await detectSignalsBatch(stocks)

    const watchlistStocks = stocks.filter((s) =>
      watchlistCodes.some((code) => s.code === code || s.code.includes(code))
    )

    const aiResponse = generateAIResponse(question, {
      scanResults,
      watchlistStocks,
      allStocks: stocks,
    })

    return NextResponse.json({
      success: true,
      data: aiResponse,
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'CHAT_ERROR', message: 'AI助手处理失败，请稍后重试' }
      },
      { status: 500 }
    )
  }
}
