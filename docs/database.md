# Database

Tapcet uses **PostgreSQL 16** as its primary data store with **Drizzle ORM** for schema management, migrations, and queries.

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        text email UK
        text password_hash
        text name
        role role "user | admin"
        timestamp created_at
    }

    QUIZZES {
        uuid id PK
        text title
        text description
        integer time_limit_seconds "nullable"
        uuid created_by FK "nullable"
        visibility visibility "public | draft"
        text[] exam_tags
        text subject "nullable"
        text topic "nullable"
    }

    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        text text
        jsonb options "string[]"
        integer answer "0-based index"
        integer order_index
    }

    LEADERBOARD {
        uuid id PK
        uuid quiz_id FK
        uuid user_id FK "nullable"
        text nickname
        integer score
        integer total
        real percentage
        timestamp completed_at
    }

    QUIZZES ||--o{ QUESTIONS : "has many"
    QUIZZES ||--o{ LEADERBOARD : "has many"
    USERS   ||--o{ LEADERBOARD : "has many"
    USERS   ||--o{ QUIZZES : "creates"
```

## Schema Details

### `users`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `email` | `text` | NOT NULL, UNIQUE | — | User email (stored lowercase) |
| `password_hash` | `text` | NOT NULL | — | bcrypt hash (12 rounds) |
| `name` | `text` | NOT NULL | — | Display name |
| `role` | `enum('user','admin')` | NOT NULL | `'user'` | Authorization role |
| `created_at` | `timestamp` | NOT NULL | `now()` | Account creation time |

### `quizzes`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `title` | `text` | NOT NULL | — | Quiz title |
| `description` | `text` | NOT NULL | `''` | Quiz description |
| `time_limit_seconds` | `integer` | nullable | `NULL` | Time limit in seconds (`NULL` = untimed) |
| `created_by` | `uuid` | nullable, FK → `users.id` | `NULL` | Associated creator (SET NULL on delete) |
| `visibility` | `enum('public','draft')` | NOT NULL | `'public'` | Quiz visibility |
| `exam_tags` | `text[]` | NOT NULL | `[]` | Array of relevant exam tags |
| `subject` | `text` | nullable | `NULL` | Associated subject area |
| `topic` | `text` | nullable | `NULL` | Specific topic within the subject |

### `questions`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `quiz_id` | `uuid` | NOT NULL, FK → `quizzes.id` | — | Parent quiz (CASCADE on delete) |
| `text` | `text` | NOT NULL | — | Question text |
| `options` | `jsonb` | NOT NULL | — | Array of answer strings (e.g. `["A","B","C","D"]`) |
| `answer` | `integer` | NOT NULL | — | 0-based index of the correct option |
| `order_index` | `integer` | NOT NULL | — | Display order within the quiz |

### `leaderboard`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `quiz_id` | `uuid` | NOT NULL, FK → `quizzes.id` | — | Associated quiz (CASCADE on delete) |
| `user_id` | `uuid` | nullable, FK → `users.id` | `NULL` | Associated user (SET NULL on delete) |
| `nickname` | `text` | NOT NULL | — | Display name for leaderboard |
| `score` | `integer` | NOT NULL | — | Number of correct answers |
| `total` | `integer` | NOT NULL | — | Total number of questions |
| `percentage` | `real` | NOT NULL | — | Score as percentage (0–100) |
| `completed_at` | `timestamp` | NOT NULL | `now()` | Submission time |

## Foreign Key Relationships

| Relationship | On Delete | Rationale |
|---|---|---|
| `quizzes.created_by` → `users.id` | **SET NULL** | Preserve quizzes even if the creator's account is deleted |
| `questions.quiz_id` → `quizzes.id` | **CASCADE** | Questions are part of a quiz; deleting the quiz removes its questions |
| `leaderboard.quiz_id` → `quizzes.id` | **CASCADE** | Leaderboard entries belong to a quiz; deleting the quiz cleans up scores |
| `leaderboard.user_id` → `users.id` | **SET NULL** | Preserve leaderboard entries even if a user is deleted |

## Drizzle ORM

### Configuration

The Drizzle config is at `server/drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://tapcetuser:tapcetpass@localhost:5432/tapcetdb",
  },
});
```

### Schema Definition

The schema is defined in `server/src/db/schema.ts` using Drizzle's TypeScript API. This is the single source of truth for the database structure.

### Connection Pool

The database connection is managed by a `pg.Pool` instance in `server/src/db/index.ts`, wrapped with Drizzle:

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://...",
});
export const db = drizzle(pool, { schema });
```

## Migrations

Migrations are stored in `server/drizzle/` and are **automatically run on server startup**:

```typescript
// server/src/index.ts
await migrate(db, { migrationsFolder: "./drizzle" });
```

### Generating New Migrations

When you modify the schema in `server/src/db/schema.ts`, generate a new migration:

```bash
cd server
npx drizzle-kit generate
```

This creates a new SQL file in `server/drizzle/`. The next time the server starts, it will automatically apply pending migrations.

> [!WARNING]
> Never manually edit migration files that have already been applied to a database. Instead, generate a new migration for schema changes.

### Running Migrations Manually

If needed, you can run migrations without starting the server:

```bash
cd server
npx drizzle-kit migrate
```

## Seed Data

On first startup, the server checks if any quizzes exist. If the `quizzes` table is empty, it seeds with three sample quizzes:

| Quiz | Questions | Time Limit |
|---|---|---|
| General Knowledge | 6 | 60s |
| Web Development | 6 | 90s |
| Science & Nature | 6 | 75s |

The seed logic is in `server/src/db/seed.ts` and runs after migrations in the startup sequence:

```typescript
await migrate(db, { migrationsFolder: "./drizzle" });
await seed(); // Only seeds if quizzes table is empty
```
