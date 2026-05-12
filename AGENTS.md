# tapcet-next — agent guide

## Monorepo layout

| dir | what | tech |
|-----|------|------|
| `client/` | Next.js 16 App Router frontend | React 19, Tailwind v4, shadcn/ui (Base UI + CVA), Vitest |
| `server/` | Express REST API | Drizzle ORM + pg, PostgreSQL 16, Zod, Vitest |
| `docs/` | architecture, API ref, database, deployment, contributing |

## Commands (run from root)

```bash
npm run install:all       # npm ci in both packages
npm run dev:server        # tsx watch src/index.ts (hot reload)
npm run dev:client        # next dev
npm run build             # next build && tsc -p tsconfig.json

# per-package
npm --prefix client run test         # vitest (jsdom + React Testing Library)
npm --prefix client run lint         # ESLint (next preset)
npm --prefix server run test         # vitest (supertest + mocked db)
npm --prefix server run build        # tsc → dist/
```

## Testing quirks

- **Server tests** mock `../db/index.js` via `vi.hoisted()` + `makeChain()` (see `server/src/test-utils/index.ts`). Run with `supertest` on a lightweight express app. No test DB needed.
- **Client tests** use jsdom with `@testing-library/react`, `@testing-library/jest-dom`, and `@vitejs/plugin-react`. Setup in `client/src/test-utils/setup.ts`.
- No server-level vitest config file — uses Vitest defaults.

## Architecture & request flow

```
Local dev:    Browser → Next.js (:3000) → rewrite /api/* → Express (:3001) → PostgreSQL (:5432)
Production:   Browser → Nginx (:80) → /api/* → Express (:3001), else → Next.js (:3000)
```

- Server auto-runs Drizzle migrations + seed on startup (retries up to 10× with 3s delay).
- Quiz answers are **never** sent to client (`GET /api/quiz/:id` omits `answer`). Grading is server-only.
- JWT stored in localStorage key `"tapcet_auth"`. Three middleware levels in `server/src/middleware/auth.ts`: `authenticateToken` (401/403), `optionalAuth` (sets `req.user` if valid), `requireAdmin` (403 if not admin).

## DB schema & migrations

- Schema: `server/src/db/schema.ts` — single source of truth.
- Migrations: `server/drizzle/` (SQL files). Auto-applied on server start via `drizzle-orm/node-postgres/migrator`.
- Generate new migration: `cd server && npx drizzle-kit generate`
- Seed script: `server/src/db/seed.ts` — only runs if `quizzes` table is empty.

## Conventions (deviations from defaults)

- Server uses **ESM** (`"type": "module"`). Import paths use `.js` extension: `import { x } from "./foo.js"`.
- Files: kebab-case. DB columns: snake_case. Components: PascalCase. Everything else: camelCase.
- Route handlers wrap logic in `try/catch` with `next(err)`. Global error handler returns 500 JSON.
- Server loads `.env` from **project root** (not `server/`) via `dotenv` in `src/env.ts`.

## Docker

- `docker compose up -d --build` for full stack. `rebuild.sh` wraps compose down + up + wait-for-ready loop.
- Server Dockerfile has a `client-builder` stage that is effectively unused (legacy). Only the `server-builder` and `runtime` stages matter.
- Nginx config at `nginx/nginx.conf`.

## Existing instruction files

- `.agents/workflows/test.md` — runs `npm --prefix server run test`
- `.agents/workflows/update-docs.md` — checks git diff/docs dir
- `.agents/skills/code-review/SKILL.md` — review guidelines
- `.claude/commands/error-journal.md` — structured error logging
