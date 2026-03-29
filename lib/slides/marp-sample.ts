import { resolvePalette, type Palette } from "@/lib/slides/template/css-builder";
import { type TemplateValues } from "@/lib/slides/template/config";

export function generateSampleMarkdown(values: TemplateValues): string {
  const palette = resolvePalette(values);

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

  return `# ${values.themeMode === "dark" ? "Future Launch Deck" : "Campaign Launch Blueprint"}

**${values.primaryColor.toUpperCase()}** accent + **${values.bgStyle}** background

---

## Storyline / Content Slide

- **Audience:** student + young professionals
- **Promise:** immersive event experience
- **Goal:** convert attention into ticket sales

**Timeline:**

- **Week 1-2:** Campaign setup
- **Week 3-4:** Influencer burst
- **Week 5-6:** Closing push

---

## Budget Breakdown

Spending allocation across event categories.

\`\`\`echarts
${JSON.stringify(barOption)}
\`\`\`

---

## Revenue Mix

Revenue streams and contribution breakdown.

\`\`\`echarts
${JSON.stringify(donutOption)}
\`\`\`

---

## Registration Trend

Weekly registration growth trajectory.

\`\`\`echarts
${JSON.stringify(lineOption)}
\`\`\`

---

## KPI Overview

| Metric | Value |
|--------|-------|
| Projected Reach | **120K** |
| Sponsor Leads | **48** |
| Expected ROI | **2.6x** |

**Ready to ship:** This template demonstrates Cover + Content + Chart + KPI layouts for rapid style iteration.`;
}

export const buildSampleMarkdown = generateSampleMarkdown;
