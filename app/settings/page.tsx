// app/settings/page.tsx
import { Metadata } from 'next'
import { DataExport } from '@/components/settings/DataExport'

export const metadata: Metadata = {
  title: '设置 - StockTracker',
  description: '管理应用设置和数据',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">设置</h1>
        <p className="page-description">管理应用设置和数据</p>
      </div>

      <DataExport />
    </div>
  )
}
