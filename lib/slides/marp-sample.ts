import { buildDynamicStyle, type Palette } from "@/lib/slides/template/css-builder";
import { type TemplateValues } from "@/lib/slides/template/config";

function optionToDataAttr(option: Record<string, unknown>): string {
  return JSON.stringify(option).replace(/'/g, "&#39;");
}

function toMarpStyleDirective(style: string): string {
  return style
    .trim()
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

export function generateMarpMarkdown(values: TemplateValues): string {
  const { style, palette } = buildDynamicStyle(values);
  const marpStyle = toMarpStyleDirective(style);

  const barOption = {
    color: [palette.primary, palette.secondary, palette.accent],
    backgroundColor: "transparent",
    tooltip: {},
    grid: { top: 40, bottom: 28, left: 58, right: 14 },
    xAxis: {
      type: "category",
      data: ["Venue", "Tech", "Marketing", "Catering", "Merch"],
      axisLine: { lineStyle: { color: palette.slideMuted } },
      axisLabel: { color: palette.slideMuted },
    },
    yAxis: {
      splitLine: { lineStyle: { color: `${palette.slideMuted}33` } },
      axisLabel: { color: palette.slideMuted },
    },
    series: [
      {
        type: "bar",
        data: [15, 20, 10, 25, 8],
        barWidth: "42%",
        animationDuration: 1200,
        animationEasing: "cubicInOut",
      },
    ],
  };

  const donutOption = {
    color: [palette.primary, palette.secondary, palette.accent, palette.slideMuted],
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    legend: { bottom: 8, textStyle: { color: palette.slideMuted } },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "44%"],
        data: [
          { value: 38, name: "Sponsorship" },
          { value: 24, name: "Tickets" },
          { value: 18, name: "Merch" },
          { value: 20, name: "Other" },
        ],
        label: { color: palette.slideText },
        animationDuration: 1200,
        animationEasing: "cubicInOut",
      },
    ],
  };

  const lineOption = {
    color: [palette.primary, palette.secondary],
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { top: 32, bottom: 28, left: 58, right: 16 },
    xAxis: {
      type: "category",
      data: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      axisLine: { lineStyle: { color: palette.slideMuted } },
      axisLabel: { color: palette.slideMuted },
    },
    yAxis: {
      splitLine: { lineStyle: { color: `${palette.slideMuted}33` } },
      axisLabel: { color: palette.slideMuted },
    },
    series: [
      {
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.18 },
        data: [42, 120, 220, 360, 540, 820],
        animationDuration: 1200,
        animationEasing: "cubicInOut",
      },
    ],
  };

  return `---
marp: true
theme: default
paginate: true
style: |
${marpStyle}
---

<!-- _class: cover -->
# ${values.themeMode === "dark" ? "Future Launch Deck" : "Campaign Launch Blueprint"}

<p><strong>${values.primaryColor.toUpperCase()}</strong> accent + <strong>${values.bgStyle}</strong> background</p>

---

## Storyline / Content Slide

<div class="two-col">
  <div class="panel">
    <h3>Core Narrative</h3>
    <ul>
      <li><strong>Audience:</strong> student + young professionals</li>
      <li><strong>Promise:</strong> immersive event experience</li>
      <li><strong>Goal:</strong> convert attention into ticket sales</li>
    </ul>
  </div>
  <div class="panel">
    <h3>Execution Beats</h3>
    <div class="timeline-item"><strong>Week 1-2</strong>: Campaign setup</div>
    <div class="timeline-item"><strong>Week 3-4</strong>: Influencer burst</div>
    <div class="timeline-item"><strong>Week 5-6</strong>: Closing push</div>
  </div>
</div>

---

## Chart Slide (ECharts)
One sentence support: spend and demand trend are aligned with conversion goals.

<div class="chart-row">
  <div id="chart-budget" class="echarts-chart" data-option='${optionToDataAttr(barOption)}'></div>
  <div id="chart-mix" class="echarts-chart" data-option='${optionToDataAttr(donutOption)}'></div>
</div>

<div id="chart-trend" class="echarts-chart" data-option='${optionToDataAttr(lineOption)}'></div>

---

## KPI Slide

<div class="kpi-row">
  <div class="kpi"><div class="label">Projected Reach</div><div class="value">120K</div></div>
  <div class="kpi"><div class="label">Sponsor Leads</div><div class="value">48</div></div>
  <div class="kpi"><div class="label">Expected ROI</div><div class="value">2.6x</div></div>
</div>

<div class="panel">
  <strong>Ready to ship:</strong> This template demonstrates Cover + Content + Chart + KPI layouts for rapid style iteration.
</div>
`;
}

export const buildSampleMarkdown = generateMarpMarkdown;
