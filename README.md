# Tapcet

**Tapcet** is a free, community-driven reviewer platform built specifically for Filipino students preparing for college entrance examinations and scholarship tests — UPCAT, ACET, USTET, DLSUCET, PUPCET, DOST-SEI, JLSS, and more.

The platform gives students a place to practice under real exam conditions, track their progress across subjects, and access quizzes made by the community — without paying for a review center.

---

## The Problem It Solves

Filipino students often prepare for 2–4 entrance exams in a single season, each with different formats, subjects, and scoring rules. Review centers are expensive. Practice materials are scattered across chat groups, PDFs, and informal notes. There is no central, free, interactive place to practice specifically for these exams.

Tapcet is that place.

---

## Target Exams and Scholarships

| Exam / Scholarship | Institution | What It's For |
|--------------------|-------------|---------------|
| **UPCAT** | University of the Philippines | Admission to any UP campus nationwide |
| **ACET** | Ateneo de Manila University | Admission to AdMU; includes essay section |
| **USTET** | University of Santo Tomas | Admission to UST undergraduate programs |
| **DLSUCET** | De La Salle University | Admission to DLSU; no guessing penalty |
| **PUPCET** | Polytechnic University of the Philippines | Free tuition; ~50,000 annual takers |
| **DOST-SEI Merit** | Dept. of Science and Technology | Full STEM scholarship for HS graduates |
| **JLSS** | Dept. of Science and Technology | Mid-degree STEM scholarship for 2nd-year college students |

Each exam has different sections, time limits, and scoring rules. Tapcet is designed to reflect those differences — not flatten them into a generic quiz format.

---

## Who It Is For

- **Grade 11–12 students** preparing for one or more college entrance exams
- **College applicants** who cannot afford or access a review center
- **2nd-year STEM students** preparing for DOST JLSS scholarship exams
- **Teachers and review instructors** building quiz sets for their students
- **Student communities** sharing practice materials in a structured, repeatable format

---

## Core Features

- Browse and take quizzes organized by exam and subject
- Timed quiz sessions that reflect actual exam conditions
- Per-question result breakdowns showing correct answers and explanations
- Personal dashboard tracking attempt history across quizzes
- Leaderboards for score comparison
- Community quiz creation — any registered user can build and share quizzes
- Admin tools for managing official, curated quiz sets

---

## Subjects Covered

Tapcet's content is organized around the subjects tested across all major CETs:

- **English** — grammar, vocabulary, reading comprehension
- **Mathematics** — arithmetic, algebra, geometry, statistics, word problems
- **Science** — biology, chemistry, physics, earth science
- **Abstract / Logical Reasoning** — patterns, analogies, spatial reasoning
- **Filipino** — language proficiency and reading comprehension (UPCAT)
- **Mechanical-Technical** — simple machines, diagrams, spatial reasoning (DOST/JLSS)
- **General Information** — Philippine history, geography, current events (PUPCET)

See [`docs/research/subject-coverage.md`](./docs/research/subject-coverage.md) for the full topic breakdown per exam.

---

## Tech Overview

Tapcet is a monorepo:

| Directory | Stack |
|-----------|-------|
| `client/` | Next.js 16, React 19, Tailwind CSS, TypeScript |
| `server/` | Express, Drizzle ORM, PostgreSQL, TypeScript |
| `docs/` | Architecture, API reference, research |

Deployment: Docker + Nginx + Cloudflare Tunnel.

---

## Quick Start

```bash
git clone <repo-url>
cd tapcet-next
cp .env.example .env
# Set JWT_SECRET and database credentials in .env
docker compose up -d --build
```

Open `http://localhost:80`.

For local development without Docker, see [Getting Started](./docs/getting-started.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/architecture.md) | System overview, stack, and request flow |
| [Getting Started](./docs/getting-started.md) | Installation, environment setup, local development |
| [API Reference](./docs/api-reference.md) | REST endpoints and request/response examples |
| [Database](./docs/database.md) | Schema, migrations, and seeding |
| [Client](./docs/client.md) | Frontend pages, routing, auth context, UI |
| [Deployment](./docs/deployment.md) | Docker, Nginx, and production notes |
| [Contributing](./docs/contributing.md) | Development workflow and contribution guidance |
| [Research](./docs/research/README.md) | Exam formats, subject coverage, and platform strategy |

---

## Roadmap Direction

The next phase of Tapcet focuses on making it genuinely exam-specific:

- Exam tags on quizzes (UPCAT, ACET, USTET, etc.)
- Subject and topic taxonomy mapped to actual exam coverage
- Penalized scoring mode for UPCAT (right-minus-wrong)
- Section-level timers matching each exam's actual time structure
- Full mock exam simulator per target school
- Per-topic performance analytics
- Curated official quiz banks maintained by admins

See [`docs/research/platform-strategy.md`](./docs/research/platform-strategy.md) for the full product direction.
