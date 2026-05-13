# AI Chatbot Builder

Full-stack SaaS for training and embedding custom RAG chatbots. See `README.md` for setup, env vars, and API reference.

`backend/` (Express 5, Prisma, pgvector) · `frontend/` (React 19 + Vite) · `embed/` (widget/iframe build)

## Non-obvious conventions

- Backend is **ESM** — local imports must use `.js` extensions even for `.ts` files (e.g. `import { x } from './foo.js'`).
- **LLM provider**: all chat completions (streaming + booking classifier) go through OpenRouter (`@openrouter/sdk`). Per-chatbot model selection lives in `Chatbot.selectedModel`; the curated catalog is in `backend/src/constants/models.ts` and exposed via `GET /api/models`. Unknown / null ids fall back to `DEFAULT_MODEL_ID`. Embeddings always use HuggingFace Inference (BGE-small-en, 384-dim).
- **Action tokens**: the LLM emits sentinels like `__ACTION:BOOKING__` mid-stream. The chat controller buffers and intercepts them server-side so they never reach the client. New LLM-driven flows go in `backend/src/actions/`.
- **Embed routes** (`/api/embed/:embedKey/...`) are public — they use `embedKey` + domain whitelisting instead of user auth.
- pgvector extension must exist before migrations run (they create `vector(384)` columns).
- **API error notifications**: the axios interceptor in `frontend/src/api/index.ts` only toasts for *infra-level* failures — network unreachable, `401` (auto-logout via `useStore.logout()`), and `5xx` ("Server is unavailable"). All 4xx statuses reject silently; the calling component must show a contextual message via `showNotification` from `@/utils/notifications`. Do NOT add 4xx toasts to the interceptor.

## Where things live

- New frontend feature → `frontend/src/feature/<name>/`, lazy-loaded route in `App.tsx`
- Shared UI → `frontend/src/components/`
- API calls → wrap axios client in `frontend/src/api/services/`
- Global state → Zustand slice in `frontend/src/store/`
- New backend endpoint → `routes/` + `controllers/` + `services/` (business logic stays in services)

## Testing policy

- **Frontend**: write tests for every page/feature as it's reviewed (see below).
- **Backend**: do NOT write tests by default. Thin CRUD controllers are not worth testing — they exercise Prisma, not our logic. Only add a backend test when the controller does one of these:
  1. **Ownership / auth scoping** (e.g. `where: { id, userId }`) — security boundary.
  2. **Non-trivial computation** (aggregations, joins-then-shape, classifier logic, action-token buffering).
  3. **Side effects beyond a single Prisma call** (R2 uploads/deletes, embed-key generation, multi-step transactions).
  Skip tests for plain "fetch → return" or "validate id → update → return" handlers.

## Frontend tests

Vitest + React Testing Library + jsdom. Config is in `frontend/vite.config.ts` (uses `defineConfig` from `vitest/config`); shared setup lives in `frontend/src/test/setup.ts` (loads `@testing-library/jest-dom/vitest`, polyfills `matchMedia` and `ResizeObserver` for Mantine, autocleans). Tests live next to source as `*.test.tsx`. Mock `@/store`, `react-router-dom`, `@/utils/notifications`, and `@mantine/modals` per-test; wrap render in `<MantineProvider>`. Reference: `frontend/src/feature/Landing/Landing.test.tsx`.

## Commands

Backend: `npm run dev` (port 3001) · `npx prisma migrate dev`
Frontend: `npm run dev` (port 5173) · `npm run build` · `npm run lint` · `npm test` (watch) · `npm run test:run` (one-shot)
