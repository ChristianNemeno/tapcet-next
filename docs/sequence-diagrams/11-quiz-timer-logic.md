# Quiz Timer Logic (Client-side)

How the countdown timer works during a timed quiz.

```mermaid
flowchart TD
    START["useEffect runs<br/>step === 'quiz'<br/>timeLeft !== null"] --> CHECK{"timeLeft > 0?"}

    CHECK -->|No / null| SKIP["No timer effect<br/>(untimed quiz or expired)"]
    CHECK -->|Yes| TIMEOUT["setTimeout(() => ..., 1000ms)"]

    TIMEOUT --> TICK{"timeLeft <= 1?"}
    TICK -->|Yes — Time's up!| AUTO_SUBMIT["handleSubmit(answers)<br/>AUTO-SUBMIT with current answers"]
    TICK -->|No| DECREMENT["setTimeLeft(prev - 1)"]

    DECREMENT --> RENDER{"timeLeft < 10?"}
    RENDER -->|Yes| RED["Display in RED + bold<br/>(visual urgency)"]
    RENDER -->|No| GRAY["Display in muted gray"]

    RED --> LOOP["Effect cleanup + re-run<br/>(timeLeft changed)"]
    GRAY --> LOOP
    LOOP --> CHECK

    AUTO_SUBMIT --> SUBMIT_API["POST /api/quiz/{id}/submit<br/>with whatever answers exist"]

    style AUTO_SUBMIT fill:#8b0000,stroke:#ff4444,color:#fff
    style RED fill:#8b0000,stroke:#ff4444,color:#fff
    style SKIP fill:#2f4f4f,stroke:#708090,color:#fff
```

## Behavior Summary

| Condition | Behavior |
|-----------|----------|
| `timeLimitSeconds` is `null` | No timer shown, no auto-submit |
| `timeLeft > 10` | Timer shown in muted gray |
| `timeLeft < 10` | Timer shown in **red + bold** (urgency) |
| `timeLeft` reaches `0` | Quiz auto-submits with current answers |
| User submits before timeout | Timer is irrelevant, normal submit |

## Implementation Notes

- Timer only runs when `step === "quiz"` (not during nickname entry)
- Uses `setTimeout` with cleanup (`clearTimeout`) to avoid memory leaks
- The `handleSubmit` function is wrapped in `useCallback` to stay stable across re-renders
- If a user hasn't answered some questions when time expires, those questions get `-1` as the selected answer (always wrong)
