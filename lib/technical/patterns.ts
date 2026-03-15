import type { KLineData } from '@/types/stock'
import type {
  DetectedPattern,
  PatternAnalysisResult,
  PatternName,
  SinglePatternName,
  DoublePatternName,
  TriplePatternName,
} from '@/types/pattern'
import { PATTERN_CONFIG } from '@/types/pattern'

type KLine = {
  open: number
  high: number
  low: number
  close: number
  date?: string
}

function getBody(kline: KLine): number {
  return Math.abs(kline.close - kline.open)
}

function getUpperShadow(kline: KLine): number {
  return kline.high - Math.max(kline.open, kline.close)
}

function getLowerShadow(kline: KLine): number {
  return Math.min(kline.open, kline.close) - kline.low
}

function getTotalRange(kline: KLine): number {
  return kline.high - kline.low
}

function isBullish(kline: KLine): boolean {
  return kline.close > kline.open
}

function isBearish(kline: KLine): boolean {
  return kline.close < kline.open
}

function getAverageBody(klines: KLine[], count: number = 10): number {
  const recent = klines.slice(-count)
  const bodies = recent.map((k) => getBody(k))
  return bodies.reduce((sum, b) => sum + b, 0) / bodies.length
}

function detectBigBullish(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  if (!isBullish(kline)) return { detected: false, confidence: 0 }

  const body = getBody(kline)
  const upperShadow = getUpperShadow(kline)
  const lowerShadow = getLowerShadow(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const shadowRatio = (upperShadow + lowerShadow) / totalRange
  const isBigBody = body > avgBody * 1.5

  if (isBigBody && bodyRatio > 0.7 && shadowRatio < 0.3) {
    const confidence = Math.min(100, Math.round(bodyRatio * 100 + (isBigBody ? 20 : 0)))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectBigBearish(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  if (!isBearish(kline)) return { detected: false, confidence: 0 }

  const body = getBody(kline)
  const upperShadow = getUpperShadow(kline)
  const lowerShadow = getLowerShadow(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const shadowRatio = (upperShadow + lowerShadow) / totalRange
  const isBigBody = body > avgBody * 1.5

  if (isBigBody && bodyRatio > 0.7 && shadowRatio < 0.3) {
    const confidence = Math.min(100, Math.round(bodyRatio * 100 + (isBigBody ? 20 : 0)))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectDoji(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  const body = getBody(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const isSmallBody = body < avgBody * 0.1

  if (isSmallBody || bodyRatio < 0.1) {
    const confidence = Math.min(100, Math.round((1 - bodyRatio) * 100))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectHammer(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  const body = getBody(kline)
  const upperShadow = getUpperShadow(kline)
  const lowerShadow = getLowerShadow(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const lowerShadowRatio = lowerShadow / totalRange
  const upperShadowRatio = upperShadow / totalRange
  const isSmallBody = body < avgBody * 0.5

  if (isSmallBody && bodyRatio < 0.3 && lowerShadowRatio > 0.6 && upperShadowRatio < 0.1) {
    const confidence = Math.min(100, Math.round(lowerShadowRatio * 80 + 20))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectInvertedHammer(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  const body = getBody(kline)
  const upperShadow = getUpperShadow(kline)
  const lowerShadow = getLowerShadow(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const upperShadowRatio = upperShadow / totalRange
  const lowerShadowRatio = lowerShadow / totalRange
  const isSmallBody = body < avgBody * 0.5

  if (isSmallBody && bodyRatio < 0.3 && upperShadowRatio > 0.6 && lowerShadowRatio < 0.1) {
    const confidence = Math.min(100, Math.round(upperShadowRatio * 80 + 20))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectShootingStar(kline: KLine, avgBody: number): { detected: boolean; confidence: number } {
  const body = getBody(kline)
  const upperShadow = getUpperShadow(kline)
  const lowerShadow = getLowerShadow(kline)
  const totalRange = getTotalRange(kline)

  if (totalRange === 0) return { detected: false, confidence: 0 }

  const bodyRatio = body / totalRange
  const upperShadowRatio = upperShadow / totalRange
  const lowerShadowRatio = lowerShadow / totalRange
  const isSmallBody = body < avgBody * 0.5

  if (isSmallBody && bodyRatio < 0.3 && upperShadowRatio > 0.6 && lowerShadowRatio < 0.1) {
    const confidence = Math.min(100, Math.round(upperShadowRatio * 80 + 20))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectBullishEngulfing(
  prev: KLine,
  curr: KLine
): { detected: boolean; confidence: number } {
  if (!isBearish(prev) || !isBullish(curr)) return { detected: false, confidence: 0 }

  const prevBody = getBody(prev)
  const currBody = getBody(curr)

  if (currBody > prevBody && curr.open < prev.close && curr.close > prev.open) {
    const engulfRatio = currBody / prevBody
    const confidence = Math.min(100, Math.round(engulfRatio * 50 + 50))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectBearishEngulfing(
  prev: KLine,
  curr: KLine
): { detected: boolean; confidence: number } {
  if (!isBullish(prev) || !isBearish(curr)) return { detected: false, confidence: 0 }

  const prevBody = getBody(prev)
  const currBody = getBody(curr)

  if (currBody > prevBody && curr.open > prev.close && curr.close < prev.open) {
    const engulfRatio = currBody / prevBody
    const confidence = Math.min(100, Math.round(engulfRatio * 50 + 50))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectPiercingLine(
  prev: KLine,
  curr: KLine
): { detected: boolean; confidence: number } {
  if (!isBearish(prev) || !isBullish(curr)) return { detected: false, confidence: 0 }

  const prevBody = getBody(prev)
  const prevMidpoint = prev.open - prevBody / 2

  if (curr.open < prev.close && curr.close > prevMidpoint && curr.close < prev.open) {
    const penetration = (curr.close - prev.close) / prevBody
    const confidence = Math.min(100, Math.round(penetration * 100))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectDarkCloudCover(
  prev: KLine,
  curr: KLine
): { detected: boolean; confidence: number } {
  if (!isBullish(prev) || !isBearish(curr)) return { detected: false, confidence: 0 }

  const prevBody = getBody(prev)
  const prevMidpoint = prev.open + prevBody / 2

  if (curr.open > prev.close && curr.close < prevMidpoint && curr.close > prev.open) {
    const penetration = (prev.close - curr.close) / prevBody
    const confidence = Math.min(100, Math.round(penetration * 100))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectThreeWhiteSoldiers(
  k1: KLine,
  k2: KLine,
  k3: KLine
): { detected: boolean; confidence: number } {
  if (!isBullish(k1) || !isBullish(k2) || !isBullish(k3)) {
    return { detected: false, confidence: 0 }
  }

  if (k2.close > k1.close && k3.close > k2.close && k2.open > k1.open && k3.open > k2.open) {
    const avgBody = (getBody(k1) + getBody(k2) + getBody(k3)) / 3
    const consistency = Math.min(getBody(k1), getBody(k2), getBody(k3)) / avgBody
    const confidence = Math.min(100, Math.round(consistency * 100))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectThreeBlackCrows(
  k1: KLine,
  k2: KLine,
  k3: KLine
): { detected: boolean; confidence: number } {
  if (!isBearish(k1) || !isBearish(k2) || !isBearish(k3)) {
    return { detected: false, confidence: 0 }
  }

  if (k2.close < k1.close && k3.close < k2.close && k2.open < k1.open && k3.open < k2.open) {
    const avgBody = (getBody(k1) + getBody(k2) + getBody(k3)) / 3
    const consistency = Math.min(getBody(k1), getBody(k2), getBody(k3)) / avgBody
    const confidence = Math.min(100, Math.round(consistency * 100))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectMorningStar(
  k1: KLine,
  k2: KLine,
  k3: KLine,
  avgBody: number
): { detected: boolean; confidence: number } {
  if (!isBearish(k1) || !isBullish(k3)) return { detected: false, confidence: 0 }

  const k2Body = getBody(k2)
  const isDoji = k2Body < avgBody * 0.1

  if (isDoji && k2.low < k1.close && k3.close > (k1.open + k1.close) / 2) {
    const gap1 = Math.abs(k2.open - k1.close)
    const gap2 = Math.abs(k3.open - k2.close)
    const confidence = Math.min(100, Math.round(60 + (isDoji ? 20 : 0) + (gap1 > 0 && gap2 > 0 ? 20 : 0)))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectEveningStar(
  k1: KLine,
  k2: KLine,
  k3: KLine,
  avgBody: number
): { detected: boolean; confidence: number } {
  if (!isBullish(k1) || !isBearish(k3)) return { detected: false, confidence: 0 }

  const k2Body = getBody(k2)
  const isDoji = k2Body < avgBody * 0.1

  if (isDoji && k2.high > k1.close && k3.close < (k1.open + k1.close) / 2) {
    const gap1 = Math.abs(k2.open - k1.close)
    const gap2 = Math.abs(k3.open - k2.close)
    const confidence = Math.min(100, Math.round(60 + (isDoji ? 20 : 0) + (gap1 > 0 && gap2 > 0 ? 20 : 0)))
    return { detected: true, confidence }
  }

  return { detected: false, confidence: 0 }
}

function detectSinglePattern(
  kline: KLine,
  avgBody: number
): { name: SinglePatternName; confidence: number } | null {
  const patterns: { name: SinglePatternName; result: { detected: boolean; confidence: number } }[] = [
    { name: 'big_bullish', result: detectBigBullish(kline, avgBody) },
    { name: 'big_bearish', result: detectBigBearish(kline, avgBody) },
    { name: 'doji', result: detectDoji(kline, avgBody) },
    { name: 'hammer', result: detectHammer(kline, avgBody) },
    { name: 'inverted_hammer', result: detectInvertedHammer(kline, avgBody) },
    { name: 'shooting_star', result: detectShootingStar(kline, avgBody) },
  ]

  let bestMatch: { name: SinglePatternName; confidence: number } | null = null

  for (const { name, result } of patterns) {
    if (result.detected && (!bestMatch || result.confidence > bestMatch.confidence)) {
      bestMatch = { name, confidence: result.confidence }
    }
  }

  return bestMatch
}

function detectDoublePattern(
  prev: KLine,
  curr: KLine
): { name: DoublePatternName; confidence: number } | null {
  const patterns: { name: DoublePatternName; result: { detected: boolean; confidence: number } }[] = [
    { name: 'bullish_engulfing', result: detectBullishEngulfing(prev, curr) },
    { name: 'bearish_engulfing', result: detectBearishEngulfing(prev, curr) },
    { name: 'piercing_line', result: detectPiercingLine(prev, curr) },
    { name: 'dark_cloud_cover', result: detectDarkCloudCover(prev, curr) },
  ]

  let bestMatch: { name: DoublePatternName; confidence: number } | null = null

  for (const { name, result } of patterns) {
    if (result.detected && (!bestMatch || result.confidence > bestMatch.confidence)) {
      bestMatch = { name, confidence: result.confidence }
    }
  }

  return bestMatch
}

function detectTriplePattern(
  k1: KLine,
  k2: KLine,
  k3: KLine,
  avgBody: number
): { name: TriplePatternName; confidence: number } | null {
  const patterns: { name: TriplePatternName; result: { detected: boolean; confidence: number } }[] = [
    { name: 'three_white_soldiers', result: detectThreeWhiteSoldiers(k1, k2, k3) },
    { name: 'three_black_crows', result: detectThreeBlackCrows(k1, k2, k3) },
    { name: 'morning_star', result: detectMorningStar(k1, k2, k3, avgBody) },
    { name: 'evening_star', result: detectEveningStar(k1, k2, k3, avgBody) },
  ]

  let bestMatch: { name: TriplePatternName; confidence: number } | null = null

  for (const { name, result } of patterns) {
    if (result.detected && (!bestMatch || result.confidence > bestMatch.confidence)) {
      bestMatch = { name, confidence: result.confidence }
    }
  }

  return bestMatch
}

export function analyzePatterns(klines: KLineData[]): PatternAnalysisResult {
  const patterns: DetectedPattern[] = []
  const avgBody = getAverageBody(klines, 20)

  for (let i = 0; i < klines.length; i++) {
    const current = klines[i]

    const singlePattern = detectSinglePattern(current, avgBody)
    if (singlePattern) {
      patterns.push({
        pattern: PATTERN_CONFIG[singlePattern.name],
        confidence: singlePattern.confidence,
        date: current.date,
        index: i,
        klines: [current],
      })
    }

    if (i >= 1) {
      const prev = klines[i - 1]
      const doublePattern = detectDoublePattern(prev, current)
      if (doublePattern) {
        patterns.push({
          pattern: PATTERN_CONFIG[doublePattern.name],
          confidence: doublePattern.confidence,
          date: current.date,
          index: i,
          klines: [prev, current],
        })
      }
    }

    if (i >= 2) {
      const k1 = klines[i - 2]
      const k2 = klines[i - 1]
      const triplePattern = detectTriplePattern(k1, k2, current, avgBody)
      if (triplePattern) {
        patterns.push({
          pattern: PATTERN_CONFIG[triplePattern.name],
          confidence: triplePattern.confidence,
          date: current.date,
          index: i,
          klines: [k1, k2, current],
        })
      }
    }
  }

  const summary = {
    bullish: patterns.filter((p) => p.pattern.type === 'bullish').length,
    bearish: patterns.filter((p) => p.pattern.type === 'bearish').length,
    neutral: patterns.filter((p) => p.pattern.type === 'neutral').length,
  }

  const latestPatterns = patterns.slice(-10).reverse()

  return {
    patterns,
    summary,
    latestPatterns,
  }
}

export function getPatternByName(name: PatternName) {
  return PATTERN_CONFIG[name]
}

export function getPatternsByType(
  patterns: DetectedPattern[],
  type: 'bullish' | 'bearish' | 'neutral'
): DetectedPattern[] {
  return patterns.filter((p) => p.pattern.type === type)
}

export function getRecentPatterns(
  patterns: DetectedPattern[],
  count: number = 5
): DetectedPattern[] {
  return patterns.slice(-count).reverse()
}