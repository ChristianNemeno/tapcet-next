# Deployment Architecture (Docker)

## Docker Compose Stack

```mermaid
graph TB
    subgraph "Docker Compose Stack"
        subgraph "nginx service"
            NGINX["nginx:alpine<br/>Exposed Port: 80"]
        end

        subgraph "client service"
            CLIENT["Next.js Standalone<br/>Internal Port: 3000"]
        end

        subgraph "server service"
            SERVER["Express.js<br/>Internal Port: 3001"]
        end

        subgraph "db service"
            PG["postgres:16-alpine<br/>Internal Port: 5432<br/>Volume: postgres_data"]
        end
    end

    INTERNET["Internet<br/>:80"] --> NGINX
    NGINX -->|"/api/*"| SERVER
    NGINX -->|"/*"| CLIENT
    NGINX -->|"/_next/webpack-hmr"| CLIENT
    SERVER -->|"DATABASE_URL"| PG

    PG -.->|"healthcheck:<br/>pg_isready"| SERVER

    style INTERNET fill:#1a1a2e,stroke:#e94560,color:#e94560
    style NGINX fill:#0f3460,stroke:#16213e,color:#e94560
    style CLIENT fill:#16213e,stroke:#0f3460,color:#e94560
    style SERVER fill:#16213e,stroke:#0f3460,color:#e94560
    style PG fill:#533483,stroke:#0f3460,color:#e94560
```

## Service Dependencies

```mermaid
graph LR
    NGINX["nginx"] --> CLIENT["client"]
    NGINX --> SERVER["server"]
    SERVER --> DB["db (healthy)"]
    CLIENT --> SERVER
```

- **db**: Must pass `pg_isready` healthcheck before server starts
- **server**: Depends on `db` (condition: `service_healthy`)
- **client**: Depends on `server`
- **nginx**: Depends on both `client` and `server`

## Nginx Request Routing

```mermaid
flowchart TD
    REQ["Incoming HTTP Request<br/>Port 80"] --> SEC["Apply Security Headers:<br/>• X-Frame-Options: SAMEORIGIN<br/>• X-Content-Type-Options: nosniff<br/>• X-XSS-Protection: 1; mode=block<br/>• Referrer-Policy: strict-origin<br/>• Permissions-Policy: deny all"]

    SEC --> PATH{"Match path"}

    PATH -->|"/api/*"| EXPRESS["proxy_pass → http://server:3001<br/>Forward: Host, X-Real-IP,<br/>X-Forwarded-For"]

    PATH -->|"/_next/webpack-hmr"| HMR["proxy_pass → http://client:3000<br/>Upgrade: websocket<br/>Connection: upgrade"]

    PATH -->|"/* everything else"| NEXTJS["proxy_pass → http://client:3000<br/>Forward: Host, X-Real-IP,<br/>X-Forwarded-For<br/>+ Upgrade + Connection headers"]

    style REQ fill:#1a1a2e,stroke:#e94560,color:#e94560
    style SEC fill:#4a0e4e,stroke:#9b59b6,color:#fff
    style EXPRESS fill:#006400,stroke:#00ff00,color:#fff
    style HMR fill:#2f4f4f,stroke:#708090,color:#fff
    style NEXTJS fill:#0f3460,stroke:#16213e,color:#fff
```

## Environment Variables

| Service | Variable | Purpose |
|---------|----------|---------|
| `db` | `POSTGRES_DB` | Database name (default: `tapcetdb`) |
| `db` | `POSTGRES_USER` | DB user (default: `tapcetuser`) |
| `db` | `POSTGRES_PASSWORD` | DB password (default: `tapcetpass`) |
| `server` | `DATABASE_URL` | Full Postgres connection string |
| `server` | `JWT_SECRET` | Secret key for JWT signing |
| `server` | `PORT` | Server listen port (3001) |
