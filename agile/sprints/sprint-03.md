# Sprint 3

**Dates:** 2026-05-14 → 2026-05-27  
**Status:** Upcoming  
**Sprint Goal:** Unlock figure-based questions by adding image support to the quiz platform — creators can attach one image per question; students see it while taking the quiz, reviewing results, and working through the review queue.

---

## Pre-Sprint Gate

**The storage strategy decision MUST be made before this sprint starts.** The upload endpoint, file naming convention, and serving approach all depend on it.

| Option | Verdict |
|---|---|
| PostgreSQL `bytea` | Not recommended — DB bloat, no CDN |
| Base64 in JSONB | Not recommended — poor for anything > 50 KB |
| **Cloudflare R2** | **Recommended** — free tier generous, CDN-ready, integrates with existing Cloudflare Tunnel |

Document the decision in a history note before Day 1 of the sprint.

---

## Sprint Backlog

| ID | Story | Points | Status |
|---|---|---|---|
| US-04-5 | Schema: `imageUrl` nullable column on `questions` | 2 | 📋 |
| US-04-4 | Server: `POST /api/upload/image` endpoint | 5 | 📋 |
| US-04-1 | Creator: image upload on question form (create + edit) | 5 | 📋 |
| US-04-2 | Student: image displayed during quiz-taking | 3 | 📋 |
| US-04-3 | Student: image in results page + review queue | 3 | 📋 |
| US-04-6 | CSV import: optional `image_url` column | 3 | 📋 |
| **Total** | | **21 SP** | |

> 21 SP is 1 over nominal 20 SP capacity. **US-04-6 is the candidate to slip to Sprint 4** if the sprint runs long — it depends on both EP-03 and EP-04 being done and is useful but not critical for the core image feature.

---

## Suggested Build Order

Infra first, then creator-side, then student-side, then the CSV extension.

### Week 1 — Infra + Upload (12 SP)

**Day 1:** US-04-5 — Schema migration
- Add `imageUrl text` nullable to `questions` table in `schema.ts`
- Generate and review Drizzle migration
- Confirm `imageUrl` surfaces in `GET /api/quiz/:id`, `GET /api/review-queue`, `POST /api/quiz`, and `PUT /api/quiz/:id` (optional, pass-through)

**Day 2–3:** US-04-4 — Upload endpoint
- `POST /api/upload/image` — auth required
- `multer` for `multipart/form-data`; validate: PNG/JPG/WebP, max 2 MB
- Store to Cloudflare R2 (or chosen storage); return `{ url: "https://..." }`
- File naming: `{userId}/{timestamp}-{originalName}.{ext}` to avoid collisions
- Write tests: auth gate, file type rejection, size rejection, success case

**Day 4–5:** US-04-1 — Image upload in question form
- Per-question image input on create and edit pages
- Upload on file selection → call `POST /api/upload/image` → store returned URL in form state
- Show preview thumbnail; show remove button (sets `imageUrl` to null)
- Disable save while upload is in flight

### Week 2 — Student Display + CSV (9 SP)

**Day 1–2:** US-04-2 — Image during quiz-taking
- If `question.imageUrl` is set, render `<img>` above question text
- Responsive: `max-width: 100%`, object-fit cover or contain (TBD by design)
- Skeleton placeholder while loading; graceful fallback if load fails (question still answerable)

**Day 3:** US-04-3 — Image in results + review queue
- Same image display logic on results page per-question breakdown
- Same on `/review` queue — consistent styling with quiz-taking view

**Day 4:** US-04-6 — CSV image column _(defer if behind)_
- Add optional `image_url` column to CSV template
- Server validates as a valid URL string (not checked for reachability)
- Imported rows with a non-empty `image_url` set `questions.imageUrl`
- Update `CsvImporter` and validation endpoint to handle the new column

**Day 5:** Buffer — end-to-end walkthrough, mobile viewport check for image display, regression on existing quiz flow

---

## Acceptance Checklist

### Schema (US-04-5)
- [ ] `questions.imageUrl` column exists: `text`, nullable, default `null`
- [ ] Migration applied cleanly without data loss
- [ ] `imageUrl` included in quiz API responses (null if not set)
- [ ] `imageUrl` accepted (optional) in quiz create and update routes

### Upload Endpoint (US-04-4)
- [ ] `POST /api/upload/image` requires auth — 401 if unauthenticated
- [ ] Rejects non-image file types with a clear error
- [ ] Rejects files > 2 MB with a clear error
- [ ] Returns `{ url: "..." }` with a publicly accessible URL on success
- [ ] URL serves with correct `Content-Type` header

### Question Form (US-04-1)
- [ ] Image upload input appears on each question row (create + edit)
- [ ] Image preview shows after successful upload
- [ ] Remove button clears the image (sets to null)
- [ ] Save button is disabled while an upload is in progress
- [ ] Accepted formats: PNG, JPG, WebP

### Student Display (US-04-2)
- [ ] Questions with `imageUrl` show the image above the question text
- [ ] Image is responsive — no horizontal overflow on mobile
- [ ] Skeleton shown while image loads
- [ ] If image fails to load, question is still answerable

### Results + Review Queue (US-04-3)
- [ ] Image appears on results page per-question breakdown (when present)
- [ ] Image appears on review queue cards (when present)
- [ ] Styling is consistent with quiz-taking display

### CSV Import (US-04-6)
- [ ] `image_url` column in updated CSV template
- [ ] Valid URLs imported as `questions.imageUrl`
- [ ] Rows with blank `image_url` import cleanly (field treated as null)
- [ ] Invalid URLs rejected with row-specific error message

---

## Sprint Notes

**Pre-sprint checklist:**
- [ ] Storage decision made and documented
- [ ] R2 bucket (or equivalent) provisioned and credentials in `.env`
- [ ] `multer` added to server dependencies (`npm install multer @types/multer` in `server/`)

**Technical notes:**
- Serve images through the storage provider's CDN, not through Express — the upload endpoint writes to storage and returns the CDN URL; Express never proxies image data
- Consider signed upload URLs (direct-to-R2) as a future optimization; for now, proxy through the server for simplicity
- Abstract the storage call behind a thin `uploadImage(file): Promise<string>` helper so the storage provider can be swapped without touching the route

**Sprint Notes:**

_(Fill in during sprint)_

---

## Sprint Review / Retrospective

_(Fill in after sprint completes)_

**Demo:**

**What went well:**

**What to improve:**

**Velocity:** _ / 21 SP attempted, _ SP completed
