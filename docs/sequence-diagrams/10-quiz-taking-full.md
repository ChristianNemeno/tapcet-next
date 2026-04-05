# Quiz Taking — Full End-to-End Sequence

The complete flow from opening a quiz to seeing results, covering all 5 phases.

```mermaid
sequenceDiagram
    actor User
    participant Browser as QuizPage Component
    participant Session as sessionStorage
    participant API as Express Server
    participant DB as PostgreSQL

    Note over User,DB: Phase 1 — Load Quiz Data
    User->>Browser: Navigate to /quiz/{id}
    Browser->>Browser: Show skeleton loader
    Browser->>API: GET /api/quiz/{id}
    API->>DB: SELECT * FROM quizzes WHERE id = ?
    API->>DB: SELECT id, text, options, orderIndex<br/>FROM questions WHERE quiz_id = ?<br/>ORDER BY order_index ASC<br/>(answer column EXCLUDED)
    DB-->>API: Quiz + questions (no answers sent to client)
    API-->>Browser: {id, title, description, timeLimitSeconds, questions[]}
    Browser->>Browser: setQuiz(data)
    Browser->>Browser: if (timeLimitSeconds) setTimeLeft(timeLimitSeconds)

    Note over User,DB: Phase 2 — Nickname Entry
    Browser-->>User: Show nickname screen:<br/>• Quiz title + metadata<br/>• Nickname input (pre-filled if logged in)<br/>• "start quiz" button
    User->>Browser: Enter nickname (optional, max 20 chars)
    User->>Browser: Click "start quiz"
    Browser->>Browser: setStep("quiz"), timer starts

    Note over User,DB: Phase 3 — Answer Questions
    loop For each question (sequential, one at a time)
        Browser-->>User: Display:<br/>• Progress bar (current / total)<br/>• Timer countdown (if timed quiz)<br/>• Question text<br/>• 4 option buttons (A, B, C, D)
        User->>Browser: Click an option
        Browser->>Browser: setAnswers({...prev, [questionId]: optionIndex})
        Browser->>Browser: Highlight selected option
        User->>Browser: Click "next" (or "submit" if last)
        Browser->>Browser: setCurrent(current + 1)
    end

    Note over User,DB: Phase 4 — Submit & Server-Side Grading
    Browser->>API: POST /api/quiz/{id}/submit<br/>{answers: {questionId: optionIndex, ...}, nickname}<br/>Headers: Authorization: Bearer {token} (if logged in)
    API->>DB: SELECT * FROM questions WHERE quiz_id = ?
    API->>API: Grade each answer:<br/>compare answers[q.id] vs q.answer
    API->>API: Calculate: score, total, percentage
    API->>DB: INSERT INTO leaderboard<br/>(quizId, userId or null, nickname, score, total, percentage)
    DB-->>API: Row inserted
    API-->>Browser: {score, total, percentage, results[], quizId, nickname}

    Browser->>Session: sessionStorage.setItem("tapcet_result_{id}", JSON.stringify(result))
    Browser->>Browser: router.push("/quiz/{id}/results")

    Note over User,DB: Phase 5 — View Results
    Browser->>Session: Read "tapcet_result_{id}"
    Browser->>API: GET /api/quiz/{id} (to get question text for breakdown)
    API-->>Browser: Quiz with questions
    Browser-->>User: Results page:<br/>• Score display (e.g. 4/6)<br/>• Percentage progress bar<br/>• Per-question breakdown<br/>• Correct/Wrong labels<br/>• "leaderboard" + "play again" buttons
```

## Key Design Decisions

1. **Answers are never sent to the client** — the `GET /api/quiz/:id` endpoint excludes the `answer` column from questions
2. **Grading is server-side only** — prevents cheating by inspecting client code
3. **Results are stored in sessionStorage** — allows the results page to display without another API call; data is lost on tab close (by design)
4. **Optional auth on submit** — both logged-in users and anonymous users can take quizzes; logged-in users get their attempt linked to their account
