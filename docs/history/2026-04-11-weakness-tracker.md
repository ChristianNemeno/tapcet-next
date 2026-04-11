# Weakness Tracker

> Date: 2026-04-11
> Backlog ref: `docs/backlogs.md` — 🟠 High Impact

---

## Summary

Added a Weakness Tracker section to the user dashboard. After a user accumulates quiz attempts, per-subject accuracy is aggregated and displayed — weakest subjects ranked first — so students know where to focus study time.

---

## Changes

### `server/src/routes/quiz.ts`
- Added `sum`, `isNotNull` to Drizzle imports
- New route: `GET /api/dashboard/weakness` (auth required)
  - Joins `leaderboard` with `quizzes`, filters by `userId` and non-null subject
  - Groups by `quizzes.subject`, sums `score` and `total` across attempts
  - Returns array sorted by `percentage` ascending (weakest first)

### `client/src/lib/types.ts`
- Added `WeaknessEntry` interface: `{ subject, totalCorrect, totalQuestions, attempts, percentage }`

### `client/src/lib/api.ts`
- Added `fetchWeakness(token: string): Promise<WeaknessEntry[]>` — calls `GET /api/dashboard/weakness`

### `client/src/app/dashboard/page.tsx`
- Extended `Section` union to include `"weakness"`
- Added `"Weaknesses"` nav item to sidebar (symbol: `!`)
- Added `SUBJECT_COLORS` map (one color per subject)
- Added `WeaknessBar` component — renders subject name, correct/total, attempt count, percentage with color coding, and a thin progress bar
- Added `WeaknessSection` component — lists all bars weakest-first; handles loading skeletons and empty state
- Wired `fetchWeakness` into `DashboardContent` with its own loading state
- Added `section === "weakness"` render branch in main content area
