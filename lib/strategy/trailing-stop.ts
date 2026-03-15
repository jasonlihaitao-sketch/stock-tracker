import type { Position } from '@/types/position'
import { STOP_LOSS_CONFIG } from '@/types/position'

/**
 * 计算移动止损价
 */
export function updateTrailingStop(
  position: Position,
  currentPrice: number
): number {
  // 更新最高价
  const newHighest = Math.max(position.highestPrice, currentPrice)

  // 移动止损 = 最高价 * (1 - 回撤比例)
  let newStopLoss = newHighest * (1 - STOP_LOSS_CONFIG.trailingPercent)

  // 确保不低于初始止损
  newStopLoss = Math.max(newStopLoss, position.initialStopLoss)

  // 确保不低于买入价（保护本金）
  newStopLoss = Math.max(newStopLoss, position.buyPrice)

  return newStopLoss
}

/**
 * 计算初始止损价
 */
export function calculateInitialStopLoss(buyPrice: number): number {
  return buyPrice * (1 - STOP_LOSS_CONFIG.defaultPercent)
}

/**
 * 检查是否需要更新止损价
 */
export function shouldUpdateStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  // 只有盈利时才移动止损
  if (currentPrice <= position.buyPrice) {
    return false
  }

  // 检查是否创新高
  if (currentPrice > position.highestPrice) {
    const newStopLoss = updateTrailingStop(position, currentPrice)
    return newStopLoss > position.currentStopLoss
  }

  return false
}