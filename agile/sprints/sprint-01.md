# Sprint 1

**Dates:** 2026-04-16 → 2026-04-29  
**Status:** Done  
**Sprint Goal:** Enable students and creators to share quizzes easily, and let content contributors bulk-import questions so large question banks are practical to create.

---

## Sprint Backlog

| ID | Story | Points | Status |
|---|---|---|---|
| US-02-1 | Share button on quiz detail + results page | 2 | ✅ Done |
| US-02-2 | Share button on quiz cards (home + collections) | 2 | ✅ Done |
| US-02-3 | Share collection link | 2 | ✅ Done |
| US-02-4 | Share from results page | 2 | ✅ Done |
| US-03-1 | Download CSV template | 1 | ✅ Done |
| US-03-2 | Upload CSV on quiz creation page | 3 | ✅ Done |
| US-03-3 | Server-side CSV validation endpoint | 5 | ✅ Done |
| US-03-4 | Import CSV via quiz edit page | 3 | ✅ Done |
| **Total** | | **20 SP** | |

> US-03-5 (JSON import) is **deferred to Sprint 2** — 20 SP is the target capacity for this sprint.

---

## Suggested Build Order

Work shareable links first — they're frontend-only and build confidence. Then tackle CSV import.

### Week 1 — Shareable Links (8 SP)

**Day 1–2:** US-02-1 — Share button on quiz detail + results
- Add `CopyLinkButton` component (clipboard API + toast feedback)
- Place on `/quiz/:id` page and `/quiz/:id/results` page

**Day 3:** US-02-2 — Share icon on quiz cards
- Add share icon to `QuizCard` component (home page + collection detail)

**Day 4:** US-02-3 + US-02-4 — Collection share + results page share
- Add "Copy link" to `/collection/:id` page
- Confirm results page share points to quiz URL (not results URL)

**Day 5:** Buffer / polish / cross-browser clipboard testing

### Week 2 — CSV Import (12 SP)

**Day 1:** US-03-1 — CSV template download
- Create a static template file or generate it dynamically
- Add download link to quiz creation page

**Day 2–3:** US-03-3 — Server-side validation endpoint
- `POST /api/quiz/import/validate` — parse + validate rows, return `{ valid, errors }`
- Write tests for validation logic (required fields, answer range, empty strings)

**Day 4:** US-03-2 — CSV upload on creation page
- File input on quiz create form
- Client-side parse with `papaparse`
- Call validation endpoint, show errors, merge valid rows into form state

**Day 5:** US-03-4 — CSV upload on edit page
- Same component, different placement (edit page)
- Append to existing questions (not replace)
- Integration test: upload → validate → form populated correctly

---

## Acceptance Checklist

Before marking Sprint 1 **Done**, all of the following must pass:

### Shareable Links
- [x] Copy link button works on quiz detail page
- [x] Copy link button works on quiz cards (home)
- [x] Copy link button works on collection detail page
- [x] Copy link button works on results page
- [x] "Copied!" feedback appears and disappears after ~2 seconds (inline button state, no separate toast)
- [x] Works in Chrome, Firefox, Safari (clipboard API + execCommand fallback)
- [x] No auth required to use any share button

### CSV Import
- [x] Template CSV downloads with correct headers and example row
- [x] Valid CSV with 10 rows populates 10 questions in the quiz form
- [x] Invalid rows return row-specific error messages
- [x] Valid rows are kept even when some rows fail
- [x] Empty file / wrong file type shows a clear error
- [x] File > 1 MB is rejected with a clear error
- [x] CSV upload works on both create and edit pages
- [x] Imported questions can be edited/removed in the form before saving

---

## Sprint Notes

**Decisions made:**
- US-03-1/2/3/4: CSV parsing is client-side (papaparse), validation is server-side (`POST /api/quiz/import/validate`). Row errors are shown inline in `CsvImporter` component; valid rows are still imported even if some rows fail.
- Edit page importer uses `mode="append"` — imported questions are appended to existing ones, not replaced.
- Answer column accepts A/B/C/D (case-insensitive). 1-indexed numbers were not supported to avoid ambiguity.
- Max 200 rows per import enforced on server; max 1 MB file size enforced client-side.
- papaparse added to client dependencies — run `npm install` (or equivalent) in `client/` before building.
- US-02-1/2/3/4 shipped as a single `CopyLinkButton` component (`client/src/components/CopyLinkButton.tsx`). Feedback is inline button state ("Copied!" for 2 s) rather than a toast — no toast library needed, simpler, works the same.
- Results page share link points to `/quiz/:id` (not `/quiz/:id/results`) so the recipient can take the quiz.
- QuizCard share icon stops click propagation to avoid navigating while copying.
- Clipboard fallback uses `execCommand("copy")` for browsers that block the async Clipboard API without HTTPS.

**Blockers:** Infrastructure issues hit on 2026-04-16 (resolved same day) — see `history/2026-04-16-infra-fixes.md`

**Deferred to backlog:** None

---

## Sprint Review / Retrospective

**Demo:** Both epics delivered end-to-end on 2026-04-16.
- Shareable links: copy button on quiz detail, results, quiz cards, and collection pages.
- CSV import: template download, client-side parse (papaparse), server-side validation endpoint (`POST /api/quiz/import/validate`), integrated on both create and edit pages.

**What went well:**
- All 20 SP shipped in a single day rather than across 2 weeks — both epics were well-scoped and unblocked.
- Single `CopyLinkButton` component covered all four share surfaces cleanly; no toast library needed.
- Partial-import strategy (valid rows pass even when some rows fail) was the right call — keeps the UX forgiving for large uploads.
- Server-side validation endpoint is thoroughly tested (8 tests), which made the client integration straightforward.

**What to improve:**
- Infrastructure setup cost a session at the start of the sprint (missing `.env`, `trust proxy` not set, stale Docker volume). Document the setup steps in `docs/` so it doesn't repeat.
- The answer-column format (A/B/C/D only, no numeric) should be documented prominently in the template CSV, not just in code comments.

**Velocity:** 20 / 20 SP completed
