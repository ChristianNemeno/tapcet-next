# Platform Strategy — Serving Philippine CET Students

This document translates the exam research into concrete product decisions for tapcet.

---

## Who the Users Are

### Primary: Grade 11–12 Senior High School Students
- Taking 2–4 entrance exams in a single season (October–February)
- Preparing simultaneously for UPCAT, ACET, USTET, DLSUCET, or PUPCET
- High stress, time-limited, often without access to expensive review centers

### Secondary: 2nd-Year College Students
- Applying for DOST JLSS scholarship
- Already have college-level knowledge; need exam-format practice

### Tertiary: Teachers and Review Center Instructors
- Curating quizzes for students
- Tracking class performance

---

## Core Platform Requirements

### 1. Exam-Tagged Quiz Sets

Every quiz and question should be taggable by exam:

```
tags: ["UPCAT", "Math", "Algebra", "Word Problems"]
tags: ["ACET", "English", "Vocabulary"]
tags: ["DOST", "Science", "Biology"]
```

This allows:
- Students to filter practice by their target exam
- Creators to label their content properly
- Analytics to show coverage gaps per exam

### 2. Subject + Topic Taxonomy

A standardized topic tree that maps to the exam coverage document:

```
Mathematics
  ├── Arithmetic
  ├── Algebra
  │   ├── Linear Equations
  │   ├── Quadratic Equations
  │   └── ...
  ├── Geometry
  ├── Trigonometry (UPCAT)
  └── Statistics & Probability

Science
  ├── Biology
  ├── Chemistry
  ├── Physics
  └── Earth Science

English
  ├── Grammar
  ├── Vocabulary
  └── Reading Comprehension

Abstract Reasoning
  ├── Number Series
  ├── Figural Analogies
  └── Logical Reasoning

Filipino (UPCAT)
Mechanical-Technical (DOST/JLSS)
General Information (PUPCET)
```

### 3. Timed Practice Mode

All major exams are time-pressured. The platform must support:

- Per-question time tracking (not just total quiz time)
- Exam-specific time limits (e.g., USTET Mental Ability = 80 items / 30 min)
- "Exam simulation" mode: full timed session mimicking actual exam conditions
- Timer visible but not distracting

### 4. Scoring Variants

Different exams use different scoring rules:

| Exam | Rule | Platform Setting |
|------|------|-----------------|
| UPCAT | Right-minus-wrong (-0.25 per wrong) | Penalized scoring mode |
| ACET | Standard | Standard scoring |
| USTET | Standard | Standard scoring |
| DLSUCET | No penalty | Standard scoring |
| PUPCET | Standard | Standard scoring |
| DOST | Standard | Standard scoring |

Quiz creators should be able to select the scoring mode. Practice quizzes in "UPCAT mode" should penalize wrong answers.

### 5. Per-Question Analytics

Students need to know not just their score but:

- Which topics they consistently miss
- Time spent per question vs. average
- Performance trend over multiple attempts
- Comparison to other users (leaderboard already exists)

### 6. Difficulty Levels

Each question should have a difficulty tag:

- **Easy** — straightforward recall or single-step problems
- **Medium** — two-step problems or moderate reasoning
- **Hard** — multi-step, time-consuming, or tricky distractors
- **Exam-level** — sourced or styled after actual past test items

### 7. Filipino Language Support

UPCAT tests Filipino — the platform should support Filipino-language questions and answer choices natively. UI strings may optionally be bilingual (EN/FIL).

---

## Content Strategy

### Priority Content to Create First

Based on the subject coverage priority table:

1. **English Grammar** — affects all 7 exams; highest ROI for content creation
2. **Reading Comprehension** — affected by all 7; create passage banks with questions
3. **Abstract Reasoning** — all 7 exams; pattern-based questions are highly reusable
4. **Algebra** — 6 exams; word problems especially
5. **Science: Biology, Chemistry, Physics** — 5 exams; USTET alone has 80 science items

### Official Practice Materials (Legal Considerations)

- Past UPCAT, ACET, USTET items are not officially released by the schools
- Content must be **original** or adapted (not copied verbatim)
- Questions should be inspired by released reviewers and prep books, not scraped
- DOST releases sample items — these could be adapted with attribution

---

## Features Implied by This Research

### Exam Simulator
Full mock exams that simulate the real test experience:
- Section-by-section (with correct time limits per section)
- Scoring mode matching the target exam
- Result breakdown by section and topic

### Weakness Tracker
After multiple practice sessions:
- Show weakest topics per exam
- Suggest which quizzes to take next

### Scholarship Mode
For DOST-SEI and JLSS:
- Mechanical-Technical section (unique — barely covered elsewhere)
- Self-Inventory guidance (explain the non-scored section)
- Income and eligibility information page

### Leaderboard by Exam
Current leaderboard is per-quiz. Could be extended to:
- Subject-level leaderboards (e.g., top Math scorers)
- Exam-level ranking (UPCAT sim score ranking)

### Study Plans
Pre-built study plans for each exam:
- "100 days to UPCAT" — daily quiz targets by topic
- "ACET essay crash course" — writing practice track
- "DOST Mechanical-Technical boot camp" — focused mechanical topic set

---

## Competitive Landscape

| Platform | Strength | Weakness |
|----------|----------|---------|
| UPCATChampion | UPCAT-focused | Paid, limited exams |
| ExamsPinas | Broad coverage | Mostly articles, few practice items |
| Ahead Tutorial | Established brand | Expensive review center |
| Reviewers on YouTube | Free, accessible | Not interactive |
| **tapcet** | Free, interactive, community-created | Content depth needs building |

---

## Summary: What to Build Next

Based on this research, the highest-impact features in order:

1. **Exam tags on quizzes** — allow filtering by UPCAT, ACET, USTET, DLSUCET, PUPCET, DOST
2. **Subject/topic taxonomy** — structured categorization per the coverage document
3. **Timer per section** (not just total quiz timer) — matches actual exam structure
4. **Penalized scoring mode** — critical for UPCAT practice
5. **Analytics dashboard** — per-topic accuracy tracking
6. **Official quiz sets** — admin-created, exam-specific quiz banks
7. **Exam simulator** — full timed mock exam experience
