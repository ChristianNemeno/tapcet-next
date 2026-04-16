# Authentication & Authorization Middleware

How the three middleware functions (`authenticateToken`, `optionalAuth`, `requireAdmin`) validate requests.

## Decision Flowchart

```mermaid
flowchart TD
    REQ["Incoming Request"] --> CHECK{"Has Authorization<br/>header?"}

    CHECK -->|No| MW_TYPE{"Which middleware?"}
    CHECK -->|Yes| EXTRACT["Extract token from<br/>Bearer {token}"]

    MW_TYPE -->|authenticateToken| DENY_401["401: Access token required"]
    MW_TYPE -->|optionalAuth| CONTINUE_ANON["Continue as anonymous<br/>req.user = undefined"]

    EXTRACT --> VERIFY{"jwt.verify(token, secret)"}
    VERIFY -->|Valid| ATTACH["req.user = {userId, role}"]
    VERIFY -->|Invalid / Expired| MW_TYPE2{"Which middleware?"}

    MW_TYPE2 -->|authenticateToken| DENY_403["403: Invalid or expired token"]
    MW_TYPE2 -->|optionalAuth| CONTINUE_ANON

    ATTACH --> ADMIN_CHECK{"requireAdmin<br/>middleware applied?"}
    ADMIN_CHECK -->|No| NEXT["next() — proceed to handler"]
    ADMIN_CHECK -->|Yes| ROLE_CHECK{"req.user.role === admin?"}

    ROLE_CHECK -->|Yes| NEXT
    ROLE_CHECK -->|No| DENY_ADMIN["403: Admin access required"]

    style DENY_401 fill:#8b0000,stroke:#ff0000,color:#fff
    style DENY_403 fill:#8b0000,stroke:#ff0000,color:#fff
    style DENY_ADMIN fill:#8b0000,stroke:#ff0000,color:#fff
    style NEXT fill:#006400,stroke:#00ff00,color:#fff
    style CONTINUE_ANON fill:#2f4f4f,stroke:#708090,color:#fff
```

## Middleware Usage by Route

| Route | Middleware | Behavior |
|-------|-----------|----------|
| `GET /api/quizzes` | None | Fully public |
| `GET /api/quiz/:id` | None | Fully public |
| `POST /api/quiz/:id/submit` | `optionalAuth` | Works for anonymous; attaches `userId` if logged in |
| `GET /api/quiz/:id/leaderboard` | None | Fully public |
| `GET /api/dashboard` | `authenticateToken` | Requires valid JWT |
| `POST /api/admin/quizzes` | `authenticateToken` + `requireAdmin` | Must be admin |
| `PUT /api/admin/quizzes/:id` | `authenticateToken` + `requireAdmin` | Must be admin |
| `DELETE /api/admin/quizzes/:id` | `authenticateToken` + `requireAdmin` | Must be admin |

## JWT Payload Structure

```json
{
  "userId": "uuid-string",
  "role": "user | admin",
  "iat": 1234567890,
  "exp": 1235172690
}
```

- **Signing algorithm**: HS256 (default)
- **Expiry**: 7 days
- **Secret**: Read from `JWT_SECRET` environment variable
