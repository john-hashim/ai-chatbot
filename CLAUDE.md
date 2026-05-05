# AI Chatbot Builder

Full-stack SaaS for training and embedding custom RAG chatbots. See `README.md` for setup, env vars, and API reference.

`backend/` (Express 5, Prisma, pgvector) · `frontend/` (React 19 + Vite) · `embed/` (widget/iframe build)

## Non-obvious conventions

- Backend is **ESM** — local imports must use `.js` extensions even for `.ts` files (e.g. `import { x } from './foo.js'`).
- **LLM provider switch**: `USE_GROQ=true` → Groq; otherwise HuggingFace Inference. Embeddings always use HuggingFace (BGE-small-en, 384-dim).
- **Action tokens**: the LLM emits sentinels like `__ACTION:BOOKING__` mid-stream. The chat controller buffers and intercepts them server-side so they never reach the client. New LLM-driven flows go in `backend/src/actions/`.
- **Embed routes** (`/api/embed/:embedKey/...`) are public — they use `embedKey` + domain whitelisting instead of user auth.
- pgvector extension must exist before migrations run (they create `vector(384)` columns).

## Where things live

- New frontend feature → `frontend/src/feature/<name>/`, lazy-loaded route in `App.tsx`
- Shared UI → `frontend/src/components/`
- API calls → wrap axios client in `frontend/src/api/services/`
- Global state → Zustand slice in `frontend/src/store/`
- New backend endpoint → `routes/` + `controllers/` + `services/` (business logic stays in services)

## Commands

Backend: `npm run dev` (port 3001) · `npx prisma migrate dev`
Frontend: `npm run dev` (port 5173) · `npm run build` · `npm run lint`
