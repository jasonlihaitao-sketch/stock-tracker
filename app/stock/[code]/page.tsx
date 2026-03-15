import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  StockChart,
  MinuteChart,
  StockDiagnosis,
  PatternAnalysis,
  StockTradeActions,
} from '@/components/stock'
import { fetchSinaRealtime } from '@/lib/api/stock'
import { formatPrice, formatChangePercent, formatVolume, formatAmount, cn } from '@/lib/utils'
import type { Stock } from '@/types/stock'

interface StockDetailPageProps {
  params: {
    code: string
  }
}

export async function generateMetadata({ params }: StockDetailPageProps): Promise<Metadata> {
  const stocks = await fetchSinaRealtime([params.code])
  const stock = stocks[0]

  if (!stock) {
    return { title: '股票未找到 - StockTracker' }
  }

  return {
    title: `${stock.name} (${stock.code}) - StockTracker`,
    description: `${stock.name} 股票实时行情，当前价格 ${stock.price}，涨跌幅 ${stock.changePercent.toFixed(2)}%`,
  }
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const stocks = await fetchSinaRealtime([params.code])
  const stock: Stock | undefined = stocks[0]

  if (!stock) {
    notFound()
  }

  const isUp = stock.change > 0
  const isDown = stock.change < 0

  // 从完整代码中提取显示用的代码
  const displayCode = stock.code.replace(/^(sh|sz)/, '')

  return (
    <div className="space-y-6">
      {/* 返回和标题 */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {displayCode} {stock.name}
          </h1>
          <p className="text-muted-foreground">
            {stock.market === 'SH' ? '上海证券交易所' : '深圳证券交易所'}
          </p>
        </div>
      </div>

      {/* 价格信息 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">现价</div>
              <div className="text-3xl font-bold">{formatPrice(stock.price)}</div>
              <div
                className={cn(
                  'mt-1 flex items-center gap-2',
                  isUp && 'text-up',
                  isDown && 'text-down'
                )}
              >
                <span className="text-lg">
                  {stock.change >= 0 ? '+' : ''}
                  {formatPrice(stock.change)}
                </span>
                <span className="text-lg">{formatChangePercent(stock.changePercent)}</span>
                {isUp && <Plus className="h-4 w-4" />}
                {isDown && <Minus className="h-4 w-4" />}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">今开 / 昨收</div>
              <div className="text-lg font-semibold">{formatPrice(stock.open)}</div>
              <div className="text-muted-foreground">{formatPrice(stock.preClose)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">最高 / 最低</div>
              <div className="text-lg font-semibold">
                {formatPrice(stock.high)} / {formatPrice(stock.low)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">成交量 / 成交额</div>
              <div className="text-lg font-semibold">{formatVolume(stock.volume)}</div>
              <div className="text-muted-foreground">{formatAmount(stock.turnover)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易操作 */}
      <StockTradeActions stock={stock} />

      {/* 分时走势图 */}
      <MinuteChart code={stock.code} name={stock.name} />

      {/* K线图 */}
      <StockChart code={stock.code} name={stock.name} />

      {/* K线形态识别 */}
      <PatternAnalysis code={stock.code} name={stock.name} />

      {/* AI智能诊断 */}
      <StockDiagnosis code={stock.code} name={stock.name} />
    </div>
  )
}
