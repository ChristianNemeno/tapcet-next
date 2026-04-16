# Leaderboard Retrieval

How the top 10 leaderboard is fetched and displayed.

```mermaid
sequenceDiagram
    actor User
    participant Browser as LeaderboardPage
    participant API as GET /api/quiz/:id/leaderboard
    participant DB as PostgreSQL

    User->>Browser: Navigate to /quiz/{id}/leaderboard
    Browser->>Browser: loading = true
    Browser-->>User: Show skeleton table rows (5)

    Browser->>API: GET /api/quiz/{id}/leaderboard
    API->>DB: SELECT id, nickname, score, total, percentage, completedAt<br/>FROM leaderboard<br/>WHERE quiz_id = ?<br/>ORDER BY percentage DESC,<br/>         score DESC,<br/>         completedAt ASC<br/>LIMIT 10
    DB-->>API: Top 10 entries
    API-->>Browser: [{id, nickname, score, total, percentage, completedAt}]

    Browser->>Browser: setEntries(data), loading = false

    alt No entries
        Browser-->>User: "No entries yet. Be the first!"
    else Has entries
        Browser-->>User: Ranked table:<br/>#  |  Name  |  Score  |  %
    end

    Note over Browser: "take quiz" button → /quiz/{id}
```

## Sorting Logic

Entries are ranked by three criteria (in order):

1. **Percentage** — highest first (`DESC`)
2. **Score** — highest first (`DESC`) — breaks ties when percentage is equal
3. **Completed at** — earliest first (`ASC`) — first to achieve the score ranks higher

## Display

| Column | Example |
|--------|---------|
| Rank | `01`, `02`, ... |
| Nickname | `Alice` |
| Score | `5/6` |
| Percentage | `83%` |
