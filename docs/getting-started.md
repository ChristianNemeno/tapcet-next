# Getting Started

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 20 LTS | Runtime for both client and server |
| **npm** | 10+ | Package management (ships with Node 20) |
| **PostgreSQL** | 16 | Database (or use Docker) |

> [!TIP]
> If you don't want to install PostgreSQL locally, you can use Docker for just the database:
> ```bash
> docker run -d --name tapcet-db \
>   -e POSTGRES_DB=tapcetdb \
>   -e POSTGRES_USER=tapcetuser \
>   -e POSTGRES_PASSWORD=tapcetpass \
>   -p 5432:5432 \
>   postgres:16-alpine
> ```

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd tapcet-next
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
POSTGRES_DB=tapcetdb
POSTGRES_USER=tapcetuser
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql://tapcetuser:changeme@localhost:5432/tapcetdb
JWT_SECRET=change-this-to-a-long-random-secret
TUNNEL_TOKEN=your-cloudflare-tunnel-token-here
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_DB` | Yes | `tapcetdb` | PostgreSQL database name |
| `POSTGRES_USER` | Yes | `tapcetuser` | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | — | PostgreSQL password |
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens. Use a long random string. |
| `TUNNEL_TOKEN` | No | — | Cloudflare Tunnel token (production only) |
| `PORT` | No | `3001` | Express server port |
| `CLIENT_ORIGIN` | No | `http://localhost:3000` | CORS origin for dev mode |
| `NEXT_OUTPUT` | No | — | Set to `standalone` for Docker production builds |

> [!IMPORTANT]
> `JWT_SECRET` must be a strong, random string in production. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Install Dependencies

```bash
npm run install:all
```

This runs `npm install` in both the `server/` and `client/` directories.

### 4. Set Up the Database

Ensure PostgreSQL is running and the database exists. The server will **automatically run Drizzle migrations and seed data** on startup, so no manual migration step is needed.

If you need to create the database manually:

```bash
createdb tapcetdb
```

## Running Locally

Open **two terminals**:

```bash
# Terminal 1 — Start the API server
npm run dev:server
# → Express running on http://localhost:3001
```

```bash
# Terminal 2 — Start the frontend
npm run dev:client
# → Next.js running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> In development, the Next.js dev server proxies all `/api/*` requests to `localhost:3001` via rewrites configured in `client/next.config.ts`. You don't need Nginx locally.

## Available Scripts

| Script | Location | Description |
|---|---|---|
| `npm run install:all` | Root | Install dependencies for both client and server |
| `npm run dev:server` | Root | Start Express in watch mode (uses `tsx watch`) |
| `npm run dev:client` | Root | Start Next.js dev server |
| `npm run build` | Root | Production build of both client and server |
| `npm run dev` | `client/` | Next.js dev server |
| `npm run build` | `client/` | Next.js production build |
| `npm run lint` | `client/` | Run ESLint |
| `npm run dev` | `server/` | Express dev server with hot reload |
| `npm run build` | `server/` | Compile TypeScript to `dist/` |
| `npm start` | `server/` | Run compiled server from `dist/` |

## Verifying the Setup

1. The server should print `Server running on :3001`
2. The server auto-runs migrations and prints `Database seeded.` on first run
3. Visit `http://localhost:3000` — you should see quiz cards
4. Three seed quizzes are created: **General Knowledge**, **Web Development**, and **Science & Nature**

## Troubleshooting

| Issue | Solution |
|---|---|
| `ECONNREFUSED` on `:5432` | PostgreSQL is not running. Start it or use the Docker command above. |
| `JWT_SECRET environment variable is not set` | Add `JWT_SECRET` to your `.env` file |
| `relation "quizzes" does not exist` | Migrations failed. Check `DATABASE_URL` is correct. |
| Port `:3000` already in use | Another Next.js instance is running. Kill it or change the port. |
| API requests return CORS errors | Ensure `CLIENT_ORIGIN` matches your frontend URL in dev mode. |
