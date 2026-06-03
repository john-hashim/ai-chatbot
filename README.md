# AI Chatbot Builder

A full-stack SaaS platform for creating, training, and deploying custom AI chatbots. Train chatbots with documents, text, links, and Q&A pairs, customize their appearance, embed them on websites, and monitor performance with analytics.

## Features

- **Chatbot Creation** — Multi-step wizard with branding (name, color, logo)
- **Document Training** — Upload PDFs, DOCX, plain text, Q&A pairs, or crawl websites
- **RAG-based Chat** — Vector similarity search (pgvector) for context-aware responses
- **LLM-driven Actions** — Action registry where the LLM detects intent (e.g. booking) and triggers structured flows mid-stream
- **Appointment Booking** — Weekly + date-specific availability, time slot generation, in-chat booking with confirm/cancel flow and email notifications
- **Customization** — Light/dark mode, brand colors, chat bubble styling, initial messages
- **Playground** — Test chatbot with custom instructions before deployment
- **Embedding** — Deploy as a widget or iframe with domain whitelisting; in-widget booking UI for date/time selection
- **Analytics** — Message counts, session metrics, geolocation, like/dislike stats
- **Chat History** — View sessions with sort/filter, export as JSON/CSV/PDF
- **Account & Profile** — Profile popover in header, profile editing, editable notification email, chatbot switcher
- **Streaming UX** — Single-stream chat controller with typewriter effect and action-token detection
- **Per-chatbot model selection** — Choose any OpenRouter-hosted LLM (OpenAI, Anthropic, Google, Meta, DeepSeek, etc.) per chatbot via a curated registry grouped into free / standard / premium tiers
- **Google OAuth** — Authentication for users

## Tech Stack

### Frontend

| Category | Technology |
|---|---|
| Framework | React 19, TypeScript, Vite 7 |
| UI | Mantine 8, Tailwind CSS 4 |
| State | Zustand |
| Routing | React Router 7 |
| Forms | React Hook Form |
| Charts | Recharts |
| HTTP | Axios |

### Backend

| Category | Technology |
|---|---|
| Framework | Express 5, TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL + pgvector |
| LLM | OpenRouter SDK (`@openrouter/sdk`) — model selectable per chatbot from a curated registry |
| Embeddings | HuggingFace (BGE-small-en, 384-dim) |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | Google OAuth |
| Scraping | Playwright |
| Email | Resend (booking notifications) |
| Docs | pdf-parse, Mammoth, PDFKit |

## Project Structure

```
ai-chatbot/
├── frontend/
│   └── src/
│       ├── feature/            # Feature modules (pages)
│       │   ├── auth/           # Authentication
│       │   ├── Landing/        # Landing page
│       │   ├── create-chatbot/ # Chatbot creation wizard
│       │   ├── chatbot/        # Chatbot dashboard
│       │   ├── playground/     # Instruction settings & preview
│       │   ├── customize/      # Style & content customization
│       │   ├── knowledgebase/  # Document management
│       │   ├── sources/        # Data source upload (Files, Text, Links, Q&A)
│       │   ├── chats/          # Chat history with sort/filter
│       │   ├── analytics/      # Analytics dashboard
│       │   ├── deploy/         # Embed configuration
│       │   ├── bookings/       # Appointments + availability (weekly & date-specific)
│       │   ├── automations/    # Automation rules
│       │   ├── account/        # Account settings & profile
│       │   ├── billing/        # Billing
│       │   └── contacts/       # Contact management
│       ├── components/         # Reusable components (ChatbotWidget, TextEditor, etc.)
│       ├── api/                # Axios client, endpoints, service modules
│       ├── store/              # Zustand slices (chatbot, user, booking)
│       ├── hooks/              # Custom hooks
│       ├── types/              # TypeScript types
│       ├── utils/              # Utility functions
│       └── App.tsx             # Root component with lazy-loaded routing
│
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers (chat, chatbot, document, bookings, ...)
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic (chat, training, embedding, crawling, booking, email)
│   │   ├── actions/            # Action registry — LLM-driven flows (booking, etc.)
│   │   ├── middleware/         # Auth, embed auth, file upload, error handling
│   │   ├── prisma/             # Prisma client
│   │   ├── constants/          # System instructions
│   │   └── app.ts              # Express app entry point
│   └── prisma/
│       ├── schema.prisma       # Database schema
│       └── migrations/         # Migration history
│
└── README.md
```

## Prerequisites

- **Node.js** v20 LTS or higher
- **PostgreSQL** v14+ with **pgvector** extension — either local (see below) or a managed provider with pgvector built in (e.g. [Neon](https://neon.tech), Supabase). Neon is what this project deploys against.
- **npm**

## Setup

### 1. PostgreSQL + pgvector

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
brew install pgvector
```

**Ubuntu/Debian:**

```bash
sudo apt install postgresql postgresql-contrib
# pgvector: https://github.com/pgvector/pgvector#installation
```

**Create database:**

```sql
psql -U postgres

CREATE USER your_user WITH PASSWORD 'your_password';
CREATE DATABASE chatbot OWNER your_user;
\c chatbot
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend

```bash
cd backend
npm install
npx playwright install          # downloads Chromium for website crawling
```

**Environment files.** The backend splits env vars across files so you can switch between a local DB and a cloud DB (Neon) with a *script*, not by editing files. `dotenv-cli` loads the right combination per npm script. Copy `backend/.env.example` as a reference, then create:

| File | Contents | Git |
|---|---|---|
| `.env` | Shared secrets (everything **except** the DB URLs) | ignored |
| `.env.local` | `DATABASE_URL` + `DIRECT_URL` for **local** Postgres | ignored |
| `.env.development` | `DATABASE_URL` + `DIRECT_URL` for **Neon** | ignored |
| `.env.example` | Placeholder template (committed) | tracked |

The DB URLs live **only** in the per-env files and shared secrets **only** in `.env` — no key overlap, so there is no way to accidentally run the app against one DB while migrating another.

`backend/.env` (shared secrets):

```env
PORT=3001

# Google OAuth (same client ID used in frontend) + Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3001/api/chatbot/calendar/google/callback
OAUTH_STATE_SECRET=any-long-random-string
FRONTEND_URL=http://localhost:5173

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=chatbot
R2_PUBLIC_URL=https://your-r2-public-url

# HuggingFace (used for text embeddings)
HUGGINGFACE_API_KEY=hf_your_key

# OpenRouter (all chat completions: streaming responses + booking classifier)
OPENROUTER_API_KEY=sk-or-your_key
# Optional — surfaces your app in the OpenRouter dashboard for attribution
OPENROUTER_SITE_URL=https://yourapp.com
OPENROUTER_SITE_NAME=AI Chatbot Builder

# Email notifications (booking confirmations) — Resend
RESEND_API_KEY=re_your_key
BOOKING_EMAIL_FROM="Chatbot <noreply@yourdomain.com>"
```

`backend/.env.local` (local Postgres — no pooler, so both URLs are identical):

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/chatbot?schema=public"
DIRECT_URL="postgresql://<user>:<password>@localhost:5432/chatbot?schema=public"
```

`backend/.env.development` (Neon — pooled URL for runtime, direct/unpooled for migrations):

```env
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.<region>.aws.neon.tech/<db>?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://<user>:<pass>@<host>.<region>.aws.neon.tech/<db>?sslmode=require"
```

Run migrations and start (pick the target via the script suffix):

```bash
npm run migrate:dev             # migrate local DB (creates pgvector, runs migrations + generates client)
npm run dev                     # run against local DB on port 3001

# …or target Neon:
npm run migrate:deploy:neon     # apply migrations to Neon
npm run dev:neon                # run against Neon

npm run studio                  # browse local DB  (studio:neon for Neon)
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_URL=http://localhost:3001/api/
```

Start:

```bash
npm run dev                     # runs on port 5173
```

## External Services

| Service | Purpose | Where to Get |
|---|---|---|
| Google OAuth | User authentication | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| Cloudflare R2 | File/document storage | Cloudflare dashboard → R2 |
| HuggingFace | Text embeddings (BGE-small-en) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| OpenRouter | Chat completions — OpenAI, Anthropic, Google, Meta, DeepSeek, etc. | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Resend | Booking confirmation emails | [resend.com/api-keys](https://resend.com/api-keys) |

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/google/signin` | Google OAuth sign-in |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |

### Chatbot (`/api/chatbot`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/create` | Create chatbot |
| GET | `/chatbots` | List user's chatbots |
| GET | `/:chatbotId` | Get chatbot details |
| PATCH | `/:chatbotId` | Update chatbot |
| DELETE | `/:chatbotId` | Delete chatbot |

### Models (`/api/models`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List curated chat models grouped by tier (free / standard / premium), plus the default model id used as a fallback |

### Embed Config (`/api/chatbot`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:chatbotId/embed` | Create embed config |
| GET | `/:chatbotId/embed` | Get embed config |
| PATCH | `/:chatbotId/embed` | Update embed config |

### Documents (`/api/chatbot`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload-url` | Get presigned upload URL |
| POST | `/delete-file` | Delete uploaded file |
| POST | `/:chatbotId/upload-document` | Upload document |
| POST | `/:chatbotId/upload-text` | Upload text content |
| POST | `/:chatbotId/crawl-website` | Crawl website |
| DELETE | `/documents/:documentId` | Delete document |
| POST | `/documents/delete-multiple` | Bulk delete documents |
| POST | `/:chatbotId/train` | Train chatbot |
| GET | `/:chatbotId/training-status` | Check training status |

### Chat (`/api/chatbot`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:chatbotId/chat` | Send message |
| GET | `/:chatbotId/chat-sessions` | List chat sessions |
| GET | `/:chatbotId/:sessionId` | Get session details |
| PATCH | `/:chatbotId/:sessionId/:messageId` | Update message feedback |
| DELETE | `/:chatbotId/:sessionId` | Delete session |
| GET | `/:chatbotId/export/json` | Export as JSON |
| GET | `/:chatbotId/export/csv` | Export as CSV |
| GET | `/:chatbotId/export/pdf` | Export as PDF |

### Analytics (`/api/chatbot`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:chatbotId/analytics` | Get chatbot analytics |

### Bookings (`/api/bookings`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:chatbotId/availability` | Create availability slot |
| GET | `/:chatbotId/availability` | Get availability config |
| PATCH | `/:chatbotId/availability/:slotId` | Update time slot |
| DELETE | `/:chatbotId/availability/:slotId` | Delete time slot |
| GET | `/:chatbotId/booking-config` | Get booking config |
| PATCH | `/:chatbotId/booking-config` | Update booking config (timezone, notification email, etc.) |
| POST | `/:chatbotId/booking/timeslots` | Get available time slots for a given date |
| POST | `/:chatbotId/booking/confirm` | Confirm an appointment |
| POST | `/:chatbotId/booking/cancel` | Cancel an in-progress booking flow |

### Embed (Public) (`/api/embed`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:embedKey/config` | Get embed config |
| POST | `/:embedKey/chat` | Send message via embed (LLM-driven actions emitted in stream) |
| PATCH | `/:embedKey/:sessionId/:messageId` | Update message feedback |

## Important Notes

- **pgvector** must be installed before running migrations — the migration creates `vector(384)` columns that require it.
- The same **Google OAuth Client ID** is used in both frontend and backend `.env` files.
- `npx playwright install` downloads Chromium, required for the website crawling feature.
- The backend uses **ESM** (`"type": "module"` in package.json).
- **LLM provider** — all chat completions (streaming responses + the booking-flow classifier) go through OpenRouter via `@openrouter/sdk`. The model used per request comes from `Chatbot.selectedModel`; the curated catalog lives in `backend/src/constants/models.ts` and is exposed via `GET /api/models`. Unknown / null ids fall back to `DEFAULT_MODEL_ID`. Embeddings always use HuggingFace.
- **Action tokens** — the LLM emits sentinel tokens (e.g. `__ACTION:BOOKING__`) that the chat controller intercepts to drive structured flows like appointment booking. Tokens are buffered server-side so they never leak to the client.
- **Resend** (`RESEND_API_KEY` + `BOOKING_EMAIL_FROM`) is required only if you want booking confirmation emails sent on appointment creation.
- **Environment files** — the backend keeps DB URLs out of the base `.env`; `.env.local` (local) and `.env.development` (Neon) each hold `DATABASE_URL` (pooled) + `DIRECT_URL` (direct, for migrations). Switch targets with the `dev` / `dev:neon` (and `migrate:dev` / `migrate:deploy:neon`) scripts rather than editing files. Use `prisma migrate dev`, not `db push`, to keep migration history in sync.

## Deployment

The three apps stay in **one repository** — each deploys from its own subdirectory (no need to split into separate repos; Vercel and Railway both support a per-service "Root Directory"). Recommended setup, all on free/low-cost tiers:

| App | Host | Notes |
|---|---|---|
| Database | **Neon** | Serverless Postgres with **pgvector** built in. Pooled URL → `DATABASE_URL`, direct URL → `DIRECT_URL`. Kept off Railway so an always-on Postgres doesn't drain the Railway credit. |
| `backend` | **Railway** | Root Directory `backend`. Start command: `npx prisma migrate deploy && node dist/app.js` (build `npm run build`). Set all shared secrets + the two Neon URLs as dashboard env vars (no `.env` files in prod). |
| `frontend` | **Vercel** | Root Directory `frontend` (Vite). Set `VITE_API_URL` to the Railway backend URL at build time. |
| `embed` | **Vercel / CDN** | Root Directory `embed`. Static build outputs the IIFE `embed.js` (the `<script>` tag) + the iframe page; served over the platform CDN. |

**Deploy order:** DB → backend → frontend → embed (each depends on the previous; the frontend needs the live backend URL, and the embed widget calls the backend's public `/api/embed/...` routes).

In production, env vars come from the platform dashboard — `dotenv.config()` simply no-ops when no `.env` file is present.
