// components/common/ErrorFallback.tsx
'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">出错了</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {error?.message || '页面加载时发生错误，请刷新重试'}
          </p>
          {onReset && (
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
