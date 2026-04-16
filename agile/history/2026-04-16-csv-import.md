# 2026-04-16 — EP-03 CSV Import

**Sprint:** Sprint 1  
**Stories:** US-03-1, US-03-2, US-03-3, US-03-4 (12 SP)  
**Status:** Shipped

---

## What was built

| Story | Deliverable |
|---|---|
| US-03-1 | `client/public/quiz-template.csv` — static download with headers + 2 example rows. Download link on create page. |
| US-03-3 | `POST /api/quiz/import/validate` — authenticates user, validates rows with Zod + custom logic, returns `{ parsed, errors }`. 8 tests in `quiz.test.ts`. |
| US-03-2 | `CsvImporter` component on quiz **create** page — `mode="replace"`, replaces all questions with imported ones. |
| US-03-4 | Same component on quiz **edit** page — `mode="append"`, appends to existing questions. |

## Key files

- `client/public/quiz-template.csv` — downloadable template
- `client/src/components/CsvImporter.tsx` — new component
- `client/src/lib/api.ts` — added `validateCsvImport()` + `CsvRow`/`CsvImportResult` types
- `server/src/schemas/quiz.ts` — added `csvImportSchema`, `CsvImportInput`, `CsvImportRow`
- `server/src/routes/quiz.ts` — added `POST /api/quiz/import/validate`
- `server/src/routes/quiz.test.ts` — 8 new tests for the validate endpoint
- `client/package.json` — added `papaparse` + `@types/papaparse`

## CSV format

```
question,option_a,option_b,option_c,option_d,answer
What is X?,Choice1,Choice2,Choice3,Choice4,A
```

- `answer`: A/B/C/D (case-insensitive)
- Max 200 rows per import
- Max 1 MB file size (client-side check)

## Decisions

- Parsing is client-side (papaparse), validation is server-side. This keeps the server from dealing with raw file uploads while still enforcing data integrity server-side.
- Valid rows are imported even when some rows fail — partial import is better than rejecting the whole file.
- Answer is A/B/C/D only — numeric values not supported to avoid 0 vs 1 indexing ambiguity.
- **Requires `npm install` in `client/`** to pick up the new papaparse dependency before building.
