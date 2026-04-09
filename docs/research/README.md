# Research: Philippine College Entrance Tests & Scholarships

This directory documents research into Philippine college entrance examinations and scholarship tests. The goal is to shape tapcet into a platform that genuinely serves Filipino students preparing for these high-stakes exams.

## Directory Structure

```
research/
├── README.md               ← this file (overview + comparison)
├── exams/
│   ├── upcat.md            ← University of the Philippines
│   ├── acet.md             ← Ateneo de Manila
│   ├── ustet.md            ← University of Santo Tomas
│   ├── dlsucet.md          ← De La Salle University
│   └── pupcet.md           ← Polytechnic University of the Philippines
├── scholarships/
│   ├── dost-sei.md         ← DOST Merit Scholarship (undergrad)
│   └── jlss.md             ← DOST Junior Level Science Scholarship
├── subject-coverage.md     ← topics tested across all exams
└── platform-strategy.md    ← how this research maps to product decisions
```

---

## Quick Comparison Table

| Exam | Institution | Sections | Items | Time | Fee | Acceptance |
|------|-------------|----------|-------|------|-----|------------|
| UPCAT | UP System | 4 | ~200+ | ~4 hrs | Free (PH) | ~10% |
| ACET | Ateneo de Manila | 5 + essay | ~200+ | ~4 hrs | PHP 600 | Competitive |
| USTET | Univ. of Santo Tomas | 4 | 265 | ~2.5 hrs | PHP 600 | Competitive |
| DLSUCET | De La Salle University | 4 | 280 | ~2–3 hrs | TBD | Competitive |
| PUPCET | PUP | 5 | 70+ | ~2–3 hrs | TBD | ~16% |
| DOST-SEI | DOST (Scholarship) | 6 | N/A | ~3 hrs | Free | Very limited |
| JLSS | DOST (Scholarship) | 6 | N/A | ~3 hrs | Free | Very limited |

---

## Common Subjects Across All Exams

Every major exam tests some combination of:

- **Mathematics** — algebra, geometry, word problems, statistics
- **English** — grammar, vocabulary, reading comprehension
- **Science** — biology, chemistry, physics, earth science
- **Abstract/Logical Reasoning** — patterns, analogies, spatial reasoning
- **Reading Comprehension** — literary and non-literary passages

UPCAT additionally tests **Filipino language proficiency**.

---

## Key Observations for Platform Design

1. **Multiple choice, 4 options** — universal format across all exams
2. **Timed practice is critical** — most exams are designed to be time-pressured
3. **UPCAT has a right-minus-wrong penalty** — strategy matters, not just knowledge
4. **DLSUCET has no guessing penalty** — different strategy applies
5. **USTET formula is public** — `(score × 80%) + (HS average × 20%)`
6. **Scholarship exams (DOST)** also include a non-scored Self-Inventory section
7. **Students target multiple exams** — a single student may take UPCAT + ACET + USTET in one season

---

## Sources

- [Ateneo Admissions](https://www.ateneo.edu/college/admissions/acet)
- [UST Admissions Portal](https://ustet.ust.edu.ph/)
- [UP UPCAT Portal](https://upcat.up.edu.ph/)
- [DOST-SEI Official Site](https://www.sei.dost.gov.ph/)
- [DLSU Admissions](https://www.dlsu.edu.ph/admission/undergraduate-admissions/)
- [PUP iApply Portal](https://www.pup.edu.ph/iapply/PUPCET)
- [JLSS Portal](https://jlss.science-scholarships.ph/)
