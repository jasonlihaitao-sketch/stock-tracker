// 持仓记录
export interface Portfolio {
  id: string
  stockCode: string
  stockName: string
  buyPrice: number // 买入价
  quantity: number // 数量
  buyDate: string // 买入日期
  note?: string // 备注
  createdAt: string
  updatedAt: string
}

// 持仓详情（包含实时数据）
export interface PortfolioWithStock extends Portfolio {
  currentPrice: number
  marketValue: number // 市值
  profit: number // 收益
  profitPercent: number // 收益率
  changePercent: number // 今日涨跌幅
}

// 持仓概览
export interface PortfolioSummary {
  totalCost: number // 总成本
  totalValue: number // 总市值
  totalProfit: number // 总收益
  totalProfitPercent: number // 总收益率
  todayProfit: number // 今日收益
  todayProfitPercent: number // 今日收益率
}