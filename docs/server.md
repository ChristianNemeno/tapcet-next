# Server

The backend is an **Express.js** REST API using **Drizzle ORM** with **PostgreSQL 16**, JWT authentication, and Zod validation.

## Directory Structure

```
server/src/
├── core/                          # Shared infrastructure
│   ├── config/
│   │   └── spaced-repetition.ts   # Review interval schedule
│   ├── constants/
│   │   ├── limits.ts              # Nickname length, page sizes, etc.
│   │   ├── reportStatus.ts        # Report status enum
│   │   └── tags.ts               # Valid exam tags
│   ├── db/
│   │   ├── index.ts               # pg.Pool + Drizzle connection
│   │   ├── migrate.ts             # Auto-runs Drizzle migrations on startup
│   │   ├── schema.ts              # Single source of truth for all table definitions
│   │   └── seed.ts                # Seeds sample quizzes if table is empty
│   ├── errors/
│   │   ├── AppError.ts            # Custom error class with status code
│   │   └── error-response.ts      # Formats errors as { error: "message" }
│   └── middleware/
│       ├── auth.middleware.ts      # authenticateToken, optionalAuth, requireAdmin
│       ├── auth.middleware.test.ts
│       ├── authorize.middleware.ts # Ownership-based authorization
│       └── validate-request.middleware.ts  # Zod body/query validation
├── modules/                       # Domain modules (routes, schemas, services co-located)
│   ├── auth/
│   │   ├── auth.routes.ts         # POST /register, /login
│   │   ├── auth.routes.test.ts
│   │   └── auth.schema.ts
│   ├── collection/
│   │   ├── collection.routes.ts   # CRUD collections, follow/unfollow, add/remove quizzes
│   │   └── collection.schema.ts
│   ├── quiz/
│   │   ├── quiz.routes.ts         # GET /quizzes, /quiz/:id, POST /submit, GET /leaderboard
│   │   ├── quiz.routes.test.ts
│   │   ├── quiz.schema.ts
│   │   └── quiz.service.ts
│   ├── quiz-management/
│   │   ├── admin-quiz.routes.ts   # Admin CRUD: POST/PUT/DELETE /admin/quizzes/:id
│   │   ├── user-quiz.routes.ts    # User CRUD: POST/PUT/DELETE /quiz/:id, GET /my-quizzes
│   │   ├── quiz-management.routes.test.ts
│   │   ├── quiz-management.schema.ts
│   │   └── quiz-content.service.ts
│   ├── rating/
│   │   ├── rating.routes.ts       # GET/POST /quiz/:id/rating
│   │   ├── rating.schema.ts
│   │   └── rating.service.ts
│   ├── report/
│   │   ├── report.routes.ts       # POST /question/:id/report, GET/PUT /admin/reports
│   │   └── report.schema.ts
│   ├── review/
│   │   ├── review.routes.ts       # GET /review-queue, POST /review-queue/answer
│   │   └── review.schema.ts
│   └── user/
│       ├── user.routes.ts         # GET /dashboard, /dashboard/weakness, /user/:id/profile
│       └── user.routes.test.ts
├── test-utils/
│   └── index.ts                   # makeChain(), mock db for Vitest + supertest
├── env.ts                         # Loads .env from project root via dotenv
└── index.ts                       # Express setup, router registration, migration + seed
```

## Module Conventions

Code is organized by **domain, not layer**. Each module under `modules/` owns its routes, schemas, services, and tests:

| File Pattern | Purpose |
|---|---|
| `<module>.routes.ts` | Express Router with route handlers |
| `<module>.schema.ts` | Zod validation schemas for request bodies/params |
| `<module>.service.ts` | Business logic (only `quiz`, `rating`, and `quiz-management` have a service layer) |
| `<module>.routes.test.ts` | Vitest test file co-located with the module it tests |

### Import Pattern

Modules import from `core/` using relative paths with `.js` extensions (ESM):

```typescript
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import { AppError } from "../../core/errors/AppError.js";
import { db } from "../../core/db/index.js";
```

## Shared Infrastructure

### `core/db/`

| File | Purpose |
|---|---|
| `schema.ts` | All Drizzle table definitions — single source of truth |
| `index.ts` | Creates `pg.Pool` from `DATABASE_URL`, exports `drizzle(pool, { schema })` |
| `migrate.ts` | Runs pending Drizzle migrations from `server/drizzle/` |
| `seed.ts` | Checks if `quizzes` table is empty, inserts 3 sample quizzes if so |

### `core/middleware/`

| Export | Middleware Type | Behavior |
|---|---|---|
| `authenticateToken` | Required | Returns 401 if no token, 403 if invalid. Sets `req.user` = `{ userId, role }`. |
| `optionalAuth` | Optional | Sets `req.user` if valid token present. Never blocks the request. |
| `requireAdmin` | Required | Returns 403 if `req.user.role !== "admin"`. Must be used after `authenticateToken`. |
| `validateBody(schema)` | Request validation | Returns 400 if the parsed body fails the given Zod schema |

`auth.middleware.ts` also exports `signToken(userId, role)` for issuing JWTs (used by the auth module).

### `core/errors/`

| File | Purpose |
|---|---|
| `AppError.ts` | Custom error class extending `Error` with a `statusCode` property |
| `error-response.ts` | Formats any error as `{ error: string }` with appropriate HTTP status |

### `core/constants/`

| File | Exports |
|---|---|
| `limits.ts` | `NICKNAME_MAX_LENGTH` (20), `QUIZZES_PER_PAGE` (12), and similar |
| `reportStatus.ts` | `REPORT_STATUS` enum: `open`, `reviewing`, `resolved` |
| `tags.ts` | `EXAM_TAGS` array of valid exam identifiers |

### `core/config/`

| File | Exports |
|---|---|
| `spaced-repetition.ts` | `INTERVALS`: `[1, 3, 7, 14, 30]` days — correct answer advances, wrong answer resets to 1 |

## Route Handler Pattern

Every route handler wraps its logic in `try/catch` and passes errors to `next`:

```typescript
import { Router } from "express";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import { db } from "../../core/db/index.js";
import { mySchema } from "./my-module.schema.js";

const router = Router();

router.post("/endpoint", authenticateToken, validateBody(mySchema), async (req, res, next) => {
  try {
    // Access typed body: req.body
    // Access user: req.user = { userId, role }
    const result = await db.query.someTable.findMany({ ... });
    res.json(result);
  } catch (err) {
    next(err); // Delegates to global error handler in index.ts
  }
});

export default router;
```

## Validation

Zod schemas are defined per module in `<module>.schema.ts` and wired in via `validateBody()`:

```typescript
// my-module.schema.ts
import { z } from "zod";
export const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  count: z.number().int().min(1).optional(),
});

// my-module.routes.ts
router.post("/item", authenticateToken, validateBody(createItemSchema), handler);
```

Failed validation returns `400` with the first Zod error message.

## Module Reference

| Module | Key Routes | Auth | Files |
|---|---|---|---|
| `auth/` | `POST /api/auth/register`, `POST /api/auth/login` | None | routes, schema, test |
| `quiz/` | `GET /api/quizzes`, `GET /api/quiz/:id`, `POST /api/quiz/:id/submit`, `GET /api/quiz/:id/leaderboard` | Optional (submit) | routes, schema, service, test |
| `quiz-management/` | `POST|PUT|DELETE /api/quiz`, `GET /api/my-quizzes`, `POST|PUT|DELETE /api/admin/quizzes/:id` | Required / Admin | admin-quiz.routes, user-quiz.routes, schema, service, test |
| `collection/` | `GET|POST /api/collections`, `GET|PUT|DELETE /api/collection/:id`, `POST /api/collection/:id/follow`, `POST|DELETE /api/collection/:id/quizzes/:quizId`, `GET /api/my-collections` | Mixed | routes, schema |
| `review/` | `GET /api/review-queue`, `GET /api/review-queue/stats`, `POST /api/review-queue/answer` | Required | routes, schema |
| `rating/` | `GET /api/quiz/:id/rating`, `POST /api/quiz/:id/rate` | Optional (GET), Required (POST) | routes, schema, service |
| `report/` | `POST /api/question/:id/report`, `GET /api/admin/reports`, `PUT /api/admin/report/:id` | Required / Admin | routes, schema |
| `user/` | `GET /api/dashboard`, `GET /api/dashboard/weakness`, `GET /api/user/:id/profile` | Required | routes, test |

## Entry Point

`index.ts` executes in order:

1. **Loads env** from the project root `.env` file (via `dotenv` in `env.ts`)
2. **Creates Express app** with `express.json()` body parser and CORS (origin from `CLIENT_ORIGIN`)
3. **Registers routers** — each module's router is mounted under `/api`
4. **Registers global error handler** — catches `next(err)` from all routes, returns JSON `{ error: string }`
5. **Runs Drizzle migrations** — retries up to 10 times with 3-second delay (for DB readiness)
6. **Seeds sample data** — only if `quizzes` table is empty
7. **Starts listening** on `PORT` (default `3001`)

## Testing

Tests use **Vitest** with **supertest** and mocked database:

- **Test utils** (`test-utils/index.ts`) provide `makeChain()` for mocking Drizzle query chains via `vi.hoisted()`
- Database module (`../db/index.js`) is mocked at the module level — no test DB needed
- Tests create a lightweight Express app, mount the router under test, and make requests with supertest
- `signToken()` is imported from `core/middleware/auth.middleware.js` to generate auth headers in tests

```typescript
// Example test pattern
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import quizRouter from "../quiz/quiz.routes.js";

const app = express();
app.use(express.json());
app.use("/api", quizRouter);

// Mock db with vi.hoisted() + makeChain()
// Make requests with supertest(app), assert on status and body
```

## ESM Conventions

- Server `package.json` has `"type": "module"`
- All import paths use `.js` extension: `import { x } from "./foo.js"`
- Files: **kebab-case** (`auth.routes.ts`)
- DB columns: **snake_case** (`password_hash`, `quiz_id`)
