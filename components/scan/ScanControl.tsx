// components/scan/ScanControl.tsx

'use client'

import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ScanScope, ScanStatus } from '@/types/scan'

interface ScanControlProps {
  status: ScanStatus
  scope: ScanScope
  onScopeChange: (scope: ScanScope) => void
  onStart: () => void
  onStop: () => void
}

const scopeOptions = [
  { value: 'all', label: '全市场', count: '~5000只' },
  { value: 'hs300', label: '沪深300', count: '300只' },
  { value: 'watchlist', label: '自选股', count: '自选' },
] as const

export function ScanControl({
  status,
  scope,
  onScopeChange,
  onStart,
  onStop,
}: ScanControlProps) {
  const isScanning = status === 'scanning'

  return (
    <div className="flex items-center gap-4">
      <Select
        value={scope}
        onValueChange={(value) => onScopeChange(value as ScanScope)}
        disabled={isScanning}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="选择范围" />
        </SelectTrigger>
        <SelectContent>
          {scopeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label} ({option.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isScanning ? (
        <Button variant="destructive" onClick={onStop}>
          <Square className="w-4 h-4 mr-2" />
          停止扫描
        </Button>
      ) : (
        <Button onClick={onStart}>
          <Play className="w-4 h-4 mr-2" />
          开始扫描
        </Button>
      )}
    </div>
  )
}