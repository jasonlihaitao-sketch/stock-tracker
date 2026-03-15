import { Metadata } from 'next'
import { PortfolioTable } from '@/components/portfolio'

export const metadata: Metadata = {
  title: '持仓管理 - StockTracker',
  description: '管理您的股票持仓，计算投资收益',
}

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">持仓管理</h1>
        <p className="page-description">记录和管理您的股票持仓，实时计算收益</p>
      </div>
      <PortfolioTable />
    </div>
  )
}
