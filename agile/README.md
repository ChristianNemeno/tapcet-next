# Tapcet — Agile Workspace

This directory is the single source of truth for all product planning, sprint work, and delivery history. Technical reference documentation lives in `docs/`.

---

## How We Work

**Framework:** Scrum  
**Sprint length:** 2 weeks  
**Audience:** Student-focused only — all features serve students preparing for Philippine college entrance exams (UPCAT, ACET, USTET, DLSUCET, PUPCET, DOST-SEI)

---

## Roles

| Role | Responsibility |
|---|---|
| Product Owner | Prioritizes backlog, accepts/rejects completed stories |
| Developer | Implements stories, estimates story points |
| (No Scrum Master currently) | Team self-organizes |

---

## Story Point Scale (Fibonacci)

| Points | Meaning |
|---|---|
| 1 | Trivial — a config change, a copy edit |
| 2 | Simple — one file, no new schema |
| 3 | Small — one route + one component |
| 5 | Medium — a few routes + UI, no infrastructure |
| 8 | Large — new feature area, schema change likely |
| 13 | Complex — multiple layers, design decisions needed |
| 21 | Epic-sized — break it down further before sprinting |

---

## Directory Layout

```
agile/
├── README.md               ← you are here
├── product-backlog.md      ← ordered list of all pending work
├── definition-of-done.md   ← criteria for "done"
├── epics/                  ← one file per epic with user stories + ACs
│   ├── EP-01-creator-profiles.md
│   ├── EP-02-shareable-links.md
│   ├── EP-03-csv-import.md
│   └── EP-04-image-support.md
├── sprints/                ← sprint plans and reviews
│   └── sprint-01.md
├── done/                   ← completed feature documentation
│   └── features.md
└── history/                ← dated implementation notes per feature
    ├── 2026-04-14-ratings-reports-mockexam-refactor.md
    ├── 2026-04-12-collections.md
    ├── 2026-04-11-review-queue.md
    ├── 2026-04-11-weakness-tracker.md
    └── 2026-04-11-scoring-sections.md
```

---

## Sprint Index

| Sprint | Goal | Status |
|---|---|---|
| [Sprint 1](sprints/sprint-01.md) | Shareable links + CSV import | Planning |

---

## Epic Index

| ID | Epic | Priority | Status |
|---|---|---|---|
| EP-01 | [Creator Profiles](epics/EP-01-creator-profiles.md) | 🟡 Community & Growth | Backlog |
| EP-02 | [Shareable Links](epics/EP-02-shareable-links.md) | 🟡 Community & Growth | Sprint 1 |
| EP-03 | [CSV / JSON Import](epics/EP-03-csv-import.md) | 🟡 Community & Growth | Sprint 1 |
| EP-04 | [Image Support](epics/EP-04-image-support.md) | ⚪ Nice to Have | Backlog |
