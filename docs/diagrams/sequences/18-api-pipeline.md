# API Layer — Request/Response Pipeline

How requests flow through the client API layer and server middleware stack.

## Client-Side API Layer

```mermaid
flowchart LR
    subgraph "Client - api.ts"
        CALL["Caller invokes<br/>fetchQuizzes(), submitQuiz(), etc."]
        FETCH["fetch(BASE + url, options)"]
        AUTH_H["authHeader(token)<br/>→ {Authorization: Bearer ...}"]
        PARSE["parseResponse(res)"]
    end

    CALL --> FETCH
    AUTH_H -.->|"Attached to<br/>protected requests"| FETCH
    FETCH -->|"Response"| PARSE
    PARSE -->|"res.ok"| RETURN["Return typed data<br/>as Promise&lt;T&gt;"]
    PARSE -->|"!res.ok"| THROW["throw Error(body.error<br/>?? 'HTTP {status}')"]
```

## Server-Side Middleware Stack

```mermaid
flowchart TD
    REQ["Incoming Request"] --> CORS{"NODE_ENV !== production?"}

    CORS -->|"Dev"| CORS_MW["CORS Middleware<br/>Allow CLIENT_ORIGIN"]
    CORS -->|"Prod"| JSON_MW

    CORS_MW --> JSON_MW["express.json()<br/>Parse request body"]

    JSON_MW --> LOG{"Path matches<br/>/api/auth/* OR<br/>/api/admin/* OR<br/>POST /api/quiz/*/submit?"}

    LOG -->|"Yes"| LOG_MW["Logging Middleware<br/>Log: method, url, status,<br/>duration, userId"]
    LOG -->|"No"| ROUTE

    LOG_MW --> ROUTE["Route Handler<br/>(auth, admin, quiz)"]

    ROUTE -->|"Success"| RES["Send JSON response"]
    ROUTE -->|"Throws error"| ERR["Global Error Handler<br/>console.error(err)<br/>→ 500 Internal server error"]

    style ERR fill:#8b0000,stroke:#ff0000,color:#fff
    style RES fill:#006400,stroke:#00ff00,color:#fff
```

## Client API Functions

| Function | Method | Endpoint | Auth |
|----------|--------|----------|:----:|
| `fetchQuizzes()` | GET | `/api/quizzes` | ✗ |
| `fetchQuiz(id)` | GET | `/api/quiz/{id}` | ✗ |
| `submitQuiz(id, answers, nickname, token)` | POST | `/api/quiz/{id}/submit` | Optional |
| `fetchLeaderboard(id)` | GET | `/api/quiz/{id}/leaderboard` | ✗ |
| `fetchDashboard(token)` | GET | `/api/dashboard` | Required |
| `login(email, password)` | POST | `/api/auth/login` | ✗ |
| `register(email, password, name)` | POST | `/api/auth/register` | ✗ |

## Error Handling Pattern

All client API calls use the same `parseResponse<T>()` helper:

1. Check `res.ok` (status 200-299)
2. If not OK: parse body for `.error` message, throw `Error`
3. If OK: return `res.json()` typed as `T`

This means all API errors surface as thrown `Error` objects with meaningful messages from the server.
