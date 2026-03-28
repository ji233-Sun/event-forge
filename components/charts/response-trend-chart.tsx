'use client'

import { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer])

type TrendDay = { date: string; count: number }

/** Read a CSS variable value from :root */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Convert an oklch/hsl CSS variable to a usable color string */
function resolveColor(varName: string): string {
  const raw = cssVar(varName)
  if (!raw) return '#888'
  // CSS variables from globals.css use oklch values like "0.922 0.004 286.32"
  return `oklch(${raw})`
}

export function ResponseTrendChart({ data }: { data: TrendDay[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)

    const primary = resolveColor('--primary')
    const border = resolveColor('--border')
    const mutedFg = resolveColor('--muted-foreground')
    const popover = resolveColor('--popover')
    const foreground = resolveColor('--foreground')

    const option: echarts.EChartsCoreOption = {
      animation: true,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      grid: { top: 16, right: 16, bottom: 32, left: 40 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: popover,
        borderColor: border,
        borderWidth: 1,
        textStyle: { fontSize: 12, color: foreground },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0]
          return `<strong>${p.name}</strong><br/>Responses: ${p.value}`
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: mutedFg },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: border } },
        axisLabel: { fontSize: 11, color: mutedFg },
      },
      series: [
        {
          type: 'line',
          data: data.map((d) => d.count),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: primary },
          itemStyle: { color: primary },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: primary },
              { offset: 1, color: 'transparent' },
            ]),
            opacity: 0.15,
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
