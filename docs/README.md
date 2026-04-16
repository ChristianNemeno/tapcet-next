# Tapcet Documentation

A quiz platform for Filipino students preparing for college entrance exams.

## Guides

| Document | Description |
|---|---|
| [Getting Started](getting-started.md) | Local dev setup, environment variables, running the app |
| [Contributing](contributing.md) | Code conventions, adding routes/pages/schema changes |
| [Deployment](deployment.md) | Docker Compose, Cloudflare Tunnel, production setup |

## Reference

| Document | Description |
|---|---|
| [Architecture](architecture.md) | System overview, tech stack, request flow, auth flow |
| [Database](database.md) | Schema reference, Drizzle ORM, migrations, seed data |
| [API Reference](api-reference.md) | All REST endpoints with request/response examples |
| [Client](client.md) | Pages, routing, auth context, API client, components |

## Diagrams

| Document | Description |
|---|---|
| [ERD](diagrams/erd.md) | Entity-relationship diagram for the full database schema |
| [Sequences](diagrams/sequences/) | Flow-by-flow sequence diagrams (auth, quiz, admin, etc.) |
| [Class Diagrams — Client](diagrams/class/client/) | Client-side class/component structure |
| [Class Diagrams — Server](diagrams/class/server/) | Server-side class/module structure |

## Research

| Document | Description |
|---|---|
| [Overview](research/README.md) | Philippine CET comparison table and key design observations |
| [Subject Coverage](research/subject-coverage.md) | Topics tested across all exams |
| [Platform Strategy](research/platform-strategy.md) | How research maps to product decisions |
| [Exams](research/exams/) | Per-exam deep dives: UPCAT, ACET, USTET, DLSUCET, PUPCET |
| [Scholarships](research/scholarships/) | DOST-SEI and JLSS scholarship exam details |

## Planning & History

Product planning, sprint work, and delivery history live in [`agile/`](../agile/README.md):

| Document | Description |
|---|---|
| [Agile Workspace](../agile/README.md) | Sprint index, epic index, how we work |
| [Product Backlog](../agile/product-backlog.md) | Prioritized feature backlog |
| [Done Features](../agile/done/features.md) | Everything currently built and shipped |
| [History](../agile/history/) | Dated implementation notes per feature |
