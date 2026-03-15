/**
 * 信号强度（1-5星）
 */
export type SignalStrength = 1 | 2 | 3 | 4 | 5

/**
 * 信号类型
 */
export type SignalType = 'buy' | 'sell'

/**
 * 信号状态
 */
export type SignalStatus = 'active' | 'expired' | 'executed'

/**
 * 信号模型
 */
export interface Signal {
  id: string
  stockCode: string
  stockName: string
  type: SignalType
  strength: SignalStrength
  triggerReason: string        // 触发原因
  suggestPrice?: number        // 建议价格（买入信号）
  stopLoss?: number           // 止损价（卖出信号）
  takeProfit?: number         // 止盈价
  createdAt: string
  expiresAt: string           // 信号过期时间
  status: SignalStatus
}

/**
 * 信号过期配置
 */
export const SIGNAL_EXPIRY_HOURS = {
  buy: 24,    // 买入信号24小时后过期
  sell: 4     // 卖出信号4小时后过期（更紧急）
} as const