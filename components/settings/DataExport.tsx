// components/settings/DataExport.tsx
'use client'

import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportAllData, downloadAsJson, importData, restoreData } from '@/lib/utils/export'

export function DataExport() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportAllData()
    const filename = `stock-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    downloadAsJson(data, filename)
    setMessage({ type: 'success', text: '数据已导出' })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = importData(e.target?.result as string)
      if (result.success && result.data) {
        restoreData(result.data)
        setMessage({ type: 'success', text: '数据已恢复，页面将刷新' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据管理</CardTitle>
        <CardDescription>导出或导入您的自选股、持仓、预警等数据</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            导入数据
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'text-up' : 'text-destructive'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          数据存储在浏览器本地，清除浏览器缓存将丢失所有数据。建议定期导出备份。
        </p>
      </CardContent>
    </Card>
  )
}
