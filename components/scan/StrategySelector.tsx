// components/scan/StrategySelector.tsx

'use client'

import { useMemo } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useScanStore } from '@/store/scanStore'
import {
  STRATEGIES,
  STRATEGIES_BY_CATEGORY,
  CATEGORY_NAMES,
  type StrategyId,
  type StrategyCategory,
} from '@/types/strategy'
import { cn } from '@/lib/utils'

interface StrategySelectorProps {
  className?: string
}

const categoryIcons: Record<StrategyCategory, string> = {
  technical: '📊',
  fundamental: '📈',
  growth: '🚀',
  quality: '🏰',
  reversal: '🔄',
  event: '📢',
}

const strengthColors = {
  strong: 'text-green-600',
  medium: 'text-yellow-600',
  weak: 'text-red-600',
}

export function StrategySelector({ className }: StrategySelectorProps) {
  const { selectedStrategies, toggleStrategy, resetStrategies } = useScanStore()

  const selectedCount = selectedStrategies.length
  const totalCount = STRATEGIES.length

  const handleToggle = (strategyId: StrategyId) => {
    toggleStrategy(strategyId)
  }

  const handleReset = () => {
    resetStrategies()
  }

  const selectAll = (category: StrategyCategory) => {
    const categoryStrategies = STRATEGIES_BY_CATEGORY[category].map((s) => s.id)
    categoryStrategies.forEach((id) => {
      if (!selectedStrategies.includes(id)) {
        toggleStrategy(id)
      }
    })
  }

  const deselectAll = (category: StrategyCategory) => {
    const categoryStrategies = STRATEGIES_BY_CATEGORY[category].map((s) => s.id)
    categoryStrategies.forEach((id) => {
      if (selectedStrategies.includes(id)) {
        toggleStrategy(id)
      }
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">策略选择</h3>
          <Badge variant="secondary">
            {selectedCount}/{totalCount}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          重置
        </Button>
      </div>

      <Separator />

      {/* Strategy Categories */}
      <ScrollArea className="h-[400px] pr-4">
        <Accordion type="multiple" defaultValue={['technical']} className="w-full">
          {(Object.keys(STRATEGIES_BY_CATEGORY) as StrategyCategory[]).map((category) => {
            const categoryStrategies = STRATEGIES_BY_CATEGORY[category]
            const selectedInCategory = categoryStrategies.filter((s) =>
              selectedStrategies.includes(s.id)
            ).length

            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>{categoryIcons[category]}</span>
                    <span>{CATEGORY_NAMES[category]}</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedInCategory}/{categoryStrategies.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {/* Category Actions */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAll(category)}
                        disabled={selectedInCategory === categoryStrategies.length}
                      >
                        全选
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deselectAll(category)}
                        disabled={selectedInCategory === 0}
                      >
                        取消全选
                      </Button>
                    </div>

                    {/* Strategy List */}
                    {categoryStrategies.map((strategy) => {
                      const isSelected = selectedStrategies.includes(strategy.id)
                      return (
                        <div
                          key={strategy.id}
                          className={cn(
                            'flex items-start justify-between p-3 rounded-lg border transition-colors',
                            isSelected ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                          )}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <Switch
                              checked={isSelected}
                              onCheckedChange={() => handleToggle(strategy.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{strategy.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {strategy.description}
                              </div>
                              {strategy.warnings.length > 0 && (
                                <div className="text-xs text-amber-600 mt-1">
                                  ⚠️ {strategy.warnings[0]}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <Badge variant="outline" className="text-xs">
                              {strategy.timeFrame === 'short'
                                ? '短线'
                                : strategy.timeFrame === 'medium'
                                  ? '中线'
                                  : '长线'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                strategy.riskLevel === 'high'
                                  ? 'border-red-300 text-red-600'
                                  : strategy.riskLevel === 'medium'
                                    ? 'border-yellow-300 text-yellow-600'
                                    : 'border-green-300 text-green-600'
                              )}
                            >
                              {strategy.riskLevel === 'high'
                                ? '高风险'
                                : strategy.riskLevel === 'medium'
                                  ? '中风险'
                                  : '低风险'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  )
}