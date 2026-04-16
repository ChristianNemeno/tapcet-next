# Penalized Scoring Mode + Section-Level Timers

> Date: 2026-04-11
> Backlog ref: `docs/backlogs.md` — 🔴 Foundational Mechanics

---

## Summary

Implements two Philippine CET exam mechanics:
- **Penalized Scoring**: wrong answers deduct points (default −0.25, UPCAT standard). Unanswered questions are neutral. Students must weigh risk on uncertain answers.
- **Section-Level Timers**: quizzes can be divided into named sections each with its own countdown. Completing a section locks it — no going back. Mirrors actual exam structure (e.g. UPCAT's English / Math / Science / Filipino parts).

Both features share one migration (0006) and are backward-compatible: existing quizzes default to `standard` scoring and no sections.

---

## Changes

### `server/src/db/schema.ts`
- Added `scoringModeEnum` pgEnum (`"standard" | "penalized"`)
- Added `scoringMode` (enum, default `"standard"`) and `penaltyFraction` (real, default `0.25`) columns to `quizzes`
- Added `penaltyPoints` (real, default `0`) column to `leaderboard`
- Added new `sections` table: `id`, `quizId` (FK cascade), `title`, `timeLimitSeconds`, `orderIndex`
- Added nullable `sectionId` (FK → sections, set null on delete) column to `questions`

### `server/drizzle/0006_scoring_sections.sql` (new file)
- Creates `scoring_mode` enum type
- ALTERs `quizzes` to add `scoring_mode` and `penalty_fraction`
- ALTERs `leaderboard` to add `penalty_points`
- Creates `sections` table with FK constraint
- ALTERs `questions` to add `section_id` with FK constraint

### `server/drizzle/meta/_journal.json`
- Added entry for `0006_scoring_sections` (idx: 6)

### `server/src/routes/quiz.ts`
- Added `sections` to schema import
- `GET /api/quiz/:id`: now fetches sections ordered by `orderIndex` and nests questions within them; also selects `scoringMode` and `penaltyFraction` from `quizzes`; `questions` includes `sectionId`; response shape: `{ ...quiz, sections, questions }`
- `POST /api/quiz/:id/submit`: updated scoring logic — `wrongCount` counts only answered-wrong (not skipped); computes `penaltyPoints = wrongCount * penaltyFraction` for penalized mode; `percentage` reflects penalty; leaderboard insert includes `penaltyPoints`; response includes `scoringMode`, `penaltyPoints`, `penaltyFraction`

### `server/src/routes/userQuiz.ts`
- Added `sections` to schema import
- `POST /api/quiz`: accepts `scoringMode`, `penaltyFraction`, and `sections[]` in body; when `sections` provided, creates section rows then questions within each section; otherwise falls back to flat question insert
- `PUT /api/quiz/:id`: accepts same new fields; when `sections` provided, deletes existing questions + sections then recreates; otherwise updates flat questions as before

### `client/src/lib/types.ts`
- `QuizSummary`: added `scoringMode`, `penaltyFraction`
- `QuizQuestion`: added `sectionId: string | null`
- Added `QuizSection` interface: `id`, `title`, `timeLimitSeconds`, `orderIndex`, `questions`
- `QuizDetail`: added `sections: QuizSection[]`
- `QuizFormPayload`: added `scoringMode`, `penaltyFraction`, optional `sections[]`
- `SubmitQuizResponse`: added `scoringMode`, `penaltyPoints`, `penaltyFraction`

### `client/src/app/quiz/[id]/page.tsx`
- Added `sectionIdx` state for section-by-section navigation
- On load: sets timer from first section's `timeLimitSeconds` (section mode) or quiz's `timeLimitSeconds` (flat mode)
- Timer expiry: advances to next section (section mode) or submits (flat mode)
- Pre-quiz screen: shows section list with question counts and time limits when sections exist; shows penalized scoring badge when `scoringMode === "penalized"`
- Section mode quiz view: progress header shows `Question N / M · Section X/Y`; "Next →" within section; "Next Section →" at last question of non-final section; "Submit Quiz" at last question of final section
- Flat mode: unchanged behavior

### `client/src/app/quiz/[id]/results/page.tsx`
- Wrong count now computed from `results.filter(r => !r.correct && r.selectedAnswer !== -1)` (excludes skipped)
- Penalty banner shown below stats grid when `scoringMode === "penalized"`: displays correct − penalty = net score with amber styling

### `client/src/app/quiz/create/page.tsx`
- Added `scoringMode` radio selector (standard / penalized) with `penaltyFraction` input shown when penalized
- Added `useSections` checkbox toggle; when enabled: hides global time limit field, shows sections UI (title + per-section time limit + questions per section); add/remove sections and questions within sections
- Flat mode and section mode submit different payload shapes to the API
