# EP-04: Image Support in Questions

**Priority:** ⚪ Nice to Have  
**Sprint:** 3  
**Total Estimate:** 21 story points  
**Status:** 📋 Backlog

---

## Why

Several question types on Philippine CETs cannot be expressed in text alone:

| Exam | Question type | Why images are needed |
|---|---|---|
| UPCAT / ACET | Abstract Reasoning | Figural patterns — literally impossible in text |
| DOST-SEI | Mechanical-Technical | Gear systems, pulley diagrams |
| Most exams | Science | Cell diagrams, circuits, graphs |

Without image support, Tapcet cannot host a significant category of real exam questions. This is an infrastructure investment that unlocks an entire question type.

---

## Scope

Allow quiz creators to attach one image per question. The image appears above the question text during quiz-taking. Images are stored externally (object storage) or in the database (base64) — decision to be made before sprint.

---

## Open Decision: Storage Strategy

This must be resolved before Sprint 3 starts.

| Option | Pros | Cons |
|---|---|---|
| **PostgreSQL bytea** | No new infrastructure, simple | DB bloat, slow for large images, not CDN-able |
| **S3-compatible (e.g. Cloudflare R2)** | Fast, scalable, CDN-ready | New service to configure, added complexity |
| **Base64 in JSONB** | Simplest to implement | Very poor for anything > ~50 KB |

**Recommendation:** Cloudflare R2 (free tier is generous, integrates naturally with the existing Cloudflare Tunnel setup). Decide and document before starting this epic.

---

## User Stories

### US-04-1 — Image upload on question form
**As a quiz creator**, I want to attach an image to a question when creating or editing a quiz, so I can ask about diagrams and figures.

**Story Points:** 5

**Acceptance Criteria:**
- [ ] Image upload input on each question row in the quiz create/edit form
- [ ] Accepted formats: PNG, JPG, WebP
- [ ] Max file size: 2 MB per image
- [ ] Image preview shown in the form after upload
- [ ] Creator can remove the image (sets it back to null)
- [ ] Upload happens immediately on file selection (not on form submit) — returns a URL

---

### US-04-2 — Image displayed during quiz-taking
**As a student**, I want to see the image for a question while taking a quiz, so I can answer figure-based questions.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] If a question has an `imageUrl`, it is displayed above the question text
- [ ] Image is responsive (does not overflow on mobile)
- [ ] Image loads with a skeleton placeholder while fetching
- [ ] If image fails to load, question is still answerable (graceful fallback)

---

### US-04-3 — Image displayed in results and review queue
**As a student**, I want to see the question image in my results breakdown and review queue, so I can understand the context of my wrong answers.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] Question image shown on the results page per-question breakdown
- [ ] Question image shown on the `/review` page during review sessions
- [ ] Consistent styling with quiz-taking display

---

### US-04-4 — Image upload server endpoint
**As a developer**, I need a `POST /api/upload/image` endpoint that accepts an image file and returns a stored URL, so the client can get a URL before submitting the quiz form.

**Story Points:** 5

**Acceptance Criteria:**
- [ ] `POST /api/upload/image` accepts `multipart/form-data` with a single image file
- [ ] Auth required — only authenticated users can upload
- [ ] Validates: file type (PNG/JPG/WebP), file size (max 2 MB)
- [ ] Stores the file in object storage (or DB — per storage decision)
- [ ] Returns `{ url: "https://..." }` on success
- [ ] Uploaded images are served with correct `Content-Type` headers

---

### US-04-5 — Schema change: `imageUrl` on questions
**As a developer**, I need an `imageUrl` nullable column on the `questions` table, so images can be associated with questions.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] `questions.imageUrl` column: `text`, nullable, default `null`
- [ ] Drizzle migration generated and reviewed
- [ ] `imageUrl` included in `GET /api/quiz/:id` response (null if no image)
- [ ] `imageUrl` included in `GET /api/review-queue` response
- [ ] `imageUrl` accepted (optional) in `POST /api/quiz` and `PUT /api/quiz/:id` body

---

### US-04-6 — Image in CSV import
**As a quiz creator**, when importing from CSV, I want to be able to specify an image URL per question, so bulk-imported questions can also have images.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] CSV template includes an optional `image_url` column
- [ ] Imported rows with a non-empty `image_url` set `questions.imageUrl`
- [ ] URL is validated as a valid URL string (not checked for reachability at import time)

**Note:** This story depends on both EP-03 (CSV import) and EP-04 being done.

---

## Out of Scope (this sprint)

- Images in question options (not just question text) — deferred
- Video support — deferred
- Image cropping / resizing UI — deferred (use browser-native upload as-is)
- Alt text / accessibility for images — important, add to backlog as follow-on

---

## Dependencies

- EP-03 (CSV Import) must be done before US-04-6
- Storage infrastructure decision must be made and documented before sprint starts
- Cloudflare R2 (or equivalent) must be provisioned

## Technical Notes

- Add `imageUrl text` to `questions` table in `server/src/db/schema.ts`
- Upload endpoint should use `multer` (already a common Express middleware) for multipart handling
- Consider a file naming convention: `{quizId}/{questionIndex}-{timestamp}.{ext}` to avoid collisions
- Serve images through the storage provider's CDN, not through the Express server
