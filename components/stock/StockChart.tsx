'use client'

import { useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getKLineData } from '@/lib/api/stock'
import type { KLineData } from '@/types/stock'
import { cn, getChartColors } from '@/lib/utils'

interface StockChartProps {
  code: string
  name?: string
  className?: string
}

export function StockChart({ code, name, className }: StockChartProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [klineData, setKlineData] = useState<KLineData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await getKLineData(code, period)
        setKlineData(data)
      } catch (error) {
        console.error('Error fetching kline data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [code, period])

  const getOption = () => {
    const dates = klineData.map((d) => d.date)
    const ohlc = klineData.map((d) => [d.open, d.close, d.low, d.high])
    const volumes = klineData.map((d) => d.volume)
    const colors = getChartColors()

    return {
      animation: false,
      legend: {
        bottom: 10,
        left: 'center',
        data: ['K线', '成交量'],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: colors.border,
        textStyle: {
          color: colors.text,
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        {
          left: '10%',
          right: '8%',
          height: '50%',
        },
        {
          left: '10%',
          right: '8%',
          top: '65%',
          height: '16%',
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: colors.muted,
            fontSize: 10,
          },
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
          },
          axisLabel: {
            color: colors.muted,
            fontSize: 10,
          },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: ohlc,
          itemStyle: {
            color: colors.up,
            color0: colors.down,
            borderColor: colors.up,
            borderColor0: colors.down,
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: function (params: { dataIndex: number }) {
              const dataIndex = params.dataIndex
              if (dataIndex === 0) return colors.flat
              const current = klineData[dataIndex]
              const prev = klineData[dataIndex - 1]
              return current && prev && current.close >= prev.close ? colors.up : colors.down
            },
          },
        },
      ],
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">K线图</CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="daily">日K</TabsTrigger>
            <TabsTrigger value="weekly">周K</TabsTrigger>
            <TabsTrigger value="monthly">月K</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : klineData.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">暂无数据</div>
          </div>
        ) : (
          <ReactECharts
            option={getOption()}
            style={{ height: 400 }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
