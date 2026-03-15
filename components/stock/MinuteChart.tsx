'use client'

import { useEffect, useState, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMinuteData } from '@/lib/api/stock'
import type { MinuteData } from '@/types/stock'
import { getChartColors } from '@/lib/utils'

interface MinuteChartProps {
  code: string
  name?: string
  className?: string
}

export function MinuteChart({ code, name, className }: MinuteChartProps) {
  const [minuteData, setMinuteData] = useState<MinuteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await getMinuteData(code)
        setMinuteData(data)
      } catch (error) {
        console.error('Error fetching minute data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [code])

  const getOption = () => {
    if (minuteData.length === 0) return {}

    const times = minuteData.map((d) => d.time)
    const prices = minuteData.map((d) => d.price)
    const volumes = minuteData.map((d) => d.volume)
    const avgPrices = minuteData.map((d) => d.avgPrice)
    const colors = getChartColors()

    // 计算基准价格（昨日收盘价）
    const basePrice = minuteData[0]?.price || 0

    return {
      animation: false,
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
        formatter: function (params: any[]) {
          const priceData = params.find((p: { seriesName: string }) => p.seriesName === '价格')
          const volumeData = params.find((p: { seriesName: string }) => p.seriesName === '成交量')
          if (!priceData) return ''
          const price = priceData.data
          const change = price - basePrice
          const changePercent = ((change / basePrice) * 100).toFixed(2)
          const changeColor = change >= 0 ? colors.up : colors.down
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${priceData.axisValue}</div>
              <div>价格: <span style="font-weight: 600;">${price.toFixed(2)}</span></div>
              <div>涨跌: <span style="color: ${changeColor};">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)</span></div>
              ${volumeData ? `<div>成交量: ${(volumeData.data / 10000).toFixed(0)}万</div>` : ''}
            </div>
          `
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
          data: times,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisLabel: { show: false },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: times,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: colors.muted,
            fontSize: 10,
            interval: 30,
          },
        },
      ],
      yAxis: [
        {
          scale: true,
          axisLabel: {
            color: colors.muted,
            fontSize: 10,
          },
          splitLine: {
            lineStyle: {
              color: colors.border,
              type: 'dashed',
            },
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
      series: [
        {
          name: '价格',
          type: 'line',
          data: prices,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 1,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
              ],
            },
          },
        },
        {
          name: '均价',
          type: 'line',
          data: avgPrices,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 1,
            type: 'dashed',
            color: '#F59E0B',
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
              const current = minuteData[dataIndex]
              const prev = minuteData[dataIndex - 1]
              if (!current || !prev) return colors.flat
              return current.price >= prev.price ? colors.up : colors.down
            },
          },
        },
      ],
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">分时走势</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : minuteData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted-foreground">暂无分时数据</div>
          </div>
        ) : (
          <ReactECharts
            option={getOption()}
            style={{ height: 300 }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
