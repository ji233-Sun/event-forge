'use client'

import { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

type StatusData = { draft: number; published: number; closed: number }

export function SurveyStatusChart({ data }: { data: StatusData }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)
    const total = data.draft + data.published + data.closed

    const option: echarts.EChartsCoreOption = {
      animation: true,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#333' },
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
        textStyle: { fontSize: 11, color: '#666' },
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
                fill: '#333',
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
                fill: '#999',
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
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' },
          },
          data: [
            { value: data.draft, name: 'Draft', itemStyle: { color: '#f59e0b' } },
            { value: data.published, name: 'Published', itemStyle: { color: '#16a34a' } },
            { value: data.closed, name: 'Closed', itemStyle: { color: '#ef4444' } },
          ],
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
