# Sprint 1

**Dates:** TBD (2-week sprint)  
**Status:** Planning  
**Sprint Goal:** Enable students and creators to share quizzes easily, and let content contributors bulk-import questions so large question banks are practical to create.

---

## Sprint Backlog

| ID | Story | Points | Status |
|---|---|---|---|
| US-02-1 | Share button on quiz detail + results page | 2 | To Do |
| US-02-2 | Share button on quiz cards (home + collections) | 2 | To Do |
| US-02-3 | Share collection link | 2 | To Do |
| US-02-4 | Share from results page | 2 | To Do |
| US-03-1 | Download CSV template | 1 | To Do |
| US-03-2 | Upload CSV on quiz creation page | 3 | To Do |
| US-03-3 | Server-side CSV validation endpoint | 5 | To Do |
| US-03-4 | Import CSV via quiz edit page | 3 | To Do |
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
- [ ] Copy link button works on quiz detail page
- [ ] Copy link button works on quiz cards (home)
- [ ] Copy link button works on collection detail page
- [ ] Copy link button works on results page
- [ ] "Link copied" toast appears and disappears after ~2 seconds
- [ ] Works in Chrome, Firefox, Safari (clipboard API)
- [ ] No auth required to use any share button

### CSV Import
- [ ] Template CSV downloads with correct headers and example row
- [ ] Valid CSV with 10 rows populates 10 questions in the quiz form
- [ ] Invalid rows return row-specific error messages
- [ ] Valid rows are kept even when some rows fail
- [ ] Empty file / wrong file type shows a clear error
- [ ] File > 1 MB is rejected with a clear error
- [ ] CSV upload works on both create and edit pages
- [ ] Imported questions can be edited/removed in the form before saving

---

## Sprint Notes

_(Fill in during/after sprint)_

**Decisions made:**

**Blockers:**

**Deferred to backlog:**

---

## Sprint Review / Retrospective

_(Fill in after sprint completes)_

**Demo:** 

**What went well:**

**What to improve:**

**Velocity:** ___ / 20 SP completed
