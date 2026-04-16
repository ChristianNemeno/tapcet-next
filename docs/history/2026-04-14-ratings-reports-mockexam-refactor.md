# Quiz Ratings, Question Reporting, Mock Exams, and Service Refactor

> Date: 2026-04-14
> Commits: c878ed3, fd77937, 6485515

---

## Summary

Three features shipped across two commits, plus a service-layer refactor:

1. **Quiz Ratings** — users rate a quiz 1–5 stars after completing it. Upserted per user. Aggregate average/count exposed on quiz and results pages.
2. **Question Reporting** — users flag individual questions as incorrect, ambiguous, or duplicate from the results page. Admin report queue with status lifecycle (open → reviewing → resolved).
3. **Mock Exam support** — `quizType` field (`standard` | `mock_exam`) on quizzes. Dedicated `/mock-exams` browse page. Section breakdown in results for mock exams.
4. **Service-layer refactor** — business logic extracted into `gradingService`, `quizService`, `ratingService`. Zod schemas moved to `server/src/schemas/`. `validateBody` middleware centralized. Robust error handling added.

---

## Changes

### Schema

#### `server/src/db/schema.ts`
- Added `quizTypeEnum` pgEnum (`"standard" | "mock_exam"`)
- Added `reportTypeEnum` pgEnum (`"incorrect" | "ambiguous" | "duplicate"`)
- Added `reportStatusEnum` pgEnum (`"open" | "reviewing" | "resolved"`)
- Added `quizType` column to `quizzes` (default `"standard"`)
- Added `quizRatings` table: `id`, `userId` (FK cascade), `quizId` (FK cascade), `rating`, `ratedAt` — unique on `(userId, quizId)`
- Added `questionReports` table: `id`, `userId`, `questionId`, `quizId`, `reportType`, `comment`, `status` (default `"open"`), `createdAt`, `resolvedAt`, `resolvedBy`

### New Routes

#### `server/src/routes/rating.ts`
- `GET /api/quiz/:id/rating` — public rating summary (`averageRating`, `ratingCount`, optional `userRating`); uses `optionalAuth`
- `POST /api/quiz/:id/rate` — upsert user rating (auth required); returns updated summary

#### `server/src/routes/report.ts`
- `POST /api/question/:id/report` — flag a question (auth required); validates question belongs to given quiz
- `GET /api/admin/reports` — paginated report list with `?status=` and `?reportType=` filters (admin only); joins question text, quiz title, reporter name
- `PUT /api/admin/report/:id` — update report status; sets `resolvedAt` and `resolvedBy` when resolved (admin only)

### Services

#### `server/src/services/gradingService.ts` (new)
- Extracted grading logic from `quiz.ts`: computes correct/incorrect per question, penalty points, final percentage

#### `server/src/services/quizService.ts` (new)
- Extracted quiz fetch + section/question assembly from route handler

#### `server/src/services/ratingService.ts` (new)
- `getRatingSummary(quizId, userId?)` — aggregates avg + count; returns `userRating` if authenticated
- `upsertRating(quizId, userId, rating)` — insert or update on conflict

### Schemas

#### `server/src/schemas/rating.ts`, `report.ts`, `review.ts`, `quiz.ts`, `auth.ts`, `collection.ts`
- Zod schemas moved out of route files; `validateBody` middleware accepts schema and infers type

### Middleware

#### `server/src/middleware/validateRequest.ts` (new)
- `validateBody(schema)` — validates `req.body` against a Zod schema; returns 400 with field-level errors on failure

#### `server/src/middleware/authorize.ts` (new)
- `requireOwnerOrAdmin` helper for resource-level authorization checks

### Client

#### `client/src/lib/types.ts`
- Added `RatingSummary` interface
- Added `QuestionReport`, `AdminReport` interfaces
- Added `quizType` field to `QuizSummary` and `QuizDetail`

#### `client/src/lib/api.ts`
- Added `fetchRating`, `rateQuiz`, `reportQuestion`

#### `client/src/app/mock-exams/page.tsx` (new)
- Browse page for `quizType === "mock_exam"` quizzes; same card grid as `/quizzes`

#### `client/src/app/quiz/[id]/results/page.tsx`
- Added star rating widget (1–5, filled/empty); calls `rateQuiz` on select; shows existing `userRating`
- Added "Report" dropdown per question in the breakdown table; modal with reason selector and comment
- Added section breakdown table for mock exam results

### `server/src/index.ts`
- Registered `ratingRouter` and `reportRouter`
