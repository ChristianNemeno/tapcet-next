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
        scoring_mode scoring_mode "standard | penalized"
        real penalty_fraction
    }

    SECTIONS {
        uuid id PK
        uuid quiz_id FK
        text title
        integer time_limit_seconds "nullable"
        integer order_index
    }

    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        uuid section_id FK "nullable"
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
        real penalty_points
    }

    COLLECTIONS {
        uuid id PK
        text title
        text description
        text exam_tag "nullable"
        visibility visibility "public | draft"
        boolean is_official
        uuid created_by FK "nullable"
        timestamp created_at
    }

    COLLECTION_QUIZZES {
        uuid id PK
        uuid collection_id FK
        uuid quiz_id FK
        integer order_index
    }

    COLLECTION_FOLLOWS {
        uuid id PK
        uuid user_id FK
        uuid collection_id FK
        timestamp created_at
    }

    QUIZZES ||--o{ QUESTIONS : "has many"
    QUIZZES ||--o{ SECTIONS : "has many"
    SECTIONS ||--o{ QUESTIONS : "contains"
    QUIZZES ||--o{ LEADERBOARD : "has many"
    USERS   ||--o{ LEADERBOARD : "has many"
    USERS   ||--o{ QUIZZES : "creates"
    USERS   ||--o{ COLLECTIONS : "creates"
    COLLECTIONS ||--o{ COLLECTION_QUIZZES : "contains"
    COLLECTIONS ||--o{ COLLECTION_FOLLOWS : "followed by"
    USERS ||--o{ COLLECTION_FOLLOWS : "follows"
    QUIZZES ||--o{ COLLECTION_QUIZZES : "belongs to"
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
| `scoring_mode` | `enum('standard','penalized')` | NOT NULL | `'standard'` | Scoring mode for the quiz |
| `penalty_fraction` | `real` | NOT NULL | `0.25` | Points deducted for wrong answers |

### `sections`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `quiz_id` | `uuid` | NOT NULL, FK → `quizzes.id` | — | Parent quiz (CASCADE on delete) |
| `title` | `text` | NOT NULL | — | Section title |
| `time_limit_seconds` | `integer` | nullable | `NULL` | Per-section time limit in seconds |
| `order_index` | `integer` | NOT NULL | — | Display order of section within the quiz |

### `questions`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `quiz_id` | `uuid` | NOT NULL, FK → `quizzes.id` | — | Parent quiz (CASCADE on delete) |
| `section_id` | `uuid` | nullable, FK → `sections.id` | `NULL` | Belonging section (SET NULL on delete) |
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
| `penalty_points` | `real` | NOT NULL | `0` | Points deducted from score |
| `completed_at` | `timestamp` | NOT NULL | `now()` | Submission time |

### `collections`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `title` | `text` | NOT NULL | — | Collection title |
| `description` | `text` | NOT NULL | `''` | Collection description |
| `exam_tag` | `text` | nullable | `NULL` | Applicable exam tag for filtering |
| `visibility` | `enum('public','draft')` | NOT NULL | `'public'` | Collection visibility |
| `is_official` | `boolean` | NOT NULL | `false` | Curated by admins |
| `created_by` | `uuid` | NOT NULL, FK → `users.id` | — | Creator |
| `created_at` | `timestamp` | NOT NULL | `now()` | Creation time |

### `collection_quizzes`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `collection_id` | `uuid` | NOT NULL, FK → `collections.id` | — | Parent collection (CASCADE on delete) |
| `quiz_id` | `uuid` | NOT NULL, FK → `quizzes.id` | — | Associated quiz (CASCADE on delete) |
| `order_index` | `integer` | NOT NULL | — | Position of the quiz in collection |

*Note: Has unique constraint on `(collection_id, quiz_id)`*

### `collection_follows`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Unique identifier |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | — | Follower (CASCADE on delete) |
| `collection_id` | `uuid` | NOT NULL, FK → `collections.id` | — | Followed collection (CASCADE on delete) |
| `created_at` | `timestamp` | NOT NULL | `now()` | Follow time |

*Note: Has unique constraint on `(user_id, collection_id)`*

## Foreign Key Relationships

| Relationship | On Delete | Rationale |
|---|---|---|
| `quizzes.created_by` → `users.id` | **SET NULL** | Preserve quizzes even if the creator's account is deleted |
| `questions.quiz_id` → `quizzes.id` | **CASCADE** | Questions are part of a quiz; deleting the quiz removes its questions |
| `leaderboard.quiz_id` → `quizzes.id` | **CASCADE** | Leaderboard entries belong to a quiz; deleting the quiz cleans up scores |
| `leaderboard.user_id` → `users.id` | **SET NULL** | Preserve leaderboard entries even if a user is deleted |
| `sections.quiz_id` → `quizzes.id` | **CASCADE** | Sections are part of a quiz; deleting the quiz removes its sections |
| `questions.section_id` → `sections.id` | **SET NULL** | Decouple questions from deleted sections if required |
| `collections.created_by` → `users.id` | **CASCADE** | Collections deleted with creator |
| `collection_quizzes.collection_id` → `collections.id` | **CASCADE** | Entry removed on collection deleted |
| `collection_quizzes.quiz_id` → `quizzes.id` | **CASCADE** | Entry removed on quiz deleted |
| `collection_follows.user_id` → `users.id` | **CASCADE** | Stop following if user deleted |
| `collection_follows.collection_id` → `collections.id` | **CASCADE** | Stop following if collection deleted |

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
