# Admin — Create Quiz

How an admin user creates a new quiz with questions.

```mermaid
sequenceDiagram
    actor Admin
    participant Browser as AdminPage
    participant AuthCtx as AuthContext
    participant API as Express Server
    participant MW as authenticateToken + requireAdmin
    participant DB as PostgreSQL

    Note over Admin,DB: Guard — Access Check
    Browser->>AuthCtx: Check token + role
    alt Not authenticated or not admin
        Browser->>Browser: router.replace("/")
        Browser-->>Admin: Redirect to homepage
    end

    Note over Admin,DB: Load Existing Quizzes
    Browser->>API: GET /api/quizzes
    API-->>Browser: Current quiz list
    Browser-->>Admin: Show existing quizzes with delete buttons

    Note over Admin,DB: Build the Quiz Form
    Admin->>Browser: Fill in title (required)
    Admin->>Browser: Fill in description (optional)
    Admin->>Browser: Set time limit in seconds (optional)
    Admin->>Browser: Fill question 01:<br/>  • Question text<br/>  • 4 options (A, B, C, D)<br/>  • Select correct answer (radio button)
    Admin->>Browser: Click "+ add question" for more
    Admin->>Browser: Click "create quiz"

    Note over Admin,DB: Submit to Server
    Browser->>API: POST /api/admin/quizzes<br/>Authorization: Bearer {token}<br/>{title, description, timeLimitSeconds, questions[]}

    API->>MW: authenticateToken → verify JWT
    MW->>MW: requireAdmin → check role === "admin"
    alt Not authenticated
        MW-->>Browser: 401 "Authentication required"
        Browser-->>Admin: Show error
    end
    alt Not admin role
        MW-->>Browser: 403 "Admin access required"
        Browser-->>Admin: Show error
    end

    alt Missing title or empty questions array
        API-->>Browser: 400 "title and questions are required"
        Browser-->>Admin: Show error
    end

    API->>DB: INSERT INTO quizzes<br/>(title, description, timeLimitSeconds)
    DB-->>API: {id, title, ...}

    API->>DB: INSERT INTO questions<br/>VALUES for each question with orderIndex = array index
    DB-->>API: Questions created

    API-->>Browser: 201 {quiz object}

    Browser->>Browser: setSuccess("Quiz created!")
    Browser->>Browser: Reset all form fields
    Browser->>API: GET /api/quizzes (refresh list)
    API-->>Browser: Updated quiz list
    Browser-->>Admin: Show success message + updated quiz list
```

## Form Structure

```mermaid
flowchart TD
    FORM["Create Quiz Form"] --> META["Metadata Section"]
    FORM --> QUESTIONS["Questions Section"]
    FORM --> SUBMIT["Submit Button"]

    META --> TITLE["Title (required)"]
    META --> DESC["Description (optional)"]
    META --> TIME["Time Limit in seconds (optional)"]

    QUESTIONS --> Q1["Question 01"]
    QUESTIONS --> Q2["Question 02"]
    QUESTIONS --> ADD["+ add question button"]

    Q1 --> QTEXT["Question text (required)"]
    Q1 --> OPTS["4 Options (A, B, C, D)<br/>Each required"]
    Q1 --> ANSWER["Correct answer<br/>(radio buttons)"]
```

## Notes

- Questions always have exactly 4 options
- The correct answer is stored as a 0-based index
- `orderIndex` is automatically assigned based on array position
- After successful creation, the form resets and the quiz list refreshes
