# 2026-04-16 — Infrastructure Fixes (Sprint 1, Day 1)

**Type:** Bugfix / Ops  
**Status:** Resolved

---

## Problems

### 1. `POST /api/auth/register` → 500
**Root cause:** `JWT_SECRET` was not set. The `.env` file did not exist — only `.env.example`. Docker compose defaulted the variable to a blank string, and the auth middleware threw at sign time.

**Fix:** Created `.env` from `.env.example` and set a real `JWT_SECRET` (64-byte hex string).

---

### 2. `express-rate-limit` ValidationError on every request
**Root cause:** nginx passes `X-Forwarded-For` headers but Express `trust proxy` was not configured, so `express-rate-limit` could not identify real client IPs.

**Fix:** Added `app.set("trust proxy", 1)` to `server/src/index.ts` immediately after the app is created.

---

### 3. `password authentication failed for user "tapcetuser"` — server crash loop
**Root cause:** The `postgres_data` Docker volume was initialized with the default password (`tapcetpass`) before any `.env` existed. After `.env` was created with `POSTGRES_PASSWORD=jimboylo`, the DB rejected the new password because the volume data was already locked to the old one.

**Fix:** `docker compose down -v && docker compose up -d` — wiped the volume so postgres reinitialised with the password from `.env`. Safe because the server seeds data on every startup.

---

### 4. `DATABASE_URL` pointed to `localhost` in `.env`
**Minor:** `.env` had `DATABASE_URL=postgresql://...@localhost:5432/...`. Docker compose overrides this with `db:5432` so it didn't cause the crash, but it was misleading.

**Fix:** Updated `.env` to use `db:5432` to match the Docker service name.

---

## Files changed

- `.env` — created from `.env.example`; set `JWT_SECRET`, `POSTGRES_PASSWORD`, fixed `DATABASE_URL` host to `db`
- `server/src/index.ts` — added `app.set("trust proxy", 1)`
