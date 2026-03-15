import { NextRequest, NextResponse } from 'next/server'
import { fetchSinaSearch } from '@/lib/api/stock'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword')

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const results = await fetchSinaSearch(keyword.trim())

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search stocks' }
    }, { status: 500 })
  }
}
