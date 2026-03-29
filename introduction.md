# EventForge — The All-in-One AI Event Operating System

**Tagline:** One prompt. Your entire event infrastructure, generated.

## What is EventForge?

EventForge is a next-generation AI-powered event management platform built on **Agentic Workflows** and **dynamic component rendering (Artifacts)**. Instead of juggling a dozen disconnected tools, organizers describe their event in a single prompt and EventForge's AI agent automatically assembles a complete, interactive toolbox.

## The Problem

Planning a campus or commercial event today means constant context-switching across fragmented platforms:

| Need | Typical tool |
|------|-------------|
| Sponsorship pitch deck | PowerPoint / Google Slides |
| Promotional poster & BGM | Canva, CapCut, Suno |
| Registration & surveys | Wenjuanxing, Jinshuju |
| On-site interactions | Third-party lottery & voting mini-apps |

The result is wasted time on "platform-hopping" and siloed data. EventForge collapses the entire lifecycle into one conversational interface.

## Core Features

### 🛠️ Slide Generator
The AI analyzes your event theme, scale, and goals, then renders an **interactive pitch deck** (powered by Reveal.js/Slidev) directly in the browser — no PowerPoint required. One click exports to PDF for sponsors.

### 🎨 Multimedia Engine
Using multi-modal AI models, EventForge generates:
- **Event posters** matched to your theme (via image generation models)
- **Background music clips** to set the atmosphere
- **Promotional copy** ready for social media

### 📊 Dynamic Surveys & Forms
The agent detects data-collection needs from your prompt and scaffolds:
- **Pre-event surveys** (multi-choice, ranking, open text)
- **Registration forms** with auto-included fields (name, ID, emergency contact)

All responses land in EventForge's built-in lightweight database — no CSV exports needed.

### 🎯 On-site Interaction Tools
For live events, EventForge generates dedicated web apps such as real-time voting leaderboards or themed prize-wheel spinners, ready to share via a single link.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js · Tailwind CSS · shadcn/ui |
| AI Orchestration | Vercel AI SDK (Tool Calling via Next.js Route Handlers) |
| Image Generation | Qwen multi-modal / DALL-E compatible |
| Authentication | BetterAuth (email + social login, role-based access) |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| Email | Nodemailer (SMTP) |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and describe your event to get started.

## Project Structure

```
app/           # Next.js App Router pages and API routes
components/    # Reusable UI components (shadcn/ui based)
lib/
├── ai/        # Shared AI provider, models, and image helpers
├── auth.ts    # Server-side BetterAuth instance
├── auth-client.ts  # Client-side BetterAuth instance
└── db/        # Drizzle ORM client and schema
public/        # Static assets
```

## License

MIT
