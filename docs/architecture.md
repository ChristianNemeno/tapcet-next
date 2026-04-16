# Architecture

## System Overview

Tapcet is a monorepo containing two independently built applications — a **Next.js 16** frontend client and an **Express** backend server — fronted by **Nginx** as a reverse proxy and backed by **PostgreSQL 16**.

```mermaid
graph LR
    Browser -->|HTTP :80| Nginx

    subgraph Docker Compose
        Nginx -->|"/" routes| Client["Next.js Client\n:3000"]
        Nginx -->|"/api/*" routes| Server["Express Server\n:3001"]
        Server --> DB[(PostgreSQL\n:5432)]
    end

    Nginx --> Cloudflared["Cloudflare Tunnel"]
    Cloudflared -->|Public URL| Internet
```

In **local development**, the Next.js dev server proxies `/api/*` requests to the Express server via [Next.js rewrites](../client/next.config.ts), so Nginx is not needed.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.2 |
| UI Components | shadcn/ui (Base UI + CVA) | v4 |
| Styling | Tailwind CSS | v4 |
| Backend | Express.js | 4.x |
| ORM | Drizzle ORM | 0.40 |
| Database | PostgreSQL | 16 |
| Auth | JWT (jsonwebtoken) + bcrypt | — |
| Containerization | Docker + Docker Compose | — |
| Reverse Proxy | Nginx | Alpine |
| Tunnel | Cloudflare Tunnel (cloudflared) | Latest |

## Monorepo Structure

```
tapcet-next/
├── client/                    # Next.js 16 frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components (navbar, shadcn/ui)
│   │   └── lib/               # API client, auth context, types, utils
│   ├── next.config.ts         # Rewrites, standalone output
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── db/                # Drizzle schema, connection, seed, migrate
│   │   ├── middleware/        # JWT auth, role guards, request validation
│   │   ├── routes/            # auth, quiz, userQuiz, admin, collection, rating, report, review
│   │   ├── schemas/           # Zod validation schemas per domain
│   │   └── services/          # gradingService, quizService, ratingService
│   ├── drizzle/               # SQL migration files
│   ├── drizzle.config.ts      # Drizzle Kit config
│   └── package.json
│
├── nginx/
│   └── nginx.conf             # Reverse proxy configuration
│
├── docker-compose.yml         # Full-stack orchestration
├── Dockerfile                 # Server multi-stage build
├── Dockerfile.client          # Client standalone build
├── .env.example               # Environment variable template
└── package.json               # Root workspace scripts
```

## Request Flow

### Local Development

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as Next.js Dev Server (:3000)
    participant S as Express Server (:3001)
    participant D as PostgreSQL

    B->>C: GET /quiz/abc123
    C-->>B: React page (SSR/CSR)

    B->>C: GET /api/quiz/abc123
    C->>S: Proxy rewrite → GET /api/quiz/abc123
    S->>D: SELECT from quizzes, questions
    D-->>S: rows
    S-->>C: JSON response
    C-->>B: JSON response
```

### Production (Docker Compose)

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx (:80)
    participant C as Next.js Client (:3000)
    participant S as Express Server (:3001)
    participant D as PostgreSQL (:5432)

    B->>N: GET /quiz/abc123
    N->>C: proxy_pass → client:3000
    C-->>N: HTML
    N-->>B: HTML

    B->>N: GET /api/quizzes
    N->>S: proxy_pass → server:3001
    S->>D: Query
    D-->>S: Rows
    S-->>N: JSON
    N-->>B: JSON
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Express Server

    B->>S: POST /api/auth/register {email, password, name}
    S->>S: bcrypt.hash(password, 12)
    S->>S: INSERT user → DB
    S->>S: jwt.sign({userId, role}, secret, {exp: 7d})
    S-->>B: {token, name, role}

    Note over B: Store in localStorage as "tapcet_auth"

    B->>S: GET /api/dashboard (Authorization: Bearer <token>)
    S->>S: jwt.verify(token) → {userId, role}
    S-->>B: User's quiz attempts
```

## Key Design Decisions

1. **Server-side grading** — Answers are validated on the server. The quiz detail endpoint (`GET /api/quiz/:id`) intentionally omits the `answer` column to prevent cheating.

2. **Optional auth for quiz submission** — Users can take quizzes without logging in (anonymous with a nickname). Authenticated users get their attempts linked to their account for the dashboard.

3. **Standalone Next.js output** — In production, Next.js builds a self-contained `standalone` directory that runs with plain `node server.js`, eliminating the need for `node_modules` in the Docker image.

4. **Nginx as API gateway** — In production, Nginx handles routing: `/api/*` goes to Express, everything else goes to Next.js. This removes the need for Next.js rewrites in production.

5. **User-Generated Quizzes** — Normal users and admins can create their own quizzes with visibility scopes (`public` or `draft`). This democratizes content creation while keeping drafts private to the creator.
