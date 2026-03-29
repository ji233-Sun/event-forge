# Product Brief: EventForge

---

## A. Problem Statement

Campus activity organizers—student union officers, club presidents, and independent student event leads at universities—face a severely fragmented toolchain every time they plan an event.

Preparing for a single campus music festival or conference requires bouncing between Canva (poster design), PowerPoint (sponsor pitch deck), Wenjuanxing / Google Forms (registration & surveys), and separate third-party mini-programs for on-site interactions like voting boards and lucky draws.

**The Pain Point:** This cross-platform switching consumes 3–5 hours of setup time before any real event planning begins. Data collected across tools lives in silos, cannot be shared with collaborators in one place, and must be manually collated for post-event review. When organizers fail to get these assets ready on time, sponsor pitches are delayed, audience engagement drops, and the overall quality of the campus experience suffers.

---

## B. Solution

EventForge is a single web application that turns a plain-text event brief into a complete, ready-to-use event toolkit. The user writes one paragraph (event name, theme, audience size, tone) and the platform generates four categories of assets in parallel:

- **Slide Studio:** Generates a structured Marp pitch deck (sponsor presentation with theme, layout, and bullet points). Users can refine any slide with natural language instructions and export or present directly in the browser—no PowerPoint required.
- **Media Studio:** Produces a themed promotional poster (via Alibaba Wanx), a 30-second instrumental background soundtrack (via MiniMax), and social copy ready for WeChat or Xiaohongshu—all from the same brief.
- **Surveys:** Provides a drag-and-drop survey builder with custom question types, shareable live links, and a real-time response dashboard with charts. All data stays inside EventForge, eliminating manual CSV exports.
- **Question Types (MiniTool):** The user describes an interactive component in plain language (e.g., "a cyberpunk-themed voting leaderboard"). The platform's code-specialized AI generates a fully working React component, sandboxed and instantly deployable inside any survey or on-site screen, replacing the need for third-party mini-programs.

---

## C. Target Users

**Primary User**
Student event organizers at Chinese universities (typically aged 18–24), responsible for planning 2–8 campus events per academic year. They have basic digital literacy but no design or front-end development background. Their primary trigger is the two-week window between "event approved" and "assets must be submitted," during which they must produce all materials simultaneously.

**Usage Scenario**
A student club president needs to organize a 200-person cyberpunk campus music festival. She opens EventForge, types a brief describing the theme, attendance, and her need for a sponsor deck and voting system. Within three minutes, she receives:

1.  A Marp pitch deck to email sponsors.
2.  A Wanx-generated cyberpunk poster for WeChat.
3.  An electronic background soundtrack playing in the browser.
4.  A registration survey link for immediate distribution.
5.  A live, deployable React voting widget generated via the MiniTool by simply prompting: _"real-time band popularity voting board with cyberpunk styling."_

---

## D. Core Value Proposition

> **One-Sentence Value Proposition:** > For campus event organizers, EventForge generates a complete set of event assets—pitch deck, poster, soundtrack, survey, and live interactive components—from a single text brief, enabling them to go from idea to fully operational event infrastructure in minutes, unlike the current approach of switching between five separate tools with no shared data layer.

**Brief Explanation:**
Today's student organizers spend more time wrangling disconnected tools than actually running their events. EventForge consolidates the entire pre-event and on-site production workflow into one AI-driven session. Because all assets are generated from the same brief and stored in one place, organizers can iterate quickly, share with collaborators instantly, and reuse components across future events.

---

## E. AI & Technical Approach

### Models Used

- **Text LLMs (Qwen series via Alibaba DashScope):** `qwen-turbo` for fast generation tasks; `qwen-plus` for balanced content like slides and surveys; `qwen-max` for complex multi-step reasoning.
- **Code-Specialized LLM (MiniMax-M2.7):** Specifically used to generate syntactically correct, runnable React component code from natural language in the MiniTool feature.
- **Image Generation (Alibaba Wan2.6-t2i):** Generates themed event posters from a text prompt.
- **Music Generation (MiniMax music-2.5+ API):** Generates instrumental soundtracks matched to the event's theme and mood.

### Role of AI in the Product

- **Text LLMs** parse the brief, extract structured attributes, and generate cohesive copy across all modules in one coordinated session.
- **The Code LLM** translates interaction descriptions into complete, working React components with state management.
- **The Image Model** produces visual assets tuned to the theme, requiring zero design skills.
- **The Music Model** creates matching background audio, eliminating the search for royalty-free tracks.

### Why AI is the Right Approach

Fixed templates cannot adapt to the infinite variety of campus events. A rule-based system could produce a generic sponsor deck, but it cannot generate a cyberpunk presentation, matching visuals, and a contextual on-site interaction component from one paragraph. The code generation use case is specifically impossible without a code-capable LLM. AI is the only approach that scales personalization to zero-configuration input.

---

## F. Key Assumptions

- **Assumption 1:** Campus organizers will accept AI-generated first drafts as a starting point because their primary pain point is "time-to-first-draft," not pixel-perfect quality. _(Partially validated internally; pending structured cohort testing)._
- **Assumption 2:** The code generated by MiniMax-M2.7 will be syntactically correct and safely executable in a sandboxed browser environment for most narrow use cases (interactive React widgets). _(Validated for simple components; pending testing for complex stateful hooks)._
- **Assumption 3:** Chinese university students have sufficient English reading ability to navigate an English-language UI, or the Chinese AI output is clear enough to compensate. _(Pending formal validation; UI is currently English-only)._

---

## G. Differentiation

**Current Alternatives**
Existing tools serve isolated parts of the workflow: Canva (design), PowerPoint/WPS (pitch decks), Wenjuanxing/Tencent (forms), and bespoke mini-programs (on-site interactions). General-purpose AI (ChatGPT, Tongyi Qianwen) can draft outlines but outputs plain text that still requires manual assembly.

**What Makes EventForge Different**
EventForge is the **only** tool specifically scoped to the campus organizer's end-to-end workflow that produces directly usable, rendered artifacts from a single input. The MiniTool (Question Types) is the sharpest differentiator: no existing consumer tool lets a non-developer describe a widget in plain language and receive a deployable, sandboxed React component in 30 seconds, bypassing days of custom development.
