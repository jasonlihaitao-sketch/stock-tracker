// components/scan/StrategyTemplateCard.tsx

'use client'

import { Check, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useScanStore } from '@/store/scanStore'
import { STRATEGY_TEMPLATES } from '@/types/strategy-template'
import { cn } from '@/lib/utils'

interface StrategyTemplateCardProps {
  className?: string
}

const timeFrameLabels = {
  short: '短线',
  medium: '中线',
  long: '长线',
}

const riskLevelColors = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
}

const riskLevelLabels = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

export function StrategyTemplateCard({ className }: StrategyTemplateCardProps) {
  const { activeTemplateId, applyTemplate, selectedStrategies } = useScanStore()

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-medium">经典策略模板</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STRATEGY_TEMPLATES.map((template) => {
          const isActive = activeTemplateId === template.id
          const strategiesCount = template.strategies.length

          return (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isActive && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => handleApplyTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{template.author}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {timeFrameLabels[template.timeFrame]}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', riskLevelColors[template.riskLevel])}>
                    {riskLevelLabels[template.riskLevel]}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {strategiesCount} 个策略
                  </Badge>
                </div>

                {template.successRate && (
                  <div className="text-xs text-green-600 font-medium">
                    {template.successRate}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}