# Tapcet Documentation

**Tapcet** is a full-stack quiz platform where users can take timed quizzes, compete on leaderboards, and track their scores. Admins can create and manage quizzes through a dedicated management interface.

## Table of Contents

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | System overview, tech stack, monorepo structure, and data flow diagrams |
| [Getting Started](./getting-started.md) | Prerequisites, installation, environment setup, and running locally |
| [API Reference](./api-reference.md) | Complete REST API documentation with request/response examples |
| [Database](./database.md) | Schema design, entity-relationship diagram, migrations, and seeding |
| [Client](./client.md) | Next.js frontend — pages, routing, auth context, components |
| [Deployment](./deployment.md) | Docker, Docker Compose, Nginx reverse proxy, Cloudflare Tunnel |
| [Contributing](./contributing.md) | Development workflow, code conventions, and how to extend the project |

## Quick Start

```bash
# Clone and install
git clone <repo-url> && cd tapcet-next
cp .env.example .env          # Edit with your values
npm run install:all

# Start development
npm run dev:server             # Express API on :3001
npm run dev:client             # Next.js on :3000
```

See [Getting Started](./getting-started.md) for the full setup guide.
