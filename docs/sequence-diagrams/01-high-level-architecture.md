# High-Level Architecture

System overview showing how the browser, nginx reverse proxy, application servers, and database connect.

```mermaid
graph TB
    subgraph "Browser"
        UI["Next.js Client<br/>(React SPA)"]
    end

    subgraph "Nginx Reverse Proxy"
        NG["nginx:alpine<br/>Port 80"]
    end

    subgraph "Application Layer"
        API["Express.js Server<br/>Port 3001"]
        NEXT["Next.js Server<br/>Port 3000"]
    end

    subgraph "Data Layer"
        DB[("PostgreSQL 16<br/>Port 5432")]
    end

    UI -->|"HTTP Requests"| NG
    NG -->|"/api/* routes"| API
    NG -->|"All other routes"| NEXT
    API -->|"Drizzle ORM"| DB
    API -->|"JWT Auth"| API

    style UI fill:#1a1a2e,stroke:#16213e,color:#e94560
    style NG fill:#0f3460,stroke:#16213e,color:#e94560
    style API fill:#16213e,stroke:#0f3460,color:#e94560
    style NEXT fill:#16213e,stroke:#0f3460,color:#e94560
    style DB fill:#533483,stroke:#0f3460,color:#e94560
```

## Key Points

- **Nginx** acts as a single entry point on port 80
- `/api/*` requests are proxied to the **Express.js** backend
- All other requests (pages, assets) go to **Next.js**
- The Express server communicates with **PostgreSQL** via **Drizzle ORM**
- **JWT tokens** are used for authentication (stateless, no session store)
