'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
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
import { usePortfolioStore } from '@/store/portfolioStore'
import { getStockRealtime } from '@/lib/api/stock'
import { formatPrice, formatChangePercent, formatAmount, cn, generateId } from '@/lib/utils'
import type { PortfolioWithStock } from '@/types/portfolio'
import type { Stock } from '@/types/stock'

export function PortfolioTable() {
  const { portfolios, addPortfolio, removePortfolio, updatePortfolio } = usePortfolioStore()
  const [portfolioWithStocks, setPortfolioWithStocks] = useState<PortfolioWithStock[]>([])
  const [stockData, setStockData] = useState<Record<string, Stock>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    buyPrice: '',
    quantity: '',
    buyDate: new Date().toISOString().split('T')[0],
    note: '',
  })

  // 获取实时股价
  useEffect(() => {
    const fetchData = async () => {
      if (portfolios.length === 0) {
        setPortfolioWithStocks([])
        setLoading(false)
        return
      }

      setLoading(true)
      const codes = Array.from(new Set(portfolios.map((p) => p.stockCode)))
      const stocks = await getStockRealtime(codes)
      const stockMap: Record<string, Stock> = {}
      stocks.forEach((s) => {
        stockMap[s.code] = s
      })
      setStockData(stockMap)
      setLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [portfolios])

  // 计算持仓详情
  useEffect(() => {
    const details: PortfolioWithStock[] = portfolios.map((p) => {
      const stock = stockData[p.stockCode]
      const currentPrice = stock?.price || 0
      const marketValue = currentPrice * p.quantity
      const cost = p.buyPrice * p.quantity
      const profit = marketValue - cost
      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0

      return {
        ...p,
        currentPrice,
        marketValue,
        profit,
        profitPercent,
        changePercent: stock?.changePercent || 0,
      }
    })
    setPortfolioWithStocks(details)
  }, [portfolios, stockData])

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      stockCode: '',
      stockName: '',
      buyPrice: '',
      quantity: '',
      buyDate: new Date().toISOString().split('T')[0],
      note: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (portfolio: PortfolioWithStock) => {
    setEditingId(portfolio.id)
    setFormData({
      stockCode: portfolio.stockCode,
      stockName: portfolio.stockName,
      buyPrice: portfolio.buyPrice.toString(),
      quantity: portfolio.quantity.toString(),
      buyDate: portfolio.buyDate,
      note: portfolio.note || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.stockCode || !formData.buyPrice || !formData.quantity) return

    const data = {
      stockCode: formData.stockCode,
      stockName: formData.stockName || formData.stockCode,
      buyPrice: parseFloat(formData.buyPrice),
      quantity: parseInt(formData.quantity),
      buyDate: formData.buyDate,
      note: formData.note,
    }

    if (editingId) {
      updatePortfolio(editingId, data)
    } else {
      addPortfolio(data)
    }
    setDialogOpen(false)
  }

  // 计算汇总
  const summary = portfolioWithStocks.reduce(
    (acc, p) => {
      acc.totalCost += p.buyPrice * p.quantity
      acc.totalValue += p.marketValue
      acc.todayProfit += p.currentPrice * p.quantity * (p.changePercent / 100)
      return acc
    },
    { totalCost: 0, totalValue: 0, todayProfit: 0 }
  )
  const totalProfit = summary.totalValue - summary.totalCost

  return (
    <div className="space-y-6">
      {/* 汇总卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总资产</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(summary.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总成本</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(summary.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', totalProfit >= 0 ? 'text-up' : 'text-down')}>
              {totalProfit >= 0 ? '+' : ''}{formatAmount(totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">收益率</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold flex items-center gap-1',
                totalProfit >= 0 ? 'text-up' : 'text-down'
              )}
            >
              {totalProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {summary.totalCost > 0 ? formatChangePercent((totalProfit / summary.totalCost) * 100) : '0.00%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 持仓列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>持仓明细</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加持仓
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : portfolioWithStocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无持仓记录，点击&ldquo;添加持仓&rdquo;开始记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>股票</TableHead>
                  <TableHead className="text-right">持仓量</TableHead>
                  <TableHead className="text-right">成本价</TableHead>
                  <TableHead className="text-right">现价</TableHead>
                  <TableHead className="text-right">市值</TableHead>
                  <TableHead className="text-right">收益</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioWithStocks.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.stockCode}</div>
                      <div className="text-sm text-muted-foreground">{p.stockName}</div>
                    </TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">{formatPrice(p.buyPrice)}</TableCell>
                    <TableCell className="text-right">
                      <div>{formatPrice(p.currentPrice)}</div>
                      <div className={cn('text-sm', p.changePercent >= 0 ? 'text-up' : 'text-down')}>
                        {formatChangePercent(p.changePercent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(p.marketValue)}</TableCell>
                    <TableCell className="text-right">
                      <div className={cn(p.profit >= 0 ? 'text-up' : 'text-down')}>
                        {p.profit >= 0 ? '+' : ''}{formatAmount(p.profit)}
                      </div>
                      <div className={cn('text-sm', p.profitPercent >= 0 ? 'text-up' : 'text-down')}>
                        {formatChangePercent(p.profitPercent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removePortfolio(p.id)}>
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

      {/* 添加/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑持仓' : '添加持仓'}</DialogTitle>
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
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">买入价格</label>
                <Input
                  type="number"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  placeholder="10.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">持仓数量</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">买入日期</label>
              <Input
                type="date"
                value={formData.buyDate}
                onChange={(e) => setFormData({ ...formData, buyDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="备注（可选）"
              />
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