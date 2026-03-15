import type { Stock } from '@/types/stock'
import type { ScanResult, ScanSignal } from '@/types/scan'
import type { Signal } from '@/types/signal'

/**
 * 推荐类型
 */
export type RecommendationType =
  | 'breakout'
  | 'volume'
  | 'sector'
  | 'watchlist'
  | 'market'
  | 'general'

/**
 * 推荐结果
 */
export interface StockRecommendation {
  code: string
  name: string
  price: number
  changePercent: number
  reason: string
  type: RecommendationType
  strength: number // 1-5
}

/**
 * AI回答类型
 */
export interface AIResponse {
  type:
    | 'recommendation'
    | 'analysis'
    | 'market_overview'
    | 'watchlist_review'
    | 'greeting'
    | 'unknown'
  message: string
  recommendations?: StockRecommendation[]
  analysis?: {
    stockCode: string
    stockName: string
    score: number
    trend: 'up' | 'down' | 'sideways'
    advice: string
  }
  marketSummary?: {
    upCount: number
    downCount: number
    avgChange: number
    hotSectors: string[]
  }
}

/**
 * 问题分类
 */
export type QuestionType =
  | 'today_recommendation' // "今天有什么好股票"
  | 'breakout_stocks' // "推荐一些突破股"
  | 'volume_stocks' // "放量上涨的股票"
  | 'watchlist_review' // "我的自选股怎么样"
  | 'market_trend' // "市场趋势如何"
  | 'stock_analysis' // "分析某只股票"
  | 'greeting' // 问候语
  | 'unknown' // 未知问题

/**
 * 检查信号是否包含策略ID
 */
function hasStrategy(signals: ScanSignal[], strategyId: string): boolean {
  return signals.some((s) => s.strategyId === strategyId)
}

/**
 * 分析问题类型
 */
export function analyzeQuestion(question: string): QuestionType {
  const lowerQuestion = question.toLowerCase()

  // 问候语
  if (/^(你好|您好|嗨|hello|hi|在吗)/i.test(lowerQuestion)) {
    return 'greeting'
  }

  // 今天有什么好股票 / 推荐股票
  if (
    /今天|今日|现在|目前|推荐|有什么.*好.*股|哪些.*股|买点.*什么/i.test(lowerQuestion) &&
    /好.*股|推荐|股票|买点|机会/i.test(lowerQuestion)
  ) {
    return 'today_recommendation'
  }

  // 突破股
  if (/突破|创新高|新高|突破股/i.test(lowerQuestion)) {
    return 'breakout_stocks'
  }

  // 放量股
  if (/放量|量价|成交量|量能/i.test(lowerQuestion)) {
    return 'volume_stocks'
  }

  // 自选股
  if (/自选|我的.*股|关注.*股|watchlist/i.test(lowerQuestion)) {
    return 'watchlist_review'
  }

  // 市场趋势
  if (/市场|大盘|行情|趋势|走势|沪指|深证|创业板/i.test(lowerQuestion)) {
    return 'market_trend'
  }

  // 单只股票分析
  if (
    /分析|看看|怎么样|如何|评价|诊断.*(\d{6}|[\u4e00-\u9fa5]{2,})/i.test(lowerQuestion) ||
    /^(\d{6}|[\u4e00-\u9fa5]{2,}).*怎么样/i.test(lowerQuestion)
  ) {
    return 'stock_analysis'
  }

  return 'unknown'
}

/**
 * 生成今日推荐
 */
export function generateTodayRecommendations(
  scanResults: ScanResult[],
  limit: number = 5
): StockRecommendation[] {
  if (!scanResults || scanResults.length === 0) {
    return []
  }

  // 按信号强度排序
  const sorted = [...scanResults].sort((a, b) => b.strength - a.strength)

  return sorted.slice(0, limit).map((result) => {
    const reasons: string[] = []

    if (hasStrategy(result.signals, 'tech_breakout')) {
      reasons.push('突破20日高点')
    }
    if (hasStrategy(result.signals, 'tech_volume')) {
      reasons.push('量价配合良好')
    }
    if (hasStrategy(result.signals, 'tech_sector')) {
      reasons.push('板块共振')
    }

    return {
      code: result.code,
      name: result.name,
      price: result.price,
      changePercent: result.changePercent,
      reason: reasons.join('，') || '技术面良好',
      type: hasStrategy(result.signals, 'tech_breakout') ? 'breakout' : 'general',
      strength: result.strength,
    }
  })
}

/**
 * 生成突破股推荐
 */
export function generateBreakoutRecommendations(
  scanResults: ScanResult[],
  limit: number = 5
): StockRecommendation[] {
  if (!scanResults || scanResults.length === 0) {
    return []
  }

  const breakoutStocks = scanResults.filter((r) => hasStrategy(r.signals, 'tech_breakout'))

  if (breakoutStocks.length === 0) {
    return []
  }

  const sorted = [...breakoutStocks].sort((a, b) => b.strength - a.strength)

  return sorted.slice(0, limit).map((result) => ({
    code: result.code,
    name: result.name,
    price: result.price,
    changePercent: result.changePercent,
    reason: `突破20日高点，当前价格${result.price.toFixed(2)}元，涨幅${result.changePercent.toFixed(2)}%`,
    type: 'breakout' as const,
    strength: result.strength,
  }))
}

/**
 * 生成放量股推荐
 */
export function generateVolumeRecommendations(
  scanResults: ScanResult[],
  limit: number = 5
): StockRecommendation[] {
  if (!scanResults || scanResults.length === 0) {
    return []
  }

  const volumeStocks = scanResults.filter((r) => hasStrategy(r.signals, 'tech_volume'))

  if (volumeStocks.length === 0) {
    return []
  }

  const sorted = [...volumeStocks].sort((a, b) => b.strength - a.strength)

  return sorted.slice(0, limit).map((result) => ({
    code: result.code,
    name: result.name,
    price: result.price,
    changePercent: result.changePercent,
    reason: `放量上涨，成交量显著放大，涨幅${result.changePercent.toFixed(2)}%`,
    type: 'volume' as const,
    strength: result.strength,
  }))
}

/**
 * 生成自选股评价
 */
export function generateWatchlistReview(stocks: Stock[], scanResults: ScanResult[]): AIResponse {
  if (!stocks || stocks.length === 0) {
    return {
      type: 'watchlist_review',
      message: '您当前没有关注任何股票。建议您先添加一些自选股，我可以帮您分析它们的表现。',
    }
  }

  const upStocks = stocks.filter((s) => s.changePercent > 0)
  const downStocks = stocks.filter((s) => s.changePercent < 0)
  const flatStocks = stocks.filter((s) => s.changePercent === 0)

  const avgChange = stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length

  // 找出有信号的股票
  const stocksWithSignals = scanResults.filter((r) =>
    stocks.some((s) => s.code === r.code || s.code.includes(r.code))
  )

  const breakoutSignals = stocksWithSignals.filter((r) => hasStrategy(r.signals, 'tech_breakout'))
  const volumeSignals = stocksWithSignals.filter((r) => hasStrategy(r.signals, 'tech_volume'))

  let message = `您的自选股共${stocks.length}只，今日平均涨跌幅${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%。\n\n`

  message += `📈 上涨${upStocks.length}只，📉 下跌${downStocks.length}只`
  if (flatStocks.length > 0) {
    message += `，➖ 平盘${flatStocks.length}只`
  }
  message += '\n\n'

  if (breakoutSignals.length > 0) {
    message += `🔥 **突破信号**：${breakoutSignals.map((s) => s.name).join('、')} 突破20日高点\n\n`
  }

  if (volumeSignals.length > 0) {
    message += `📊 **放量信号**：${volumeSignals.map((s) => s.name).join('、')} 量价配合良好\n\n`
  }

  // 找出表现最好和最差的
  const bestStock = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0]
  const worstStock = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0]

  if (bestStock && bestStock.changePercent > 0) {
    message += `🏆 今日最佳：**${bestStock.name}** (+${bestStock.changePercent.toFixed(2)}%)\n`
  }
  if (worstStock && worstStock.changePercent < 0) {
    message += `⚠️ 今日最弱：**${worstStock.name}** (${worstStock.changePercent.toFixed(2)}%)\n`
  }

  return {
    type: 'watchlist_review',
    message,
  }
}

/**
 * 生成市场概览
 */
export function generateMarketOverview(stocks: Stock[]): AIResponse {
  if (!stocks || stocks.length === 0) {
    return {
      type: 'market_overview',
      message: '暂无市场数据。请稍后再试。',
    }
  }

  const upCount = stocks.filter((s) => s.changePercent > 0).length
  const downCount = stocks.filter((s) => s.changePercent < 0).length
  const flatCount = stocks.filter((s) => s.changePercent === 0).length

  const avgChange = stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length

  const strongUp = stocks.filter((s) => s.changePercent > 5).length
  const strongDown = stocks.filter((s) => s.changePercent < -5).length

  let marketSentiment = '中性'
  if (avgChange > 1) marketSentiment = '偏多'
  if (avgChange > 2) marketSentiment = '强势'
  if (avgChange < -1) marketSentiment = '偏空'
  if (avgChange < -2) marketSentiment = '弱势'

  let message = `📊 **今日市场情绪：${marketSentiment}**\n\n`
  message += `涨跌分布：上涨 ${upCount} 只，下跌 ${downCount} 只，平盘 ${flatCount} 只\n`
  message += `平均涨跌幅：${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%\n\n`

  if (strongUp > 0) {
    message += `🔥 强势股（涨幅>5%）：${strongUp}只\n`
  }
  if (strongDown > 0) {
    message += `⚠️ 弱势股（跌幅>5%）：${strongDown}只\n`
  }

  message += '\n💡 **操作建议**：'
  if (marketSentiment === '强势') {
    message += '市场氛围积极，可关注强势股机会，但仍需控制仓位。'
  } else if (marketSentiment === '偏多') {
    message += '市场温和上涨，适合精选个股，逢低布局。'
  } else if (marketSentiment === '中性') {
    message += '市场震荡整理，建议观望为主，等待明确方向。'
  } else if (marketSentiment === '偏空') {
    message += '市场偏弱，建议控制仓位，关注防御性板块。'
  } else {
    message += '市场弱势，建议减仓避险，等待企稳信号。'
  }

  return {
    type: 'market_overview',
    message,
    marketSummary: {
      upCount,
      downCount,
      avgChange,
      hotSectors: [],
    },
  }
}

/**
 * 生成问候语
 */
export function generateGreeting(): AIResponse {
  const hour = new Date().getHours()
  let greeting = '您好'

  if (hour < 9) {
    greeting = '早上好'
  } else if (hour < 12) {
    greeting = '上午好'
  } else if (hour < 14) {
    greeting = '中午好'
  } else if (hour < 18) {
    greeting = '下午好'
  } else {
    greeting = '晚上好'
  }

  const messages = [
    `${greeting}！我是您的AI股票助手，可以帮您：\n\n` +
      '• 📈 推荐今日潜力股\n' +
      '• 🔍 分析突破和放量股票\n' +
      '• 📊 评估您的自选股\n' +
      '• 📉 解读市场趋势\n\n' +
      '请问有什么可以帮助您的吗？',

    `${greeting}！很高兴为您服务。\n\n` +
      '您可以问我：\n' +
      '• "今天有什么好股票？"\n' +
      '• "推荐一些突破股"\n' +
      '• "我的自选股怎么样？"\n' +
      '• "市场趋势如何？"\n\n' +
      '还有什么想了解的吗？',
  ]

  return {
    type: 'greeting',
    message: messages[Math.floor(Math.random() * messages.length)],
  }
}

/**
 * 生成未知问题回复
 */
export function generateUnknownResponse(): AIResponse {
  return {
    type: 'unknown',
    message:
      '抱歉，我可能没有完全理解您的问题。\n\n' +
      '您可以尝试问我：\n' +
      '• "今天有什么好股票？" - 获取今日推荐\n' +
      '• "推荐一些突破股" - 查看突破股票\n' +
      '• "我的自选股怎么样？" - 分析您的自选股\n' +
      '• "市场趋势如何？" - 了解市场概况\n\n' +
      '请问有什么可以帮您的吗？',
  }
}

/**
 * 生成AI回复
 */
export function generateAIResponse(
  question: string,
  context: {
    scanResults?: ScanResult[]
    watchlistStocks?: Stock[]
    allStocks?: Stock[]
  }
): AIResponse {
  const questionType = analyzeQuestion(question)

  switch (questionType) {
    case 'greeting':
      return generateGreeting()

    case 'today_recommendation':
      const recommendations = generateTodayRecommendations(context.scanResults || [], 5)
      if (recommendations.length === 0) {
        return {
          type: 'recommendation',
          message: '当前市场暂无明确的买入信号。建议您关注市场动态，等待更好的入场时机。',
          recommendations: [],
        }
      }
      return {
        type: 'recommendation',
        message:
          `根据当前市场扫描，为您推荐${recommendations.length}只潜力股：\n\n` +
          recommendations
            .map(
              (r, i) =>
                `${i + 1}. **${r.name}** (${r.code})\n` +
                `   价格：${r.price.toFixed(2)}元  ${r.changePercent >= 0 ? '+' : ''}${r.changePercent.toFixed(2)}%\n` +
                `   理由：${r.reason}`
            )
            .join('\n\n') +
          '\n\n⚠️ 以上推荐仅供参考，不构成投资建议。请结合自身风险承受能力谨慎决策。',
        recommendations,
      }

    case 'breakout_stocks':
      const breakoutRecs = generateBreakoutRecommendations(context.scanResults || [], 5)
      if (breakoutRecs.length === 0) {
        return {
          type: 'recommendation',
          message: '当前暂无突破20日高点的股票。突破股往往意味着强势启动，建议您持续关注市场动态。',
          recommendations: [],
        }
      }
      return {
        type: 'recommendation',
        message:
          `🔥 **今日突破股推荐**\n\n` +
          breakoutRecs
            .map(
              (r, i) =>
                `${i + 1}. **${r.name}** (${r.code})\n` +
                `   价格：${r.price.toFixed(2)}元  +${r.changePercent.toFixed(2)}%\n` +
                `   信号强度：${'★'.repeat(r.strength)}${'☆'.repeat(5 - r.strength)}\n` +
                `   ${r.reason}`
            )
            .join('\n\n') +
          '\n\n💡 **突破股策略**：突破后往往有惯性上涨，但需注意追高风险，建议结合成交量和板块热度综合判断。',
        recommendations: breakoutRecs,
      }

    case 'volume_stocks':
      const volumeRecs = generateVolumeRecommendations(context.scanResults || [], 5)
      if (volumeRecs.length === 0) {
        return {
          type: 'recommendation',
          message: '当前暂无明显的放量上涨股票。放量通常意味着资金关注，建议您持续关注。',
          recommendations: [],
        }
      }
      return {
        type: 'recommendation',
        message:
          `📊 **放量股推荐**\n\n` +
          volumeRecs
            .map(
              (r, i) =>
                `${i + 1}. **${r.name}** (${r.code})\n` +
                `   价格：${r.price.toFixed(2)}元  +${r.changePercent.toFixed(2)}%\n` +
                `   信号强度：${'★'.repeat(r.strength)}${'☆'.repeat(5 - r.strength)}\n` +
                `   ${r.reason}`
            )
            .join('\n\n') +
          '\n\n💡 **量价分析**：放量上涨是健康信号，表明资金积极入场；但需警惕高位放量滞涨的风险。',
        recommendations: volumeRecs,
      }

    case 'watchlist_review':
      return generateWatchlistReview(context.watchlistStocks || [], context.scanResults || [])

    case 'market_trend':
      return generateMarketOverview(context.allStocks || [])

    case 'stock_analysis':
      // 提取股票代码或名称
      const stockMatch = question.match(/(\d{6})/)
      if (stockMatch) {
        return {
          type: 'analysis',
          message:
            `您想分析股票代码 **${stockMatch[1]}**。\n\n` +
            '请前往股票详情页查看完整的AI诊断报告，包括：\n' +
            '• 技术面分析\n' +
            '• 趋势判断\n' +
            '• 操作建议\n' +
            '• 风险提示\n\n' +
            '点击股票卡片上的"AI诊断"按钮即可查看。',
        }
      }
      return {
        type: 'analysis',
        message:
          '请提供具体的股票代码（如000001）或股票名称，我可以帮您分析。\n\n' +
          '或者您可以直接在股票详情页点击"AI诊断"按钮获取详细分析报告。',
      }

    case 'unknown':
    default:
      return generateUnknownResponse()
  }
}

/**
 * 生成欢迎消息
 */
export function generateWelcomeMessage(): string {
  return (
    '👋 欢迎来到AI股票助手！\n\n' +
    '我可以帮您：\n' +
    '• 📈 发现今日潜力股和突破股\n' +
    '• 📊 分析您的自选股表现\n' +
    '• 📉 解读市场趋势和热点\n' +
    '• 💡 提供个性化的投资建议\n\n' +
    '试试问我："今天有什么好股票？" 或 "推荐一些突破股"'
  )
}
