'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, CandlestickChart } from 'lucide-react'
import { getKLineData } from '@/lib/api/stock'
import { analyzePatterns } from '@/lib/technical/patterns'
import type { KLineData } from '@/types/stock'
import type { DetectedPattern, PatternType } from '@/types/pattern'

interface PatternAnalysisProps {
  code: string
  name?: string
}

const patternTypeConfig: Record<PatternType, { label: string; className: string; icon: typeof TrendingUp }> = {
  bullish: { label: '看涨', className: 'bg-up text-white', icon: TrendingUp },
  bearish: { label: '看跌', className: 'bg-down text-white', icon: TrendingDown },
  neutral: { label: '中性', className: 'bg-muted text-muted-foreground', icon: Minus },
}

export function PatternAnalysis({ code, name }: PatternAnalysisProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [klineData, setKlineData] = useState<KLineData[]>([])
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [summary, setSummary] = useState({ bullish: 0, bearish: 0, neutral: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await getKLineData(code, period)
        setKlineData(data)
        const result = analyzePatterns(data)
        setPatterns(result.patterns)
        setSummary(result.summary)
      } catch (error) {
        console.error('Error fetching kline data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [code, period])

  const latestPatterns = patterns.slice(-10).reverse()

  const bullishPatterns = patterns.filter((p) => p.pattern.type === 'bullish')
  const bearishPatterns = patterns.filter((p) => p.pattern.type === 'bearish')
  const neutralPatterns = patterns.filter((p) => p.pattern.type === 'neutral')

  const renderPatternList = (patternList: DetectedPattern[]) => {
    if (patternList.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground text-sm">
          暂无识别到的形态
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {patternList.slice(-20).reverse().map((p, index) => {
          const config = patternTypeConfig[p.pattern.type]
          const Icon = config.icon
          return (
            <div
              key={`${p.date}-${p.pattern.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge className={config.className}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="font-medium text-sm">{p.pattern.displayName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{p.date}</span>
                <span className="font-mono">{p.confidence}%</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CandlestickChart className="h-5 w-5" />
          K线形态识别
        </CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="daily">日K</TabsTrigger>
            <TabsTrigger value="weekly">周K</TabsTrigger>
            <TabsTrigger value="monthly">月K</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">分析中...</div>
          </div>
        ) : klineData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">暂无数据</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg p-3 text-center bg-up/10">
                <div className="text-sm text-muted-foreground mb-1">看涨形态</div>
                <div className="text-2xl font-bold text-up">{summary.bullish}</div>
              </div>
              <div className="rounded-lg p-3 text-center bg-down/10">
                <div className="text-sm text-muted-foreground mb-1">看跌形态</div>
                <div className="text-2xl font-bold text-down">{summary.bearish}</div>
              </div>
              <div className="rounded-lg p-3 text-center bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">中性形态</div>
                <div className="text-2xl font-bold">{summary.neutral}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">最近形态</h4>
              {latestPatterns.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  暂无识别到的形态
                </div>
              ) : (
                <div className="space-y-2">
                  {latestPatterns.slice(0, 5).map((p, index) => {
                    const config = patternTypeConfig[p.pattern.type]
                    const Icon = config.icon
                    return (
                      <div
                        key={`${p.date}-${p.pattern.name}-${index}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={config.className}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="font-medium text-sm">{p.pattern.displayName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{p.date}</span>
                          <span className="font-mono">{p.confidence}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">全部 ({patterns.length})</TabsTrigger>
                <TabsTrigger value="bullish" className="flex-1">看涨 ({summary.bullish})</TabsTrigger>
                <TabsTrigger value="bearish" className="flex-1">看跌 ({summary.bearish})</TabsTrigger>
                <TabsTrigger value="neutral" className="flex-1">中性 ({summary.neutral})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4 max-h-[300px] overflow-y-auto">
                {renderPatternList(patterns)}
              </TabsContent>
              <TabsContent value="bullish" className="mt-4 max-h-[300px] overflow-y-auto">
                {renderPatternList(bullishPatterns)}
              </TabsContent>
              <TabsContent value="bearish" className="mt-4 max-h-[300px] overflow-y-auto">
                {renderPatternList(bearishPatterns)}
              </TabsContent>
              <TabsContent value="neutral" className="mt-4 max-h-[300px] overflow-y-auto">
                {renderPatternList(neutralPatterns)}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}