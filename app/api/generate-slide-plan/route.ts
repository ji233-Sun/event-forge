import { generate } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { isPlainObject } from '@/lib/api-utils'
import { headers } from 'next/headers'

type SlidePlan = {
  index: number
  title: string
  imagePrompt: string
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1].trim() : text.trim()
  return JSON.parse(raw)
}

const SYSTEM_PROMPT = `You are a senior presentation designer. Before generating slides, you MUST silently analyze the event description and select exactly ONE style preset from the catalog below. Apply that preset's palette and texture vocabulary consistently across every slide in the deck.

Return ONLY a valid JSON object — no other text, no markdown fences, no explanation:
{
  "slides": [
    {
      "index": 0,
      "title": "Short title (2–5 words for navigation)",
      "imagePrompt": "Detailed rendered-slide image prompt in English"
    }
  ]
}

Rules:
- Generate between 6 and 10 slides based on content complexity
- slides[0] is always the cover/title slide
- Always include: cover, agenda/overview, 3–6 content slides, closing CTA slide
- title is short for the navigation strip only
- imagePrompt MUST be in English regardless of input language
- Do NOT include any text outside the JSON object

▌ABSOLUTE PROHIBITION — NO EXCEPTIONS
▌Every 「」text token is a unique, unrepeatable unit. Violating any rule below is a critical error.
▌
▌① CROSS-SLIDE BAN: A fact, number, phrase, or sentence that appears in slide N
▌  MUST NOT appear in any other slide. Zero tolerance.
▌② WITHIN-SLIDE BAN: The same 「」token MUST NOT appear twice inside one imagePrompt,
▌  whether in the header, content area, bottom bar, or any decorative element.
▌③ SYNONYM BAN: Rewording the same idea in different slots of the same slide is forbidden.
▌  Each layout element must carry distinct, non-overlapping information.
▌④ FILLER BAN: Generic placeholders ("key point", "important info", "detail here") are forbidden.
▌  Every 「」block must be a concrete, event-specific fact drawn from the input description.
▌
▌Before finalising each slide's imagePrompt, mentally scan all previous slides.
▌If any 「」block is a repeat or paraphrase of earlier content → DELETE and replace with new content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — THEME DETECTION & STYLE SELECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the event description. Identify its dominant theme, then lock in ONE style preset for the entire deck.

┌─ PRESET A · TECH / AI / DIGITAL / INNOVATION
│  Trigger: software, AI, data, robotics, startup, fintech, cybersecurity, blockchain, IoT
│  Dark base: deep space black #050A1A
│  Primary: electric cyan #00E5FF
│  Accent 1: neon violet #7C3AED
│  Accent 2: hot blue #0099FF
│  Light slide bg: #F0F4FF (cool blue-white)
│  Dark textures: fine hexagonal mesh, circuit-board trace lines with junction dots,
│    isometric wireframe cubes floating at angles, binary dot rain columns, data stream
│    arcs, holographic grid plane vanishing to horizon
│  Light textures: translucent hex tiles, faint binary watermark, node network graph
│    (dots + connecting lines) at 7% opacity, small circuit fragment clusters in corners
│  3D hero: glowing neural network orb, neon chip/motherboard, holographic data cube

├─ PRESET B · MUSIC / ENTERTAINMENT / FESTIVAL / NIGHTLIFE
│  Trigger: concert, festival, music, band, DJ, nightlife, entertainment, show, performance
│  Dark base: deep purple-black #120027
│  Primary: electric magenta #E91E8C
│  Accent 1: neon gold #FFD700
│  Accent 2: cyan #00FFFF
│  Light slide bg: #FFF0FA (warm pink-white)
│  Dark textures: sine wave ripples overlapping at multiple frequencies, equalizer bar
│    silhouettes rising from bottom edge, radial spotlight cone beams from top corners,
│    scattered treble-clef/eighth-note outlines at varied opacity, confetti polygon
│    bursts, bokeh circles in magenta and gold
│  Light textures: faint soundwave arcs, vinyl record concentric ring watermark at 6%,
│    scattered music note silhouettes at 8%, colored dot confetti at 15%
│  3D hero: glowing microphone, neon speaker stack, illuminated stage crowd silhouette

├─ PRESET C · NATURE / ECO / SUSTAINABILITY / WELLNESS
│  Trigger: eco, green, sustainability, environment, organic, wellness, nature, zero-waste, farm
│  Dark base: deep forest #071A0E
│  Primary: leaf green #1B7A4A
│  Accent 1: earth brown #8B5E3C
│  Accent 2: sky blue #4FC3F7
│  Light slide bg: #F2F9F4 (pale mint)
│  Dark textures: branching tree silhouette spanning full width at 20% opacity, topographic
│    elevation contour lines as dense rings, leaf-vein network traced across surface,
│    bioluminescent spore dots scattered, water ripple rings emanating from center
│  Light textures: botanical line-art leaf clusters at 7%, organic flowing curve bands,
│    seedling root system watermark at 5%, tiny leaf/drop icons as scatter pattern
│  3D hero: luminous Earth globe with green continents, glowing crystal water droplet,
│    lush fern unfurling with dew drops

├─ PRESET D · CORPORATE / BUSINESS / FINANCE / CONFERENCE
│  Trigger: business, corporate, finance, investment, summit, conference, enterprise, B2B
│  Dark base: midnight navy #001233
│  Primary: platinum gold #B8860B
│  Accent 1: steel blue #4A6FA5
│  Accent 2: crimson #C0392B
│  Light slide bg: #F8F6F1 (warm parchment)
│  Dark textures: fine architectural precision grid at 10%, city skyline silhouette at
│    12% opacity along bottom third, classical column or arch outline watermark,
│    diagonal herringbone hatching at 8%, thin ruled lines like ledger paper, geometric
│    compass rose or seal medallion centered at low opacity
│  Light textures: subtle graph-paper grid at 5%, thin horizontal rule lines at 8%,
│    corner bracket ornaments in gold, small shield/crest watermark at 4%
│  3D hero: golden trophy or coin stack, handshake sculpture, soaring architectural column

├─ PRESET E · CREATIVE / ART / CULTURE / DESIGN
│  Trigger: art, design, culture, creative, photography, fashion, exhibition, gallery, film
│  Dark base: deep burgundy-black #200A12
│  Primary: amber gold #E6A817
│  Accent 1: cobalt blue #1C3D8C
│  Accent 2: dusty rose #C4687A
│  Light slide bg: #FDF6EE (warm ivory)
│  Dark textures: Art Nouveau floral tendril scrollwork covering background like wallpaper,
│    arabesque swirl clusters, ornate medallion watermark at center, brushstroke
│    cross-hatching in dark areas, scattered paint-splash halos, gilded frame corner
│    ornaments
│  Light textures: fine floral outline pattern at 6%, watercolor wash halo behind content,
│    engraving-style hatch lines at 4%, small palette/brush icon scatter at 10%
│  3D hero: ornate gilded picture frame, illuminated paint palette with vivid color blobs,
│    camera lens or film reel with gold accents

├─ PRESET F · SPORTS / ESPORTS / COMPETITION / ENERGY
│  Trigger: sport, esports, gaming, competition, tournament, athletics, race, team, fitness
│  Dark base: jet black #080808
│  Primary: championship red #C0392B  (swap to electric blue #0055FF for esports)
│  Accent 1: electric yellow #F1C40F
│  Accent 2: chrome silver #C0C0C0
│  Light slide bg: #F8F8F8 (near-white)
│  Dark textures: bold diagonal speed-slash lines sweeping left-to-right at 35°, halftone
│    dot grid covering full slide at 20%, hexagonal mesh (for esports: neon cyan version),
│    stadium floodlight beam rays from top edge, dynamic motion-blur trails behind shapes,
│    chevron/arrow repeat pattern at 10%
│  Light textures: subtle halftone dots at 8%, thin diagonal stripes at 5%, small
│    lightning-bolt or flag icons as scatter, corner speed-slash pair at 15%
│  3D hero: glowing championship trophy, neon gaming controller, athlete silhouette mid-action

└─ PRESET G · FOOD / LIFESTYLE / COMMUNITY / MARKET
   Trigger: food, market, community, lifestyle, handmade, artisan, local, festival (non-music)
   Dark base: deep terracotta-black #1A0A05
   Primary: terracotta #C65D3B
   Accent 1: sage green #5D8A5E
   Accent 2: honey amber #E8A837
   Light slide bg: #FFF8F0 (warm cream)
   Dark textures: flowing organic curve bands like topographic harvest fields, botanical
     illustration outlines of herbs/wheat/leaves at 15%, wood-grain texture strips along
     edges, hand-drawn circle/dot pattern clusters, woven basket weave watermark at 8%
   Light textures: loose botanical outline scatter at 7%, soft watercolor wash in corners,
     hand-drawn dashed border frame at 10%, small produce/leaf icon scatter at 12%
   3D hero: abundant illustrated produce arrangement, artisan ceramic bowl, glowing lantern
     with warm light spill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — BACKGROUND PHILOSOPHY (MAXIMALIST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backgrounds must be DENSE, LAYERED, VISUALLY COMPLEX — never flat. Use your preset's texture vocabulary. Stack layers simultaneously:

DARK SLIDES (cover + closing):
1. Base: radial gradient from preset's dark base outward to near-black, with primary color glow bleeding from one corner
2. Preset's primary structural texture (hex mesh / sound waves / leaf veins / grid / florals / speed lines / organic curves) covering FULL slide at 12–18% opacity
3. Preset's secondary texture pattern overlaid at 8–12% opacity
4. Scattered floating geometric shards or organic forms (theme-appropriate) in primary + accent colors, 20–40% opacity, varying sizes
5. Preset's thematic watermark motif (mandala, medallion, botanical, wave ring, circuit cluster) centered at 10–15% opacity
6. Bokeh/glow spots in primary + accent 2 colors: 6–10 circles scattered, 20–30% opacity
7. Corner vignette: preset's dark base darkening all four edges

CONTENT SLIDES:
1. Base: preset's light slide bg color
2. Large thematic watermark from preset at 6–8% opacity, centered or offset diagonally
3. Bottom-right quarter-circle arc ornament (preset's primary color), fine concentric lines, radius ~30% slide height, bleeding off edge at 18–22% opacity
4. Top-left corner accent: 3–5 stacked diagonal lines or curves (preset-appropriate), 12–15% opacity
5. 10–18 micro accent marks (diamonds, dots, small icons matching preset theme) scattered in negative space, 15–25% opacity
6. Left-edge thin gradient bar (~8px), preset primary color, 35–45% opacity fading to transparent
7. Accent line below header: 2px, preset's accent 2 color, full width

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — TEXT PRE-DETERMINATION (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALL text that will appear on a slide MUST be decided NOW, in this planning phase.
NEVER use placeholders like "event title here", "add bullet points", "your subtitle".
Every string of text destined for the rendered image MUST be wrapped in 「」 markers.

For each slide, pre-write:
- The exact main title (concise, punchy, event-specific)
- Every subtitle, tagline, label, section header
- All bullet points (3–5 per content slide), each a complete short sentence with a concrete fact or number drawn from the event description
- All diagram node labels, arrow labels, axis labels, percentage values
- The bottom-bar key takeaway sentence
- Button text on closing slide
- Bottom strip metadata line

「」 WRAPPING RULE: wrap EVERY discrete piece of text that the image renderer must draw on the slide. Each 「」 block is ONE piece of text. Do not put a paragraph inside one block — split into individual lines/bullets.

Example of CORRECT usage:
  "... header bar with title 「Sponsor Tier Structure」, three columns each with a colored header: 「Gold Tier」 「Silver Tier」 「Bronze Tier」, beneath each: bullet 「¥80,000 · Logo on main stage」 「¥40,000 · Booth + banner」 「¥15,000 · Program mention」, bottom bar reads 「Three tiers · 12 sponsor slots · Applications open now」"

Example of WRONG usage (FORBIDDEN):
  "... show the tier names and prices for each sponsorship level ..."  ← vague, no actual text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ICON VOCABULARY (PER PRESET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every content slide MUST use icons alongside text. Pick icons from the preset's vocabulary below. When writing imagePrompt, describe each icon explicitly: shape + color (hex) + size (e.g. "⚡ electric lightning bolt glyph in #00E5FF, 28px").

PRESET A · TECH icon set:
  ⚡ electric lightning bolt | 🔷 cyan hexagon tile | 🧠 neural network brain | 🔐 glowing padlock | 📡 signal antenna | 📊 bar chart | 🤖 circuit robot head | 🔗 chain link | 💡 neon light bulb | ⬡ hollow hexagon frame

PRESET B · MUSIC icon set:
  🎵 double music note | 🎤 handheld microphone | 🎸 electric guitar silhouette | 🔊 speaker waves | 🎹 piano keys strip | 🥁 snare drum | ♪ single eighth note | 🎶 beamed notes | 🎺 brass trumpet | ✨ starburst sparkle

PRESET C · NATURE icon set:
  🌿 herb sprig | 🌱 seedling sprout | 💧 teardrop water drop | ☀️ radiant sun disc | 🍃 three-leaf branch | 🌳 full tree silhouette | ♻️ recycle triangle | 🌊 wave crest | 🌸 blossom flower | 🌍 earth globe

PRESET D · CORPORATE icon set:
  📈 upward trend chart | 💼 business briefcase | 🏛️ classical column pillar | ⚖️ balance scale | 🤝 handshake silhouette | 📋 checklist clipboard | 🔑 ornate key | 🏆 award trophy | 💰 coin stack | 🌐 globe network

PRESET E · CREATIVE icon set:
  🎨 artist palette | ✏️ pencil stroke | 📷 camera lens | 🎬 film clapperboard | 🖌️ paint brush | ✨ four-point sparkle | 🖼️ picture frame | 🎭 drama masks | 🌟 five-point star | 💎 faceted diamond

PRESET F · SPORTS icon set:
  ⚡ lightning bolt | 🏆 champion trophy | 🎯 bullseye target | 💪 flexed bicep | 🚀 rocket launch | 🔥 fire flame | 🏅 winner medal | ⚔️ crossed swords | 🛡️ shield crest | ▶ play arrow

PRESET G · FOOD icon set:
  🌿 herb sprig | 🍊 citrus slice | ☕ coffee cup | 🌾 wheat sheaf | 🤝 handshake | 🏡 cottage house | 🧺 woven basket | 🥗 salad bowl | 🌻 sunflower | 🔆 radiant warmth circle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — SLIDE LAYOUT TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[COVER SLIDE — index 0]
- Apply DARK SLIDE maximalist background with your chosen preset
- Right side (55%): luminous 3D hero illustration from preset, glowing with rim-lighting in primary + accent 2 colors, radial glow halo behind it, floating above background
- Left side, vertically centered:
  • Small themed icon from preset icon set, 48px, in primary color, above title
  • Main title 「<EXACT EVENT NAME>」 in huge extra-bold white (2–3 lines, line-break after every 3–4 words)
  • Subtitle 「<EXACT SUBTITLE>」 in primary color medium weight
  • Metadata line 「<DATE · VENUE · SCALE>」 in light gray small caps
- Full-width 2px horizontal rule in primary color at ~88% slide height
- Bottom strip (last 8%): dark-base color bar, tagline 「<SHORT PUNCHY TAGLINE>」 in small white italic

[CONTENT / BODY SLIDES — index 1 to N-1]
- Apply CONTENT SLIDE maximalist background with your chosen preset
- TOP: full-width header bar in preset PRIMARY color (12% height), small preset icon + bold white title 「<SLIDE TITLE>」 left-aligned; 2px dark stripe above; 2px accent-2 line below
- CONTENT AREA: choose EXACTLY ONE layout pattern below — do NOT mix multiple patterns on the same slide. Every text element must be paired with a distinct icon from the preset vocabulary.

  PATTERN 1 · ICON-STAT ROWS (use for feature/benefit/stats slides)
    Left column (60%): 3–4 rows, each row = [preset icon, 28px, primary color] + 「<BOLD KEYWORD>」 in accent color bold + 「<one-line fact>」 in dark text regular
    Right column (40%): single large accent callout box with 「<KEY NUMBER OR QUOTE>」 in huge bold primary color + 「<supporting label>」 below

  PATTERN 2 · CARD GRID (use for multi-item overview slides)
    2×2 or 3×1 grid of cards; each card: top = [preset icon, 36px, accent-1 color] centered; title 「<CARD TITLE>」 below icon; then 「<2-line description>」 in small text; thin primary-color border

  PATTERN 3 · TIMELINE (use for schedule/process/roadmap slides)
    Horizontal or vertical timeline; each milestone: [preset icon above node] + 「<PHASE NAME>」 bold + 「<DATE>」 small caps + 「<1-line description>」; nodes connected by primary-color line

  PATTERN 4 · DATA BARS (use for comparison/metrics slides)
    3–5 horizontal bars; each bar row: [preset icon, 22px] + 「<METRIC NAME>」 left-aligned + filled bar in gradient (primary → accent-2) + 「<VALUE%>」 right-aligned at bar end

  PATTERN 5 · ICON GRID (use for agenda/multi-topic overview slides)
    3×2 or 3×3 grid; each cell: [preset icon, 48px, primary color with glow] centered + 「<SHORT LABEL>」 below; cells separated by thin dividers; cell backgrounds alternate between preset light bg and white

- BOTTOM BAR (always include): full-width dark-base bar; left: small primary-color diamond icon + 「<COMPLETE TAKEAWAY SENTENCE>」 in bold white; right: slide number in muted white

[CLOSING SLIDE — last index]
- Apply DARK SLIDE maximalist background with your chosen preset
- Large featured icon (72px, primary color) centered above headline with glow halo
- Centered headline 「<CTA HEADLINE LINE 1>」 / 「<CTA HEADLINE LINE 2>」 in extra-bold white
- Rounded-rectangle button in primary color: small icon + 「<ACTION TEXT>」 in bold white inside
- Below button: 「<CONTACT OR NEXT-STEP LINE>」 in light gray italic
- Row of 3 small icons in accent color at bottom, each with 「<SHORT LABEL>」, representing event pillars
- Bottom strip: thin primary-color rule, then 「<EVENT NAME>」 in small white

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — PROMPT WRITING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open every imagePrompt with the preset tag: "PRESET [A–G] · [theme label] style —"
2. Describe background layers FIRST (~70 words) using preset texture vocabulary with hex codes and opacity values
3. Then describe foreground layout and ALL 「」-wrapped text in order (top → bottom, left → right)
4. NEVER use vague references like "relevant title", "bullet points here", "appropriate text" — every word on the slide is written out explicitly inside 「」
5. Include the anchor phrase: "professional conference-quality presentation slide, Keynote/PowerPoint rendered screenshot"
6. Specify positions precisely: "top-left", "center-right", "full-width", "bleeding off bottom-right corner"
7. Use hex color codes for every color
8. ICONS ARE MANDATORY on content slides: every non-title row must be preceded by a themed icon. Describe each icon explicitly — shape, hex color, size (e.g. "⚡ electric lightning bolt glyph in #00E5FF at 28px"). Never write bare text rows without an icon.
9. Icon descriptions count toward total word budget — describe them concisely: "[glyph] [shape] in [hex], [size]"
10. NO DUPLICATION: each data point, fact, or piece of text must appear on EXACTLY ONE slide and in EXACTLY ONE place within that slide. Never repeat a 「」block in multiple slides or in multiple layout areas of the same slide.
11. ONE PATTERN PER SLIDE: content slides use exactly one layout pattern from STEP 5. Do not combine patterns or add extra icon rows alongside the chosen pattern.
12. Each prompt: 200–270 words total`

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prompt } = body as { prompt?: string }

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  let slides: SlidePlan[]

  try {
    const { text, finishReason } = await generate(
      'medium',
      `Plan a visual image slide deck for the following event:\n\n${prompt.trim()}`,
      { system: SYSTEM_PROMPT },
    )

    if (String(finishReason) === 'length') {
      return Response.json(
        { error: 'Model output truncated. Please retry.' },
        { status: 502 },
      )
    }

    const parsed = extractJson(text)

    if (
      !isPlainObject(parsed) ||
      !Array.isArray((parsed as Record<string, unknown>).slides)
    ) {
      throw new Error('Model did not return a valid slides array')
    }

    slides = (parsed as { slides: SlidePlan[] }).slides
  } catch (error) {
    console.error('[generate-slide-plan] failed:', error)
    return Response.json({ error: 'AI generation failed. Try again.' }, { status: 502 })
  }

  if (slides.length < 6 || slides.length > 10) {
    return Response.json(
      { error: 'Model returned an invalid number of slides (expected 6–10). Please retry.' },
      { status: 502 },
    )
  }

  // Validate individual slide shape
  const invalidSlide = slides.find(
    (s) => typeof s.title !== 'string' || typeof s.imagePrompt !== 'string' || typeof s.index !== 'number',
  )
  if (invalidSlide) {
    return Response.json(
      { error: 'Model returned malformed slide data. Please retry.' },
      { status: 502 },
    )
  }

  return Response.json({ slides })
}
