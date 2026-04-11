# Missed Questions Review Queue

> Date: 2026-04-11
> Backlog ref: `docs/backlogs.md` — 🟢 Student-Specific (highest study-science ROI)

---

## Summary

Implements a personal spaced-repetition review queue. Every wrong answer a logged-in user gives on any quiz is upserted into a `review_queue` table. Questions re-surface after a delay that grows on each successful review (1 → 3 → 7 → 14 → 30 days). A standalone `/review` page lets students work through due items daily with immediate per-answer feedback. The dashboard gains a "Review Queue" section with live due-count badge.

---

## Changes

### `server/src/db/schema.ts`
- Added `uniqueIndex` to pg-core imports
- Added `reviewQueue` table: `id`, `userId` (FK cascade), `questionId` (FK cascade), `nextReviewAt`, `intervalDays` (default 1), `missCount` (default 1), `createdAt`, `updatedAt`
- Unique index on `(userId, questionId)` — one row per user per question

### `server/drizzle/0004_review_queue.sql` (new file)
- Creates `review_queue` table with both FK constraints (cascade delete) and the unique index

### `server/drizzle/meta/_journal.json`
- Added missing entry for `0003_official_quiz_flag` (was on disk but not journaled)
- Added entry for `0004_review_queue`
- Migration runs automatically on server startup via `migrate()`

### `server/src/routes/quiz.ts`
- Added `reviewQueue` to schema imports, `sql` to drizzle-orm imports
- In `POST /api/quiz/:id/submit`: after grading, bulk-upserts wrong-answer question IDs for authenticated users
  - Insert: `intervalDays=1`, `nextReviewAt=+1 day`, `missCount=1`
  - Conflict update: reset `intervalDays=1`, `nextReviewAt=+1 day`, increment `missCount` via SQL expression

### `server/src/routes/review.ts` (new file)
- `GET /api/review-queue` — returns due items (`nextReviewAt <= NOW()`) joined with question text/options and quiz title/subject. Answer field is never selected.
- `GET /api/review-queue/stats` — returns `{ dueToday, total }` for the dashboard badge
- `POST /api/review-queue/answer` — grades server-side; correct answers advance interval via `[1,3,7,14,30]` progression, wrong answers reset to 1 and increment `missCount`; returns `{ correct, correctAnswer, newIntervalDays, nextReviewAt }`

### `server/src/index.ts`
- Imported `reviewRouter` from `./routes/review.js`
- Registered `app.use("/api", reviewRouter)`
- Added `/api/review-queue` to the request logger's `shouldLog` condition

### `client/src/lib/types.ts`
- Added `ReviewQueueItem`, `ReviewAnswerResponse`, `ReviewStats` interfaces

### `client/src/lib/api.ts`
- Added `fetchReviewQueue(token)`, `fetchReviewStats(token)`, `answerReviewItem(questionId, selectedAnswer, token)`

### `client/src/app/review/page.tsx` (new file)
- Standalone review session page — no timer, no leaderboard, no nickname entry
- State machine: `loading → empty | reviewing → done`
- Per-question sub-states: `waiting` (option selection) → `feedback` (correct/wrong display + next interval) → next question
- Option color coding in feedback: correct = green, wrong selection = red, others = dimmed
- Summary screen at end: correct count, percentage, per-item breakdown with interval info

### `client/src/app/dashboard/page.tsx`
- Extended `Section` union to include `"review-queue"`
- Added nav item (symbol `↺`, label "Review Queue") between Weaknesses and My Quizzes
- Added `fetchReviewStats` call with `loadingReview` state on mount
- Added live due-count `<Badge>` on the Review Queue nav item when `dueToday > 0`
- Added `ReviewQueueSection` component: two stat cards (due today / total), CTA card with "Start Review →" link when items are due, empty state otherwise
- Added `section === "review-queue"` render branch
