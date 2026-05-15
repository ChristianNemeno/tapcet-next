# Contributing

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Test locally (both client and server)
4. Submit a pull request

## Code Conventions

### TypeScript

- **Strict mode** is enabled for both client and server
- Use **ES module** syntax (`import`/`export`) — the server has `"type": "module"` in `package.json`
- File extensions in server imports use `.js` (required for ESM — TypeScript resolves `.ts` files but compiled output needs `.js`)

### Naming

| Item | Convention | Example |
|---|---|---|
| Files | kebab-case | `auth-context.tsx` |
| Components | PascalCase | `Navbar`, `QuizPage` |
| Functions | camelCase | `fetchQuizzes`, `handleSubmit` |
| Database columns | snake_case | `password_hash`, `quiz_id` |
| TypeScript types | PascalCase | `QuizSummary`, `AuthResponse` |
| API routes | kebab-case | `/api/auth/login` |

### Project Structure

```
client/src/
├── app/          # Pages (App Router — one directory per route)
│   └── _components/  # Page-specific components co-located with their page
├── components/   # Reusable React components
│   └── ui/       # shadcn/ui primitives
├── lib/          # Non-component code
│   ├── api/      # API client functions (per domain)
│   ├── constants/# App constants
│   ├── hooks/    # Custom React hooks
│   └── types/    # TypeScript type definitions (per domain)
└── test-utils/   # Vitest + jsdom test setup

server/src/
├── core/                     # Shared infrastructure
│   ├── config/               # App configuration (spaced repetition intervals)
│   ├── constants/            # App-wide constants (nickname length, page sizes)
│   ├── db/                   # Database (schema, connection, seed, migrations)
│   ├── errors/               # AppError class, error response formatter
│   └── middleware/            # Express middleware (auth, request validation, authorization)
├── modules/                  # Domain modules (routes, schemas, services co-located)
│   ├── auth/                 # Registration & login
│   ├── collection/           # CRUD collections, follow/unfollow
│   ├── quiz/                 # Quiz listing, detail, submission, leaderboard
│   ├── quiz-management/      # User & admin quiz CRUD
│   ├── rating/               # Quiz rating
│   ├── report/               # Question reporting
│   ├── review/               # Spaced repetition review queue
│   └── user/                 # Dashboard, weakness analysis, profiles
└── test-utils/               # Test helpers
```

## How to Add a New API Route

1. **Create or edit a module** in `server/src/modules/`:

    Each module contains co-located routes, schemas, and optionally services. Add or edit the route file:

    ```typescript
    // server/src/modules/example/example.routes.ts
    import { Router } from "express";

    const router = Router();

    router.get("/example", async (req, res, next) => {
      try {
        // Your logic here
        res.json({ message: "Hello" });
      } catch (err) {
        next(err);
      }
    });

    export default router;
    ```

    For routes that accept a request body, use `validateBody()` with a Zod schema defined in the same module:

    ```typescript
    // server/src/modules/example/example.schema.ts
    import { z } from "zod";
    export const createExampleSchema = z.object({ name: z.string().min(1) });

    // server/src/modules/example/example.routes.ts
    import { validateBody } from "../../core/middleware/validate-request.middleware.js";
    import { createExampleSchema } from "./example.schema.js";

    router.post("/example", validateBody(createExampleSchema), async (req, res, next) => {
      const { name } = req.body; // typed and validated
      res.json({ name });
    });
    ```

2. **Register the router** in `server/src/index.ts`:

    ```typescript
    import exampleRouter from "./modules/example/example.routes.js";
    app.use("/api", exampleRouter);
    ```

3. **Add a client-side API function** in `client/src/lib/api/`:

    ```typescript
    // client/src/lib/api/example.api.ts
    import { parseResponse } from "./client.js";

    const BASE = "/api";

    export async function fetchExample(): Promise<ExampleType> {
      return parseResponse(await fetch(`${BASE}/example`));
    }
    ```

4. **Add types** in `client/src/lib/types/` if needed.

## How to Add a New Page

1. Create a directory under `client/src/app/`:

    ```
    client/src/app/my-page/
    └── page.tsx
    ```

2. Export a default component:

    ```tsx
    "use client";

    export default function MyPage() {
      return <div>My Page</div>;
    }
    ```

3. The page is automatically available at `/my-page` (filesystem-based routing).

4. For dynamic routes, use `[param]` folders:

    ```
    client/src/app/quiz/[id]/
    └── page.tsx
    ```

## How to Modify the Database Schema

1. **Edit the schema** in `server/src/core/db/schema.ts`:

    ```typescript
    export const myTable = pgTable("my_table", {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(),
    });
    ```

2. **Generate a migration**:

    ```bash
    cd server
    npx drizzle-kit generate
    ```

3. **Verify** the generated SQL in `server/drizzle/`

4. **Restart the server** — migrations run automatically on startup

> [!CAUTION]
> Be careful with destructive schema changes (dropping columns/tables). Always review the generated migration SQL before applying it to a production database.

## Adding Protected Routes

### Requiring Authentication

Use the `authenticateToken` middleware:

```typescript
import { authenticateToken } from "../../core/middleware/auth.middleware.js";

router.get("/protected", authenticateToken, async (req, res) => {
  // req.user is available: { userId: string, role: "user" | "admin" }
  res.json({ userId: req.user!.userId });
});
```

### Requiring Admin Role

Stack `authenticateToken` and `requireAdmin`:

```typescript
import { authenticateToken, requireAdmin } from "../../core/middleware/auth.middleware.js";

router.use(authenticateToken, requireAdmin);
// All routes on this router now require admin
```

### Optional Authentication

Use `optionalAuth` — sets `req.user` if a valid token is present, but doesn't reject the request if it's missing:

```typescript
import { optionalAuth } from "../../core/middleware/auth.middleware.js";

router.post("/submit", optionalAuth, async (req, res) => {
  if (req.user) {
    // Authenticated user
  } else {
    // Anonymous user
  }
});
```

## Error Handling

Server route handlers should follow this pattern:

```typescript
router.get("/example", async (req, res, next) => {
  try {
    // Your logic here
    res.json(result);
  } catch (err) {
    next(err); // Passes to the global error handler
  }
});
```

The global error handler in `server/src/index.ts` logs the error and returns a `500` JSON response.

## UI Components

When adding new UI components, use [shadcn/ui](https://ui.shadcn.com/):

```bash
cd client
npx shadcn@latest add <component-name>
```

Components are installed into `client/src/components/ui/` and can be customized directly.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing both the client and server.

### Running Client Tests

```bash
cd client
npm run test
```
This runs the UI component tests and client utility tests using a jsdom environment.

### Running Server Tests

```bash
cd server
npm run test
```
This runs the API route tests using an in-memory test database and mock schemas.

## Linting

```bash
cd client
npm run lint
```

ESLint is configured via `client/eslint.config.mjs` with the `eslint-config-next` preset.
