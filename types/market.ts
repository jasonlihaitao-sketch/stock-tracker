// types/market.ts

/**
 * 市场统计数据
 */
export interface MarketStats {
  upCount: number       // 上涨家数
  downCount: number     // 下跌家数
  limitUp: number       // 涨停数
  limitDown: number     // 跌停数
  netInflow: number     // 主力净流入（亿元）
}

/**
 * 市场强弱判断
 */
export type MarketStrength = 'strong' | 'neutral' | 'weak'

/**
 * 指数数据
 */
export interface IndexData {
  code: string          // 代码
  name: string          // 名称
  price: number         // 当前点位
  change: number        // 涨跌点数
  changePercent: number // 涨跌幅
}

/**
 * 热门板块
 */
export interface HotSector {
  code: string
  name: string
  changePercent: number
}