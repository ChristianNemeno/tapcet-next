# Tapcet — Current Features

> Last updated: 2026-04-14

---

## Authentication & Accounts

- User registration with email, password, and name
- User login with email and password
- JWT-based authentication (7-day token expiry)
- Auth state persistence via localStorage
- Automatic logout
- Rate limiting: 3 registration attempts/hour, 5 login attempts/15 min
- Role-based access control (`user` vs `admin`)

---

## Quiz Discovery & Browsing

- Public quiz listing page
- Quiz metadata display (title, description, tags, subject, topic, question count, time limit, creator)
- Filtering by visibility (public vs. draft)
- Alphabetical sorting by title
- Hero section on homepage
- Official/community distinction badge on quiz cards

---

## Quiz Taking

- Nickname entry before starting (defaults to user name or "Anonymous")
- Single-question progressive interface with next/previous navigation
- Real-time progress tracking (current question / total)
- Optional countdown timer with visual warning when <10 seconds
- Auto-submit when timer expires
- Server-side answer validation and grading
- **Penalized scoring mode** — wrong answers deduct points (default −0.25); shown as badge on pre-quiz screen
- **Section-level timers** — quiz can be divided into named sections each with its own countdown; timer auto-advances to next section on expiry; progress header shows `Question N / M · Section X/Y`

---

## Results & Feedback

- Score display in `x/y` and percentage format
- Visual progress bar for percentage correct
- Per-question breakdown with correct/incorrect indicators
- Shows user's selected answer vs. correct answer for wrong questions
- Option to retake the same quiz
- Link to leaderboard from results page
- **Penalty banner** for penalized quizzes — shows correct − penalty = net score (amber styling)
- **Question reporting** — flag individual questions as incorrect, ambiguous, or duplicate from the results page

---

## Leaderboard & Rankings

- Per-quiz leaderboard showing top 10 scores
- Columns: rank, nickname, score (x/y), percentage
- Sorted by: percentage (desc) → score (desc) → completion time (asc)
- Anonymous participation supported (no account required)

---

## Quiz Ratings

- Rate a quiz 1–5 stars after completing it (auth required)
- Ratings are upserted — re-submitting updates the user's prior rating
- Aggregate average and count surfaced on quiz detail and results pages
- `GET /api/quiz/:id/rating` — public rating summary with optional `userRating` for auth users
- `POST /api/quiz/:id/rate` — upsert rating (auth required)

---

## User Dashboard

- Sidebar navigation to toggle between sections
- **Overview section** — personalized greeting and high-level summary
- **My Attempts section** — quiz attempt history with scores, percentages, and dates
- **Weaknesses section** — per-subject accuracy aggregated across all attempts, sorted weakest first, with color-coded progress bars
- **Review Queue section** — due-today / total stats cards; live badge on nav item when items are due; "Start Review →" CTA
- **My Quizzes section** — quizzes created by user with visibility status
- **My Collections section** — collections created by user with quiz count, exam tag, visibility; edit/delete actions
- Quick links to leaderboards from attempt history
- Empty states for attempts, quizzes, and collections

---

## Missed Questions Review Queue

- Wrong answers from any quiz are automatically upserted into a personal `review_queue`
- Spaced-repetition intervals: 1 → 3 → 7 → 14 → 30 days on correct review; reset to 1 day on wrong
- `/review` standalone page — no timer, no leaderboard; state machine: loading → empty | reviewing → done
- Per-question feedback: correct = green, wrong selection = red, correct answer highlighted
- Summary screen at end: correct count, percentage, per-item breakdown with next interval info
- `GET /api/review-queue` — due items joined with question text/options and quiz title (answer never exposed)
- `GET /api/review-queue/stats` — `{ dueToday, total }` for dashboard badge
- `POST /api/review-queue/answer` — server-side grading; advances or resets interval; returns result + new schedule

---

## Quiz Management (User)

- Create quizzes from navbar or dashboard
- Edit quiz: title, description, time limit, visibility, exam tags, subject, topic, scoring mode, questions
- Delete quiz with confirmation dialog
- Add, remove, and reorder questions
- 4 multiple-choice options per question with answer key selection
- Public / Draft visibility toggle
- Draft quizzes visible only to creator
- **Penalized scoring** toggle with configurable penalty fraction
- **Sections** — add named sections with per-section time limits; questions belong to a section; section mode and flat mode submit different payload shapes

---

## Collections

- Group quizzes into named, curated sets (e.g. "UPCAT Mathematics — Full Coverage")
- Browse page at `/collections` — exam tag filter pills + "Official" toggle; 3-column grid; skeleton loaders; empty state
- Collection detail at `/collection/:id` — header with exam/official badges, follower count, follow/unfollow button; quiz list; edit link for owner
- Create form: title (required), description, exam tag picker, visibility toggle, official flag (admin only)
- Edit page: metadata form + quiz management (add from searchable all-quizzes list; remove; reorder by `orderIndex`)
- Follow/unfollow toggle for authenticated users; follower count live updates
- `GET /api/collections` — public collections; supports `?exam=` and `?official=true` filters
- `GET /api/collection/:id` — single collection with quizzes and `isFollowing` status
- `POST /api/collection`, `PUT /api/collection/:id`, `DELETE /api/collection/:id` — CRUD (owner/admin)
- `GET /api/my-collections` — creator's own collections including drafts
- `POST /api/collection/:id/follow` — toggle follow; returns `{ following, followerCount }`
- `POST/DELETE /api/collection/:id/quizzes/:quizId` — add/remove quiz from collection
- Navbar "Collections" link (visible to all users)

---

## Mock Exams

- Quiz type field on `quizzes`: `standard` (default) or `mock_exam`
- Dedicated `/mock-exams` browse page listing mock exam quizzes
- Mock exams use section-level timers and penalized scoring to mirror real exam structure
- Section breakdown displayed in results for per-section score visibility

---

## Admin Features

- Admin-only dashboard at `/admin`
- Admin role badge in navbar
- List all public quizzes with question counts
- Create, update, and delete any quiz
- Bulk question management (add/remove/reorder)
- Cascade deletion: quiz → questions + leaderboard entries
- **Question reports queue** — `GET /api/admin/reports` with `?status=` and `?reportType=` filters; paginated
- **Update report status** — `PUT /api/admin/report/:id` → `open | reviewing | resolved`; resolved records `resolvedAt` and `resolvedBy`
- Official quiz flag — admin can mark quizzes as `isOfficial`

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Quizzes (User)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/quizzes` | List public quizzes |
| GET | `/api/quiz/:id` | Get quiz with questions, sections, scoring config (answer key hidden) |
| POST | `/api/quiz/:id/submit` | Submit answers and get results (auto-queues wrong answers for review) |
| GET | `/api/quiz/:id/leaderboard` | Get top 10 leaderboard |
| GET | `/api/quiz/:id/rating` | Get rating summary (optional auth for `userRating`) |
| POST | `/api/quiz/:id/rate` | Upsert user rating (auth required) |
| GET | `/api/dashboard` | Get user's attempt history (auth required) |
| GET | `/api/dashboard/weakness` | Get per-subject accuracy breakdown (auth required) |
| POST | `/api/quiz` | Create quiz (auth required) |
| PUT | `/api/quiz/:id` | Update quiz (creator or admin) |
| DELETE | `/api/quiz/:id` | Delete quiz (creator or admin) |
| GET | `/api/my-quizzes` | List quizzes created by user (auth required) |

### Question Reports
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/question/:id/report` | Flag a question (auth required) |

### Review Queue
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/review-queue` | Get due review items (auth required) |
| GET | `/api/review-queue/stats` | Get `{ dueToday, total }` (auth required) |
| POST | `/api/review-queue/answer` | Submit review answer; advances interval (auth required) |

### Collections
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/collections` | List public collections (`?exam=`, `?official=true`) |
| GET | `/api/collection/:id` | Get collection with quizzes and follow status |
| POST | `/api/collection` | Create collection (auth required) |
| PUT | `/api/collection/:id` | Update collection (owner/admin) |
| DELETE | `/api/collection/:id` | Delete collection (owner/admin) |
| GET | `/api/my-collections` | List creator's collections including drafts (auth required) |
| POST | `/api/collection/:id/follow` | Toggle follow (auth required) |
| POST | `/api/collection/:id/quizzes/:quizId` | Add quiz to collection (owner/admin) |
| DELETE | `/api/collection/:id/quizzes/:quizId` | Remove quiz from collection (owner/admin) |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/quizzes` | Create quiz (admin only) |
| PUT | `/api/admin/quizzes/:id` | Update quiz (admin only) |
| DELETE | `/api/admin/quizzes/:id` | Delete quiz (admin only) |
| GET | `/api/admin/reports` | List question reports with filters (admin only) |
| PUT | `/api/admin/report/:id` | Update report status (admin only) |

---

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | id, email (unique), passwordHash, name, role (user/admin), createdAt |
| `quizzes` | id, title, description, timeLimitSeconds, createdBy, visibility, examTags, subject, topic, isOfficial, scoringMode (standard/penalized), penaltyFraction, quizType (standard/mock_exam) |
| `sections` | id, quizId (FK cascade), title, timeLimitSeconds, orderIndex |
| `questions` | id, quizId (FK cascade), sectionId (FK nullable), text, options (JSONB), answer (index), orderIndex |
| `leaderboard` | id, quizId, userId (nullable), nickname, score, total, percentage, penaltyPoints, completedAt |
| `collections` | id, title, description, examTag, visibility, isOfficial, createdBy (FK cascade), createdAt |
| `collection_quizzes` | id, collectionId (FK cascade), quizId (FK cascade), orderIndex — unique(collectionId, quizId) |
| `collection_follows` | id, userId (FK cascade), collectionId (FK cascade), createdAt — unique(userId, collectionId) |
| `quiz_ratings` | id, userId (FK cascade), quizId (FK cascade), rating, ratedAt — unique(userId, quizId) |
| `question_reports` | id, userId, questionId, quizId, reportType (incorrect/ambiguous/duplicate), comment, status (open/reviewing/resolved), createdAt, resolvedAt, resolvedBy |
| `review_queue` | id, userId (FK cascade), questionId (FK cascade), nextReviewAt, intervalDays, missCount, createdAt, updatedAt — unique(userId, questionId) |

---

## UI / UX

- Monospace typography (IBM Plex Mono)
- Dark/light theme via CSS variables
- Skeleton loaders for loading states
- Progress bars, badges, dialogs, tabs
- Responsive single/multi-column layouts
- Dot grid background on hero section
- Conditional navbar (auth vs. non-auth views)

---

## In Progress / Planned

> See [product-backlog.md](../product-backlog.md) for the full prioritized backlog and [epics/](../epics/) for detailed user stories.

| Feature | Status |
|---|---|
| Shareable quiz / collection links | 🏃 Sprint 1 |
| CSV / JSON import | 🏃 Sprint 1 |
| Public creator profiles | 📋 Sprint 2 |
| Image support in questions | 📋 Sprint 3 |
| Difficulty ratings on questions | 💤 Future |
| Offline / PWA mode | 💤 Future |
| Recommended quizzes | 💤 Future |
| Topic-level weakness breakdown | 💤 Future |
| Study plan / daily goals | 💤 Future |
| Adaptive learning | 💤 Future |
