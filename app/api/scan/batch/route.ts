// app/api/scan/batch/route.ts

import { NextResponse } from 'next/server'
import type { StrategyId, StrategyCategory } from '@/types/strategy'
import type { SignalStrength } from '@/types/scan'

/**
 * 批量扫描 API
 * 一次性获取大量股票数据并检测信号，减少网络请求次数
 */

// 新浪财经 API 支持一次查询约 800 只股票
const BATCH_SIZE = 500

interface StockData {
  code: string
  name: string
  price: number
  preClose: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  volume: number
  turnover: number
}

interface ScanSignalResult {
  code: string
  name: string
  price: number
  changePercent: number
  strategies: Array<{
    strategyId: StrategyId
    strategyName: string
    category: StrategyCategory
    strength: SignalStrength
    warnings: string[]
  }>
  strength: number
}

// 策略定义 - 使用与 types/strategy.ts 完全一致的 StrategyId
const STRATEGY_DEFINITIONS: Partial<
  Record<
    StrategyId,
    {
      name: string
      category: StrategyCategory
      detect: (stock: StockData) => { strength: SignalStrength; warnings: string[] } | null
    }
  >
> = {
  // === 技术面策略 ===
  tech_breakout: {
    name: '价格突破',
    category: 'technical',
    detect: (stock: StockData) => {
      // 突破信号：涨幅 > 3% 且接近当日最高价
      if (stock.changePercent >= 3 && stock.price >= stock.high * 0.99) {
        return {
          strength: stock.changePercent >= 5 ? 'strong' : 'medium',
          warnings: stock.changePercent >= 7 ? ['涨幅较大，注意追高风险'] : [],
        }
      }
      return null
    },
  },
  tech_volume: {
    name: '量价配合',
    category: 'technical',
    detect: (stock: StockData) => {
      // 放量上涨：涨幅 > 2%，有成交额支撑
      if (stock.changePercent >= 2 && stock.turnover > 100000000) {
        return {
          strength: stock.turnover > 500000000 ? 'strong' : 'medium',
          warnings: [],
        }
      }
      return null
    },
  },
  tech_sector: {
    name: '板块共振',
    category: 'technical',
    detect: (stock: StockData) => {
      // 简化判断：强势上涨可能有板块效应
      if (stock.changePercent >= 3 && stock.turnover > 200000000) {
        return { strength: 'medium', warnings: ['需确认板块走势'] }
      }
      return null
    },
  },
  tech_ma_cross: {
    name: '均线金叉',
    category: 'technical',
    detect: (stock: StockData) => {
      // 价格在开盘价之上，阳线
      if (stock.changePercent > 0 && stock.price > stock.open) {
        return {
          strength: stock.changePercent >= 3 ? 'strong' : 'weak',
          warnings: [],
        }
      }
      return null
    },
  },
  tech_macd: {
    name: 'MACD 金叉',
    category: 'technical',
    detect: (stock: StockData) => {
      // 简化判断：强势上涨
      if (stock.changePercent >= 3 && stock.price > stock.open) {
        return { strength: 'medium', warnings: [] }
      }
      return null
    },
  },
  tech_kdj: {
    name: 'KDJ 金叉',
    category: 'technical',
    detect: (stock: StockData) => {
      // 超卖反弹：跌幅大但开始反弹
      if (stock.changePercent < -3 && stock.price > stock.low * 1.02) {
        return { strength: 'weak', warnings: ['需结合K线确认'] }
      }
      return null
    },
  },
  tech_support: {
    name: '支撑位反弹',
    category: 'technical',
    detect: (stock: StockData) => {
      // 下影线长，可能支撑
      const lowerShadow =
        stock.low < Math.min(stock.open, stock.price)
          ? ((Math.min(stock.open, stock.price) - stock.low) / stock.low) * 100
          : 0
      if (lowerShadow >= 2 && stock.changePercent >= -2) {
        return {
          strength: lowerShadow >= 3 ? 'strong' : 'medium',
          warnings: [],
        }
      }
      return null
    },
  },
  tech_resistance: {
    name: '压力位突破',
    category: 'technical',
    detect: (stock: StockData) => {
      // 接近当日最高价
      if (stock.changePercent >= 2 && stock.price >= stock.high * 0.98) {
        return { strength: 'medium', warnings: [] }
      }
      return null
    },
  },
  tech_rsi_oversold: {
    name: 'RSI 超卖',
    category: 'technical',
    detect: (stock: StockData) => {
      // 大涨或大跌
      if (Math.abs(stock.changePercent) >= 5) {
        return { strength: 'medium', warnings: [] }
      }
      return null
    },
  },

  // === 基本面策略（需要财务数据，简化版暂不检测）===
  fund_low_pe: {
    name: '低估值(PE)',
    category: 'fundamental',
    detect: () => null,
  },
  fund_low_pb: {
    name: '低估值(PB)',
    category: 'fundamental',
    detect: () => null,
  },
  fund_high_dividend: {
    name: '高股息',
    category: 'fundamental',
    detect: () => null,
  },
  fund_roe: {
    name: '高 ROE',
    category: 'fundamental',
    detect: () => null,
  },
  fund_cash_flow: {
    name: '现金流健康',
    category: 'fundamental',
    detect: () => null,
  },

  // === 成长策略 ===
  growth_revenue: {
    name: '营收高增长',
    category: 'growth',
    detect: () => null,
  },
  growth_profit: {
    name: '利润高增长',
    category: 'growth',
    detect: () => null,
  },
  growth_peg: {
    name: 'PEG 合理',
    category: 'growth',
    detect: () => null,
  },
  growth_expansion: {
    name: '业务扩张',
    category: 'growth',
    detect: (stock: StockData) => {
      // 放量上涨可能是扩张信号
      if (stock.changePercent >= 5 && stock.turnover > 200000000) {
        return { strength: 'medium', warnings: ['需结合财报确认'] }
      }
      return null
    },
  },

  // === 质量策略 ===
  quality_moat: {
    name: '护城河',
    category: 'quality',
    detect: () => null,
  },
  quality_leader: {
    name: '行业龙头',
    category: 'quality',
    detect: (stock: StockData) => {
      // 大成交额可能是龙头股
      if (stock.turnover > 1000000000 && stock.changePercent > 0) {
        return { strength: 'weak', warnings: ['需确认行业地位'] }
      }
      return null
    },
  },
  quality_brand: {
    name: '品牌溢价',
    category: 'quality',
    detect: () => null,
  },
  quality_cash_cow: {
    name: '现金牛',
    category: 'quality',
    detect: () => null,
  },

  // === 超跌反弹策略 ===
  reversal_oversold: {
    name: '超跌反弹',
    category: 'reversal',
    detect: (stock: StockData) => {
      // 大跌后反弹
      if (stock.changePercent < -5 && stock.price > stock.low) {
        return {
          strength: 'medium',
          warnings: ['下跌趋势中需谨慎'],
        }
      }
      return null
    },
  },
  reversal_support: {
    name: '历史支撑',
    category: 'reversal',
    detect: (stock: StockData) => {
      const lowerShadow =
        stock.low < Math.min(stock.open, stock.price)
          ? ((Math.min(stock.open, stock.price) - stock.low) / stock.low) * 100
          : 0
      if (lowerShadow >= 3 && stock.changePercent >= -3) {
        return { strength: 'medium', warnings: [] }
      }
      return null
    },
  },
  reversal_bb: {
    name: '布林下轨',
    category: 'reversal',
    detect: () => null,
  },
  reversal_gap: {
    name: '缺口回补',
    category: 'reversal',
    detect: (stock: StockData) => {
      // 跳空高开
      if (stock.open > stock.preClose * 1.02 && stock.changePercent > 0) {
        return { strength: 'weak', warnings: ['需观察是否回补缺口'] }
      }
      return null
    },
  },

  // === 事件驱动策略 ===
  event_earnings: {
    name: '业绩预增',
    category: 'event',
    detect: () => null,
  },
  event_dividend: {
    name: '分红派息',
    category: 'event',
    detect: () => null,
  },
  event_repurchase: {
    name: '股票回购',
    category: 'event',
    detect: () => null,
  },
  event_institution: {
    name: '机构调研',
    category: 'event',
    detect: () => null,
  },
}

export async function POST(request: Request) {
  try {
    const { codes, offset = 0, strategies } = await request.json()

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ stocks: [], signals: [], hasMore: false })
    }

    // 获取当前批次
    const batchCodes = codes.slice(offset, offset + BATCH_SIZE)
    const hasMore = offset + BATCH_SIZE < codes.length

    // 并行获取股票数据
    const stocks = await fetchStocksParallel(batchCodes)

    // 使用传入的策略或默认策略
    const enabledStrategies: StrategyId[] =
      strategies || (Object.keys(STRATEGY_DEFINITIONS) as StrategyId[])

    // 检测信号
    const signals = detectSignalsBatch(stocks, enabledStrategies)

    return NextResponse.json({
      stocks: stocks.length,
      signals,
      nextOffset: hasMore ? offset + BATCH_SIZE : null,
      hasMore,
    })
  } catch (error) {
    console.error('Batch scan error:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

/**
 * 并行获取股票数据（分多个请求并行执行）
 */
async function fetchStocksParallel(codes: string[]): Promise<StockData[]> {
  // 将代码分成多个小组并行请求
  const chunkSize = 200 // 每个请求 200 只
  const chunks: string[][] = []

  for (let i = 0; i < codes.length; i += chunkSize) {
    chunks.push(codes.slice(i, i + chunkSize))
  }

  // 并行请求所有块
  const results = await Promise.all(chunks.map((chunk) => fetchFromSina(chunk)))

  // 合并结果
  return results.flat()
}

/**
 * 从新浪财经获取股票数据
 */
async function fetchFromSina(codes: string[]): Promise<StockData[]> {
  if (codes.length === 0) return []

  const codeList = codes.join(',')
  const url = `https://hq.sinajs.cn/list=${codeList}`

  try {
    const response = await fetch(url, {
      headers: {
        Referer: 'https://finance.sina.com.cn',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    // GBK 解码
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)

    return parseSinaData(text)
  } catch (error) {
    console.error('Fetch sina error:', error)
    return []
  }
}

/**
 * 解析新浪数据
 */
function parseSinaData(text: string): StockData[] {
  const lines = text.split('\n').filter((line) => line.trim())
  const stocks: StockData[] = []

  for (const line of lines) {
    const codeMatch = line.match(/(sh|sz)(\d{6})/)
    if (!codeMatch) continue

    const match = line.match(/="([^"]+)"/)
    if (!match || !match[1]) continue

    const parts = match[1].split(',')
    if (parts.length < 33) continue

    const code = codeMatch[1] + codeMatch[2]
    const name = parts[0]
    const open = parseFloat(parts[1]) || 0
    const preClose = parseFloat(parts[2]) || 0
    const price = parseFloat(parts[3]) || 0
    const high = parseFloat(parts[4]) || 0
    const low = parseFloat(parts[5]) || 0
    const volume = parseInt(parts[8]) || 0
    const turnover = parseFloat(parts[9]) || 0

    // 跳过停牌股票
    if (price === 0) continue

    const change = price - preClose
    const changePercent = preClose > 0 ? (change / preClose) * 100 : 0

    stocks.push({
      code,
      name,
      price,
      preClose,
      change,
      changePercent,
      high,
      low,
      open,
      volume,
      turnover,
    })
  }

  return stocks
}

/**
 * 批量检测信号 - 使用策略系统
 */
function detectSignalsBatch(
  stocks: StockData[],
  enabledStrategies: StrategyId[]
): ScanSignalResult[] {
  const signals: ScanSignalResult[] = []

  for (const stock of stocks) {
    // 跳过 ST 股票
    if (stock.name.includes('ST') || stock.name.includes('*ST')) continue

    // 使用启用的策略检测
    const detectedStrategies: ScanSignalResult['strategies'] = []

    for (const strategyId of enabledStrategies) {
      const strategy = STRATEGY_DEFINITIONS[strategyId]
      if (!strategy) continue

      const result = strategy.detect(stock)
      if (result) {
        detectedStrategies.push({
          strategyId,
          strategyName: strategy.name,
          category: strategy.category,
          strength: result.strength,
          warnings: result.warnings,
        })
      }
    }

    // 如果检测到信号，添加到结果
    if (detectedStrategies.length > 0) {
      // 计算综合强度
      const strengthMap: Record<SignalStrength, number> = { strong: 3, medium: 2, weak: 1 }
      const totalScore = detectedStrategies.reduce((sum, s) => sum + strengthMap[s.strength], 0)
      const overallStrength = Math.min(5, Math.max(1, Math.ceil(totalScore / 2)))

      signals.push({
        code: stock.code,
        name: stock.name,
        price: stock.price,
        changePercent: stock.changePercent,
        strategies: detectedStrategies,
        strength: overallStrength,
      })
    }
  }

  // 按强度和信号数量排序
  signals.sort((a, b) => {
    if (b.strength !== a.strength) return b.strength - a.strength
    return b.strategies.length - a.strategies.length
  })

  return signals.slice(0, 100) // 每批最多返回 100 个信号
}
