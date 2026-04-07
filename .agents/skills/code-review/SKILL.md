---
name: code-review
description: Comprehensive guidelines for performing code reviews in the project. Use this skill when asked to review code changes, audit pull requests, or perform quality checks on new code modifications.
---

# Code Review Skill

When instructed to perform a code review, please follow these systematic steps to evaluate the code:

## 1. Correctness & Functionality
- **Logic:** Verify that the code achieves its intended objective without introducing regressions.
- **Edge Cases:** Check if error conditions, null/undefined states, and out-of-bounds scenarios are handled correctly.
- **Side Effects:** Ensure state or database modifications have no unintended side consequences.

## 2. Architecture & Design
- **Separation of Concerns:** Does the logic belong where it was placed? (e.g. keeping UI components pure and handling complex logic in services/hooks).
- **Modularity:** Are functions small, focused, and single-purpose? Are we avoiding massive monolithic files?
- **Reusability:** Could this code be generalized into an existing abstraction rather than duplicated?

## 3. Clean Code & Readability
- **Naming:** Do variable, function, and file names accurately describe their purpose and intent?
- **Comments:** Are comments explaining the "why", not just the "what"?
- **Housekeeping:** Ensure there are no lingering `console.log` statements, unused variables, or commented-out code blocks.

## 4. Performance & Security
- **Efficiency:** Watch out for unoptimized queries, unnecessary re-renders in Next.js, or blocking operations on the main thread.
- **Security:** Ensure no sensitive information is leaked, and input is sanitized.

## 5. Review Output
When presenting the review, organize your findings clearly. Point out critical issues first, followed by stylistic suggestions, and finally positive feedback on what was done well.
