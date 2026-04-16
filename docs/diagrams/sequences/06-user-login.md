# User Login Flow

Complete sequence from form submission to authenticated redirect.

```mermaid
sequenceDiagram
    actor User
    participant Browser as React Client
    participant API as /api/auth/login
    participant Limiter as Rate Limiter
    participant DB as PostgreSQL

    User->>Browser: Fill email, password
    User->>Browser: Click "log in"
    Browser->>Browser: handleSubmit() — setLoading(true)

    Browser->>API: POST /api/auth/login<br/>{email, password}

    API->>Limiter: Check rate limit
    alt Rate limit exceeded (5 per 15 min)
        Limiter-->>Browser: 429 "Too many login attempts"
        Browser-->>User: Show error
    end

    Limiter-->>API: Allowed

    alt Missing fields
        API-->>Browser: 400 "email and password are required"
        Browser-->>User: Show error
    end

    API->>DB: SELECT * FROM users WHERE email = lower(email)
    DB-->>API: user or empty

    alt User not found
        API-->>Browser: 401 "Invalid credentials"
        Browser-->>User: Show error
    end

    API->>API: bcrypt.compare(password, user.passwordHash)

    alt Password mismatch
        API-->>Browser: 401 "Invalid credentials"
        Browser-->>User: Show error
    end

    API->>API: jwt.sign({userId: user.id, role: user.role}, secret, {expiresIn: "7d"})
    API-->>Browser: 200 {token, name, role}

    Browser->>Browser: setAuth(token, name, role)
    Browser->>Browser: localStorage.setItem("tapcet_auth", ...)
    Browser->>Browser: router.push("/")
    Browser-->>User: Redirect to homepage (logged in)
```

## Security Notes

- Same error message `"Invalid credentials"` for both wrong email and wrong password (prevents user enumeration)
- Passwords are never stored in plain text — only bcrypt hashes
- JWT tokens expire after **7 days**

## Rate Limiting

- **Window**: 15 minutes
- **Max attempts**: 5 per IP
- **Response**: `429 Too Many Requests`
