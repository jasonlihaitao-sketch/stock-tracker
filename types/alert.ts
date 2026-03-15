// 预警类型
export type AlertType = 'price_up' | 'price_down' | 'change_up' | 'change_down'

// 预警条件
export interface AlertCondition {
  type: AlertType
  value: number
}

// 预警记录
export interface Alert {
  id: string
  stockCode: string
  stockName: string
  type: AlertType
  value: number // 触发值
  enabled: boolean
  createdAt: string
  triggeredAt?: string
  notifiedAt?: string
}

// 预警历史
export interface AlertHistory {
  id: string
  alertId: string
  stockCode: string
  stockName: string
  condition: string
  triggerValue: number
  actualValue: number
  triggeredAt: string
  read: boolean
}

// 预警通知方式
export type NotificationMethod = 'browser' | 'email'

// 预警设置
export interface AlertSettings {
  notificationMethods: NotificationMethod[]
  email?: string
}

/**
 * 智能提醒类型
 */
export type SmartAlertType = 'price' | 'change' | 'signal' | 'stop_loss'

/**
 * 智能提醒状态
 */
export type SmartAlertStatus = 'active' | 'triggered' | 'dismissed'

/**
 * 智能提醒模型 - 扩展版
 */
export interface SmartAlert {
  id: string
  stockCode: string
  stockName: string
  type: SmartAlertType
  condition: {
    operator: 'above' | 'below'
    value: number
  }
  status: SmartAlertStatus
  triggeredAt?: string
  triggeredPrice?: number
  createdAt: string
}

/**
 * 提醒历史记录
 */
export interface AlertLog {
  id: string
  alertId: string
  stockCode: string
  stockName: string
  type: SmartAlertType
  message: string
  triggeredAt: string
  read: boolean
}