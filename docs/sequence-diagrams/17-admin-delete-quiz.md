# Admin — Delete Quiz

How an admin deletes a quiz with confirmation dialog.

```mermaid
sequenceDiagram
    actor Admin
    participant Browser as AdminPage
    participant Dialog as AlertDialog
    participant API as DELETE /api/admin/quizzes/:id
    participant MW as Auth Middleware
    participant DB as PostgreSQL

    Admin->>Browser: Click "delete" button on a quiz
    Browser->>Dialog: Open confirmation dialog

    Note over Dialog: "Delete '{title}'?"<br/>"This will permanently delete the<br/>quiz and all leaderboard entries."

    alt User clicks Cancel
        Admin->>Dialog: Click "Cancel"
        Dialog-->>Browser: Close dialog, no action
    end

    Admin->>Dialog: Click "Delete" (confirm)
    Dialog->>Browser: Call handleDelete(id)

    Browser->>API: DELETE /api/admin/quizzes/{id}<br/>Authorization: Bearer {token}

    API->>MW: authenticateToken + requireAdmin
    MW-->>API: Authorized

    API->>DB: DELETE FROM quizzes WHERE id = ?
    Note over DB: CASCADE triggers:<br/>• DELETE all questions with quiz_id<br/>• DELETE all leaderboard entries with quiz_id
    DB-->>API: Deleted row returned

    alt Quiz not found
        API-->>Browser: 404 "Quiz not found"
        Browser-->>Admin: Show error
    end

    API-->>Browser: 204 No Content

    Browser->>Browser: setQuizzes(prev => prev.filter(q => q.id !== id))
    Browser-->>Admin: Quiz removed from list (optimistic UI)
```

## Cascade Behavior

When a quiz is deleted, PostgreSQL automatically deletes related rows:

```mermaid
flowchart LR
    DELETE["DELETE quiz"] --> Q["CASCADE: Delete<br/>all questions"]
    DELETE --> L["CASCADE: Delete<br/>all leaderboard entries"]
```

This is defined by the foreign key constraints:
- `questions.quiz_id` → `ON DELETE CASCADE`
- `leaderboard.quiz_id` → `ON DELETE CASCADE`

## Confirmation Dialog

The deletion uses an `AlertDialog` component to prevent accidental deletions:
- **Title**: `Delete "{quiz title}"?`
- **Description**: Warns about permanent deletion including leaderboard entries
- **Actions**: Cancel (close) or Delete (proceed)
