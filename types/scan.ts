// types/scan.ts
import type { StrategyId, StrategyCategory } from './strategy'

/**
 * 扫描范围
 */
export type ScanScope = 'all' | 'watchlist' | 'hs300'

/**
 * 扫描状态
 */
export type ScanStatus = 'idle' | 'scanning' | 'completed'

/**
 * 信号强度等级
 */
export type SignalStrength = 'strong' | 'medium' | 'weak'

/**
 * 扫描信号详情
 */
export interface ScanSignal {
  strategyId: StrategyId
  strategyName: string
  category: StrategyCategory
  strength: SignalStrength
  warnings: string[]
}

/**
 * 扫描结果
 */
export interface ScanResult {
  code: string // 股票代码
  name: string // 股票名称
  price: number // 当前价格
  changePercent: number // 涨跌幅
  signals: ScanSignal[] // 触发的信号详情
  strength: number // 综合信号强度 1-5
}

/**
 * 扫描进度
 */
export interface ScanProgress {
  current: number
  total: number
}

/**
 * 扫描配置
 */
export interface ScanConfig {
  scope: ScanScope
  strategies: StrategyId[] // 选中的策略 ID
  templateId?: string // 使用的模板 ID（可选）
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  scope: ScanScope
  strategies?: StrategyId[] // 可选的策略列表，默认使用启用的策略
  onProgress?: (progress: ScanProgress) => void
  onFound?: (result: ScanResult) => void
}
