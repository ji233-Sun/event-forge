'use client'

import { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

type StatusData = { draft: number; published: number; closed: number }

/** Read a CSS variable value from :root */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Convert a CSS variable to a usable color string */
function resolveColor(varName: string): string {
  const raw = cssVar(varName)
  if (!raw) return '#888'
  return `oklch(${raw})`
}

export function SurveyStatusChart({ data }: { data: StatusData }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Initialize once on mount
  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)

    const onResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  // Update options when data changes
  useEffect(() => {
    if (!chartInstance.current) return

    const total = data.draft + data.published + data.closed

    const popover = resolveColor('--popover')
    const border = resolveColor('--border')
    const foreground = resolveColor('--foreground')
    const mutedFg = resolveColor('--muted-foreground')
    const background = resolveColor('--background')

    const draftColor = resolveColor('--chart-2')
    const publishedColor = resolveColor('--chart-1')
    const closedColor = resolveColor('--chart-5')

    chartInstance.current.setOption({
      animation: true,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: popover,
        borderColor: border,
        borderWidth: 1,
        textStyle: { fontSize: 12, color: foreground },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number }
          return `<strong>${p.name}</strong><br/>Count: ${p.value} (${p.percent}%)`
        },
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
        textStyle: { fontSize: 11, color: mutedFg },
      },
      graphic: total > 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: '38%',
              style: {
                text: String(total),
                fontSize: 22,
                fontWeight: 'bold',
                fill: foreground,
                textAlign: 'center',
              },
            },
            {
              type: 'text',
              left: 'center',
              top: '52%',
              style: {
                text: 'Total',
                fontSize: 11,
                fill: mutedFg,
                textAlign: 'center',
              },
            },
          ]
        : [],
      series: [
        {
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: background, borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' },
          },
          data: [
            { value: data.draft, name: 'Draft', itemStyle: { color: draftColor } },
            { value: data.published, name: 'Published', itemStyle: { color: publishedColor } },
            { value: data.closed, name: 'Closed', itemStyle: { color: closedColor } },
          ],
        },
      ],
    })
  }, [data])

  return <div ref={chartRef} className="h-[220px] w-full" />
}
