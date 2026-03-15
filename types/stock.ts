// 股票基础信息
export interface Stock {
  code: string // 股票代码 "000001"
  name: string // 股票名称 "平安银行"
  market: 'SH' | 'SZ' // 市场
  price: number // 当前价格
  change: number // 涨跌额
  changePercent: number // 涨跌幅
  open: number // 开盘价
  high: number // 最高价
  low: number // 最低价
  preClose: number // 昨收价
  volume: number // 成交量（手）
  turnover: number // 成交额
  time: string // 数据时间
}

// 股票详情（包含基本面数据）
export interface StockDetail extends Stock {
  pe: number // 市盈率
  pb: number // 市净率
  marketCap: number // 总市值
  circulationCap: number // 流通市值
  dividendYield?: number // 股息率
  roe?: number // ROE
}

// K线数据
export interface KLineData {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  turnover: number
  changePercent: number
}

// 分时数据
export interface MinuteData {
  time: string
  price: number
  volume: number
  avgPrice: number
}

// 股票搜索结果
export interface StockSearchResult {
  code: string
  name: string
  market: 'SH' | 'SZ'
  type: string // 股票类型
  changePercent?: number // 涨跌幅（可选）
}

// 自选股分组
export interface WatchlistGroup {
  id: string
  name: string
  stocks: string[] // 股票代码列表
}

import type { SignalStrength, SignalType } from './signal'

/**
 * 自选股列表项 - 首页表格使用
 */
export interface WatchlistItem {
  code: string                // 纯代码（无前缀）
  fullCode: string            // 带市场前缀（sh/sz）
  name: string
  market: 'SH' | 'SZ'

  // 行情数据
  price: number
  change: number
  changePercent: number

  // 信号（可选）
  signal?: {
    type: SignalType
    strength: SignalStrength
    triggerReason: string
  }

  // 持仓标记
  isHeld: boolean             // 是否持有

  // 时间戳
  updatedAt: string
}