import type { Portfolio } from './portfolio'

/**
 * 扩展持仓模型 - 包含止损止盈
 */
export interface Position extends Portfolio {
  // 止损止盈
  initialStopLoss: number     // 初始止损价
  currentStopLoss: number     // 当前止损价（移动止损）
  takeProfit?: number         // 止盈价

  // 盈亏计算（实时）
  currentPrice: number        // 当前价格
  profit: number              // 盈亏金额
  profitPercent: number       // 盈亏百分比

  // 最高价追踪（用于移动止损）
  highestPrice: number        // 持仓期间最高价
}

/**
 * 持仓概览
 */
export interface PositionSummary {
  totalValue: number          // 总市值
  totalCost: number           // 总成本
  totalProfit: number         // 总盈亏金额
  totalProfitPercent: number  // 总盈亏百分比
  todayProfit: number         // 今日盈亏
  todayProfitPercent: number  // 今日盈亏百分比
}

/**
 * 止损配置
 */
export const STOP_LOSS_CONFIG = {
  defaultPercent: 0.08,       // 默认止损比例 8%
  trailingPercent: 0.05,      // 移动止损回撤比例 5%
} as const