// lib/screener/conditions.ts
// 股票筛选条件逻辑

import type { Stock } from '@/types/stock'
import type { StockTechnical } from '@/types/technical'

/**
 * 筛选条件类型
 */
export interface ScreenerConditions {
  // 价格区间
  priceMin?: number
  priceMax?: number

  // 涨跌幅区间
  changePercentMin?: number
  changePercentMax?: number

  // 市值区间 (单位: 亿元)
  marketCapMin?: number
  marketCapMax?: number

  // 市盈率区间
  peMin?: number
  peMax?: number

  // 成交量条件
  volumeCondition?: 'high' | 'low' | null // high: 放量, low: 缩量

  // 技术指标条件
  technicalConditions?: {
    maGoldenCross?: boolean // MA5 > MA20 (金叉)
    maDeathCross?: boolean // MA5 < MA20 (死叉)
    breakout20dHigh?: boolean // 突破20日高点
    breakdown20dLow?: boolean // 跌破20日低点
    rsiOverbought?: boolean // RSI超买(>70)
    rsiOversold?: boolean // RSI超卖(<30)
  }
}

/**
 * 筛选结果项
 */
export interface ScreenerResultItem {
  code: string
  name: string
  price: number
  changePercent: number
  marketCap?: number
  pe?: number
  matchedConditions: string[] // 命中的条件描述
}

/**
 * 带技术指标的股票数据
 */
interface StockWithTech {
  stock: Stock
  technical: StockTechnical
  pe?: number
  marketCap?: number
}

/**
 * 计算RSI (相对强弱指标)
 * @param closes 收盘价数组
 * @param period 周期，默认14
 * @returns RSI值
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50

  let gains = 0
  let losses = 0

  // 计算初始平均涨跌
  for (let i = 1; i <= period; i++) {
    const change = closes[closes.length - i] - closes[closes.length - i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100

  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

/**
 * 检查股票是否满足筛选条件
 */
export function checkStockConditions(
  stockWithTech: StockWithTech,
  conditions: ScreenerConditions
): { matches: boolean; matchedConditions: string[] } {
  const { stock, technical } = stockWithTech
  const matchedConditions: string[] = []

  // 1. 价格区间检查
  if (conditions.priceMin !== undefined && stock.price < conditions.priceMin) {
    return { matches: false, matchedConditions: [] }
  }
  if (conditions.priceMax !== undefined && stock.price > conditions.priceMax) {
    return { matches: false, matchedConditions: [] }
  }
  if (conditions.priceMin !== undefined || conditions.priceMax !== undefined) {
    const min = conditions.priceMin ?? 0
    const max = conditions.priceMax ?? '∞'
    matchedConditions.push(`价格: ${min}-${max}元`)
  }

  // 2. 涨跌幅区间检查
  if (conditions.changePercentMin !== undefined && stock.changePercent < conditions.changePercentMin) {
    return { matches: false, matchedConditions: [] }
  }
  if (conditions.changePercentMax !== undefined && stock.changePercent > conditions.changePercentMax) {
    return { matches: false, matchedConditions: [] }
  }
  if (conditions.changePercentMin !== undefined || conditions.changePercentMax !== undefined) {
    const min = conditions.changePercentMin ?? '-∞'
    const max = conditions.changePercentMax ?? '+∞'
    matchedConditions.push(`涨跌幅: ${min}% ~ ${max}%`)
  }

  // 3. 市值区间检查
  if (conditions.marketCapMin !== undefined && stockWithTech.marketCap !== undefined) {
    if (stockWithTech.marketCap < conditions.marketCapMin) {
      return { matches: false, matchedConditions: [] }
    }
  }
  if (conditions.marketCapMax !== undefined && stockWithTech.marketCap !== undefined) {
    if (stockWithTech.marketCap > conditions.marketCapMax) {
      return { matches: false, matchedConditions: [] }
    }
  }
  if ((conditions.marketCapMin !== undefined || conditions.marketCapMax !== undefined) &&
      stockWithTech.marketCap !== undefined) {
    const min = conditions.marketCapMin ?? 0
    const max = conditions.marketCapMax ?? '∞'
    matchedConditions.push(`市值: ${min}-${max}亿`)
  }

  // 4. 市盈率区间检查
  if (conditions.peMin !== undefined && stockWithTech.pe !== undefined) {
    if (stockWithTech.pe < conditions.peMin) {
      return { matches: false, matchedConditions: [] }
    }
  }
  if (conditions.peMax !== undefined && stockWithTech.pe !== undefined) {
    if (stockWithTech.pe > conditions.peMax) {
      return { matches: false, matchedConditions: [] }
    }
  }
  if ((conditions.peMin !== undefined || conditions.peMax !== undefined) &&
      stockWithTech.pe !== undefined) {
    const min = conditions.peMin ?? 0
    const max = conditions.peMax ?? '∞'
    matchedConditions.push(`PE: ${min}-${max}`)
  }

  // 5. 成交量条件检查
  if (conditions.volumeCondition) {
    const volumeRatio = technical.volume / technical.avgVolume5d
    if (conditions.volumeCondition === 'high') {
      // 放量: 成交量 > 5日均量 * 1.5
      if (volumeRatio < 1.5) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push(`放量: ${volumeRatio.toFixed(2)}倍`)
    } else if (conditions.volumeCondition === 'low') {
      // 缩量: 成交量 < 5日均量 * 0.5
      if (volumeRatio > 0.5) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push(`缩量: ${volumeRatio.toFixed(2)}倍`)
    }
  }

  // 6. 技术指标条件检查
  if (conditions.technicalConditions) {
    const tech = conditions.technicalConditions

    // MA金叉: MA5 > MA20
    if (tech.maGoldenCross) {
      if (technical.ma5 <= technical.ma20) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('MA金叉(5>20)')
    }

    // MA死叉: MA5 < MA20
    if (tech.maDeathCross) {
      if (technical.ma5 >= technical.ma20) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('MA死叉(5<20)')
    }

    // 突破20日高点
    if (tech.breakout20dHigh) {
      if (stock.price < technical.high20d * 0.99) { // 允许1%误差
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('突破20日高点')
    }

    // 跌破20日低点
    if (tech.breakdown20dLow) {
      if (stock.price > technical.low20d * 1.01) { // 允许1%误差
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('跌破20日低点')
    }

    // RSI超买/超卖需要K线数据计算，这里简化处理
    // 实际应用中需要从K线数据计算RSI
    if (tech.rsiOverbought) {
      // 简化: 使用涨跌幅作为替代指标
      if (stock.changePercent < 5) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('强势上涨(>5%)')
    }

    if (tech.rsiOversold) {
      // 简化: 使用涨跌幅作为替代指标
      if (stock.changePercent > -5) {
        return { matches: false, matchedConditions: [] }
      }
      matchedConditions.push('超跌(<-5%)')
    }
  }

  return { matches: matchedConditions.length > 0 || isEmptyConditions(conditions), matchedConditions }
}

/**
 * 检查是否为空条件（无任何筛选条件）
 */
function isEmptyConditions(conditions: ScreenerConditions): boolean {
  return (
    conditions.priceMin === undefined &&
    conditions.priceMax === undefined &&
    conditions.changePercentMin === undefined &&
    conditions.changePercentMax === undefined &&
    conditions.marketCapMin === undefined &&
    conditions.marketCapMax === undefined &&
    conditions.peMin === undefined &&
    conditions.peMax === undefined &&
    conditions.volumeCondition === undefined &&
    (conditions.technicalConditions === undefined ||
      Object.values(conditions.technicalConditions).every(v => !v))
  )
}

/**
 * 执行股票筛选
 */
export function filterStocks(
  stocks: StockWithTech[],
  conditions: ScreenerConditions
): ScreenerResultItem[] {
  const results: ScreenerResultItem[] = []

  for (const stockWithTech of stocks) {
    const { matches, matchedConditions } = checkStockConditions(stockWithTech, conditions)

    if (matches) {
      results.push({
        code: stockWithTech.stock.code.replace(/^(sh|sz)/, ''),
        name: stockWithTech.stock.name,
        price: stockWithTech.stock.price,
        changePercent: stockWithTech.stock.changePercent,
        marketCap: stockWithTech.marketCap,
        pe: stockWithTech.pe,
        matchedConditions: matchedConditions.length > 0 ? matchedConditions : ['基础筛选'],
      })
    }
  }

  return results
}

/**
 * 默认筛选条件
 */
export const defaultConditions: ScreenerConditions = {
  priceMin: undefined,
  priceMax: undefined,
  changePercentMin: undefined,
  changePercentMax: undefined,
  marketCapMin: undefined,
  marketCapMax: undefined,
  peMin: undefined,
  peMax: undefined,
  volumeCondition: null,
  technicalConditions: {
    maGoldenCross: false,
    maDeathCross: false,
    breakout20dHigh: false,
    breakdown20dLow: false,
    rsiOverbought: false,
    rsiOversold: false,
  },
}

/**
 * 预设筛选模板
 */
export const screenerPresets = {
  // 价值股筛选
  valueStocks: {
    name: '价值股',
    conditions: {
      peMin: 0,
      peMax: 20,
      marketCapMin: 100,
    } as ScreenerConditions,
  },
  // 成长股筛选
  growthStocks: {
    name: '成长股',
    conditions: {
      changePercentMin: 3,
      volumeCondition: 'high' as const,
    } as ScreenerConditions,
  },
  // 技术突破
  breakout: {
    name: '技术突破',
    conditions: {
      technicalConditions: {
        maGoldenCross: true,
        breakout20dHigh: true,
      },
      volumeCondition: 'high' as const,
    } as ScreenerConditions,
  },
  // 超跌反弹
  oversold: {
    name: '超跌反弹',
    conditions: {
      changePercentMin: -10,
      changePercentMax: -3,
      technicalConditions: {
        rsiOversold: true,
      },
    } as ScreenerConditions,
  },
  // 强势股
  strongStocks: {
    name: '强势股',
    conditions: {
      changePercentMin: 5,
      volumeCondition: 'high' as const,
      technicalConditions: {
        breakout20dHigh: true,
      },
    } as ScreenerConditions,
  },
}
