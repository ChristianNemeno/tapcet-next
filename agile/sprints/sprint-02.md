# Sprint 2

**Dates:** 2026-04-30 → 2026-05-13  
**Status:** Upcoming  
**Sprint Goal:** Give creators a public identity — students can browse quizzes by creator, see aggregate stats, and click through from any quiz card to a full creator profile. Also ships the deferred JSON import story from Sprint 1.

---

## Sprint Backlog

| ID | Story | Points | Status |
|---|---|---|---|
| US-01-5 | Server endpoint `GET /api/user/:id/profile` | 3 | 📋 |
| US-01-1 | Public creator profile page `/user/:id` | 5 | 📋 |
| US-01-2 | Creator name links to profile on quiz cards + detail page | 2 | 📋 |
| US-01-3 | Aggregate stats (quizzes, attempts, avg rating) on profile | 3 | 📋 |
| US-01-4 | "My Profile" link in dashboard | 2 | 📋 |
| US-03-5 | JSON import on create + edit pages | 2 | 📋 |
| **Total** | | **17 SP** | |

> 3 SP buffer below nominal 20 SP capacity — use for polish, cross-browser testing, or absorbing scope surprises.

---

## Suggested Build Order

Start with the server endpoint — the UI stories all depend on it. JSON import is independent and can run in parallel or at the end.

### Week 1 — Server + Profile Shell (10 SP)

**Day 1–2:** US-01-5 — `GET /api/user/:id/profile`
- Aggregates: `quizCount`, `collectionCount`, `totalAttempts` (sum of leaderboard), `averageRating` (avg of quiz_ratings)
- Returns only public quizzes + collections
- 404 if user does not exist
- Write tests for the aggregation logic and 404 case

**Day 3–4:** US-01-1 — Profile page shell
- Route `/user/:id`, fetches from the new endpoint
- Layout: header (name, join date, stat row), then quiz list, then collection list
- 404 handling: redirect or render "User not found"
- Reuse `QuizCard` component for the quiz list

**Day 5:** US-01-3 — Stat row polish
- Total quizzes, total attempts, average rating (show "—" if no ratings yet)
- Displayed as compact stat cards in the profile header

### Week 2 — Linking + Dashboard + JSON Import (7 SP)

**Day 1:** US-01-2 — Wire up creator links
- Quiz cards (home page, collection page): creator name → `/user/:id`
- Quiz detail page: creator name → `/user/:id`
- Null guard: if `createdBy` is missing, render plain text

**Day 2:** US-01-4 — "My Profile" link in dashboard
- Add link to sidebar/nav pointing to `/user/:id` for the logged-in user
- Page renders exactly like any other profile (no edit controls)

**Day 3–4:** US-03-5 — JSON import
- File input accepts `.json` alongside `.csv` on create and edit pages
- Validate against `QuizFormPayload` Zod schema server-side
- On success, merges into form state (same as CSV flow)
- Clear error messages for invalid structure (missing fields, wrong types)

**Day 5:** Buffer — end-to-end walkthrough, edge cases, regression check

---

## Acceptance Checklist

### Creator Profiles (EP-01)
- [ ] `GET /api/user/:id/profile` returns correct shape (see EP-01-creator-profiles.md)
- [ ] Returns 404 for unknown user ID
- [ ] Only public quizzes and collections appear on the profile
- [ ] Profile page loads at `/user/:id`
- [ ] Stat row shows: quiz count, total attempts, average rating (or "—")
- [ ] Quizzes list uses the same card component as the home page
- [ ] Collections list is present and links to the collection page
- [ ] Creator name on quiz cards (home) links to `/user/:id`
- [ ] Creator name on quiz detail page links to `/user/:id`
- [ ] If `createdBy` is null, no broken link is shown
- [ ] Dashboard includes a "My Profile" link
- [ ] Profile page is publicly accessible — no auth required
- [ ] Page returns a sensible 404 UI for unknown users

### JSON Import (US-03-5)
- [ ] JSON file upload accepted on quiz create and edit pages
- [ ] Valid JSON matching `QuizFormPayload` populates the quiz form
- [ ] Invalid JSON returns row/field-level error messages
- [ ] Empty file / wrong type shows a clear error

---

## Sprint Notes

**Pre-sprint checklist:**
- Confirm `quizzes.createdBy` FK is indexed (check `schema.ts`) — the profile endpoint will aggregate across it
- No schema changes expected for EP-01 — all tables exist

**Decisions to make:**
- Profile URL: `/user/:id` (UUID) vs. `/creator/:username` (display name). Recommend `:id` for now — display names are not unique in the current schema. Can add slug/username routing later.

**Sprint Notes:**

_(Fill in during sprint)_

---

## Sprint Review / Retrospective

_(Fill in after sprint completes)_

**Demo:**

**What went well:**

**What to improve:**

**Velocity:** _ / 17 SP completed
