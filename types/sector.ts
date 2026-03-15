/**
 * 板块龙头股
 */
export interface LeadingStock {
  code: string
  name: string
  changePercent: number
}

/**
 * 板块模型
 */
export interface Sector {
  code: string
  name: string
  changePercent: number
  capitalFlow: number         // 资金流入（亿）
  leadingStocks: LeadingStock[]
  stocks: string[]            // 板块内个股代码列表
}

/**
 * 板块排序方式
 */
export type SectorSortBy = 'change' | 'capital_flow'

/**
 * 热门板块配置
 */
export const HOT_SECTOR_THRESHOLD = {
  changePercent: 1,           // 涨幅超过1%视为热门
  capitalFlow: 5,             // 资金流入超过5亿视为热门
} as const