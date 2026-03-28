import Marp from "@marp-team/marp-core";
import { generate } from "@/lib/ai";

function extractMarkdown(text: string): string {
  const mdCodeBlockMatch = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (mdCodeBlockMatch) {
    return mdCodeBlockMatch[1].trim();
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("---")) {
    return trimmed;
  }

  return trimmed;
}

function countMarpSlides(markdown: string): number {
  const body = markdown.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/u, "");
  const separators = body.match(/(^|\r?\n)---\s*(?=\r?\n|$)/g);
  return 1 + (separators?.length ?? 0);
}

function buildBaseSystemPrompt(language: string): string {
  return `你是一位顶级路演设计师 + 信息可视化设计师。请基于用户输入生成一份 Marp 格式的 Markdown 演示文稿，风格要"科技、立体、有空间层次"，避免模板化和大段单调项目符号。

必须严格遵守：
- 输出必须是纯 Marp Markdown，不要解释，不要额外文字
- Content language: ${language}
- 使用 Marp 的 front-matter 指令控制主题和样式
- 使用 --- 分隔每一页幻灯片

Marp 指令规范：
- 在文件开头使用 --- 包裹的 YAML front-matter 中设置：
  marp: true
  theme: default
  paginate: true
  style: |
    :root {
      --bg-0: #070b1f;
      --bg-1: #101a3c;
      --cyan: #36f5ff;
      --mint: #5effc7;
      --violet: #b47bff;
      --text: #e9efff;
      --muted: #9fb0d7;
    }
    section {
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      color: var(--text);
      background:
        radial-gradient(1200px 500px at 20% -10%, rgba(54,245,255,.18), transparent 60%),
        radial-gradient(1000px 500px at 100% 0%, rgba(180,123,255,.20), transparent 55%),
        linear-gradient(140deg, var(--bg-0) 0%, var(--bg-1) 100%);
      padding: 44px 56px;
      line-height: 1.45;
    }
    section::before {
      content: "";
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(94,255,199,.22);
      border-radius: 18px;
      pointer-events: none;
      box-shadow: inset 0 0 40px rgba(54,245,255,.06);
    }
    h1, h2, h3 {
      margin: 0 0 14px;
      letter-spacing: .5px;
      text-shadow: 0 0 18px rgba(54,245,255,.20);
    }
    h1 { color: var(--cyan); font-size: 54px; text-align: left; }
    h2 { color: var(--violet); font-size: 40px; }
    h3 { color: var(--mint); font-size: 30px; }
    p, li { font-size: 23px; }
    ul { margin: 8px 0 0; }
    strong { color: var(--cyan); }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 14px;
    }
    .kpi {
      padding: 16px 14px;
      border-radius: 14px;
      background: linear-gradient(160deg, rgba(255,255,255,.10), rgba(255,255,255,.03));
      border: 1px solid rgba(54,245,255,.25);
      box-shadow: 0 8px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.05);
    }
    .kpi .label { font-size: 16px; color: var(--muted); margin-bottom: 6px; }
    .kpi .value { font-size: 34px; color: var(--mint); font-weight: 700; }
    .panel {
      margin-top: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(180,123,255,.35);
      background: rgba(16,26,60,.55);
      backdrop-filter: blur(6px);
      box-shadow: 0 10px 24px rgba(6,10,30,.35);
    }
    .two-col {
      display: grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 20px;
      align-items: start;
    }
    .timeline-item {
      margin: 10px 0;
      padding-left: 12px;
      border-left: 3px solid rgba(94,255,199,.7);
    }
    .cover h1 { font-size: 64px; text-align: center; margin-top: 40px; }
    .cover p { text-align: center; color: var(--mint); font-size: 30px; }
    .echarts-chart { width: 100%; height: 280px; border-radius: 14px; background: linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02)); border: 1px solid rgba(54,245,255,.18); box-shadow: 0 4px 20px rgba(0,0,0,.3); padding: 6px; }
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    .chart-row .echarts-chart { height: 250px; }

页面结构规范：
- 至少包含：首页、目录页、内容页（多页）、总结/结束页
- 必须至少 6 页
- 每页核心信息不超过3个重点
- 至少使用 3 种不同版式（例如：封面大标题、双栏对比、KPI 卡片、时间线、流程图式列表）
- 禁止连续两页都只用"纯项目符号列表"
- 使用 Marp 指令（如 <!-- _class: cover -->）和 HTML 块（div class）构建层次

加粗/强调规范（极其重要）：
- 在 HTML 块（<div>、<span>、class 面板等）内部，必须使用 <strong> 标签加粗，禁止使用 **...**
- 只有在纯 Markdown 文本（不在任何 HTML 标签内）中才能使用 **...** 加粗
- 错误示例：<div class="kpi">**营收增长** 30%</div>（** 不会被解析）
- 正确示例：<div class="kpi"><strong>营收增长</strong> 30%</div>

防溢出规范（极其重要，画布 1280×720，padding 后可用区域约 1168×632）：
- 每页总文字行数（含标题）严格不超过 12 行
- 每个列表严格不超过 4 项，每项不超过 18 个中文字符
- 图表高度设为 240-260px，图表页标题后最多 1 句说明 + 1 个图表，不再加列表
- 双栏布局每列不超过 6 行
- KPI 卡片最多 3 个（一排）
- 如果内容放不下，必须拆分到下一页，宁可多一页也不要挤压
- 封面页标题不超过 15 个字

内容与文案规范：
- 所有幻灯片文案必须使用 ${language}
- 涉及金额/规模等单位使用中文单位（亿、万），不要用 B/M/K
- 文案精炼，适合演示场景

设计风格：
- 科技感、未来感、冷色系
- 强调立体感：使用卡片、阴影、描边、半透明面板形成前后层次
- 每页留白充足，避免信息拥挤，视觉重心明确

ECharts 图表规范（必须使用）：
- 至少 2 页使用 ECharts 动态图表来展示关键数据（预算、参与人数、收益等）
- 在 Marp HTML 块中用 <div> 嵌入图表，格式如下：
  <div id="chart-N" class="echarts-chart" data-option='JSON配置'></div>
- 每个 div 必须有唯一 id（如 chart-1, chart-2）
- data-option 中必须是合法 JSON（属性名和字符串值用双引号），整个属性用单引号包裹
- 必须设置 "backgroundColor":"transparent"
- 系列配色数组："color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"]
- 轴线颜色 axisLine.lineStyle.color:"#9fb0d7"，轴标签 axisLabel.color:"#9fb0d7"
- 分割线 splitLine.lineStyle.color:"rgba(255,255,255,0.06)"
- 设置动画："animationDuration":1200,"animationEasing":"cubicInOut"
- 推荐图表类型：渐变柱状图(type:bar)、带面积折线图(type:line with areaStyle)、环形饼图(type:pie with radius)
- 图表标题用 h2/h3 写在 div 之前，不要写在 ECharts option 中

柱状图示例（单行，直接复制模式）：
<div id="chart-1" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"],"backgroundColor":"transparent","tooltip":{},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":["场地","设备","宣传","餐饮","礼品"],"axisLine":{"lineStyle":{"color":"#9fb0d7"}},"axisLabel":{"color":"#9fb0d7"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(255,255,255,0.06)"}},"axisLabel":{"color":"#9fb0d7"}},"series":[{"type":"bar","data":[15,20,10,25,8],"barWidth":"40%","animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

环形饼图示例：
<div id="chart-2" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"],"backgroundColor":"transparent","tooltip":{"trigger":"item"},"legend":{"bottom":10,"textStyle":{"color":"#9fb0d7"}},"series":[{"type":"pie","radius":["40%","70%"],"center":["50%","45%"],"data":[{"value":30,"name":"赞助"},{"value":25,"name":"门票"},{"value":20,"name":"周边"},{"value":25,"name":"其他"}],"label":{"color":"#e9efff"},"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

折线图示例：
<div id="chart-3" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff"],"backgroundColor":"transparent","tooltip":{"trigger":"axis"},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":["第1周","第2周","第3周","第4周","第5周","第6周"],"axisLine":{"lineStyle":{"color":"#9fb0d7"}},"axisLabel":{"color":"#9fb0d7"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(255,255,255,0.06)"}},"axisLabel":{"color":"#9fb0d7"}},"series":[{"type":"line","smooth":true,"areaStyle":{"opacity":0.15},"data":[50,120,200,350,500,800],"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

两图并排布局示例（使用 chart-row）：
<div class="chart-row">
<div id="chart-4" class="echarts-chart" data-option='柱状图JSON'></div>
<div id="chart-5" class="echarts-chart" data-option='饼图JSON'></div>
</div>`;
}

async function generateMarpMarkdown(
  prompt: string,
  language: string,
  extraConstraint?: string
): Promise<{ text: string; finishReason: string }> {
  const { text, finishReason } = await generate("medium", prompt, {
    maxOutputTokens: 10000,
    system: [buildBaseSystemPrompt(language), extraConstraint].filter(Boolean).join("\n\n"),
  });

  return {
    text,
    finishReason: String(finishReason ?? "unknown"),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { prompt, language } = body as { prompt?: string; language?: string };

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const outputLanguage =
    typeof language === "string" && language.trim() ? language.trim() : "English";
  const basePrompt = `Create a Marp Markdown slide deck in ${outputLanguage} based on the following event description:\n\n${prompt}`;

  let markdown: string;
  let slideCount: number;

  try {
    const { text, finishReason } = await generateMarpMarkdown(basePrompt, outputLanguage);

    if (finishReason === "length") {
      return Response.json(
        {
          error:
            "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
        },
        { status: 502 }
      );
    }

    markdown = extractMarkdown(text);
    slideCount = countMarpSlides(markdown);

    if (slideCount < 6) {
      const retry = await generateMarpMarkdown(
        basePrompt,
        outputLanguage,
        `硬性要求：
- 必须输出至少 6 页幻灯片
- front-matter 后至少出现 5 个页面分隔符（---）
- 严禁输出单页内容；如果内容不足，请自行补充目录页、方案页、预算页、时间线页、总结页`
      );

      if (retry.finishReason === "length") {
        return Response.json(
          {
            error:
              "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
          },
          { status: 502 }
        );
      }

      markdown = extractMarkdown(retry.text);
      slideCount = countMarpSlides(markdown);
    }
  } catch (error) {
    console.error("[generate-slides] generation failed:", error);
    return Response.json(
      { error: "AI generation failed. Try again." },
      { status: 502 }
    );
  }

  if (!markdown) {
    return Response.json(
      { error: "Failed to parse model response as Marp Markdown" },
      { status: 502 }
    );
  }

  if (slideCount < 6) {
    return Response.json(
      {
        error:
          "Failed to generate a 6-slide minimum deck. Please retry with more detailed event information.",
      },
      { status: 502 }
    );
  }

  console.log("[generate-slides] generated markdown length:", markdown.length);
  console.log("[generate-slides] markdown slide count:", slideCount);

  let html: string;
  let css: string;
  try {
    // Server-side rendering with Marp Core
    const marp = new Marp({ html: true });
    ({ html, css } = marp.render(markdown));
  } catch (error) {
    console.error("[generate-slides] render failed:", error);
    return Response.json(
      { error: "Failed to render generated slides. Try again." },
      { status: 502 }
    );
  }

  console.log("[generate-slides] rendered slides, html length:", html.length);

  return Response.json({ html, css, markdown });
}
