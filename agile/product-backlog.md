# Product Backlog

Ordered by priority. Items at the top are most valuable and most ready to work on. This is a living document — re-prioritize as you learn more.

> Tapcet is **student-focused only.** All features serve students preparing for Philippine college entrance exams.

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ | Done — shipped |
| 🏃 | In Sprint — actively being worked |
| 📋 | Backlog — prioritized, not yet started |
| 💤 | Future — good idea, not now |

---

## 🔴 Foundational — Complete

| # | Feature | Status |
|---|---|---|
| 1 | Exam + subject tagging | ✅ |
| 2 | Penalized scoring mode (UPCAT right-minus-wrong) | ✅ |
| 3 | Section-level timers | ✅ |
| 4 | Curated official quiz banks | ✅ |
| 5 | Weakness tracker (per-subject accuracy) | ✅ |
| 6 | Missed questions review queue (spaced repetition) | ✅ |
| 7 | Mock exam simulator | ✅ |
| 8 | Quiz collections / study sets | ✅ |
| 9 | Quiz ratings + question reporting | ✅ |

---

## 🟡 Community & Growth — Next Up

### EP-02: Shareable Quiz Links 🏃 Sprint 1
A student copies a link to a quiz and sends it to a classmate. The classmate clicks it and lands directly on the quiz. No navigating, no searching.

**Why:** The highest-leverage growth feature missing right now. Every share is a free acquisition channel.

**Epic:** [EP-02-shareable-links.md](epics/EP-02-shareable-links.md)

---

### EP-03: CSV / JSON Import 🏃 Sprint 1
A quiz creator uploads a CSV file with questions formatted in a standard template, and the system imports them as a quiz. Removes the biggest friction point for large question banks.

**Why:** Without this, creating a 100-question mock exam requires 100 manual form entries. No serious content contributor will do that.

**Epic:** [EP-03-csv-import.md](epics/EP-03-csv-import.md)

---

### EP-01: Public Creator Profiles 📋 Sprint 2
A public page at `/user/:id` (or `/user/:name`) showing a creator's published quizzes, collection count, total quiz takers, and average rating. Students can browse by creator.

**Why:** Builds a reputation layer. Quality contributors get visibility. Students can find and follow reliable sources.

**Epic:** [EP-01-creator-profiles.md](epics/EP-01-creator-profiles.md)

---

## ⚪ Nice to Have — Future

### EP-04: Image Support in Questions 📋 Sprint 3
Upload and display images in question text. Required for Abstract Reasoning (figural patterns) and Mechanical-Technical questions (gear diagrams, circuits). Infrastructure-heavy: file upload, storage, CDN/DB decision.

**Epic:** [EP-04-image-support.md](epics/EP-04-image-support.md)

---

### Difficulty Ratings on Questions 💤
Tag each question Easy / Medium / Hard / Exam-level. Surfaces in results. Lets creators build balanced quiz sets.

**Schema impact:** `difficulty` enum on `questions`.

---

### Leaderboard by Subject / Exam 💤
Aggregate rankings across quizzes: "Top UPCAT Math scorers this month." Motivating for competitive students. Low engineering cost once tagging is solid.

**Dependencies:** Exam + subject tagging (done), enough data volume.

---

### Exam-Specific Result Report 💤
After a mock exam, generate a structured report: score per section, estimated standing vs. cutoffs, topics to review. Actionable output, not just a number.

**Dependencies:** Section timers ✅, weakness tracker ✅, enough tagged content.

---

### Offline / PWA Mode 💤
Cache quiz content for offline practice. Filipino students often have unreliable internet. Major scope: service worker, sync-on-reconnect, offline-first data model.

---

### Study Plan / Daily Goals 💤
Student sets a target exam and test date. System allocates daily questions by subject based on days remaining and coverage gaps. Rule-based, not ML.

**Note:** Deferred — needs significant content volume to be useful, and the review queue already handles re-surfacing weak areas organically.

**Dependencies:** Exam tagging ✅, weakness tracker ✅, enough tagged content across all subjects.

---

## Open Questions

- Should exam tags be a strict enum or free-form? (Enum is safer for filtering; free-form scales to future exams)
- Who can create "official" quiz banks — any admin, or a separate curator role?
- Image storage: PostgreSQL bytea vs. S3-compatible object storage?
- Does the shareable link need a session concept (everyone taking it together) or just a direct link?
