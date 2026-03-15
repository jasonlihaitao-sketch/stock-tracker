'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OperationPlanForm } from './OperationPlanForm'
import type { StockSelectItem } from './StockSearchSelect'
import type { Position } from '@/types/position'
import type { OperationPlan } from '@/types/operationPlan'
import type { CreateOperationPlanParams } from '@/hooks/useOperationPlanForm'

interface OperationPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit' | 'copy'
  plan?: OperationPlan
  positions: Position[]
  stocks: StockSelectItem[]
  onSubmit: (data: CreateOperationPlanParams) => void
}

const DIALOG_TITLE = {
  create: '新建操作计划',
  edit: '编辑操作计划',
  copy: '复制操作计划',
}

const DIALOG_DESCRIPTION = {
  create: '创建一个新的买入或卖出计划',
  edit: '修改现有计划的参数',
  copy: '基于现有计划创建新计划',
}

export function OperationPlanDialog({
  open,
  onOpenChange,
  mode,
  plan,
  positions,
  stocks,
  onSubmit,
}: OperationPlanDialogProps) {
  const handleFormSubmit = (result: { success: boolean; data?: CreateOperationPlanParams }) => {
    if (result.success && result.data) {
      onSubmit(result.data)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_TITLE[mode]}</DialogTitle>
          <DialogDescription>{DIALOG_DESCRIPTION[mode]}</DialogDescription>
        </DialogHeader>
        <OperationPlanForm
          mode={mode}
          initialData={plan}
          positions={positions}
          stocks={stocks}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}