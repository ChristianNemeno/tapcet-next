# EP-02: Shareable Quiz Links

**Priority:** 🟡 Community & Growth  
**Sprint:** 1  
**Total Estimate:** 8 story points  
**Status:** 🏃 In Sprint

---

## Why

Right now, if a student wants to share a quiz with a classmate, they have to tell them "go to Tapcet, search for X quiz." That's friction. Every quiz should have a direct URL that anyone can click and land straight on the quiz detail page.

This is the single highest-leverage growth feature missing. Every share is a free acquisition channel.

---

## Scope

A shareable link is simply the canonical URL for a quiz: `/quiz/:id`. No new infrastructure needed — the quiz detail page already exists. The work is:
1. Making the URL easy to copy (share button UI)
2. Ensuring the page handles direct navigation gracefully (it already does)
3. Optionally: a short/vanity slug as an alternative to the UUID

---

## User Stories

### US-02-1 — Share button on quiz detail page
**As a student**, I want a "Copy link" button on the quiz page, so I can quickly share the quiz with classmates without copying the URL bar manually.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] A "Copy link" button appears on the quiz detail page (`/quiz/:id`) and results page
- [ ] Clicking it copies the full URL to the clipboard
- [ ] A brief toast/confirmation shows "Link copied" after clicking
- [ ] Button is visible to all users (no auth required)

---

### US-02-2 — Share button on quiz cards (home and collections)
**As a student**, I want to copy a quiz link directly from the browse page without opening the quiz, so I can share it while browsing.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] Each quiz card on the home page and collection detail page has a share icon/button
- [ ] Clicking copies the `/quiz/:id` URL to clipboard
- [ ] Does not navigate away from the page

---

### US-02-3 — Share collection link
**As a collection creator**, I want to share a direct link to my collection, so study groups can access the full set at once.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] "Copy link" button on collection detail page (`/collection/:id`)
- [ ] Copies the full collection URL to clipboard
- [ ] Confirmation toast shown

---

### US-02-4 — Share from results page
**As a student**, after finishing a quiz, I want to share the quiz with friends, so they can try the same quiz.

**Story Points:** 2

**Acceptance Criteria:**
- [ ] "Share this quiz" button on the results page
- [ ] Copies `/quiz/:id` URL (not the results URL — share the quiz itself, not your personal results)
- [ ] Confirmation toast shown

---

## Out of Scope (this sprint)

- Real-time shared sessions (everyone takes it simultaneously) — deferred, needs significant infrastructure
- Vanity slugs (e.g. `/quiz/upcat-math-2026`) — deferred, nice to have
- Social share cards / Open Graph meta tags — deferred, but a natural follow-on

---

## Dependencies

None. The quiz and collection detail pages already exist. This is purely a UI addition.

---

## Technical Notes

- Use the `navigator.clipboard.writeText()` API for clipboard copy
- Fallback: `document.execCommand('copy')` for older browsers
- Toast can use an existing shadcn/ui component or a lightweight state (`copied: boolean` with a 2s reset)
- No backend changes required
