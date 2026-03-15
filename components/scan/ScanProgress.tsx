// components/scan/ScanProgress.tsx

'use client'

import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { ScanProgress as ScanProgressType, ScanStatus } from '@/types/scan'

interface ScanProgressProps {
  progress: ScanProgressType
  status: ScanStatus
  foundCount: number
}

export function ScanProgress({ progress, status, foundCount }: ScanProgressProps) {
  if (status === 'idle') return null

  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'scanning' && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span>
            {status === 'scanning' ? '扫描中...' : '扫描完成'}
          </span>
        </div>
        <span className="text-muted-foreground">
          {progress.current} / {progress.total}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>发现 {foundCount} 只股票符合条件</span>
        <span>{percentage}%</span>
      </div>
    </div>
  )
}