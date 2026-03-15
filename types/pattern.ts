import type { KLineData } from './stock'

/**
 * 形态类型
 */
export type PatternType = 'bullish' | 'bearish' | 'neutral'

/**
 * 形态分类
 */
export type PatternCategory = 'single' | 'double' | 'triple'

/**
 * 单根K线形态
 */
export type SinglePatternName =
  | 'big_bullish'      // 大阳线
  | 'big_bearish'      // 大阴线
  | 'doji'             // 十字星
  | 'hammer'           // 锤子线
  | 'inverted_hammer'  // 倒锤子线
  | 'shooting_star'    // 射击之星

/**
 * 双根K线形态
 */
export type DoublePatternName =
  | 'bullish_engulfing'  // 阳包阴（看涨吞没）
  | 'bearish_engulfing'  // 阴包阳（看跌吞没）
  | 'piercing_line'      // 曙光初现
  | 'dark_cloud_cover'   // 乌云盖顶

/**
 * 三根K线形态
 */
export type TriplePatternName =
  | 'three_white_soldiers'  // 红三兵
  | 'three_black_crows'     // 黑三鸦
  | 'morning_star'          // 早晨之星
  | 'evening_star'          // 黄昏之星

/**
 * 形态名称
 */
export type PatternName = SinglePatternName | DoublePatternName | TriplePatternName

/**
 * 形态信息
 */
export interface PatternInfo {
  name: PatternName
  displayName: string
  type: PatternType
  category: PatternCategory
  description: string
}

/**
 * 识别到的形态
 */
export interface DetectedPattern {
  pattern: PatternInfo
  confidence: number  // 0-100 置信度
  date: string        // 形态出现的日期
  index: number       // K线索引位置
  klines: KLineData[] // 相关K线数据
}

/**
 * 形态分析结果
 */
export interface PatternAnalysisResult {
  patterns: DetectedPattern[]
  summary: {
    bullish: number   // 看涨形态数量
    bearish: number   // 看跌形态数量
    neutral: number   // 中性形态数量
  }
  latestPatterns: DetectedPattern[]  // 最近出现的形态
}

/**
 * 形态配置
 */
export const PATTERN_CONFIG: Record<PatternName, PatternInfo> = {
  // 单根形态
  big_bullish: {
    name: 'big_bullish',
    displayName: '大阳线',
    type: 'bullish',
    category: 'single',
    description: '实体较大，无上下影线或很短，表示强烈的上涨信号',
  },
  big_bearish: {
    name: 'big_bearish',
    displayName: '大阴线',
    type: 'bearish',
    category: 'single',
    description: '实体较大，无上下影线或很短，表示强烈的下跌信号',
  },
  doji: {
    name: 'doji',
    displayName: '十字星',
    type: 'neutral',
    category: 'single',
    description: '开盘价≈收盘价，表示多空力量均衡，可能预示趋势反转',
  },
  hammer: {
    name: 'hammer',
    displayName: '锤子线',
    type: 'bullish',
    category: 'single',
    description: '下影线较长，实体较小，出现在下跌趋势中可能预示反转',
  },
  inverted_hammer: {
    name: 'inverted_hammer',
    displayName: '倒锤子线',
    type: 'bullish',
    category: 'single',
    description: '上影线较长，实体较小，出现在下跌趋势中可能预示反转',
  },
  shooting_star: {
    name: 'shooting_star',
    displayName: '射击之星',
    type: 'bearish',
    category: 'single',
    description: '上影线较长，实体较小，出现在上涨趋势中可能预示反转',
  },
  // 双根形态
  bullish_engulfing: {
    name: 'bullish_engulfing',
    displayName: '阳包阴',
    type: 'bullish',
    category: 'double',
    description: '阳线完全吞没前一根阴线，表示强烈的看涨信号',
  },
  bearish_engulfing: {
    name: 'bearish_engulfing',
    displayName: '阴包阳',
    type: 'bearish',
    category: 'double',
    description: '阴线完全吞没前一根阳线，表示强烈的看跌信号',
  },
  piercing_line: {
    name: 'piercing_line',
    displayName: '曙光初现',
    type: 'bullish',
    category: 'double',
    description: '阳线深入前一根阴线实体，表示看涨信号',
  },
  dark_cloud_cover: {
    name: 'dark_cloud_cover',
    displayName: '乌云盖顶',
    type: 'bearish',
    category: 'double',
    description: '阴线深入前一根阳线实体，表示看跌信号',
  },
  // 三根形态
  three_white_soldiers: {
    name: 'three_white_soldiers',
    displayName: '红三兵',
    type: 'bullish',
    category: 'triple',
    description: '连续三根阳线，每根收盘价逐步抬高，表示强烈看涨',
  },
  three_black_crows: {
    name: 'three_black_crows',
    displayName: '黑三鸦',
    type: 'bearish',
    category: 'triple',
    description: '连续三根阴线，每根收盘价逐步降低，表示强烈看跌',
  },
  morning_star: {
    name: 'morning_star',
    displayName: '早晨之星',
    type: 'bullish',
    category: 'triple',
    description: '由阴线、十字星、阳线组成，表示底部反转信号',
  },
  evening_star: {
    name: 'evening_star',
    displayName: '黄昏之星',
    type: 'bearish',
    category: 'triple',
    description: '由阳线、十字星、阴线组成，表示顶部反转信号',
  },
}