# Definition of Done

A user story is **Done** when all of the following are true:

## Code
- [ ] Feature is implemented and works as described in the acceptance criteria
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors (`npm run lint` passes in `client/`)
- [ ] Code reviewed (self-review at minimum — check the diff before marking done)

## Testing
- [ ] Happy path manually tested in the browser
- [ ] Edge cases tested (empty state, invalid input, unauthorized access)
- [ ] Relevant server route covered by a test in `server/src/routes/*.test.ts`

## API & Schema
- [ ] New endpoints documented in `docs/api-reference.md`
- [ ] New schema changes reflected in `docs/database.md`
- [ ] Drizzle migration generated and reviewed (`npx drizzle-kit generate` in `server/`)

## Client
- [ ] New pages added to the page reference table in `docs/client.md`
- [ ] New API functions added to the API client table in `docs/client.md`
- [ ] New TypeScript types added to the types table in `docs/client.md`

## Agile
- [ ] Story marked `Done` in the sprint file
- [ ] Acceptance criteria all checked off
- [ ] Any discovered follow-up work added to the product backlog
- [ ] `agile/done/features.md` updated to include the new capability
