import { useState, useCallback, useMemo } from 'react'
import type { Position } from '@/types/position'
import type { OperationPlan, OperationType } from '@/types/operationPlan'
import type { StockSelectItem } from '@/components/operation-plan/StockSearchSelect'

interface UseOperationPlanFormOptions {
  mode: 'create' | 'edit' | 'copy'
  initialData?: OperationPlan
  positions: Position[]
  stocks: StockSelectItem[]
}

export interface FormState {
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice: number
  stopLoss?: number
  takeProfit?: number
  positionRatio?: number
  quantity?: number
  note?: string
}

interface UseOperationPlanFormReturn {
  formState: FormState
  errors: Record<string, string>
  suggestions: {
    stopLoss?: number
    positionRatio: number
  }
  selectedStock: StockSelectItem | undefined
  hasPosition: boolean
  positionInfo: Position | undefined
  isSubmitting: boolean
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void
  validate: () => boolean
  reset: () => void
  submit: () => { success: boolean; data?: CreateOperationPlanParams; error?: string }
}

export interface CreateOperationPlanParams {
  stockCode: string
  stockName: string
  type: OperationType
  targetPrice?: number
  quantity?: number
  positionRatio?: number
  stopLoss?: number
  takeProfit?: number
  note?: string
  signalId?: string
}

const DEFAULT_POSITION_RATIO = 20

function getInitialState(initialData?: OperationPlan): FormState {
  if (!initialData) {
    return {
      stockCode: '',
      stockName: '',
      type: 'buy',
      targetPrice: 0,
    }
  }
  return {
    stockCode: initialData.stockCode,
    stockName: initialData.stockName,
    type: initialData.type,
    targetPrice: initialData.targetPrice ?? 0,
    stopLoss: initialData.stopLoss,
    takeProfit: initialData.takeProfit,
    positionRatio: initialData.positionRatio,
    quantity: initialData.quantity,
    note: initialData.note,
  }
}

export function useOperationPlanForm({
  mode,
  initialData,
  positions,
  stocks,
}: UseOperationPlanFormOptions): UseOperationPlanFormReturn {
  const [formState, setFormState] = useState<FormState>(() => getInitialState(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedStock = useMemo(
    () => stocks.find((s) => s.code === formState.stockCode),
    [stocks, formState.stockCode]
  )

  const positionInfo = useMemo(
    () => positions.find((p) => p.stockCode === formState.stockCode),
    [positions, formState.stockCode]
  )

  const hasPosition = !!positionInfo

  // 智能建议
  const suggestions = useMemo(() => {
    const result: { stopLoss?: number; positionRatio: number } = {
      positionRatio: DEFAULT_POSITION_RATIO,
    }

    if (formState.type === 'buy' && formState.targetPrice > 0) {
      result.stopLoss = Number((formState.targetPrice * 0.92).toFixed(2))
    }

    return result
  }, [formState.type, formState.targetPrice])

  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // 股票必选
    if (!formState.stockCode) {
      newErrors.stockCode = '请选择股票'
    }

    // 目标价格验证
    if (!formState.targetPrice || formState.targetPrice <= 0) {
      newErrors.targetPrice = '请输入有效的目标价格'
    }

    // 止损价验证（买入模式）
    if (formState.type === 'buy' && formState.stopLoss) {
      if (formState.stopLoss <= 0) {
        newErrors.stopLoss = '止损价必须大于0'
      } else if (formState.stopLoss >= formState.targetPrice) {
        newErrors.stopLoss = '止损价应低于目标价'
      }
    }

    // 止盈价验证（买入模式）
    if (formState.type === 'buy' && formState.takeProfit) {
      if (formState.takeProfit <= 0) {
        newErrors.takeProfit = '止盈价必须大于0'
      } else if (formState.takeProfit <= formState.targetPrice) {
        newErrors.takeProfit = '止盈价应高于目标价'
      }
    }

    // 仓位比例验证
    if (formState.positionRatio !== undefined) {
      if (!Number.isInteger(formState.positionRatio) || formState.positionRatio < 1 || formState.positionRatio > 100) {
        newErrors.positionRatio = '仓位比例应为 1-100 之间的整数'
      }
    }

    // 数量验证
    if (formState.quantity !== undefined) {
      if (formState.quantity <= 0 || formState.quantity % 100 !== 0) {
        newErrors.quantity = '数量应为 100 的倍数'
      }
    }

    // 卖出模式特殊验证
    if (formState.type === 'sell') {
      if (!hasPosition) {
        newErrors.stockCode = '当前无该股票持仓，无法创建卖出计划'
      } else if (formState.quantity && formState.quantity > positionInfo!.quantity) {
        newErrors.quantity = `卖出数量不能超过持仓数量 (当前: ${positionInfo!.quantity} 股)`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formState, hasPosition, positionInfo])

  const reset = useCallback(() => {
    setFormState(getInitialState(initialData))
    setErrors({})
    setIsSubmitting(false)
  }, [initialData])

  const submit = useCallback((): { success: boolean; data?: CreateOperationPlanParams; error?: string } => {
    if (!validate()) {
      return { success: false, error: '表单验证失败' }
    }

    if (isSubmitting) {
      return { success: false, error: '正在提交中' }
    }

    setIsSubmitting(true)

    const data: CreateOperationPlanParams = {
      stockCode: formState.stockCode,
      stockName: formState.stockName,
      type: formState.type,
      targetPrice: formState.targetPrice > 0 ? formState.targetPrice : undefined,
      stopLoss: formState.type === 'buy' ? formState.stopLoss : undefined,
      takeProfit: formState.type === 'buy' ? formState.takeProfit : undefined,
      positionRatio: formState.positionRatio,
      quantity: formState.quantity,
      note: formState.note,
    }

    // 模拟异步提交完成
    setTimeout(() => setIsSubmitting(false), 100)

    return { success: true, data }
  }, [formState, isSubmitting, validate])

  return {
    formState,
    errors,
    suggestions,
    selectedStock,
    hasPosition,
    positionInfo,
    isSubmitting,
    updateField,
    validate,
    reset,
    submit,
  }
}