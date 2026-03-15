import type { AlertSettings } from '@/types/alert'

// API 相关常量
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// 新浪财经 API
export const SINA_API = {
  REALTIME: 'https://hq.sinajs.cn/list=',
  KLINE: 'https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData',
  MINUTE: 'https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getMarketMinKline',
  SEARCH: 'https://suggest3.sinajs.cn/suggest/type=11,12,13,14,15&name=params._cb&key=',
}

// 数据缓存时间（毫秒）
export const CACHE_TIME = {
  REALTIME: 3 * 1000, // 实时行情 3 秒
  KLINE: 60 * 60 * 1000, // K线数据 1 小时
  BASIC: 24 * 60 * 60 * 1000, // 基本面数据 24 小时
}

// 本地存储键名
export const STORAGE_KEYS = {
  WATCHLIST: 'stock_tracker_watchlist',
  WATCHLIST_GROUPS: 'stock_tracker_watchlist_groups',
  PORTFOLIO: 'stock_tracker_portfolio',
  ALERTS: 'stock_tracker_alerts',
  ALERT_HISTORY: 'stock_tracker_alert_history',
  SETTINGS: 'stock_tracker_settings',
}

// 默认设置
export const DEFAULT_SETTINGS: AlertSettings = {
  notificationMethods: ['browser'],
}

// K线周期
export const KLINE_PERIODS = [
  { value: 'daily', label: '日K' },
  { value: 'weekly', label: '周K' },
  { value: 'monthly', label: '月K' },
] as const

// 技术指标
export const TECH_INDICATORS = [
  { value: 'MA', label: '均线' },
  { value: 'MACD', label: 'MACD' },
  { value: 'KDJ', label: 'KDJ' },
  { value: 'BOLL', label: '布林带' },
] as const

// 预警类型
export const ALERT_TYPES = [
  { value: 'price_up', label: '价格突破' },
  { value: 'price_down', label: '价格跌破' },
  { value: 'change_up', label: '涨幅超过' },
  { value: 'change_down', label: '跌幅超过' },
] as const

// 市场标识
export const MARKET_PREFIX: Record<string, string> = {
  SH: 'sh', // 上海
  SZ: 'sz', // 深圳
}