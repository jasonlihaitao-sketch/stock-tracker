'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Bell, BellOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAlertStore } from '@/store/alertStore'
import { formatDateTime, cn } from '@/lib/utils'
import { ALERT_TYPES } from '@/lib/constants'
import type { AlertType } from '@/types/alert'

export function AlertList() {
  const { alerts, alertHistory, addAlert, updateAlert, removeAlert, toggleAlert, markHistoryRead } =
    useAlertStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    type: 'price_up' as AlertType,
    value: '',
  })

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      stockCode: '',
      stockName: '',
      type: 'price_up',
      value: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (alert: typeof alerts[0]) => {
    setEditingId(alert.id)
    setFormData({
      stockCode: alert.stockCode,
      stockName: alert.stockName,
      type: alert.type,
      value: alert.value.toString(),
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.stockCode || !formData.value) return

    if (editingId) {
      updateAlert(editingId, {
        type: formData.type,
        value: parseFloat(formData.value),
      })
    } else {
      addAlert({
        stockCode: formData.stockCode,
        stockName: formData.stockName || formData.stockCode,
        type: formData.type,
        value: parseFloat(formData.value),
        enabled: true,
      })
    }
    setDialogOpen(false)
  }

  const getAlertTypeLabel = (type: AlertType) => {
    return ALERT_TYPES.find((t) => t.value === type)?.label || type
  }

  const getConditionText = (alert: typeof alerts[0]) => {
    const typeLabel = getAlertTypeLabel(alert.type)
    if (alert.type === 'price_up' || alert.type === 'price_down') {
      return `${typeLabel} ${alert.value} 元`
    }
    return `${typeLabel} ${alert.value}%`
  }

  return (
    <div className="space-y-6">
      {/* 预警列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>预警列表</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            新建预警
          </Button>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无预警，点击&ldquo;新建预警&rdquo;设置价格提醒
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>股票</TableHead>
                  <TableHead>条件</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="font-medium">{alert.stockCode}</div>
                      <div className="text-sm text-muted-foreground">{alert.stockName}</div>
                    </TableCell>
                    <TableCell>{getConditionText(alert)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.enabled ? (
                          <span className="text-sm text-primary flex items-center gap-1">
                            <Bell className="h-4 w-4" /> 已启用
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <BellOff className="h-4 w-4" /> 已禁用
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(alert.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(alert)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 预警历史 */}
      {alertHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>预警历史</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>股票</TableHead>
                  <TableHead>条件</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertHistory.slice(0, 20).map((history) => (
                  <TableRow key={history.id} className={cn(!history.read && 'bg-muted/50')}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(history.triggeredAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{history.stockCode}</div>
                      <div className="text-sm text-muted-foreground">{history.stockName}</div>
                    </TableCell>
                    <TableCell>{history.condition}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-sm',
                          history.read ? 'text-muted-foreground' : 'text-primary font-medium'
                        )}
                      >
                        {history.read ? '已读' : '未读'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 添加/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑预警' : '新建预警'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">股票代码</label>
                <Input
                  value={formData.stockCode}
                  onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
                  placeholder="000001"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium">股票名称</label>
                <Input
                  value={formData.stockName}
                  onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
                  placeholder="平安银行"
                  disabled={!!editingId}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">预警类型</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as AlertType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">触发值</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={
                    formData.type === 'price_up' || formData.type === 'price_down' ? '12.50' : '5'
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}