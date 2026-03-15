import { NextResponse } from 'next/server'
import { fetchSectors } from '@/lib/api/sector'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sectors = await fetchSectors()

    return NextResponse.json({
      success: true,
      data: sectors
    })
  } catch (error) {
    console.error('Error fetching sectors:', error)
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: '获取板块数据失败' } },
      { status: 500 }
    )
  }
}
