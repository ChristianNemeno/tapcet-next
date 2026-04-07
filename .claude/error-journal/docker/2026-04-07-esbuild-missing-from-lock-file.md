---
date: 2026-04-07
category: docker
tags: [npm, esbuild, lock-file, peer-deps, vitest, npm-version-mismatch]
status: solved
---

# esbuild@0.28.0 missing from lock file during Docker build

## Error

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: esbuild@0.28.0 from lock file
npm error Missing: @esbuild/aix-ppc64@0.28.0 from lock file
npm error Missing: @esbuild/android-arm@0.28.0 from lock file
... (all @esbuild/* platform packages at 0.28.0)
```

Failing step in Dockerfile: `RUN npm ci --omit=dev` (runtime stage, line 20).

## Context

Running `docker compose build` for the tapcet-next server. The server Dockerfile uses `node:20-alpine` which ships with npm 10.8.2. The `server/package-lock.json` was generated locally with npm 11.11.1 / Node 25.

## What Was Tried

- Ran `npm install` inside `server/` locally — only changed a trailing newline in the lock file, did not add esbuild@0.28.0
- Checked if esbuild was explicitly in `server/package.json` — it wasn't, only a transitive dependency
- Looked at the previous "fix npm ci" commit (`6f2b76b`) — it only changed docs, never touched the actual package files

## Root Cause

`vitest@4.1.2` declares `vite` in **both** `dependencies` and `peerDependencies`. npm 11 (local) sees the dual declaration and treats `vite` as a peer dep — it doesn't install vite and doesn't need esbuild@0.28.0 in the lock file. npm 10.8.2 (Docker) treats it as a direct dependency, installs vite@8.x, then tries to resolve vite's optional peer dep `esbuild: ^0.27.0 || ^0.28.0` to the latest satisfying version — esbuild@0.28.0 — and then checks the lock file for it. It's not there. Build fails.

The same problem would have hit the `server-builder` stage (`npm ci` without `--omit=dev`) if it had run first.

## Solution

Added `--legacy-peer-deps` to both server `npm ci` commands in the Dockerfile:

```dockerfile
# server-builder stage
RUN npm ci --legacy-peer-deps

# runtime stage
RUN npm ci --omit=dev --legacy-peer-deps
```

`--legacy-peer-deps` restores npm v6 peer dep behavior — npm skips auto-installing optional peer deps, so it never tries to resolve or validate esbuild@0.28.0.

## Lesson

When local npm and Docker npm differ by a major version, `npm ci` can fail on peer dep resolution even when `npm install` locally passes fine. If you upgrade Node locally but keep an older base image in Docker, watch for this. Long-term fix: pin the same npm major in both places (either upgrade the Docker base image to node:24-alpine, or add `RUN npm install -g npm@11` to the Dockerfile).
