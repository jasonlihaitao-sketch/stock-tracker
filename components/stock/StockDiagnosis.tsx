'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'
import type { StockDiagnosis, Recommendation, Confidence } from '@/types/ai-diagnosis'

interface StockDiagnosisProps {
  code: string
  name: string
}

const recommendationConfig: Record<Recommendation, { label: string; className: string; icon: typeof TrendingUp }> = {
  buy: { label: '买入', className: 'bg-up text-white', icon: TrendingUp },
  sell: { label: '卖出', className: 'bg-down text-white', icon: TrendingDown },
  hold: { label: '持有', className: 'bg-muted text-muted-foreground', icon: Minus },
}

const confidenceConfig: Record<Confidence, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-green-500 text-white' },
  medium: { label: '中', className: 'bg-yellow-500 text-white' },
  low: { label: '低', className: 'bg-gray-400 text-white' },
}

export function StockDiagnosis({ code, name }: StockDiagnosisProps) {
  const [diagnosis, setDiagnosis] = useState<StockDiagnosis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDiagnosis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const result = await response.json()
      if (result.success) {
        setDiagnosis(result.data)
      } else {
        setError(result.error?.message || '诊断失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-up'
    if (score <= 30) return 'text-down'
    return 'text-yellow-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-up/10'
    if (score <= 30) return 'bg-down/10'
    return 'bg-yellow-500/10'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI智能诊断
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDiagnosis}
          disabled={loading}
          className="gap-1"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          {loading ? '诊断中...' : diagnosis ? '重新诊断' : '开始诊断'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-down text-sm mb-4">{error}</div>
        )}

        {!diagnosis && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            点击&ldquo;开始诊断&rdquo;获取AI分析报告
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            正在分析中...
          </div>
        )}

        {diagnosis && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={cn('rounded-lg p-4 text-center', getScoreBg(diagnosis.overallScore))}>
                <div className="text-sm text-muted-foreground mb-1">综合评分</div>
                <div className={cn('text-3xl font-bold', getScoreColor(diagnosis.overallScore))}>
                  {diagnosis.overallScore}
                </div>
              </div>
              <div className="rounded-lg p-4 text-center bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">操作建议</div>
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const config = recommendationConfig[diagnosis.recommendation]
                    const Icon = config.icon
                    return (
                      <Badge className={config.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
              <div className="rounded-lg p-4 text-center bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">置信度</div>
                <Badge className={confidenceConfig[diagnosis.confidence].className}>
                  {confidenceConfig[diagnosis.confidence].label}
                </Badge>
              </div>
              <div className="rounded-lg p-4 text-center bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">趋势强度</div>
                <div className="text-xl font-semibold">
                  {diagnosis.technicalAnalysis.trendStrength}/10
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">技术面分析</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">趋势方向</span>
                    <span className={cn(
                      diagnosis.technicalAnalysis.trend === 'up' && 'text-up',
                      diagnosis.technicalAnalysis.trend === 'down' && 'text-down'
                    )}>
                      {diagnosis.technicalAnalysis.trend === 'up' ? '上升' : 
                       diagnosis.technicalAnalysis.trend === 'down' ? '下降' : '横盘'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">支撑位</span>
                    <span>{diagnosis.technicalAnalysis.supportLevel.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">阻力位</span>
                    <span>{diagnosis.technicalAnalysis.resistanceLevel.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {diagnosis.technicalAnalysis.maStatus}
                </div>
                <div className="text-sm text-muted-foreground">
                  成交量：{diagnosis.technicalAnalysis.volumeStatus}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">操作建议</h4>
                <div className="text-sm">{diagnosis.actionAdvice.reason}</div>
                {diagnosis.actionAdvice.suggestedPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">建议价格</span>
                    <span>{diagnosis.actionAdvice.suggestedPrice.toFixed(2)}</span>
                  </div>
                )}
                {diagnosis.actionAdvice.stopLoss && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">止损价</span>
                    <span className="text-down">{diagnosis.actionAdvice.stopLoss.toFixed(2)}</span>
                  </div>
                )}
                {diagnosis.actionAdvice.takeProfit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">止盈价</span>
                    <span className="text-up">{diagnosis.actionAdvice.takeProfit.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">详细分析</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {diagnosis.detailedAnalysis}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                风险提示
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {diagnosis.riskWarning.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-muted-foreground text-right">
              诊断时间：{new Date(diagnosis.diagnosisTime).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}