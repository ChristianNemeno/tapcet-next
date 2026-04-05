# Database Schema (ER Diagram)

Entity-relationship diagram showing all four tables, their columns, constraints, and relationships.

```mermaid
erDiagram
    USERS {
        uuid id PK "defaultRandom()"
        text email UK "NOT NULL, lowercase"
        text password_hash "NOT NULL, bcrypt(12)"
        text name "NOT NULL"
        enum role "user | admin, default: user"
        timestamp created_at "defaultNow()"
    }

    QUIZZES {
        uuid id PK "defaultRandom()"
        text title "NOT NULL"
        text description "default: empty string"
        integer time_limit_seconds "nullable"
    }

    QUESTIONS {
        uuid id PK "defaultRandom()"
        uuid quiz_id FK "NOT NULL, CASCADE delete"
        text text "NOT NULL"
        jsonb options "string[] NOT NULL"
        integer answer "NOT NULL, 0-based index"
        integer order_index "NOT NULL"
    }

    LEADERBOARD {
        uuid id PK "defaultRandom()"
        uuid quiz_id FK "NOT NULL, CASCADE delete"
        uuid user_id FK "nullable, SET NULL on delete"
        text nickname "NOT NULL"
        integer score "NOT NULL"
        integer total "NOT NULL"
        real percentage "NOT NULL"
        timestamp completed_at "defaultNow()"
    }

    USERS ||--o{ LEADERBOARD : "has attempts"
    QUIZZES ||--o{ QUESTIONS : "contains"
    QUIZZES ||--o{ LEADERBOARD : "has entries"
```

## Relationships

| Parent | Child | Type | On Delete |
|--------|-------|------|-----------|
| `quizzes` | `questions` | One-to-Many | **CASCADE** — deleting a quiz removes all its questions |
| `quizzes` | `leaderboard` | One-to-Many | **CASCADE** — deleting a quiz removes all leaderboard entries |
| `users` | `leaderboard` | One-to-Many | **SET NULL** — deleting a user keeps leaderboard entries but nulls `user_id` |

## Notes

- `questions.answer` is a **0-based index** into the `options` JSON array
- `questions.options` is stored as a `jsonb` column typed as `string[]`
- `leaderboard.user_id` is **nullable** — anonymous users can submit quiz results
- All primary keys use UUID v4 (`defaultRandom()`)
