# Tapcet — Feature Backlog

Brainstormed feature set for tapcet, grounded in the Philippine CET research. Items are grouped by category and priority tier. This is a living document — not a sprint plan, but a reference for what's possible and what matters most.

---

## Priority Tiers

| Tier | Meaning |
|------|---------|
| 🔴 Foundational | System is incomplete without this. Everything else depends on it. |
| 🟠 High Impact | Directly improves the core study loop. Builds platform credibility. |
| 🟡 Community & Growth | Scales content and engagement over time. |
| 🟢 Student-Specific | Deepens value for serious exam takers. |
| ⚪ Nice to Have | Good ideas, lower urgency. |

---

## 🔴 Foundational

### Exam + Subject Tagging
Every quiz and question needs to be tagged with:
- Target exam(s): UPCAT, ACET, USTET, DLSUCET, PUPCET, DOST-SEI, JLSS
- Subject: English, Mathematics, Science, Abstract Reasoning, Filipino, Mechanical-Technical, General Information
- Topic: Algebra → Linear Equations, Science → Biology → Genetics, etc.

Without this, tapcet is a generic quiz app. Every other feature — simulators, weakness tracking, study plans — depends on structured tagging being in place first.

**Schema impact:** `quizzes` and `questions` tables need a tags/category system. Either a normalized `tags` table with a join, or a structured `jsonb` column.

---

### Penalized Scoring Mode (UPCAT)
UPCAT deducts points for wrong answers (right-minus-wrong formula). Students who practice in standard mode build the wrong strategy — they learn to guess freely when they should be selective.

Each quiz should support a scoring mode:
- `standard` — correct answers count, wrong answers ignored
- `penalized` — wrong answers subtract a fraction of a point (configurable, default −0.25)

**Schema impact:** `quizzes` gets a `scoringMode` enum field. Submit logic and results display need to reflect the selected mode.

---

### Section-Level Timers
The current quiz timer is a single countdown for the whole quiz. Real exams have per-section time limits:

| Exam | Section | Items | Time |
|------|---------|-------|------|
| USTET | Mental Ability | 80 | 30 min |
| USTET | Science | 80 | 45 min |
| USTET | Math | 60 | 45 min |
| ACET | Full exam | ~200 | 4+ hrs |

A quiz should be configurable as sequential sections. Each section has its own item set and timer. The system auto-advances when time expires.

**Schema impact:** A `sections` table linked to quizzes, with questions belonging to a section. Significant refactor of the quiz-taking flow.

---

## 🟠 High Impact

### Mock Exam Simulator
Pre-built full-length mock exams per target school. Admin-curated, not community-created. Students select "UPCAT Simulator" and get:
- Correct number of items per section
- Correct time limits per section
- Correct scoring mode
- A UPG-equivalent score estimate at the end

This is the platform's flagship differentiator. No free platform currently offers a full, accurate UPCAT/ACET/USTET simulation.

**Dependencies:** Exam tagging, section-level timers, penalized scoring mode.

---

### Weakness Tracker
After multiple quiz attempts, surface per-topic accuracy to the user:

> "Quadratic Equations — 38% across 11 attempts"
> "Cell Biology — 71% across 6 attempts"

Display as a subject breakdown on the dashboard. Highlight the weakest areas first. No ML needed — just aggregate `leaderboard` attempt data against question tags.

**Dependencies:** Exam + subject tagging on questions.

---

### Curated Official Quiz Banks
Admin-maintained, exam-tagged, quality-controlled quiz sets. Community quizzes are uneven in quality. Students need a reliable "this is genuine UPCAT-style material" track.

Official banks are marked as verified, shown first in listings, and owned by the admin role. Community quizzes remain available alongside them.

**Schema impact:** A `verified` or `source` flag on quizzes. UI differentiates official vs. community content.

---

### Quiz Rating + Reporting
Let users:
- Rate a quiz (1–5 stars) after completing it
- Flag specific questions as incorrect, ambiguous, or duplicate

Aggregate ratings surface quality signal as content scales. Bad questions erode student trust fast — a report queue lets admins review and fix them without moderating everything manually.

**Schema impact:** `quiz_ratings` table, `question_reports` table.

---

## 🟡 Community & Growth

### Quiz Collections / Study Sets
Group quizzes into named collections:
- "UPCAT Mathematics — Full Coverage"
- "ACET Vocabulary Crash Course"
- "DOST-SEI Mechanical-Technical Drills"

Users can browse and follow collections. Creators curate them. Solves discoverability as quiz volume grows — individual quiz search doesn't scale.

**Schema impact:** `collections` table, `collection_quizzes` join table. Collections have an owner, title, description, and target exam tag.

---

### Public Creator Profiles
Show a user's:
- Published quizzes and collections
- Total quiz takers
- Average quiz rating
- Subject specialization

Incentivizes quality contributions. Students can find reliable creators and follow their work. Builds community reputation layer on top of the content.

**Schema impact:** Public profile view on existing `users` table. No structural changes if ratings are already implemented.

---

### Leaderboard by Subject / Exam
Extend the current per-quiz leaderboard to aggregate rankings:
- "Top UPCAT Math scorers — this month"
- "Most attempts — USTET Science"

Motivating for competitive students. Low engineering cost once tagging and scoring are in place.

**Dependencies:** Exam + subject tagging.

---

### Shareable Quiz Link / Invite Code
Generate a short link or room code for a specific quiz session. A teacher shares it with a class; students join and take the same quiz simultaneously. Results collected under a shared session view.

Targets the group study and classroom use case without requiring full real-time infrastructure.

---

## 🟢 Student-Specific

### Missed Questions Review Queue
Wrong answers from any quiz go into a personal review queue. The queue re-surfaces questions after a delay (basic spaced repetition: 1 day → 3 days → 7 days → 14 days). Students work through the queue daily.

This is the highest study-science ROI feature on the list. Repeated exposure to missed questions is how exam scores actually improve.

**Schema impact:** `review_queue` table: `userId`, `questionId`, `nextReviewAt`, `interval`, `missCount`.

---

### Study Plan / Daily Goals
Student sets a target exam and test date. System generates a daily quiz target by subject based on:
- Days remaining until exam
- Coverage gaps from attempt history
- Subject weight in the target exam (e.g., USTET Science = 80 items)

Rule-based, not ML. A simple scheduler that allocates daily questions per topic given the timeline.

**Dependencies:** Exam tagging, weakness tracking, enough tagged content to populate a plan.

---





**Schema impact:** `language` field on `questions`. UI needs to handle bilingual content gracefully.

---

### Exam-Specific Result Report
After a mock exam or tagged quiz set, generate a structured result report:
- Score per section
- Estimated standing vs. typical cutoffs
- Topics to review based on wrong answers
- Comparison to previous attempts on the same exam

Gives students actionable output, not just a number.

**Dependencies:** Exam tagging, section timers, weakness tracker.

---

## ⚪ Nice to Have

### Import Quiz from CSV / JSON
Teachers and review center instructors bulk-upload questions instead of entering them one by one. Dramatically lowers the barrier to contributing large question banks.

Format: CSV with columns for question text, options (4), answer index, subject, topic, difficulty, exam tags.

---

### Difficulty Ratings on Questions
Tag each question: Easy / Medium / Hard / Exam-level. Surfaces in quiz results ("You got all Easy questions right but missed 6/8 Hard ones"). Lets creators build balanced quiz sets.

**Schema impact:** `difficulty` enum on `questions`.

---

### Image Support in Questions
Required for:
- Abstract Reasoning (figural patterns — can't describe them in text)
- Mechanical-Technical DOST questions (diagrams, gear systems)
- Some Science questions (diagrams of cells, circuits, etc.)

Major infrastructure scope: image upload, storage (S3 or equivalent), rendering in quiz UI, and handling images on mobile. Unlocks an entire category of question types currently impossible.

---

### Offline / PWA Mode
Cache quiz content for offline practice. Filipino students often have unreliable internet. A Progressive Web App mode lets students download a quiz set and take it without a connection, syncing results when back online.

---

### Teacher / Class Dashboard
A teacher creates a class, adds students, assigns quiz sets, and views class-level performance. Breakdown by student and by question. Separate from the personal student dashboard.

Targets the review center and classroom use case directly.

---

## Suggested Build Sequence

Based on dependencies and impact:

```
1. Exam + subject tagging          ← unlocks everything
2. Penalized scoring mode          ← correctness for UPCAT users
3. Curated official quiz banks     ← platform credibility
4. Weakness tracker                ← turns tests into study tool
5. Missed questions review queue   ← highest study-science ROI
6. Section-level timers            ← required for mock exams
7. Mock exam simulator             ← flagship feature
8. Quiz collections                ← discoverability at scale
9. Study plan                      ← closes the loop
10. Image support                  ← unlocks figural/diagram questions
```

---

## Open Questions

- Should exam tags be free-form or an enforced enum? (Enum is safer for filtering; free-form is more flexible for future exams)
- Who can create "official" quiz banks — any admin, or a separate curator role?
- Is spaced repetition for the review queue based on per-question miss history or per-topic?
- Does image support require a CDN, or is it acceptable to store in PostgreSQL as base64 for MVP?
- Should the mock exam simulator be a separate UI flow, or built on top of the existing quiz-taking flow with a config layer?
