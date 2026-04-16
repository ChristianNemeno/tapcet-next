# Results Page — Read from Session Storage

How the results page loads and displays quiz results.

```mermaid
flowchart TD
    MOUNT["ResultsPage mounts<br/>/quiz/{id}/results"] --> READ["Read sessionStorage<br/>key: tapcet_result_{id}"]

    READ --> EXISTS{"Data exists<br/>in sessionStorage?"}
    EXISTS -->|No| REDIRECT["router.replace('/quiz/{id}')<br/>Redirect back to quiz"]
    EXISTS -->|Yes| PARSE["JSON.parse(data)<br/>→ SubmitQuizResponse"]

    PARSE --> FAIL{"Parse failed?"}
    FAIL -->|Yes| CLEAN["sessionStorage.removeItem()<br/>result = null"] --> REDIRECT
    FAIL -->|No| RENDER["Render score header"]

    RENDER --> FETCH["useEffect: fetchQuiz(id)<br/>GET /api/quiz/{id}"]
    FETCH --> HAS_QUIZ{"Quiz data loaded?"}

    HAS_QUIZ -->|Yes| BREAKDOWN["Show per-question breakdown:<br/>• Question number + text<br/>• Correct / Wrong label<br/>• If wrong: your answer vs correct answer"]
    HAS_QUIZ -->|No| SCORE_ONLY["Show score only<br/>(no question breakdown)"]

    BREAKDOWN --> ACTIONS
    SCORE_ONLY --> ACTIONS

    ACTIONS["Action buttons:<br/>🔗 'leaderboard' → /quiz/{id}/leaderboard<br/>🔗 'play again' → /"]

    style REDIRECT fill:#8b4513,stroke:#d2691e,color:#fff
    style BREAKDOWN fill:#006400,stroke:#00ff00,color:#fff
```

## What the Results Page Shows

1. **Score header**: Large score number (e.g., `4 / 6`), percentage progress bar
2. **Submitted as**: Displays the nickname used
3. **Question breakdown** (if quiz data loads):
   - Each question with correct/wrong status
   - For wrong answers: shows user's pick and the correct answer
4. **Action buttons**: View leaderboard or play another quiz

## Why sessionStorage?

- Results are stored client-side in `sessionStorage` after the submit API call
- This avoids needing another API endpoint to fetch individual results
- `sessionStorage` data is **lost when the tab closes** — this is intentional (results are ephemeral, leaderboard is permanent)
- If someone navigates to `/quiz/{id}/results` directly without data, they're redirected back to the quiz
