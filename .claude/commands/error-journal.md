---
description: Log an error and its solution to the project error journal. Tracks bugs, mistakes, and fixes encountered while working on tapcet-next.
argument-hint: [category] [title] | list [category] | open <keyword>
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# Error Journal — tapcet-next

A running log of bugs and mistakes hit while building this project, with root causes and fixes. The goal is to understand the system better over time — not just fix things, but know *why* they broke.

**Journal location:** `.claude/error-journal/` (inside this project)

## Arguments

The user invoked this with: $ARGUMENTS

## Modes

Parse `$ARGUMENTS`:

- **No args, or just a title/category** → **Log mode**: write a new entry from the current conversation
- **`list`** → **List mode**: print all entries from the index
- **`list <category>`** → **List mode** filtered to one category
- **`open <keyword>`** → **Search mode**: find and display a matching past entry

---

## Log Mode

Capture the error from the current conversation and save it to the journal.

### 1. Extract context from the conversation

Read back through the conversation and pull out:

- **Error** — the actual error text (stack trace, compiler output, terminal output)
- **Context** — what was being worked on, what triggered it
- **What was tried** — approaches that didn't work (these are valuable — keep them)
- **Root cause** — the real reason it happened, not just the surface symptom
- **Solution** — exactly what fixed it
- **Status** — `solved` if fixed, `open` if still unresolved

If the error isn't solved yet, log it as `open` and leave the solution as a placeholder. The user can re-run `/error-journal` later to update it.

### 2. Determine the category

Use the argument if provided. Otherwise infer from the error:

| Category | Signals |
|---|---|
| `docker` | Dockerfile, docker-compose, container, image, layer, RUN, COPY |
| `npm` | package.json, package-lock.json, node_modules, lock file, npm ci |
| `typescript` | tsc, tsconfig, TS2xxx error codes, type mismatch, .d.ts |
| `database` | SQL, migration, Drizzle, schema, query, postgres, pg |
| `auth` | JWT, token, bcrypt, session, OAuth, middleware auth |
| `api` | endpoint, CORS, 404, 500, fetch, request/response |
| `nextjs` | App Router, Server Component, layout, pages/, routing |
| `git` | commit, branch, merge, rebase, push, conflict |
| `linux` | permission denied, chmod, PATH, shell, environment variable |
| `misc` | anything else |

### 3. Build the filename

Format: `YYYY-MM-DD-<kebab-case-title>.md`

Use today's date. Derive the title from the error (5–8 words) or use what the user passed as an argument.

Examples:
- `2026-04-07-esbuild-missing-from-lock-file.md`
- `2026-03-21-cors-headers-missing-on-preflight.md`

### 4. Write the entry

Save to `.claude/error-journal/<category>/<filename>`. Create the category directory if it doesn't exist.

Use this template — omit sections that aren't relevant, never pad with filler:

```markdown
---
date: YYYY-MM-DD
category: <category>
tags: [<relevant tags>]
status: solved | open
---

# <Short title: what broke>

## Error

```
<paste the actual error output>
```

## Context

<What was being worked on. What the expected behavior was.>

## What Was Tried

- <Attempt and why it didn't work>
- <Next attempt and why it didn't work>

## Root Cause

<The real reason — not the symptom, but what actually caused it. Include version numbers, behavioral differences between tools, architectural reasons, etc.>

## Solution

<Exact fix. Include the changed code/config/command.>

```<code or diff showing the fix>```

## Lesson

<One or two sentences you'd want to read in 6 months. What to watch for next time.>
```

### 5. Update the index

Read `.claude/error-journal/INDEX.md`. If it doesn't exist, create it:

```markdown
# Error Journal — tapcet-next

Bugs and mistakes encountered building this project, with root causes and fixes.

---

```

Add the new entry under its category heading (create the heading if missing). Keep entries newest-first within each section:

```markdown
## Docker

- [esbuild@0.28.0 missing from lock file](docker/2026-04-07-esbuild-missing-from-lock-file.md) — `npm ci` fails when lock file was generated with a different npm major version — *2026-04-07*
```

### 6. Confirm

Tell the user:
- Where the file was saved (relative path from project root)
- The category it was filed under
- If `open`, remind them to re-run `/error-journal` once they have a solution to complete the entry

---

## List Mode

When the user runs `/error-journal list` or `/error-journal list <category>`:

1. Read `.claude/error-journal/INDEX.md`
2. If a category is given, print only that section
3. If no entries exist yet, say so

---

## Search Mode

When the user runs `/error-journal open <keyword>`:

1. Grep across `.claude/error-journal/**/*.md` for the keyword
2. If one match: display the full entry
3. If multiple matches: list them and ask which to open
4. If no matches: say so

---

## Quality notes

- **Paste the real error** — not a paraphrase. The actual terminal output is what you'll search for later.
- **Root cause over symptom** — "npm v10 and npm v11 handle packages listed in both deps and peerDeps differently" beats "lock file was out of sync."
- **Keep lessons tight** — one or two sentences max.
- **Don't overwrite solved entries** — if a follow-up issue hits the same area, create a new entry and cross-reference the old one with a link.
