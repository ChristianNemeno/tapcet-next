# 2026-04-16 — EP-02 Shareable Links

**Sprint:** Sprint 1  
**Stories:** US-02-1, US-02-2, US-02-3, US-02-4 (8 SP)  
**Status:** Shipped

---

## What was built

A single reusable `CopyLinkButton` component placed on four surfaces:

| Surface | Placement |
|---|---|
| `/quiz/:id` (pre-quiz screen) | Below "Start Quiz" button |
| `/quiz/:id/results` | First button in action row; copies quiz URL (not results URL) |
| `QuizCard` (home + collections) | Icon-only button top-right of card; click stops propagation |
| `/collection/:id` | First button in actions column |

## Key files

- `client/src/components/CopyLinkButton.tsx` — new component
- `client/src/app/quiz/[id]/page.tsx` — US-02-1
- `client/src/app/quiz/[id]/results/page.tsx` — US-02-4
- `client/src/app/page.tsx` — US-02-2 (QuizCard)
- `client/src/app/collection/[id]/page.tsx` — US-02-3

## Decisions

- Feedback is inline button state (`Copied!` for 2 s) — no external toast library required.
- `execCommand("copy")` fallback included for non-HTTPS or older browsers.
- Results page share always links to `/quiz/:id` so the recipient gets the quiz, not a stale results page.
- `label=""` prop on QuizCard renders icon-only mode (smaller hit target, less visual noise on the card grid).
