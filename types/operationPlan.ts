/**
 * 操作计划类型
 */
export type OperationType = 'buy' | 'sell'

/**
 * 操作计划状态
 */
export type OperationStatus = 'pending' | 'executed' | 'cancelled'

/**
 * 操作计划模型
 */
export interface OperationPlan {
  id: string
  signalId?: string           // 关联的信号
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice?: number        // 目标价格
  quantity?: number           // 数量
  positionRatio?: number      // 仓位比例（%）
  stopLoss?: number           // 止损价
  takeProfit?: number         // 止盈价
  status: OperationStatus
  executedAt?: string         // 执行时间
  executedPrice?: number      // 执行价格
  note?: string               // 备注
  createdAt: string
  updatedAt: string
}

/**
 * 创建操作计划参数
 */
export interface CreateOperationPlanParams {
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice?: number
  quantity?: number
  positionRatio?: number
  stopLoss?: number
  takeProfit?: number
  note?: string
  signalId?: string
}