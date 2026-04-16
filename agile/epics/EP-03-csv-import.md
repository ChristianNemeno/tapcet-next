# EP-03: CSV / JSON Import

**Priority:** 🟡 Community & Growth  
**Sprint:** 1  
**Total Estimate:** 13 story points  
**Status:** 🏃 In Sprint

---

## Why

Creating a 100-question mock exam through the current form UI requires entering 100 questions one by one. No serious content contributor — a review center instructor, a teacher, a dedicated student volunteer — will do that. CSV import removes the single biggest friction point for large question banks, which is exactly what the platform needs to be useful.

---

## Scope

A quiz creator uploads a CSV file. The server parses it, validates each row, and populates the quiz's question list. The creator can review and edit before saving.

JSON import is a secondary format for developers and power users who want to export from one quiz and re-import into another.

---

## CSV Format

```
text,option_a,option_b,option_c,option_d,answer,subject,topic
"What is the capital of France?",Berlin,Madrid,Paris,Rome,3,Geography,"European Capitals"
"Solve: 2x + 3 = 11",2,4,6,8,2,Mathematics,Algebra
```

| Column | Required | Notes |
|---|---|---|
| `text` | Yes | Question text |
| `option_a` | Yes | First option |
| `option_b` | Yes | Second option |
| `option_c` | Yes | Third option |
| `option_d` | Yes | Fourth option |
| `answer` | Yes | 1-based index of the correct option (1, 2, 3, or 4) |
| `subject` | No | Maps to `quizzes.subject` |
| `topic` | No | Maps to `quizzes.topic` |

---

## User Stories

### US-03-1 — Download CSV template
**As a quiz creator**, I want to download a blank CSV template with the correct column headers, so I know exactly what format to use.

**Story Points:** 1

**Acceptance Criteria:**
- [ ] "Download template" link/button on the quiz creation page
- [ ] Downloads a `.csv` file with header row and one example data row
- [ ] File is correctly formatted and opens cleanly in Excel / Google Sheets

---

### US-03-2 — Upload CSV on quiz creation page
**As a quiz creator**, I want to upload a CSV file while creating a quiz, so the questions are pre-populated without manual entry.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] File upload input (`.csv` only) on the quiz creation form
- [ ] Uploading a valid CSV immediately populates the questions list in the form
- [ ] Creator can still add, edit, or remove individual questions after import
- [ ] If CSV contains > 200 questions, show a warning and truncate (or reject)

---

### US-03-3 — Server-side CSV validation
**As a quiz creator**, when I upload an invalid CSV, I want clear error messages telling me exactly which rows are wrong, so I can fix my file and re-upload.

**Story Points:** 5

**Acceptance Criteria:**
- [ ] Server parses the uploaded CSV and validates each row
- [ ] Returns a structured error response: `{ valid: [...], errors: [{ row: 3, message: "answer must be 1–4" }] }`
- [ ] Valid rows are returned even if some rows have errors (partial import supported)
- [ ] Validates: required fields present, `answer` is 1–4, text fields are non-empty strings
- [ ] Max file size enforced: 1 MB

---

### US-03-4 — Import via quiz edit page
**As a quiz creator**, I want to import questions into an existing quiz via CSV, so I can add a bulk batch of questions to a quiz I've already started.

**Story Points:** 3

**Acceptance Criteria:**
- [ ] Same CSV upload UI is available on the quiz **edit** page (`/quiz/:id/edit`)
- [ ] Imported questions are appended to existing questions (not replacing them)
- [ ] Creator can review and remove duplicates before saving

---

### US-03-5 — JSON import (admin + power users)
**As an admin**, I want to import a quiz from a JSON file (matching the API's `QuizFormPayload` shape), so I can migrate quizzes from exports or other tools.

**Story Points:** 2  
**Note:** Lower priority — can be deferred if Sprint 1 is too full.

**Acceptance Criteria:**
- [ ] JSON file upload accepted on quiz creation and edit pages (alongside CSV)
- [ ] JSON is validated against the `QuizFormPayload` schema (Zod)
- [ ] On success, populates quiz form fields (title, description, questions)
- [ ] Clear error messages for invalid JSON structure

---

## Out of Scope (this sprint)

- Import preview / diff UI before saving — deferred, the form itself serves as the review step
- Export quiz as CSV / JSON — natural follow-on, add to backlog
- Google Sheets direct integration — deferred

---

## Dependencies

- Quiz creation and edit pages (`/quiz/create`, `/quiz/[id]/edit`) already exist
- `QuizFormPayload` type already defined in `client/src/lib/types.ts`
- Zod schemas in `server/src/schemas/quiz.ts` can be extended for CSV row validation

---

## Technical Notes

**Client-side:**
- Parse CSV in the browser using a lightweight library (e.g. `papaparse`) before sending to server
- This gives instant feedback on obvious format errors without a round-trip
- Send parsed rows to a new endpoint `POST /api/quiz/import/validate` for server-side validation
- On success, merge rows into the existing question form state

**Server-side:**
- New route: `POST /api/quiz/import/validate` — accepts raw parsed rows, returns `{ valid, errors }`
- Does not create any database records — purely a validation step
- Actual quiz creation still goes through the normal `POST /api/quiz` route with the full payload

**File size:**
- Enforce 1 MB limit on the upload (multer or a simple content-length check)
- 200 questions × ~200 bytes per row ≈ 40 KB, so 1 MB is generous
