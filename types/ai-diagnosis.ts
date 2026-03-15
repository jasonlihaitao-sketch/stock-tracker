/**
 * AI股票诊断报告类型定义
 */

/**
 * 综合建议类型
 */
export type Recommendation = 'buy' | 'sell' | 'hold'

/**
 * 置信度类型
 */
export type Confidence = 'high' | 'medium' | 'low'

/**
 * 趋势方向
 */
export type TrendDirection = 'up' | 'down' | 'sideways'

/**
 * 操作建议类型
 */
export type ActionType = 'buy' | 'sell' | 'hold' | 'wait'

/**
 * 技术面分析结果
 */
export interface TechnicalAnalysis {
  trend: TrendDirection           // 趋势方向
  trendStrength: number           // 趋势强度 1-10
  supportLevel: number            // 支撑位
  resistanceLevel: number         // 阻力位
  maStatus: string                // 均线状态描述
  volumeStatus: string            // 成交量状态描述
}

/**
 * 操作建议
 */
export interface ActionAdvice {
  action: ActionType              // 操作建议
  reason: string                  // 建议原因
  suggestedPrice?: number         // 建议价格
  stopLoss?: number               // 止损价
  takeProfit?: number             // 止盈价
}

/**
 * 股票诊断报告
 */
export interface StockDiagnosis {
  stockCode: string               // 股票代码
  stockName: string               // 股票名称
  diagnosisTime: string           // 诊断时间

  // 综合评分
  overallScore: number            // 综合评分 1-100
  recommendation: Recommendation  // 综合建议
  confidence: Confidence          // 置信度

  // 技术面分析
  technicalAnalysis: TechnicalAnalysis

  // 操作建议
  actionAdvice: ActionAdvice

  // 风险提示
  riskWarning: string[]

  // 详细分析
  detailedAnalysis: string
}

/**
 * 诊断请求参数
 */
export interface DiagnosisRequest {
  code: string                    // 股票代码
  name: string                    // 股票名称
  price: number                   // 当前价格
  change: number                  // 涨跌额
  changePercent: number           // 涨跌幅
  high: number                    // 最高价
  low: number                     // 最低价
  volume: number                  // 成交量
  // 技术指标
  technical: {
    high20d: number
    low20d: number
    ma5: number
    ma10: number
    ma20: number
    avgVolume5d: number
    avgVolume20d: number
  }
}

/**
 * 诊断API响应
 */
export interface DiagnosisResponse {
  success: boolean
  data?: StockDiagnosis
  error?: {
    code: string
    message: string
  }
}