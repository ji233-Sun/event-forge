# EventForge

**EventForge** is an AI-powered event and survey management platform built with Next.js, featuring intelligent question type generation, interactive minitool creation, and multimedia integration.

## Features

- **AI-Driven Surveys:** Generate custom interactive question types and survey components powered by LLMs
- **Live Minitools:** Create interactive event tools (rating scales, image pickers, leaderboards) on the fly
- **Multimedia Integration:** Support for AI-generated images, music, and interactive content
- **Slide Decks:** Visual slide creation with AI-powered image generation
- **Real-time Collaboration:** Live event interactions with participant feedback
- **Custom Question Types:** Flexible schema-based question builder with code generation
- **Multi-language Support:** Built with internationalization in mind

## Tech Stack

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers, Drizzle ORM
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** BetterAuth 1.5+
- **AI/LLM:** Qwen models (image, text generation) + MiniMax (code generation)
- **Storage:** Cloudflare R2 (audio, images, slides)
- **Email:** SMTP (Aliyun DM or compatible)
- **Styling:** Tailwind CSS with CSS variables (radix-vega theme)
- **Testing:** Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ (or use `uv` for Python-based tooling)
- PostgreSQL 14+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

```bash
git clone <repo-url>
cd event-forge
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

4. **Initialize the database**

```bash
npx drizzle-kit push
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
event-forge/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── minitools/            # Interactive tool generation
│   │   ├── question-types/       # Custom question type generation
│   │   ├── question-runtime/     # Question rendering & AI hooks
│   │   ├── generate-*            # Image/slide/plan generation
│   │   └── auth/                 # Authentication endpoints
│   ├── (auth)/                   # Auth group (login, register)
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── surveys/              # Survey management
│   │   ├── question-types/       # Question type builder
│   │   ├── media/                # Media management
│   │   └── profile/              # User profile
│   └── globals.css               # Global styles
├── lib/
│   ├── auth.ts                   # Server auth instance
│   ├── auth-client.ts            # Client auth instance
│   ├── db/                       # Database setup & schema
│   ├── ai/                       # AI/LLM interface layer
│   │   ├── provider.ts           # Model provider abstraction
│   │   ├── models.ts             # Model tier definitions
│   │   └── image.ts              # Image generation logic
│   ├── question-runtime/         # Question runtime hooks & scope
│   ├── multimedia/               # Multimedia generation
│   └── r2.ts                     # Cloudflare R2 storage
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── slides/                   # Slide editor & renderer
│   ├── slide-studio/             # Slide design tools
│   └── landing/                  # Landing page sections
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── drizzle/                      # Database migrations
└── vitest.config.ts              # Testing configuration
```

## Key Workflows

### 1. Survey Creation & Question Types

- Navigate to **Question Types** → **New** to generate a custom question component
- Provide a description (e.g., "rating stars with emoji reactions")
- AI generates `formCode` (interactive survey UI), `displayCode` (read-only results view), and `answerSchema`
- Test in the live preview and deploy to your surveys

### 2. Minitools (Live Event Tools)

- Access **Minitools** → **New** to create interactive event activities
- Describe your interaction (e.g., "live voting leaderboard")
- AI generates `componentCode` (participant view) and `hostCode` (host/moderator view)
- Deploy as embeddable widgets in events

### 3. Multimedia & Slides

- Use **Slides** builder to create visual decks with AI-generated images
- Specify slide content and image prompts
- AI generates poster images and exports as PDF/PPTX
- Share or embed in surveys

### 4. Live Surveys

- Create a survey with custom question types and multimedia
- Share the survey link with participants
- Monitor responses in real-time
- View analytics and export results

## Environment Variables

See [`.env.example`](.env.example) for a complete template. Key variables:

### Database
- `DATABASE_URL` — PostgreSQL connection string

### Authentication
- `BETTER_AUTH_SECRET` — BetterAuth secret key
- `BETTER_AUTH_URL` — Base URL for auth redirects (e.g., `http://localhost:3000`)

### Email (SMTP)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` — SMTP server config
- `SMTP_USER`, `SMTP_PASS` — SMTP credentials
- `EMAIL_FROM` — Sender email address

### AI Models (Qwen/阿里百炼)
- `QWEN_API_KEY` — API key for Qwen models
- `QWEN_MODEL_SIMPLE` — Fast model (e.g., `qwen3.5-flash`)
- `QWEN_MODEL_MEDIUM` — Balanced model
- `QWEN_MODEL_HARD` — Advanced model (e.g., `qwen3.5-plus`)
- `QWEN_MODEL_IMAGE` — Image generation model (e.g., `qwen-image-2.0`)

### AI Models (MiniMax)
- `MINIMAX_API_KEY` — MiniMax API key
- `MINIMAX_MODEL_CODE` — Code generation model

### Cloud Storage (Cloudflare R2)
- `R2_ACCOUNT_ID` — Account ID
- `R2_BUCKET_NAME` — Bucket name
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — Credentials

## Development

### Running Tests

```bash
npm run test
```

### Linting & Type Checking

```bash
npm run lint
npx tsc --noEmit
```

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Generate a new migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Reset dev database
npx drizzle-kit push
```

### Prisma Studio (optional, for data inspection)

```bash
npx prisma studio
```

## API Routes

### Survey Management
- `POST /api/surveys` — Create survey
- `GET /api/surveys/:id` — Get survey
- `PUT /api/surveys/:id` — Update survey

### Question Types
- `GET /api/question-types` — List question types
- `POST /api/question-types/generate` — Generate new question type via AI

### Minitools
- `GET /api/minitools` — List minitools
- `POST /api/minitools/generate` — Generate new minitool via AI

### Image & Multimedia
- `POST /api/generate-slide-image` — Generate slide image
- `POST /api/generate-slide-plan` — Generate slide plan
- `POST /api/multimedia` — Create multimedia content

### Question Runtime
- `POST /api/question-runtime/image` — AI image generation for question
- `POST /api/question-runtime/music` — AI music generation for question
- `POST /api/question-runtime/upload` — File upload for question

### Authentication
- `POST /api/auth/sign-in` — Sign in
- `POST /api/auth/sign-up` — Sign up
- `POST /api/auth/sign-out` — Sign out

## Code Sandbox (react-live)

Question types and minitools run in a **Sucrase-based browser sandbox** using react-live. This means:

- **No TypeScript syntax** — All generated code must be plain JavaScript + JSX
- **Pre-injected scope** — React hooks, shadcn components, and Tabler icons are available globally
- **Null safety mandatory** — Always guard undefined props and hook state
- **No imports** — All dependencies must be passed via scope

See [app/(dashboard)/surveys/[surveyId]/components/custom-question-renderer.tsx](app/(dashboard)/surveys/[surveyId]/components/custom-question-renderer.tsx) for the sandbox setup.

## AI Code Generation Rules

### Question Types & Minitools

Generated components must follow strict rules to run in the sandbox:

- ✅ Props always start as `undefined` or `null` — always guard before accessing
- ✅ AI hooks (`useImageGen`, `useMusicGen`, `useChat`, `useFileUpload`) return plain strings (URLs), not objects
- ✅ Image/audio URLs are proxy paths like `/api/media/...`, not base64 data URLs
- ✅ Use null coalescing guards: `{imageUrl && <img src={imageUrl} />}`
- ❌ No TypeScript syntax (no type annotations, no generics, no `as` casts)
- ❌ No import/export statements
- ❌ No logical assignment operators (`??=`, `||=`, `&&=`)

### Form vs Display Components

- **formCode** (survey answering UI) — Must be fully interactive with visible feedback (loading, success, error states)
  - Call `onChange` whenever the answer changes
  - Display generated content (images, audio, text results) in real-time
- **displayCode** (results display UI) — Must be static and read-only
  - Do NOT include input controls, buttons, or `onChange` calls
  - Only display submitted answer data or "No answer yet"

## Internationalization (i18n)

UI text must be in **English**. All user-facing strings (labels, placeholders, error messages, aria-labels) should be in English.

## UI Design System

This project uses **shadcn/ui** (radix-vega style) with CSS variables:

- Color tokens: `bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.
- Always use shadcn components over raw HTML elements
- Icons from `@tabler/icons-react` (not lucide or emoji)
- Spacing via Tailwind utilities (`gap-4`, `p-6`, `space-y-3`, etc.)

## Performance Optimization

- **Caching:** API responses cached via Next.js `revalidatePath` / `revalidateTag`
- **Image Optimization:** Next.js `Image` component for responsive images
- **Code Splitting:** Dynamic imports for heavy components
- **Database:** Connection pooling via Supabase

## Troubleshooting

### "onChange is not a function"

This usually means a generated component is calling `onChange` without it being present in the scope. The renderer now auto-strips trailing `render()` calls and injects a safe version. If you still see this error, check that the question type form code is valid.

### Image URLs showing as base64

Old code may still try to parse image URLs as base64. Image/audio/file URLs are now always HTTP proxy paths (e.g., `/api/media/...`). Never use `Buffer.from(imageUrl, 'base64')`.

### "TypeScript syntax not supported"

Generated code runs in a browser sandbox without TypeScript. If you see this error during generation, it means the AI included type annotations. The auto-fix endpoint (`/api/fix-code`) can correct it.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Support

For questions or issues:

- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the codebase comments for implementation details

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Template library for common surveys
- [ ] Export to Typeform/SurveyMonkey formats
- [ ] Webhook integrations
- [ ] Multi-language AI generation
