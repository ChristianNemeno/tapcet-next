# Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        text email UK "NOT NULL"
        text password_hash "NOT NULL"
<!-- [MermaidChart: b4595a19-62d5-4ee5-881a-2bbaef950658] -->
        text name "NOT NULL"
        enum role "NOT NULL - default user"
        timestamp created_at "NOT NULL - default now"
    }

    quizzes {
        uuid id PK
        text title "NOT NULL"
        text description "NOT NULL - default empty"
        integer time_limit_seconds "NULLABLE"
    }

    questions {
        uuid id PK
        uuid quiz_id FK "NOT NULL"
        text text "NOT NULL"
        jsonb options "NOT NULL"
        integer answer "NOT NULL"
        integer order_index "NOT NULL"
    }

    leaderboard {
        uuid id PK
        uuid quiz_id FK "NOT NULL"
        uuid user_id FK "NULLABLE"
        text nickname "NOT NULL"
        integer score "NOT NULL"
        integer total "NOT NULL"
        real percentage "NOT NULL"
        timestamp completed_at "NOT NULL - default now"
    }

    quizzes ||--o{ questions : "has"
    quizzes ||--o{ leaderboard : "has"
    users ||--o{ leaderboard : "attempts"
```
