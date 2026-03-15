/**
 * 技术指标计算库 - 纯函数实现
 * 所有函数不依赖外部状态，可独立测试
 */

/**
 * K线数据接口
 */
export interface KLine {
  open: number
  high: number
  low: number
  close: number
  volume: number
  date?: string
}

/**
 * MACD 结果
 */
export interface MACDResult {
  dif: number   // 快线
  dea: number   // 慢线
  macd: number  // 柱状图
}

/**
 * KDJ 结果
 */
export interface KDJResult {
  k: number
  d: number
  j: number
}

/**
 * 布林带结果
 */
export interface BOLLResult {
  upper: number   // 上轨
  middle: number  // 中轨
  lower: number   // 下轨
}

/**
 * 计算简单移动平均线 (SMA)
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) {
    return data.length > 0 ? data[data.length - 1] : 0
  }
  const slice = data.slice(-period)
  return slice.reduce((sum, val) => sum + val, 0) / period
}

/**
 * 计算指数移动平均线 (EMA)
 * EMA = 当日收盘价 * 平滑系数 + 昨日EMA * (1 - 平滑系数)
 * 平滑系数 = 2 / (周期 + 1)
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0
  if (data.length < period) {
    return calculateSMA(data, data.length)
  }

  const multiplier = 2 / (period + 1)
  
  // 初始EMA使用SMA
  let ema = calculateSMA(data.slice(0, period), period)
  
  // 从period开始计算EMA
  for (let i = period; i < data.length; i++) {
    ema = data[i] * multiplier + ema * (1 - multiplier)
  }
  
  return ema
}

/**
 * 计算完整EMA序列
 */
export function calculateEMASequence(data: number[], period: number): number[] {
  if (data.length === 0) return []
  if (data.length < period) {
    return data.map((_, i) => calculateSMA(data.slice(0, i + 1), i + 1))
  }

  const multiplier = 2 / (period + 1)
  const result: number[] = []
  
  // 前period-1个数据点无法计算EMA
  for (let i = 0; i < period - 1; i++) {
    result.push(NaN)
  }
  
  // 第一个EMA使用SMA
  let ema = calculateSMA(data.slice(0, period), period)
  result.push(ema)
  
  // 继续计算后续EMA
  for (let i = period; i < data.length; i++) {
    ema = data[i] * multiplier + ema * (1 - multiplier)
    result.push(ema)
  }
  
  return result
}

/**
 * 计算RSI (相对强弱指数)
 * RSI = 100 - 100 / (1 + RS)
 * RS = 平均上涨幅度 / 平均下跌幅度
 */
export function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) {
    return 50 // 数据不足时返回中性值
  }

  // 计算价格变化
  const changes: number[] = []
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1])
  }

  // 分离上涨和下跌
  const gains = changes.map(c => c > 0 ? c : 0)
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0)

  // 计算初始平均涨跌
  let avgGain = gains.slice(0, period).reduce((sum, g) => sum + g, 0) / period
  let avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l, 0) / period

  // 使用平滑方法计算后续平均涨跌
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
  }

  // 计算RS和RSI
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/**
 * 计算MACD (指数平滑异同移动平均线)
 * DIF = EMA(12) - EMA(26)
 * DEA = EMA(DIF, 9)
 * MACD = (DIF - DEA) * 2
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (data.length < slowPeriod + signalPeriod) {
    return { dif: 0, dea: 0, macd: 0 }
  }

  // 计算快慢EMA序列
  const fastEMA = calculateEMASequence(data, fastPeriod)
  const slowEMA = calculateEMASequence(data, slowPeriod)

  // 计算DIF序列
  const difSequence: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      difSequence.push(NaN)
    } else {
      difSequence.push(fastEMA[i] - slowEMA[i])
    }
  }

  // 过滤NaN值用于计算DEA
  const validDif = difSequence.filter(d => !isNaN(d))
  
  // 计算DEA (DIF的EMA)
  const dea = calculateEMA(validDif, signalPeriod)
  
  // 获取最新的DIF值
  const dif = validDif.length > 0 ? validDif[validDif.length - 1] : 0
  
  // 计算MACD柱
  const macd = (dif - dea) * 2

  return { dif, dea, macd }
}

/**
 * 计算KDJ (随机指标)
 * RSV = (收盘价 - N日最低价) / (N日最高价 - N日最低价) * 100
 * K = 2/3 * 前一日K + 1/3 * RSV
 * D = 2/3 * 前一日D + 1/3 * K
 * J = 3 * K - 2 * D
 */
export function calculateKDJ(
  klines: KLine[],
  n: number = 9,
  m1: number = 3,
  m2: number = 3
): KDJResult {
  if (klines.length < n) {
    return { k: 50, d: 50, j: 50 }
  }

  // 计算RSV序列
  const rsvSequence: number[] = []
  for (let i = n - 1; i < klines.length; i++) {
    const slice = klines.slice(i - n + 1, i + 1)
    const highN = Math.max(...slice.map(k => k.high))
    const lowN = Math.min(...slice.map(k => k.low))
    const close = klines[i].close
    
    if (highN === lowN) {
      rsvSequence.push(50) // 避免除零
    } else {
      rsvSequence.push(((close - lowN) / (highN - lowN)) * 100)
    }
  }

  // 计算K和D
  let k = 50 // 初始K值
  let d = 50 // 初始D值

  for (const rsv of rsvSequence) {
    k = (2 / m1) * k + (1 / m1) * rsv
    d = (2 / m2) * d + (1 / m2) * k
  }

  // 计算J
  const j = 3 * k - 2 * d

  return { k, d, j }
}

/**
 * 计算布林带 (BOLL)
 * 中轨 = N日移动平均线
 * 上轨 = 中轨 + K * 标准差
 * 下轨 = 中轨 - K * 标准差
 */
export function calculateBOLL(
  data: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BOLLResult {
  if (data.length < period) {
    const middle = data.length > 0 ? data[data.length - 1] : 0
    return { upper: middle, middle, lower: middle }
  }

  // 计算中轨 (SMA)
  const middle = calculateSMA(data, period)

  // 计算标准差
  const slice = data.slice(-period)
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period
  const stdDev = Math.sqrt(variance)

  // 计算上下轨
  const upper = middle + stdDevMultiplier * stdDev
  const lower = middle - stdDevMultiplier * stdDev

  return { upper, middle, lower }
}

/**
 * 计算ATR (真实波动幅度)
 * TR = max(high - low, |high - prevClose|, |low - prevClose|)
 * ATR = N日TR的移动平均
 */
export function calculateATR(klines: KLine[], period: number = 14): number {
  if (klines.length < period + 1) {
    return 0
  }

  // 计算真实波动幅度序列
  const trSequence: number[] = []
  for (let i = 1; i < klines.length; i++) {
    const high = klines[i].high
    const low = klines[i].low
    const prevClose = klines[i - 1].close

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trSequence.push(tr)
  }

  // 计算ATR (TR的SMA)
  return calculateSMA(trSequence, period)
}

/**
 * 计算所有技术指标
 */
export function calculateAllIndicators(klines: KLine[]): {
  rsi: number
  macd: MACDResult
  kdj: KDJResult
  boll: BOLLResult
  atr: number
  ema12: number
  ema26: number
} {
  const closes = klines.map(k => k.close)

  return {
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes, 12, 26, 9),
    kdj: calculateKDJ(klines, 9, 3, 3),
    boll: calculateBOLL(closes, 20, 2),
    atr: calculateATR(klines, 14),
    ema12: calculateEMA(closes, 12),
    ema26: calculateEMA(closes, 26)
  }
}