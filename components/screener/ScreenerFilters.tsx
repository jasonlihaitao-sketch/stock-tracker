'use client'

import { useState, useCallback } from 'react'
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { defaultConditions, screenerPresets } from '@/lib/screener/conditions'
import type { ScreenerConditions } from '@/lib/screener/conditions'

interface ScreenerFiltersProps {
  conditions: ScreenerConditions
  onConditionsChange: (conditions: ScreenerConditions) => void
  onRunScreener: () => void
  isLoading: boolean
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium transition-colors hover:text-primary"
      >
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="space-y-3 pb-4">{children}</div>}
    </div>
  )
}

interface RangeInputProps {
  label: string
  minValue?: number
  maxValue?: number
  onMinChange: (value: number | undefined) => void
  onMaxChange: (value: number | undefined) => void
  placeholderMin?: string
  placeholderMax?: string
  unit?: string
}

function RangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  placeholderMin = '最小值',
  placeholderMax = '最大值',
  unit,
}: RangeInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={placeholderMin}
          value={minValue ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onMinChange(val ? parseFloat(val) : undefined)
          }}
          className="h-8 text-sm"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder={placeholderMax}
          value={maxValue ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onMaxChange(val ? parseFloat(val) : undefined)
          }}
          className="h-8 text-sm"
        />
        {unit && <span className="whitespace-nowrap text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

export function ScreenerFilters({
  conditions,
  onConditionsChange,
  onRunScreener,
  isLoading,
}: ScreenerFiltersProps) {
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const presets = [
    { id: 'valueStocks', name: '价值股', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    {
      id: 'growthStocks',
      name: '成长股',
      color: 'bg-green-500/10 text-green-600 border-green-200',
    },
    {
      id: 'breakout',
      name: '技术突破',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
    {
      id: 'oversold',
      name: '超跌反弹',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
    },
    { id: 'strongStocks', name: '强势股', color: 'bg-red-500/10 text-red-600 border-red-200' },
  ] as const

  const updateCondition = useCallback(
    <K extends keyof ScreenerConditions>(key: K, value: ScreenerConditions[K]) => {
      onConditionsChange({ ...conditions, [key]: value })
    },
    [conditions, onConditionsChange]
  )

  const updateTechnicalCondition = useCallback(
    (key: keyof NonNullable<ScreenerConditions['technicalConditions']>, value: boolean) => {
      onConditionsChange({
        ...conditions,
        technicalConditions: {
          ...conditions.technicalConditions,
          [key]: value,
        },
      })
    },
    [conditions, onConditionsChange]
  )

  const resetFilters = useCallback(() => {
    onConditionsChange(defaultConditions)
    setActivePresetId(null)
  }, [onConditionsChange])

  const applyPreset = useCallback(
    (presetId: keyof typeof screenerPresets) => {
      if (activePresetId === presetId) {
        onConditionsChange(defaultConditions)
        setActivePresetId(null)
        return
      }

      const preset = screenerPresets[presetId]
      onConditionsChange({
        ...defaultConditions,
        ...preset.conditions,
        technicalConditions: {
          ...defaultConditions.technicalConditions,
          ...preset.conditions.technicalConditions,
        },
      })
      setActivePresetId(presetId)
    },
    [activePresetId, onConditionsChange]
  )

  const hasActiveFilters =
    conditions.priceMin !== undefined ||
    conditions.priceMax !== undefined ||
    conditions.changePercentMin !== undefined ||
    conditions.changePercentMax !== undefined ||
    conditions.marketCapMin !== undefined ||
    conditions.marketCapMax !== undefined ||
    conditions.peMin !== undefined ||
    conditions.peMax !== undefined ||
    conditions.volumeCondition !== null ||
    Object.values(conditions.technicalConditions || {}).some(Boolean)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            筛选条件
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1">
              <RotateCcw className="h-3 w-3" />
              重置
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">快速筛选</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Badge
                key={preset.id}
                variant={activePresetId === preset.id ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${activePresetId === preset.id ? '' : preset.color}`}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.name}
              </Badge>
            ))}
          </div>
        </div>

        <FilterSection title="价格区间">
          <RangeInput
            label="股价范围"
            minValue={conditions.priceMin}
            maxValue={conditions.priceMax}
            onMinChange={(v) => updateCondition('priceMin', v)}
            onMaxChange={(v) => updateCondition('priceMax', v)}
            placeholderMin="最低价"
            placeholderMax="最高价"
            unit="元"
          />
        </FilterSection>

        <FilterSection title="涨跌幅">
          <RangeInput
            label="涨跌幅范围"
            minValue={conditions.changePercentMin}
            maxValue={conditions.changePercentMax}
            onMinChange={(v) => updateCondition('changePercentMin', v)}
            onMaxChange={(v) => updateCondition('changePercentMax', v)}
            placeholderMin="最小%"
            placeholderMax="最大%"
            unit="%"
          />
        </FilterSection>

        <FilterSection title="市值">
          <RangeInput
            label="市值范围"
            minValue={conditions.marketCapMin}
            maxValue={conditions.marketCapMax}
            onMinChange={(v) => updateCondition('marketCapMin', v)}
            onMaxChange={(v) => updateCondition('marketCapMax', v)}
            placeholderMin="最小"
            placeholderMax="最大"
            unit="亿"
          />
        </FilterSection>

        <FilterSection title="市盈率">
          <RangeInput
            label="PE范围"
            minValue={conditions.peMin}
            maxValue={conditions.peMax}
            onMinChange={(v) => updateCondition('peMin', v)}
            onMaxChange={(v) => updateCondition('peMax', v)}
            placeholderMin="最小PE"
            placeholderMax="最大PE"
          />
        </FilterSection>

        <FilterSection title="成交量">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">量能状态</label>
            <Select
              value={conditions.volumeCondition || 'none'}
              onValueChange={(value) =>
                updateCondition(
                  'volumeCondition',
                  value === 'none' ? null : (value as 'high' | 'low')
                )
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="选择成交量条件" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不限</SelectItem>
                <SelectItem value="high">放量 (&gt;1.5倍)</SelectItem>
                <SelectItem value="low">缩量 (&lt;0.5倍)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FilterSection>

        <FilterSection title="技术指标" defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">MA金叉 (5&gt;20)</label>
              <Switch
                checked={conditions.technicalConditions?.maGoldenCross || false}
                onCheckedChange={(v) => updateTechnicalCondition('maGoldenCross', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">MA死叉 (5&lt;20)</label>
              <Switch
                checked={conditions.technicalConditions?.maDeathCross || false}
                onCheckedChange={(v) => updateTechnicalCondition('maDeathCross', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">突破20日高点</label>
              <Switch
                checked={conditions.technicalConditions?.breakout20dHigh || false}
                onCheckedChange={(v) => updateTechnicalCondition('breakout20dHigh', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">跌破20日低点</label>
              <Switch
                checked={conditions.technicalConditions?.breakdown20dLow || false}
                onCheckedChange={(v) => updateTechnicalCondition('breakdown20dLow', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">强势上涨(&gt;5%)</label>
              <Switch
                checked={conditions.technicalConditions?.rsiOverbought || false}
                onCheckedChange={(v) => updateTechnicalCondition('rsiOverbought', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">超跌(&lt;-5%)</label>
              <Switch
                checked={conditions.technicalConditions?.rsiOversold || false}
                onCheckedChange={(v) => updateTechnicalCondition('rsiOversold', v)}
              />
            </div>
          </div>
        </FilterSection>

        <Button onClick={onRunScreener} disabled={isLoading} className="w-full gap-2">
          <Filter className="h-4 w-4" />
          {isLoading ? '筛选中...' : '开始筛选'}
        </Button>
      </CardContent>
    </Card>
  )
}
