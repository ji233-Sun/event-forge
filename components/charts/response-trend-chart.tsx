'use client'

import { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer])

type TrendDay = { date: string; count: number }

export function ResponseTrendChart({ data }: { data: TrendDay[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)

    const option: echarts.EChartsCoreOption = {
      animation: true,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      grid: { top: 16, right: 16, bottom: 32, left: 40 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#333' },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0]
          return `<strong>${p.name}</strong><br/>Responses: ${p.value}`
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLine: { lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#999' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: { fontSize: 11, color: '#999' },
      },
      series: [
        {
          type: 'line',
          data: data.map((d) => d.count),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#16a34a' },
          itemStyle: { color: '#16a34a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,163,74,0.25)' },
              { offset: 1, color: 'rgba(22,163,74,0.02)' },
            ]),
          },
        },
      ],
    }

    chart.setOption(option)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [data])

  return <div ref={chartRef} className="h-[220px] w-full" />
}
