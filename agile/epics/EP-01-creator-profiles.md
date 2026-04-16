# EP-01: Public Creator Profiles

**Priority:** 🟡 Community & Growth  
**Sprint:** 2  
**Total Estimate:** 13 story points  
**Status:** ✅ Done

---

## Why

Right now, quizzes show a "created by [name]" label but clicking it does nothing. There's no way to browse by creator, follow a quality contributor, or understand who is producing the best content.

A public profile page builds a reputation layer on top of the content. Students can find and trust reliable sources. Quality contributors get visibility and a reason to keep contributing.

---

## Scope

A public profile page at `/user/:id` (or `/creator/:name`) showing:
- Creator's display name
- Published quizzes (public, sorted by most-taken or highest-rated)
- Published collections
- Aggregate stats: total quizzes, total quiz attempts, average rating

No social graph (follow/unfollow creator) in this sprint — that's a follow-on.

---

## User Stories

### US-01-1 — Public creator profile page
**As a student**, I want to visit a creator's profile page, so I can see all their public quizzes and decide if they're a reliable source.

**Story Points:** 5

**Acceptance Criteria:**
- [ ] Route `/user/:id` renders a public profile page
- [ ] Shows: display name, join date (month + year), total public quizzes, total collections
- [ ] Lists all public quizzes by this creator (same card style as home page)
- [ ] Lists all public collections by this creator
- [ ] Page is publicly accessible — no auth required
- [ ] Returns 404 if user ID doesn't exist

---

### US-01-2 — Creator name links to profile
**As a student**, when I see "Created by [name]" on a quiz card or quiz detail page, I want to click the name to visit their profile.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] Creator name on quiz cards (home page, collections page) is a clickable link
- [ ] Creator name on quiz detail page (`/quiz/:id`) is a clickable link
- [ ] Both link to `/user/:id` for that creator
- [ ] If creator is deleted/null, name is displayed as plain text (no broken link)

---

### US-01-3 — Creator stats on profile
**As a student**, I want to see how popular a creator's quizzes are, so I can gauge whether they're worth following.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] Profile page shows aggregate stats:
  - Total public quizzes
  - Total quiz attempts across all their quizzes (sum of leaderboard entries)
  - Average rating across all their rated quizzes (null if no ratings yet)
- [ ] Stats are displayed as a compact header row / stat cards

---

### US-01-4 — Own profile in dashboard
**As a logged-in user**, I want to view my own public profile, so I can see how my content appears to other students.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] Dashboard navigation includes a "My Profile" link that opens `/user/:id` for the current user
- [ ] The page renders the same as any other profile (no editing here — editing is in the dashboard)

---

### US-01-5 — Server endpoint for creator profile
**As a developer**, I need a `GET /api/user/:id/profile` endpoint that returns public profile data, so the profile page can be populated.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] `GET /api/user/:id/profile` returns:
  ```json
  {
    "id": "...",
    "name": "Alice",
    "joinedAt": "2026-01-01T00:00:00.000Z",
    "quizCount": 12,
    "collectionCount": 3,
    "totalAttempts": 847,
    "averageRating": 4.3,
    "quizzes": [...QuizSummary],
    "collections": [...CollectionSummary]
  }
  ```
- [ ] Only public quizzes and collections are included
- [ ] Returns 404 if user does not exist
- [ ] No auth required

---

## Out of Scope (this sprint)

- Follow / unfollow creator — deferred
- Creator bio / avatar — deferred (no image upload yet)
- "Verified creator" badge — deferred
- Creator leaderboard (most quizzes, most attempts) — deferred

---

## Dependencies

- `users` table already exists — no schema changes needed
- `quizzes.createdBy` FK already exists
- `quiz_ratings` table already exists for average rating calculation
- `leaderboard` table already exists for total attempts

## Technical Notes

- No schema changes required — all data already exists
- The profile endpoint aggregates across existing tables with a few joins/subqueries
- Consider adding a DB index on `quizzes.createdBy` if not already present (check `schema.ts`)
