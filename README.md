# AI Chatbot Builder

A full-stack SaaS platform for creating, training, and deploying custom AI chatbots. Train chatbots with documents, text, links, and Q&A pairs, customize their appearance, embed them on websites, and monitor performance with analytics.

## Features

- **Chatbot Creation** — Multi-step wizard with branding (name, color, logo)
- **Document Training** — Upload PDFs, DOCX, plain text, Q&A pairs, or crawl websites
- **RAG-based Chat** — Vector similarity search (pgvector) for context-aware responses
- **Customization** — Light/dark mode, brand colors, chat bubble styling, initial messages
- **Playground** — Test chatbot with custom instructions before deployment
- **Embedding** — Deploy as a widget or iframe with domain whitelisting
- **Analytics** — Message counts, session metrics, geolocation, like/dislike stats
- **Chat History** — View sessions, export as JSON/CSV/PDF
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
| Embeddings | HuggingFace (BGE-small-en, 384-dim) |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | Google OAuth |
| Scraping | Playwright |
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
│       │   ├── chats/          # Chat history & sessions
│       │   ├── analytics/      # Analytics dashboard
│       │   ├── deploy/         # Embed configuration
│       │   └── contacts/       # Contact management
│       ├── components/         # Reusable components (ChatbotWidget, TextEditor, etc.)
│       ├── api/                # Axios client, endpoints, service modules
│       ├── store/              # Zustand slices (chatbot, user)
│       ├── hooks/              # Custom hooks
│       ├── types/              # TypeScript types
│       ├── utils/              # Utility functions
│       └── App.tsx             # Root component with routing
│
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic (chat, training, embedding, crawling)
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
- **PostgreSQL** v14+ with **pgvector** extension
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

Create `backend/.env`:

```env
PORT=3001
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/chatbot?schema=public"

# Google OAuth (same client ID used in frontend)
GOOGLE_CLIENT_ID=your-google-client-id

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=chatbot
R2_PUBLIC_URL=https://your-r2-public-url

# HuggingFace
HUGGINGFACE_API_KEY=hf_your_key
```

Run migrations and start:

```bash
npx prisma migrate dev          # applies migrations + generates Prisma client
npm run dev                     # runs on port 3001
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

### Embed (Public) (`/api/embed`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:embedKey/config` | Get embed config |
| POST | `/:embedKey/chat` | Send message via embed |
| PATCH | `/:embedKey/:sessionId/:messageId` | Update message feedback |

## Important Notes

- **pgvector** must be installed before running migrations — the migration creates `vector(384)` columns that require it.
- The same **Google OAuth Client ID** is used in both frontend and backend `.env` files.
- `npx playwright install` downloads Chromium, required for the website crawling feature.
- The backend uses **ESM** (`"type": "module"` in package.json).
