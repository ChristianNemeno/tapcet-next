# User Registration Flow

Complete sequence from form submission to authenticated redirect.

```mermaid
sequenceDiagram
    actor User
    participant Browser as React Client
    participant API as /api/auth/register
    participant Limiter as Rate Limiter
    participant DB as PostgreSQL

    User->>Browser: Fill name, email, password
    User->>Browser: Click "sign up"
    Browser->>Browser: handleSubmit() — setLoading(true)

    Browser->>API: POST /api/auth/register<br/>{email, password, name}

    API->>Limiter: Check rate limit
    alt Rate limit exceeded (3 per hour)
        Limiter-->>Browser: 429 "Too many registration attempts"
        Browser->>Browser: setError(message)
        Browser-->>User: Show error banner
    end

    Limiter-->>API: Allowed

    alt Missing fields
        API-->>Browser: 400 "email, password, and name are required"
        Browser->>Browser: setError(message)
        Browser-->>User: Show error banner
    end

    API->>DB: SELECT id FROM users WHERE email = lower(email)
    DB-->>API: Result

    alt Email already exists
        API-->>Browser: 409 "Email already in use"
        Browser->>Browser: setError(message)
        Browser-->>User: Show error banner
    end

    API->>API: bcrypt.hash(password, 12)
    API->>DB: INSERT INTO users (email, passwordHash, name)<br/>RETURNING {id, role, name}
    DB-->>API: {id, role: "user", name}

    API->>API: jwt.sign({userId, role}, secret, {expiresIn: "7d"})
    API-->>Browser: 201 {token, name, role}

    Browser->>Browser: setAuth(token, name, role)
    Browser->>Browser: localStorage.setItem("tapcet_auth", ...)
    Browser->>Browser: router.push("/")
    Browser-->>User: Redirect to homepage (logged in)
```

## Validation Rules

| Field | Requirement |
|-------|-------------|
| `email` | Required, stored as lowercase |
| `password` | Required, min 8 chars (client-side), hashed with bcrypt (cost 12) |
| `name` | Required |

## Rate Limiting

- **Window**: 1 hour
- **Max attempts**: 3 per IP
- **Response**: `429 Too Many Requests`
