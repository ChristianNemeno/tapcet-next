# 2026-04-16 — Sprint 2: Creator Profiles + JSON Import

**Sprint:** Sprint 2  
**Stories:** US-01-1, US-01-2, US-01-3, US-01-4, US-01-5, US-03-5 (17 SP)  
**Status:** Shipped

---

## What was built

| Story | Deliverable |
|---|---|
| US-01-5 | `GET /api/user/:id/profile` — aggregates quiz count, collection count, total attempts, avg rating. UUID format validated before DB query (returns 404 on invalid or missing). |
| US-01-1 | `client/src/app/user/[id]/page.tsx` — public profile page with stat cards, quiz grid, collection grid. |
| US-01-3 | Stat row on profile: quiz count, collection count, total attempts, avg rating ("—" if none). |
| US-01-2 | Creator name on `QuizCard` (home page) and on quiz detail pre-quiz screen links to `/user/:id`. |
| US-01-4 | "My Profile" link added to navbar (visible when logged in, links to `/user/:userId`). |
| US-03-5 | `JsonImporter` component on quiz create (replace mode) and edit (append mode) pages. Validates against `QuizFormPayload` question shape client-side. |

---

## Key files

**Server:**
- `server/src/routes/user.ts` — new, `GET /api/user/:id/profile`
- `server/src/routes/auth.ts` — added `userId` to login + register responses
- `server/src/routes/quiz.ts` — added `createdBy` to `GET /api/quizzes` list response
- `server/src/index.ts` — registered `userRouter`

**Client:**
- `client/src/app/user/[id]/page.tsx` — new profile page
- `client/src/components/JsonImporter.tsx` — new component
- `client/src/lib/types.ts` — added `createdBy` to `QuizSummary`, `userId` to `AuthResponse`, added `CreatorProfile` + `CreatorProfileCollection` interfaces
- `client/src/lib/auth-context.tsx` — added `userId` to `AuthState`; updated `login()` signature
- `client/src/lib/api.ts` — added `fetchCreatorProfile()`
- `client/src/app/login/page.tsx` — passes `res.userId` to `setAuth()`
- `client/src/app/register/page.tsx` — passes `res.userId` to `setAuth()`
- `client/src/app/page.tsx` — `QuizCard` creator name links to `/user/:createdBy`
- `client/src/app/quiz/[id]/page.tsx` — pre-quiz screen shows linked creator name
- `client/src/components/navbar.tsx` — "My Profile" link for logged-in users
- `client/src/app/quiz/create/page.tsx` — added `JsonImporter` (replace mode; imports metadata too)
- `client/src/app/quiz/[id]/edit/page.tsx` — added `JsonImporter` (append mode)
- `client/src/lib/auth-context.test.tsx` — updated tests for new `login()` signature

---

## Decisions

- **Profile URL uses UUID** (`/user/:id`), not display name. Display names are not unique in the current schema. Slug routing can be added later.
- **`userId` stored in auth context** (localStorage) on login/register. This avoids needing a `/api/me` round-trip just to build the "My Profile" link.
- **JSON import is fully client-side** (no server validation endpoint). The `QuizFormPayload` schema is simple and deterministic; a server round-trip adds latency for no additional safety.
- **JSON replace mode imports metadata** (title, description, examTags, subject, topic) in addition to questions. Append mode imports questions only.
- **UUID regex guard** on the profile endpoint returns 404 before hitting the DB on obviously invalid IDs (avoids PostgreSQL cast errors).
