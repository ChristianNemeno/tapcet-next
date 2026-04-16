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

## Product

| Document | Description |
|---|---|
| [Features](features.md) | Everything currently built and shipped |
| [Roadmap](roadmap.md) | Planned features, priority tiers, build sequence |

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

## History

Dated implementation notes in [history/](history/) — documents each major feature addition with schema changes, API design decisions, and implementation notes.
