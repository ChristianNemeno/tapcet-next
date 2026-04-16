# Quiz Collections

> Date: 2026-04-12
> Backlog ref: `docs/backlogs.md` — 🟡 Community & Growth

---

## Summary

Adds a collections system for grouping quizzes into named, curated sets (e.g. "UPCAT Mathematics — Full Coverage"). Collections are browsable at `/collections`, filterable by exam tag, and followable by authenticated users. Creators manage them via a two-step flow: create metadata, then add quizzes from the edit page. The dashboard gains a "My Collections" section.

---

## Changes

### `server/src/db/schema.ts`
- Added `collections` table: `id`, `title`, `description`, `examTag`, `visibility`, `isOfficial`, `createdBy` (FK cascade), `createdAt`
- Added `collectionQuizzes` table: `id`, `collectionId` (FK cascade), `quizId` (FK cascade), `orderIndex` — with unique index on `(collectionId, quizId)`
- Added `collectionFollows` table: `id`, `userId` (FK cascade), `collectionId` (FK cascade), `createdAt` — with unique index on `(userId, collectionId)`

### `server/drizzle/0005_collections.sql` (new file)
- Creates all three tables with FK constraints and unique indexes

### `server/drizzle/meta/_journal.json`
- Added entry for `0005_collections` (idx: 5)

### `server/src/routes/collection.ts` (new file)
- `GET /api/collections` — public collections; supports `?exam=` and `?official=true`; uses `COUNT(DISTINCT ...)` for quiz and follower counts across multiple LEFT JOINs
- `GET /api/collection/:id` — single collection with quizzes (ordered by `orderIndex`) and `isFollowing` status; optional auth via `optionalAuth`
- `POST /api/collection` — create collection (auth required)
- `PUT /api/collection/:id` — update metadata (owner/admin)
- `DELETE /api/collection/:id` — delete collection (owner/admin); quizzes are NOT deleted
- `GET /api/my-collections` — creator's own collections including drafts
- `POST /api/collection/:id/follow` — toggle follow; returns `{ following, followerCount }`
- `POST /api/collection/:id/quizzes/:quizId` — add quiz; uses `onConflictDoNothing` for idempotency
- `DELETE /api/collection/:id/quizzes/:quizId` — remove quiz

### `server/src/index.ts`
- Imported `collectionRouter` from `./routes/collection.js`
- Registered `app.use("/api", collectionRouter)`

### `client/src/lib/types.ts`
- Added `CollectionSummary`, `CollectionDetail`, `MyCollectionSummary`, `CollectionFormPayload` interfaces

### `client/src/lib/api.ts`
- Added 8 functions: `fetchCollections`, `fetchCollection`, `createCollection`, `updateCollection`, `deleteCollection`, `fetchMyCollections`, `toggleFollowCollection`, `addQuizToCollection`, `removeQuizFromCollection`

### `client/src/app/collections/page.tsx` (new file)
- Browse page: exam tag filter pills + "Official" toggle; 3-column grid of `CollectionCard`s; skeleton loaders; empty state

### `client/src/app/collection/[id]/page.tsx` (new file)
- Detail page: collection header with exam/official badges, follower count, follow/unfollow button; quiz list as `QuizRow` components; edit link for owner

### `client/src/app/collection/create/page.tsx` (new file)
- Create form: title (required), description, exam tag picker, visibility toggle, official flag (admin only); on submit redirects to edit page to add quizzes

### `client/src/app/collection/[id]/edit/page.tsx` (new file)
- Edit page: metadata form + quiz management (current quizzes with remove, searchable all-quizzes list with add); optimistic UI updates

### `client/src/app/dashboard/page.tsx`
- Extended `Section` union to include `"my-collections"`
- Added `"My Collections"` nav item (symbol `#`)
- Added `fetchMyCollections` call with `loadingCollections` state
- Added `handleDeleteCollection` handler
- Added `MyCollectionsSection` component: table of collections with quiz count, exam tag, visibility badge, edit/delete actions
- Added `section === "my-collections"` render branch

### `client/src/components/navbar.tsx`
- Added "Collections" ghost link (visible to all users, hidden on mobile) between logo and auth section
