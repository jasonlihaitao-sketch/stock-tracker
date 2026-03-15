// types/strategy-template.ts
import type { StrategyId, StrategyTimeFrame, RiskLevel } from './strategy'

export interface StrategyTemplate {
  id: string
  name: string
  author: string
  description: string
  strategies: StrategyId[]
  timeFrame: StrategyTimeFrame
  riskLevel: RiskLevel
  successRate?: string  // 历史表现说明
  icon?: string
}

// 经典策略模板
export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'can_slim',
    name: 'CAN SLIM 法则',
    author: '威廉·欧奈尔',
    description: '结合基本面成长与技术面动能的经典策略',
    strategies: [
      'fund_roe',
      'growth_profit',
      'tech_breakout',
      'tech_volume',
      'tech_sector',
      'fund_low_pe',
      'tech_ma_cross',
    ],
    timeFrame: 'medium',
    riskLevel: 'medium',
    successRate: '历史回测年化收益约 20-30%',
    icon: '📈',
  },
  {
    id: 'buffett_value',
    name: '巴菲特价值投资',
    author: '沃伦·巴菲特',
    description: '寻找具有护城河的优质企业，长期持有',
    strategies: [
      'quality_moat',
      'quality_cash_cow',
      'fund_roe',
      'fund_cash_flow',
      'fund_high_dividend',
    ],
    timeFrame: 'long',
    riskLevel: 'low',
    successRate: '长期年化收益约 15-20%',
    icon: '🏰',
  },
  {
    id: 'lynch_growth',
    name: '彼得林奇成长投资',
    author: '彼得·林奇',
    description: '寻找 PEG 合理的高成长股',
    strategies: [
      'growth_peg',
      'growth_revenue',
      'growth_profit',
      'fund_low_pe',
      'quality_leader',
    ],
    timeFrame: 'medium',
    riskLevel: 'medium',
    successRate: '麦哲伦基金年化收益约 29%',
    icon: '🚀',
  },
  {
    id: 'reversal_combo',
    name: '超跌反弹组合',
    author: '左侧交易者',
    description: '寻找被市场过度抛售的标的',
    strategies: [
      'reversal_oversold',
      'reversal_support',
      'fund_roe',
      'fund_cash_flow',
    ],
    timeFrame: 'medium',
    riskLevel: 'high',
    successRate: '需要严格止损',
    icon: '🔄',
  },
  {
    id: 'technical_short',
    name: '技术面短线组合',
    author: '短线交易者',
    description: '适合短线波段操作的技术指标组合',
    strategies: [
      'tech_ma_cross',
      'tech_macd',
      'tech_kdj',
      'tech_volume',
      'tech_breakout',
    ],
    timeFrame: 'short',
    riskLevel: 'high',
    successRate: '需要盯盘，风险较高',
    icon: '⚡',
  },
  {
    id: 'dividend_income',
    name: '红利投资组合',
    author: '稳健投资者',
    description: '追求稳定现金流的分红策略',
    strategies: [
      'fund_high_dividend',
      'fund_cash_flow',
      'quality_cash_cow',
      'fund_roe',
    ],
    timeFrame: 'long',
    riskLevel: 'low',
    successRate: '年化股息收益 4-6%',
    icon: '💰',
  },
]