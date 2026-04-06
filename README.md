# Tapcet

**Tapcet** is a community-driven reviewer app for scholars in the Philippines. It is built as a hub for browsing, sharing, and taking quizzes for exam preparation, especially for college entrance tests and other academic reviewers.

The product is designed around practical study habits: find a quiz, test what you know, review your results, and keep coming back to sharpen weak areas. The current focus is a scholar-first quiz and reviewer platform, not a full intelligent tutoring system.

## Who It Is For

- Senior high school students preparing for college entrance exams
- College applicants looking for repeatable reviewer practice
- Learners who want a central place to access community-made quiz content
- Student communities that want to share review materials in quiz form

## What Tapcet Is Today

Tapcet is a reviewer hub built around community-created quizzes and lightweight progress tracking. It gives learners a clean place to browse available quizzes, take timed assessments, compare scores, and revisit their performance over time.

The product identity is intentionally narrow:
- a quiz reviewer app first
- a scholar hub for shared practice materials
- a community-driven study platform

It is not currently positioned as a full adaptive learning or intelligent tutoring product.

## Core Features

- Browse publicly available quizzes from a shared quiz library
- Take timed quizzes with optional nickname-based participation
- Register and log in to keep a personal dashboard of attempts
- View quiz results with per-question breakdowns
- Compare performance on quiz leaderboards
- Create and manage quizzes through the admin interface

## Why Community-Driven Matters

Reviewer materials are often scattered across notes, chat groups, and informal document collections. Tapcet aims to bring those practice materials into one place where quiz content can be shared in a format that is easier to repeat, compare, and improve.

A community-driven reviewer hub also makes the platform more useful over time:
- more contributors can expand subject coverage
- learners can discover quizzes beyond their own circles
- quiz practice becomes easier to revisit and standardize

## Tech Overview

Tapcet is a monorepo with:

- `client/` — Next.js 16 frontend
- `server/` — Express API
- PostgreSQL for persistence
- Docker, Nginx, and Cloudflare Tunnel support for deployment

## Quick Start

```bash
git clone <repo-url>
cd tapcet-next
cp .env.example .env
npm run install:all
```

Run the app in two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Then open `http://localhost:3000`.

For full setup details, see [Getting Started](./docs/getting-started.md).

## Documentation

| Document | Description |
|---|---|
| [Architecture](./docs/architecture.md) | System overview, stack, monorepo structure, and request flow |
| [Getting Started](./docs/getting-started.md) | Installation, environment setup, and local development |
| [API Reference](./docs/api-reference.md) | REST API endpoints and request/response examples |
| [Database](./docs/database.md) | Schema design, migrations, and seeding |
| [Client](./docs/client.md) | Frontend pages, routing, auth context, and UI structure |
| [Deployment](./docs/deployment.md) | Docker, Nginx, and production deployment notes |
| [Contributing](./docs/contributing.md) | Development workflow and contribution guidance |

## Future Recommendations

If Tapcet expands beyond its current reviewer-hub scope, the next logical step is light adaptive learning rather than a full tutoring-platform pivot.

Good future additions would be:
- recommended next quizzes based on past attempts
- weak-topic surfacing from incorrect answers
- review queues for missed questions
- personalized study suggestions across quiz categories

That would let Tapcet grow toward an intelligent tutoring direction without losing its core identity as a community-driven reviewer app for scholars.
