# API Reference

Base URL: `/api`

All endpoints accept and return JSON. Authenticated endpoints require an `Authorization: Bearer <token>` header.

## Table of Contents

- [Authentication](#authentication)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
- [Quizzes](#quizzes)
  - [GET /api/quizzes](#get-apiquizzes)
  - [GET /api/quiz/:id](#get-apiquizid)
  - [POST /api/quiz/:id/submit](#post-apiquizidsubmit)
  - [GET /api/quiz/:id/leaderboard](#get-apiquizidleaderboard)
- [User Quiz Management](#user-quiz-management)
  - [POST /api/quiz](#post-apiquiz)
  - [PUT /api/quiz/:id](#put-apiquizid)
  - [DELETE /api/quiz/:id](#delete-apiquizid)
  - [GET /api/my-quizzes](#get-apimy-quizzes)
- [Collections](#collections)
  - [GET /api/collections](#get-apicollections)
  - [GET /api/collection/:id](#get-apicollectionid)
  - [POST /api/collection](#post-apicollection)
  - [PUT /api/collection/:id](#put-apicollectionid)
  - [DELETE /api/collection/:id](#delete-apicollectionid)
  - [GET /api/my-collections](#get-apimy-collections)
  - [POST /api/collection/:id/follow](#post-apicollectionidfollow)
  - [POST /api/collection/:id/quizzes/:quizId](#post-apicollectionidquizzesquizid)
  - [DELETE /api/collection/:id/quizzes/:quizId](#delete-apicollectionidquizzesquizid)
- [Dashboard](#dashboard)
  - [GET /api/dashboard](#get-apidashboard)
- [Admin](#admin)
  - [POST /api/admin/quizzes](#post-apiadminquizzes)
  - [PUT /api/admin/quizzes/:id](#put-apiadminquizzesid)
  - [DELETE /api/admin/quizzes/:id](#delete-apiadminquizzesid)

---

## Authentication

JWT tokens are issued on login/register and expire after **7 days**. Include the token in the `Authorization` header for protected endpoints.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

### POST `/api/auth/register`

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Alice"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Must be unique, stored lowercase |
| `password` | string | Yes | Hashed with bcrypt (12 rounds) |
| `name` | string | Yes | Display name |

**Response** `201 Created`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "name": "Alice",
  "role": "user"
}
```

**Errors:**

| Status | Error | Cause |
|---|---|---|
| `400` | `email, password, and name are required` | Missing fields |
| `409` | `Email already in use` | Duplicate email address |

---

### POST `/api/auth/login`

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response** `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "name": "Alice",
  "role": "user"
}
```

**Errors:**

| Status | Error | Cause |
|---|---|---|
| `400` | `email and password are required` | Missing fields |
| `401` | `Invalid credentials` | Wrong email or password |

---

## Quizzes

### GET `/api/quizzes`

List all public quizzes with question counts and creator names.

**Auth:** None

**Response** `200 OK`:

```json
[
  {
    "id": "a1b2c3d4-...",
    "title": "General Knowledge",
    "description": "Test your general knowledge across a range of topics.",
    "timeLimitSeconds": 60,
    "examTags": ["UPCAT", "ACET"],
    "subject": "General Knowledge",
    "topic": "Philippine History",
    "questionCount": 6,
    "creatorName": "Alice"
  }
]
```

Results are sorted alphabetically by title, filtering for `visibility: "public"`.

---

### GET `/api/quiz/:id`

Get a single quiz with its questions. **The `answer` field is intentionally omitted** to prevent cheating.

**Auth:** None

**Response** `200 OK`:

```json
{
  "id": "a1b2c3d4-...",
  "title": "General Knowledge",
  "description": "Test your general knowledge across a range of topics.",
  "timeLimitSeconds": 60,
  "createdBy": "user-uuid-...",
  "visibility": "public",
  "examTags": ["UPCAT", "ACET"],
  "subject": "General Knowledge",
  "topic": "Philippine History",
  "creatorName": "Alice",
  "scoringMode": "standard",
  "penaltyFraction": 0.25,
  "sections": [
    {
      "id": "sec-uuid-...",
      "title": "Part 1",
      "timeLimitSeconds": 30,
      "orderIndex": 0,
      "questions": [
        {
          "id": "q1-uuid-...",
          "text": "What is the capital of France?",
          "options": ["Berlin", "Madrid", "Paris", "Rome"],
          "orderIndex": 0,
          "sectionId": "sec-uuid-..."
        }
      ]
    }
  ],
  "questions": [
    {
      "id": "q1-uuid-...",
      "text": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "orderIndex": 0,
      "sectionId": "sec-uuid-..."
    }
  ]
}
```

**Errors:**

| Status | Error |
|---|---|
| `404` | `Quiz not found` |

---

### POST `/api/quiz/:id/submit`

Submit answers for grading. Works for both anonymous and authenticated users.

**Auth:** Optional (Bearer token). If provided, the attempt is linked to the user's account.

**Request Body:**

```json
{
  "answers": {
    "q1-uuid-...": 2,
    "q2-uuid-...": 1
  },
  "nickname": "Alice"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `answers` | `Record<questionId, optionIndex>` | Yes | Map of question UUID → selected option index (0-based) |
| `nickname` | string | No | Max 20 chars. Defaults to `"Anonymous"`. |

**Response** `200 OK`:

```json
{
  "score": 5,
  "total": 6,
  "percentage": 83.33,
  "quizId": "a1b2c3d4-...",
  "nickname": "Alice",
  "scoringMode": "standard",
  "penaltyPoints": 0,
  "penaltyFraction": 0.25,
  "results": [
    {
      "questionId": "q1-uuid-...",
      "correct": true,
      "selectedAnswer": 2,
      "correctAnswer": 2
    },
    {
      "questionId": "q2-uuid-...",
      "correct": false,
      "selectedAnswer": 0,
      "correctAnswer": 1
    }
  ]
}
```

**Errors:**

| Status | Error |
|---|---|
| `400` | `answers object is required` |
| `404` | `Quiz not found` |

---

### GET `/api/quiz/:id/leaderboard`

Get the top 10 scores for a quiz.

**Auth:** None

**Response** `200 OK`:

```json
[
  {
    "id": "entry-uuid-...",
    "nickname": "Alice",
    "score": 6,
    "total": 6,
    "percentage": 100,
    "completedAt": "2026-04-03T12:00:00.000Z"
  }
]
```

Results are ordered by: percentage (desc) → score (desc) → completedAt (asc).

---

## User Quiz Management

### POST `/api/quiz`

Create a new quiz with questions.

**Auth:** Required

**Request Body:** Similar to `POST /api/admin/quizzes`, but allows passing an optional `visibility` field (`"public"` or `"draft"`).

**Response** `201 Created`: Returns the created quiz with `questionCount`.

---

### PUT `/api/quiz/:id`

Update a quiz and its questions. Replaces existing questions. Accepts `scoringMode`, `penaltyFraction`, and an optional `sections` array where questions can be scoped per section.

**Auth:** Required (must be quiz creator or admin)

**Response** `200 OK`: Returns the updated quiz metadata.

---

### DELETE `/api/quiz/:id`

Delete a quiz and its questions/leaderboard.

**Auth:** Required (must be quiz creator or admin)

**Response** `204 No Content`

---

### GET `/api/my-quizzes`

List all quizzes created by the authenticated user.

**Auth:** Required

**Response** `200 OK`: Returns a list of quizzes similar to `GET /api/quizzes` but includes drafts.

---

## Collections

### GET `/api/collections`

List all public collections. Returns collection summaries.

**Auth:** None
**Query Params:** `?exam=TAG`, `?official=true`

---

### GET `/api/collection/:id`

Get a single collection including its list of quizzes in order. Optional authentication returns `isFollowing` status.

**Auth:** Optional

---

### POST `/api/collection`

Create a new collection.

**Auth:** Required
**Request Body:** `title` (required), `description`, `examTag`, `visibility`, `isOfficial` (admin only)

---

### PUT `/api/collection/:id`

Update collection metadata.

**Auth:** Required (owner or admin)

---

### DELETE `/api/collection/:id`

Delete a collection. Does not naturally delete its associated quizzes.

**Auth:** Required (owner or admin)

---

### GET `/api/my-collections`

List all collections created by the authenticated user, including drafts.

**Auth:** Required

---

### POST `/api/collection/:id/follow`

Toggle following a collection.

**Auth:** Required
**Response:** `{ "following": boolean, "followerCount": number }`

---

### POST `/api/collection/:id/quizzes/:quizId`

Add a quiz to a collection. Idempotent.

**Auth:** Required (owner or admin)

---

### DELETE `/api/collection/:id/quizzes/:quizId`

Remove a quiz from a collection.

**Auth:** Required (owner or admin)

---

## Dashboard

### GET `/api/dashboard`

Get the authenticated user's quiz attempt history.

**Auth:** Required

**Response** `200 OK`:

```json
[
  {
    "id": "entry-uuid-...",
    "quizId": "a1b2c3d4-...",
    "quizTitle": "General Knowledge",
    "score": 5,
    "total": 6,
    "percentage": 83.33,
    "completedAt": "2026-04-03T12:00:00.000Z"
  }
]
```

Results are ordered by `completedAt` descending (most recent first).

**Errors:**

| Status | Error |
|---|---|
| `401` | `Access token required` |
| `403` | `Invalid or expired token` |

---

## Admin

All admin endpoints require authentication **and** the `admin` role. Both `authenticateToken` and `requireAdmin` middleware are applied to the entire router.

### POST `/api/admin/quizzes`

Create a new quiz with questions.

**Auth:** Required (admin only)

**Request Body:**

```json
{
  "title": "History Quiz",
  "description": "Test your history knowledge.",
  "timeLimitSeconds": 120,
  "questions": [
    {
      "text": "When did WW2 end?",
      "options": ["1943", "1944", "1945", "1946"],
      "answer": 2
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | Quiz title |
| `description` | string | No | Defaults to `""` |
| `timeLimitSeconds` | number | No | `null` for untimed quizzes |
| `examTags` | string[] | No | Defaults to `[]` |
| `subject` | string | No | Defaults to `null` |
| `topic` | string | No | Defaults to `null` |
| `questions` | array | Yes | At least 1 question required |
| `questions[].text` | string | Yes | Question text |
| `questions[].options` | string[] | Yes | Array of answer choices |
| `questions[].answer` | number | Yes | 0-based index of the correct option |

**Response** `201 Created`:

```json
{
  "id": "new-quiz-uuid-...",
  "title": "History Quiz",
  "description": "Test your history knowledge.",
  "timeLimitSeconds": 120
}
```

**Errors:**

| Status | Error |
|---|---|
| `400` | `title and questions are required` |
| `401` | `Access token required` |
| `403` | `Admin access required` |

---

### PUT `/api/admin/quizzes/:id`

Update quiz metadata (title, description, time limit). Does not modify questions.

**Auth:** Required (admin only)

**Request Body (all fields optional):**

```json
{
  "title": "Updated Title",
  "description": "New description",
  "timeLimitSeconds": 90,
  "examTags": ["UPCAT"],
  "subject": "History",
  "topic": "World History"
}
```

**Response** `200 OK`:

```json
{
  "id": "quiz-uuid-...",
  "title": "Updated Title",
  "description": "New description",
  "timeLimitSeconds": 90
}
```

**Errors:**

| Status | Error |
|---|---|
| `404` | `Quiz not found` |
| `401` | `Access token required` |
| `403` | `Admin access required` |

---

### DELETE `/api/admin/quizzes/:id`

Delete a quiz. **Cascades** to all associated questions and leaderboard entries.

**Auth:** Required (admin only)

**Response** `204 No Content`

**Errors:**

| Status | Error |
|---|---|
| `404` | `Quiz not found` |
| `401` | `Access token required` |
| `403` | `Admin access required` |

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

Unhandled server errors return:

```json
{
  "error": "Internal server error"
}
```

with status code `500`.
