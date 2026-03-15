import type {
  StockDiagnosis,
  DiagnosisRequest,
  TrendDirection,
  ActionType,
  Recommendation,
  Confidence,
} from '@/types/ai-diagnosis'

export function generateDiagnosis(request: DiagnosisRequest): StockDiagnosis {
  const { code, name, price, change, changePercent, high, low, volume, technical } = request
  const { high20d, low20d, ma5, ma10, ma20, avgVolume5d, avgVolume20d } = technical

  const trend = analyzeTrend(price, ma5, ma10, ma20)
  const trendStrength = calculateTrendStrength(price, ma5, ma10, ma20, trend)
  const volumeStatus = analyzeVolume(volume, avgVolume5d)
  const maStatus = analyzeMA(price, ma5, ma10, ma20)
  
  const supportLevel = calculateSupportLevel(low20d, ma20, low)
  const resistanceLevel = calculateResistanceLevel(high20d, high)
  
  const overallScore = calculateOverallScore(trend, trendStrength, volumeStatus, price, ma20)
  const recommendation = determineRecommendation(overallScore, trend)
  const confidence = determineConfidence(trendStrength, volumeStatus)
  
  const actionAdvice = generateActionAdvice(
    price,
    trend,
    trendStrength,
    supportLevel,
    resistanceLevel,
    volumeStatus,
    recommendation
  )
  
  const riskWarnings = generateRiskWarnings(
    price,
    changePercent,
    trend,
    volumeStatus,
    supportLevel,
    resistanceLevel
  )
  
  const detailedAnalysis = generateDetailedAnalysis(
    name,
    price,
    changePercent,
    trend,
    trendStrength,
    maStatus,
    volumeStatus,
    supportLevel,
    resistanceLevel,
    overallScore
  )

  return {
    stockCode: code,
    stockName: name,
    diagnosisTime: new Date().toISOString(),
    overallScore,
    recommendation,
    confidence,
    technicalAnalysis: {
      trend,
      trendStrength,
      supportLevel,
      resistanceLevel,
      maStatus,
      volumeStatus,
    },
    actionAdvice,
    riskWarning: riskWarnings,
    detailedAnalysis,
  }
}

function analyzeTrend(price: number, ma5: number, ma10: number, ma20: number): TrendDirection {
  const isBullishAlignment = ma5 > ma10 && ma10 > ma20
  const isBearishAlignment = ma5 < ma10 && ma10 < ma20
  const priceAboveMA20 = price > ma20
  const priceBelowMA20 = price < ma20

  if (isBullishAlignment && priceAboveMA20) {
    return 'up'
  }
  
  if (isBearishAlignment && priceBelowMA20) {
    return 'down'
  }
  
  return 'sideways'
}

function calculateTrendStrength(
  price: number,
  ma5: number,
  ma10: number,
  ma20: number,
  trend: TrendDirection
): number {
  if (trend === 'sideways') {
    return 3
  }

  const ma5Gap = Math.abs((price - ma5) / price) * 100
  const ma10Gap = Math.abs((price - ma10) / price) * 100
  const ma20Gap = Math.abs((price - ma20) / price) * 100
  
  const alignmentScore = trend === 'up' 
    ? (ma5 > ma10 ? 2 : 0) + (ma10 > ma20 ? 2 : 0) + (price > ma5 ? 2 : 0)
    : (ma5 < ma10 ? 2 : 0) + (ma10 < ma20 ? 2 : 0) + (price < ma5 ? 2 : 0)
  
  const gapScore = Math.min(ma5Gap + ma10Gap + ma20Gap, 4)
  
  return Math.min(Math.round((alignmentScore + gapScore) * 0.8), 10)
}

function analyzeVolume(volume: number, avgVolume5d: number): string {
  if (volume > avgVolume5d * 2) {
    return '放量'
  }
  if (volume > avgVolume5d * 1.3) {
    return '温和放量'
  }
  if (volume < avgVolume5d * 0.5) {
    return '缩量'
  }
  return '量能正常'
}

function analyzeMA(price: number, ma5: number, ma10: number, ma20: number): string {
  const parts: string[] = []
  
  if (price > ma5) {
    parts.push('股价站上5日线')
  } else {
    parts.push('股价跌破5日线')
  }
  
  if (ma5 > ma10) {
    parts.push('5日线金叉10日线')
  } else if (ma5 < ma10) {
    parts.push('5日线死叉10日线')
  }
  
  if (price > ma20) {
    parts.push('运行于20日线上方')
  } else {
    parts.push('运行于20日线下方')
  }
  
  return parts.join('，')
}

function calculateSupportLevel(low20d: number, ma20: number, low: number): number {
  const candidates = [low20d, ma20, low].filter(v => v > 0)
  return Math.max(...candidates) > 0 ? Math.min(...candidates) : low20d
}

function calculateResistanceLevel(high20d: number, high: number): number {
  return Math.max(high20d, high)
}

function calculateOverallScore(
  trend: TrendDirection,
  trendStrength: number,
  volumeStatus: string,
  price: number,
  ma20: number
): number {
  let score = 50

  if (trend === 'up') {
    score += 15 + trendStrength * 2
  } else if (trend === 'down') {
    score -= 15 + trendStrength * 2
  }

  if (volumeStatus === '放量') {
    score += trend === 'up' ? 10 : -5
  } else if (volumeStatus === '缩量') {
    score += trend === 'down' ? 5 : -5
  }

  const priceVsMA20 = ((price - ma20) / ma20) * 100
  if (Math.abs(priceVsMA20) > 10) {
    score -= Math.abs(priceVsMA20) * 0.5
  }

  return Math.max(1, Math.min(100, Math.round(score)))
}

function determineRecommendation(score: number, trend: TrendDirection): Recommendation {
  if (score >= 70 && trend === 'up') {
    return 'buy'
  }
  if (score <= 30 || trend === 'down') {
    return 'sell'
  }
  return 'hold'
}

function determineConfidence(trendStrength: number, volumeStatus: string): Confidence {
  if (trendStrength >= 7 && (volumeStatus === '放量' || volumeStatus === '缩量')) {
    return 'high'
  }
  if (trendStrength >= 4) {
    return 'medium'
  }
  return 'low'
}

function generateActionAdvice(
  price: number,
  trend: TrendDirection,
  trendStrength: number,
  supportLevel: number,
  resistanceLevel: number,
  volumeStatus: string,
  recommendation: Recommendation
): StockDiagnosis['actionAdvice'] {
  const stopLossRatio = 0.05
  const takeProfitRatio = 0.10

  if (recommendation === 'buy' && trend === 'up') {
    return {
      action: 'buy',
      reason: `趋势向上，量价配合良好，建议在${supportLevel.toFixed(2)}附近逢低买入`,
      suggestedPrice: supportLevel,
      stopLoss: Math.round(supportLevel * (1 - stopLossRatio) * 100) / 100,
      takeProfit: Math.round(resistanceLevel * 100) / 100,
    }
  }

  if (recommendation === 'sell' && trend === 'down') {
    return {
      action: 'sell',
      reason: `趋势向下，建议减仓或止损，关注${supportLevel.toFixed(2)}支撑位`,
      suggestedPrice: price,
      stopLoss: Math.round(price * (1 - stopLossRatio) * 100) / 100,
    }
  }

  if (trend === 'sideways') {
    return {
      action: 'wait',
      reason: `当前处于横盘整理，建议观望，等待趋势明朗。支撑位${supportLevel.toFixed(2)}，阻力位${resistanceLevel.toFixed(2)}`,
    }
  }

  return {
    action: 'hold',
    reason: `当前趋势不明朗，建议持有观望，关注${supportLevel.toFixed(2)}支撑和${resistanceLevel.toFixed(2)}阻力`,
  }
}

function generateRiskWarnings(
  price: number,
  changePercent: number,
  trend: TrendDirection,
  volumeStatus: string,
  supportLevel: number,
  resistanceLevel: number
): string[] {
  const warnings: string[] = []

  if (Math.abs(changePercent) > 5) {
    warnings.push(`今日涨跌幅较大(${changePercent.toFixed(2)}%)，注意波动风险`)
  }

  if (trend === 'down' && volumeStatus === '放量') {
    warnings.push('下跌放量，可能存在进一步下跌风险')
  }

  if (trend === 'up' && volumeStatus === '缩量') {
    warnings.push('上涨缩量，上涨动能可能不足')
  }

  const distanceToSupport = ((price - supportLevel) / price) * 100
  if (distanceToSupport < 3) {
    warnings.push(`股价接近支撑位${supportLevel.toFixed(2)}，注意破位风险`)
  }

  const distanceToResistance = ((resistanceLevel - price) / price) * 100
  if (distanceToResistance < 3) {
    warnings.push(`股价接近阻力位${resistanceLevel.toFixed(2)}，注意回调风险`)
  }

  warnings.push('本诊断仅供参考，不构成投资建议，投资有风险，入市需谨慎')

  return warnings
}

function generateDetailedAnalysis(
  name: string,
  price: number,
  changePercent: number,
  trend: TrendDirection,
  trendStrength: number,
  maStatus: string,
  volumeStatus: string,
  supportLevel: number,
  resistanceLevel: number,
  score: number
): string {
  const trendText = {
    up: '上升趋势',
    down: '下降趋势',
    sideways: '横盘整理',
  }[trend]

  const changeText = changePercent >= 0 ? '上涨' : '下跌'

  return `${name}当前价格${price.toFixed(2)}元，今日${changeText}${Math.abs(changePercent).toFixed(2)}%。` +
    `技术面呈现${trendText}，趋势强度${trendStrength}/10。` +
    `${maStatus}。` +
    `成交量方面，${volumeStatus}。` +
    `关键位置：支撑位${supportLevel.toFixed(2)}元，阻力位${resistanceLevel.toFixed(2)}元。` +
    `综合评分${score}分，` +
    `${score >= 70 ? '技术面偏多，可关注买入机会' : score <= 30 ? '技术面偏空，注意风险控制' : '技术面中性，建议观望为主'}。`
}