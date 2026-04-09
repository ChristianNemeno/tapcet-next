# Tapcet — Current Features

> Last updated: 2026-04-09

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
- Quiz metadata display (title, description, question count, time limit, creator)
- Filtering by visibility (public vs. draft)
- Alphabetical sorting by title
- Hero section on homepage

---

## Quiz Taking

- Nickname entry before starting (defaults to user name or "Anonymous")
- Single-question progressive interface with next/previous navigation
- Real-time progress tracking (current question / total)
- Optional countdown timer with visual warning when <10 seconds
- Auto-submit when timer expires
- Server-side answer validation and grading

---

## Results & Feedback

- Score display in `x/y` and percentage format
- Visual progress bar for percentage correct
- Per-question breakdown with correct/incorrect indicators
- Shows user's selected answer vs. correct answer for wrong questions
- Option to retake the same quiz
- Link to leaderboard from results page

---

## Leaderboard & Rankings

- Per-quiz leaderboard showing top 10 scores
- Columns: rank, nickname, score (x/y), percentage
- Sorted by: percentage (desc) → score (desc) → completion time (asc)
- Anonymous participation supported (no account required)

---

## User Dashboard

- Personalized greeting by name
- **My Attempts tab** — quiz attempt history with scores, percentages, and dates
- **My Quizzes tab** — quizzes created by user with visibility status
- Quick links to leaderboards from attempt history
- Empty states for both tabs

---

## Quiz Management (User)

- Create quizzes from navbar or dashboard
- Edit quiz: title, description, time limit, visibility, questions
- Delete quiz with confirmation dialog
- Add, remove, and reorder questions
- 4 multiple-choice options per question with answer key selection
- Public / Draft visibility toggle
- Draft quizzes visible only to creator

---

## Admin Features

- Admin-only dashboard at `/admin`
- Admin role badge in navbar
- List all public quizzes with question counts
- Create, update, and delete any quiz
- Bulk question management (add/remove/reorder)
- Cascade deletion: quiz → questions + leaderboard entries

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
| GET | `/api/quiz/:id` | Get quiz with questions (answer key hidden) |
| POST | `/api/quiz/:id/submit` | Submit answers and get results |
| GET | `/api/quiz/:id/leaderboard` | Get top 10 leaderboard |
| GET | `/api/dashboard` | Get user's attempt history (auth required) |
| POST | `/api/quiz` | Create quiz (auth required) |
| PUT | `/api/quiz/:id` | Update quiz (creator or admin) |
| DELETE | `/api/quiz/:id` | Delete quiz (creator or admin) |
| GET | `/api/my-quizzes` | List quizzes created by user (auth required) |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/quizzes` | Create quiz (admin only) |
| PUT | `/api/admin/quizzes/:id` | Update quiz (admin only) |
| DELETE | `/api/admin/quizzes/:id` | Delete quiz (admin only) |

---

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | id, email (unique), passwordHash, name, role (user/admin), createdAt |
| `quizzes` | id, title, description, timeLimitSeconds, createdBy, visibility (public/draft) |
| `questions` | id, quizId, text, options (JSONB), answer (index), orderIndex |
| `leaderboard` | id, quizId, userId (nullable), nickname, score, total, percentage, completedAt |

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

## Not Yet Implemented

- Recommended quizzes based on past attempts
- Weak-topic surfacing from incorrect answers
- Review queues for missed questions
- Personalized study suggestions
- Adaptive learning features
