# Dashboard — User Attempt History

How a logged-in user views their quiz attempt history.

```mermaid
sequenceDiagram
    actor User
    participant Browser as DashboardPage
    participant AuthCtx as AuthContext
    participant API as GET /api/dashboard
    participant MW as authenticateToken
    participant DB as PostgreSQL

    User->>Browser: Navigate to /dashboard

    Browser->>AuthCtx: Check token
    alt No token (not logged in)
        Browser->>Browser: router.replace("/login")
        Browser-->>User: Redirect to login page
    end

    Browser-->>User: Show skeleton table (4 rows)
    Browser->>API: GET /api/dashboard<br/>Authorization: Bearer {token}

    API->>MW: Validate JWT
    alt Invalid or expired token
        MW-->>Browser: 401 / 403 error
        Browser-->>User: Show error message
    end

    MW->>API: req.user = {userId, role}
    API->>DB: SELECT leaderboard.*, quizzes.title<br/>FROM leaderboard<br/>INNER JOIN quizzes ON quizzes.id = leaderboard.quizId<br/>WHERE leaderboard.userId = req.user.userId<br/>ORDER BY completedAt DESC
    DB-->>API: User's attempt history
    API-->>Browser: [{id, quizId, quizTitle, score, total, percentage, completedAt}]

    Browser->>Browser: setEntries(data), loading = false
    Browser-->>User: Dashboard:<br/>"Welcome back, {name}"<br/>Table: Quiz | Score | % | Date
```

## Display Details

- **Header**: "Welcome back, {name}." with user's display name
- **Table columns**: Quiz (links to leaderboard), Score (`4/6`), Percentage (`67%`), Date
- **Empty state**: "No attempts yet. Take a quiz" with link to homepage
- **Percentage color**: Green (`text-primary`) if ≥ 60%, muted if < 60%
- **Ordering**: Most recent attempts first

## Auth Guard

The dashboard has a **client-side auth guard**:
1. If `token` is `null`, immediately redirect to `/login`
2. Render `null` during redirect to prevent flash of content
