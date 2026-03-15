// types/strategy.ts

// 策略分类
export type StrategyCategory =
  | 'technical'        // 技术面
  | 'fundamental'      // 基本面
  | 'growth'           // 高成长
  | 'quality'          // 高质量/护城河
  | 'reversal'         // 超跌反弹
  | 'event'            // 事件驱动

// 投资周期
export type StrategyTimeFrame = 'short' | 'medium' | 'long'

// 风险等级
export type RiskLevel = 'low' | 'medium' | 'high'

// 策略 ID（完整列表）
export type StrategyId =
  // 技术面策略
  | 'tech_breakout'
  | 'tech_volume'
  | 'tech_sector'
  | 'tech_ma_cross'
  | 'tech_macd'
  | 'tech_kdj'
  | 'tech_support'
  | 'tech_resistance'
  | 'tech_rsi_oversold'
  // 基本面策略
  | 'fund_low_pe'
  | 'fund_low_pb'
  | 'fund_high_dividend'
  | 'fund_roe'
  | 'fund_cash_flow'
  // 高成长策略
  | 'growth_revenue'
  | 'growth_profit'
  | 'growth_peg'
  | 'growth_expansion'
  // 高质量策略
  | 'quality_moat'
  | 'quality_leader'
  | 'quality_brand'
  | 'quality_cash_cow'
  // 超跌反弹策略
  | 'reversal_oversold'
  | 'reversal_support'
  | 'reversal_bb'
  | 'reversal_gap'
  // 事件驱动策略
  | 'event_earnings'
  | 'event_dividend'
  | 'event_repurchase'
  | 'event_institution'

// 策略定义
export interface Strategy {
  id: StrategyId
  name: string
  description: string
  category: StrategyCategory
  timeFrame: StrategyTimeFrame
  riskLevel: RiskLevel
  warnings: string[]  // 风险提示
  dataRequirements: string[]  // 需要的数据
  defaultEnabled: boolean
}

// 策略完整定义
export const STRATEGIES: Strategy[] = [
  // === 技术面策略 ===
  {
    id: 'tech_breakout',
    name: '价格突破',
    description: '股价接近 20 日新高，可能启动上升趋势',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['可能假突破，建议等待回踩确认'],
    dataRequirements: ['price', 'high20d'],
    defaultEnabled: true,
  },
  {
    id: 'tech_volume',
    name: '量价配合',
    description: '成交量放大且股价上涨，趋势得到确认',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['放量可能是出货，需结合股价位置判断'],
    dataRequirements: ['volume', 'avgVolume5d', 'changePercent'],
    defaultEnabled: true,
  },
  {
    id: 'tech_sector',
    name: '板块共振',
    description: '个股与所属板块同步上涨，热点效应明显',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['板块轮动快，追高需谨慎'],
    dataRequirements: ['sectorData', 'changePercent'],
    defaultEnabled: true,
  },
  {
    id: 'tech_ma_cross',
    name: '均线金叉',
    description: 'MA5 上穿 MA10，产生买入信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['震荡市频繁假信号，建议结合趋势判断'],
    dataRequirements: ['ma5', 'ma10', 'prevMa5', 'prevMa10'],
    defaultEnabled: false,
  },
  {
    id: 'tech_macd',
    name: 'MACD 金叉',
    description: 'DIF 线上穿 DEA 线，MACD 金叉',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['滞后指标，可能错过最佳买点'],
    dataRequirements: ['macd.dif', 'macd.dea'],
    defaultEnabled: false,
  },
  {
    id: 'tech_kdj',
    name: 'KDJ 金叉',
    description: 'K 线上穿 D 线，超短线买入信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['超短线指标，信号频繁，需结合其他指标'],
    dataRequirements: ['kdj.k', 'kdj.d'],
    defaultEnabled: false,
  },
  {
    id: 'tech_support',
    name: '支撑位反弹',
    description: '股价触及重要支撑位后回升，可能反弹',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['支撑可能失效，需设置止损'],
    dataRequirements: ['price', 'supportLevel'],
    defaultEnabled: false,
  },
  {
    id: 'tech_resistance',
    name: '压力位突破',
    description: '股价突破重要压力位，上涨空间打开',
    category: 'technical',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['需成交量确认，假突破风险'],
    dataRequirements: ['price', 'resistanceLevel', 'volume'],
    defaultEnabled: false,
  },
  {
    id: 'tech_rsi_oversold',
    name: 'RSI 超卖',
    description: 'RSI < 30 且拐头向上，超卖反弹信号',
    category: 'technical',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['RSI 超卖后可能继续超卖，建议等待拐头确认'],
    dataRequirements: ['rsi'],
    defaultEnabled: false,
  },

  // === 基本面策略 ===
  {
    id: 'fund_low_pe',
    name: '低估值(PE)',
    description: 'PE < 行业平均 × 0.7，相对低估',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: [
      '低 PE 可能是价值陷阱，公司可能面临衰退',
      '建议结合 ROE、现金流等指标综合判断',
    ],
    dataRequirements: ['pe', 'industryPe'],
    defaultEnabled: false,
  },
  {
    id: 'fund_low_pb',
    name: '低估值(PB)',
    description: 'PB < 1 且 ROE > 10%，资产价值低估',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: ['低 PB 可能资产质量差或面临困境'],
    dataRequirements: ['pb', 'roe'],
    defaultEnabled: false,
  },
  {
    id: 'fund_high_dividend',
    name: '高股息',
    description: '股息率 > 4% 且分红稳定',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['高股息可能是股价下跌导致，需检查分红可持续性'],
    dataRequirements: ['dividendYield', 'dividendHistory'],
    defaultEnabled: false,
  },
  {
    id: 'fund_roe',
    name: '高 ROE',
    description: 'ROE > 15% 连续 3 年，盈利能力强',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['需排除财务造假，关注 ROE 构成'],
    dataRequirements: ['roe', 'roeHistory'],
    defaultEnabled: false,
  },
  {
    id: 'fund_cash_flow',
    name: '现金流健康',
    description: '经营现金流 > 净利润，盈利质量高',
    category: 'fundamental',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['行业差异大，重资产行业现金流通常较低'],
    dataRequirements: ['operatingCashFlow', 'netProfit'],
    defaultEnabled: false,
  },

  // === 高成长策略 ===
  {
    id: 'growth_revenue',
    name: '营收高增长',
    description: '营收同比 > 30% 连续 2 季',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['高增长可能不可持续，关注增长质量'],
    dataRequirements: ['revenue', 'revenueYoY'],
    defaultEnabled: false,
  },
  {
    id: 'growth_profit',
    name: '利润高增长',
    description: '净利润同比 > 50%',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['基数效应影响大，需看多季度趋势'],
    dataRequirements: ['netProfit', 'netProfitYoY'],
    defaultEnabled: false,
  },
  {
    id: 'growth_peg',
    name: 'PEG 合理',
    description: 'PEG < 1（PE/增长率），成长性被低估',
    category: 'growth',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['增长预测存在偏差，需动态跟踪'],
    dataRequirements: ['pe', 'growthRate'],
    defaultEnabled: false,
  },
  {
    id: 'growth_expansion',
    name: '业务扩张',
    description: '研发投入占比 > 10%，积极扩张',
    category: 'growth',
    timeFrame: 'long',
    riskLevel: 'medium',
    warnings: ['短期盈利压力大，需关注扩张效率'],
    dataRequirements: ['rdExpense', 'revenue'],
    defaultEnabled: false,
  },

  // === 高质量策略 ===
  {
    id: 'quality_moat',
    name: '护城河',
    description: '毛利率 > 40% + ROE > 15%，竞争优势明显',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['护城河可能被侵蚀，需持续跟踪竞争格局'],
    dataRequirements: ['grossMargin', 'roe'],
    defaultEnabled: false,
  },
  {
    id: 'quality_leader',
    name: '行业龙头',
    description: '市占率前三 + 盈利稳定',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['行业天花板可能限制增长'],
    dataRequirements: ['marketShare', 'profitStability'],
    defaultEnabled: false,
  },
  {
    id: 'quality_brand',
    name: '品牌溢价',
    description: '高毛利率 + 定价权',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['消费者偏好变化可能导致品牌贬值'],
    dataRequirements: ['grossMargin', 'pricingPower'],
    defaultEnabled: false,
  },
  {
    id: 'quality_cash_cow',
    name: '现金牛',
    description: '自由现金流持续为正，分红能力强',
    category: 'quality',
    timeFrame: 'long',
    riskLevel: 'low',
    warnings: ['成长性可能不足'],
    dataRequirements: ['freeCashFlow'],
    defaultEnabled: false,
  },

  // === 超跌反弹策略 ===
  {
    id: 'reversal_oversold',
    name: '超跌反弹',
    description: '跌幅 > 30% + RSI < 30',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'high',
    warnings: [
      '超跌可能继续下跌，切勿盲目抄底',
      '建议分批建仓 + 严格止损',
    ],
    dataRequirements: ['price', 'priceDrop', 'rsi'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_support',
    name: '历史支撑',
    description: '价格接近历史低点',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'high',
    warnings: ['历史不一定重演，支撑可能失效'],
    dataRequirements: ['price', 'historicalLow'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_bb',
    name: '布林下轨',
    description: '价格触及布林下轨后回升',
    category: 'reversal',
    timeFrame: 'short',
    riskLevel: 'high',
    warnings: ['强势下跌可能穿透布林下轨'],
    dataRequirements: ['price', 'bbLower'],
    defaultEnabled: false,
  },
  {
    id: 'reversal_gap',
    name: '缺口回补',
    description: '股价回补向上跳空缺口',
    category: 'reversal',
    timeFrame: 'medium',
    riskLevel: 'medium',
    warnings: ['缺口可能不补，强势股可能继续上涨'],
    dataRequirements: ['price', 'gapLevel'],
    defaultEnabled: false,
  },

  // === 事件驱动策略 ===
  {
    id: 'event_earnings',
    name: '业绩预增',
    description: '业绩预告增长 > 50%',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['市场可能已经 Price in，公告后反而下跌'],
    dataRequirements: ['earningsForecast'],
    defaultEnabled: false,
  },
  {
    id: 'event_dividend',
    name: '分红派息',
    description: '高送转或特别分红',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['短期炒作风险，除权后可能下跌'],
    dataRequirements: ['dividendAnnouncement'],
    defaultEnabled: false,
  },
  {
    id: 'event_repurchase',
    name: '股票回购',
    description: '公司宣布回购计划',
    category: 'event',
    timeFrame: 'medium',
    riskLevel: 'low',
    warnings: ['回购计划可能不执行或不达预期'],
    dataRequirements: ['repurchaseAnnouncement'],
    defaultEnabled: false,
  },
  {
    id: 'event_institution',
    name: '机构调研',
    description: '近期机构调研密集',
    category: 'event',
    timeFrame: 'short',
    riskLevel: 'medium',
    warnings: ['调研不等于买入，可能只是了解情况'],
    dataRequirements: ['institutionVisits'],
    defaultEnabled: false,
  },
]

// 默认启用的策略
export const DEFAULT_ENABLED_STRATEGIES: StrategyId[] = [
  'tech_breakout',
  'tech_volume',
  'tech_sector',
]

// 按类别分组
export const STRATEGIES_BY_CATEGORY: Record<StrategyCategory, Strategy[]> = {
  technical: STRATEGIES.filter(s => s.category === 'technical'),
  fundamental: STRATEGIES.filter(s => s.category === 'fundamental'),
  growth: STRATEGIES.filter(s => s.category === 'growth'),
  quality: STRATEGIES.filter(s => s.category === 'quality'),
  reversal: STRATEGIES.filter(s => s.category === 'reversal'),
  event: STRATEGIES.filter(s => s.category === 'event'),
}

// 类别中文名称
export const CATEGORY_NAMES: Record<StrategyCategory, string> = {
  technical: '技术面',
  fundamental: '基本面',
  growth: '高成长',
  quality: '高质量',
  reversal: '超跌反弹',
  event: '事件驱动',
}