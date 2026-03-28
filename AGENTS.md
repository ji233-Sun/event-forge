<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Key doc paths (App Router only — we do NOT use Pages Router):**
- Getting started & file conventions: `node_modules/next/dist/docs/01-app/01-getting-started/`
- Guides (auth, forms, caching, data fetching…): `node_modules/next/dist/docs/01-app/02-guides/`
- API reference (components, functions, config): `node_modules/next/dist/docs/01-app/03-api-reference/`
- Instant navigation gotcha: read `02-guides/instant-navigation.md` before touching `<Link>` or navigation logic
<!-- END:nextjs-agent-rules -->

---

# Drizzle ORM

**Version:** 0.45.2 | **Docs:** https://orm.drizzle.team/docs (use context7 MCP for offline lookup)

## Project layout

```
lib/db/
├── index.ts          # DB client (singleton, export `db`)
└── auth-schema.ts    # All DB tables (BetterAuth-generated, extend here)
drizzle.config.ts     # Points to lib/db/auth-schema.ts, dialect: postgresql
```

## Rules

- **Always** import `db` from `@/lib/db` — never instantiate a new client
- The `DATABASE_URL` connects through **Supabase Transaction Pooler** (port 6543) — `{ prepare: false }` is already set in `lib/db/index.ts`, do not remove it
- Add new tables to `lib/db/auth-schema.ts` (do not create separate schema files unless the domain is large enough to justify it)
- After schema changes, apply with: `npx drizzle-kit push`
- For migrations (production): `npx drizzle-kit generate` then `npx drizzle-kit migrate`
- Do NOT use raw SQL or `postgres` client directly — always go through `db`

---

# BetterAuth

**Version:** 1.5.6 | **Docs:** https://better-auth.com/docs (use context7 MCP for offline lookup)

## Project layout

```
lib/
├── auth.ts           # Server-side auth instance (betterAuth config)
└── auth-client.ts    # Client-side auth instance (createAuthClient)
app/api/auth/[...all]/route.ts  # Catch-all API handler
lib/db/auth-schema.ts           # DB tables (user, session, account, verification)
```

## Rules

- Server calls (Route Handlers, Server Components, Server Actions): import `auth` from `@/lib/auth`
- Client calls (React components): import `authClient` from `@/lib/auth-client`
- The Drizzle adapter uses `provider: 'pg'` with the schema passed explicitly — keep `schema` import in `lib/auth.ts`
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` must be set in `.env`
- To add auth plugins (e.g. OAuth, 2FA), extend `lib/auth.ts` and re-run `npx auth@latest generate`
- Never call BetterAuth REST endpoints directly from server code — use the `auth` instance methods

---

# AI SDK

## Project layout

```
lib/ai/
├── provider.ts       # Shared OpenAI-compatible provider (canonical AI interface)
├── models.ts         # Text model tiers: simple / medium / hard
├── image.ts          # Shared image model + generateImage helper
└── index.ts          # Public AI entrypoint for app code
```

## Rules

- Treat `@/lib/ai` as the canonical AI interface for this repo. AI agents should use it first for any LLM or image generation task.
- Prefer `generate`, `stream`, `generateImage`, and `getModel` from `@/lib/ai` before reaching for raw SDK primitives.
- If a feature needs lower-level AI SDK capabilities (tool calling, structured outputs, embeddings, etc.), keep using the shared model instances from `@/lib/ai` and pair them with the `ai` package APIs. Do not create a new provider in feature code.
- Do NOT import `createOpenAI`, `createOpenAICompatible`, `OpenAI`, or any other vendor SDK in app feature code unless you are explicitly changing the shared provider layer in `lib/ai/`.
- The shared provider is configured in `lib/ai/provider.ts`. Keep `baseURL`, `apiKey`, headers, vendor switching, and compatibility logic centralized there.
- Current default tier mapping: `simple` -> `QWEN_MODEL_SIMPLE` / `qwen-turbo`; `medium` -> `QWEN_MODEL_MEDIUM` / `qwen-plus`; `hard` -> `QWEN_MODEL_HARD` / `qwen-max`; image -> `QWEN_MODEL_IMAGE` / `wanx2.6-t2i-turbo`.
- `lib/ai/provider.ts` and `lib/ai/image.ts` are server-only. Do not import provider code directly into Client Components.
- When an AI agent needs "the project's AI API", that means the repo-owned interface exported from `@/lib/ai` and backed by the shared provider, not a fresh third-party endpoint created ad hoc.

## Usage

### Text generation

```ts
import { generate } from '@/lib/ai'

const { text } = await generate(
  'medium',
  'Write a sponsor outreach email for a student music festival.',
)
```

### Streaming text

```ts
import { stream } from '@/lib/ai'

const result = stream(
  'medium',
  'Draft a launch announcement for an event registration page.',
)
```

### Lower-level AI SDK features

```ts
import { generateText } from 'ai'
import { getModel } from '@/lib/ai'

const result = await generateText({
  model: getModel('hard'),
  system: 'You are an event operations planner.',
  prompt: 'Break this event request into execution workstreams.',
})
```

### Image generation

```ts
import { generateImage } from '@/lib/ai'

const { images } = await generateImage(
  'Cyberpunk campus music festival poster, neon lights, cinematic composition',
  { size: '1024x1024' },
)
```

---

# UI Language

**Rule:** All UI text must be written in English — labels, placeholders, button text, error messages, descriptions, aria-labels, and any other user-visible strings. Do not use Chinese or any other language in UI copy.

---

# shadcn/ui

**Docs:** https://ui.shadcn.com/docs (use context7 MCP for offline lookup)

## Project config (`components.json`)

| Key | Value |
|-----|-------|
| Style | `radix-vega` |
| Icon library | `tabler` |
| Base color | `neutral` |
| CSS variables | `true` |
| RSC | `true` |

## Rules

- Add components with: `npx shadcn@latest add <component-name>`
- Components land in `components/ui/` — do not hand-write UI primitives that shadcn provides
- Icons: use `@tabler/icons-react`, not lucide-react or heroicons
- Theming is via CSS variables in `app/globals.css` — do not hardcode colors
- Style is `radix-vega` (not `default` or `new-york`) — check the shadcn docs for correct variant names before using them
