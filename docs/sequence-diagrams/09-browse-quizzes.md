# Homepage — Browse Quizzes

Loading and displaying the quiz listing on the homepage.

```mermaid
sequenceDiagram
    actor User
    participant Browser as HomePage Component
    participant API as GET /api/quizzes
    participant DB as PostgreSQL

    User->>Browser: Navigate to /

    Browser->>Browser: useState: loading=true, quizzes=[]
    Browser-->>User: Render skeleton loaders (3 items)

    Browser->>API: GET /api/quizzes
    API->>DB: SELECT quizzes.*, COUNT(questions.id) as questionCount<br/>FROM quizzes<br/>LEFT JOIN questions ON questions.quiz_id = quizzes.id<br/>GROUP BY quizzes.id<br/>ORDER BY title ASC
    DB-->>API: Array of quiz summaries
    API-->>Browser: [{id, title, description, timeLimitSeconds, questionCount}]

    Browser->>Browser: setQuizzes(data), setLoading(false)
    Browser-->>User: Render quiz list

    Note over Browser,User: Each quiz card shows:<br/>• Numbered index (01, 02, ...)<br/>• Title (hover → primary color)<br/>• Description<br/>• Question count<br/>• Time limit badge (if set)<br/>• Arrow on hover

    User->>Browser: Click on a quiz card
    Browser->>Browser: Navigate to /quiz/{id}
```

## UI States

| State | Display |
|-------|---------|
| Loading | 3 skeleton placeholders |
| Error | Red error message |
| Empty | "No quizzes yet. Check back soon." |
| Loaded | Numbered list of quiz cards |
