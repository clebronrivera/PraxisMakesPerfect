# Claude Code Handoff — Cognitive Clarity Restoration

**Last updated:** 2026-05-24  
**Branch:** `feat/restore-cognitive-clarity`  
**PR:** https://github.com/clebronrivera/PraxisMakesPerfect/pull/27 (OPEN — **do not merge without user approval**)  
**Bailout tag:** `pre-cognitive-clarity-revert` → `0910363` on `main`

---

## Executive summary

This is a **forward redesign** restoring the Cognitive Clarity (CC) aesthetic from PR #9 on top of post-PR #14 architecture. **Do not mechanically revert PR #14** — it bundled design with migrations, tutor grounding, diagnostic resume, admin allowlist, etc.

**Code on branch is feature-complete.** Remaining work is **pre-merge QA** (authenticated visual walkthrough + live functional checks on Netlify dev `:8888`) and PR checklist updates.

---

## What’s done (do not redo)

| Area | Status | Key commits |
|---|---|---|
| Design tokens | Done | `63c7f83` — tailwind, `index.css`, Inter-only fonts |
| Shell collapse | Done | `1c78674` — no `ATELIER_MODES`/`isAtelier`; always `editorial-shell` |
| Component sweep | Done | `08c2312` — ~30 files, Atelier → CC light surfaces |
| Login hero (generalized) | Done | `7bac82d`, `8013d77` — split layout; **no** bank size, calibration, domain/skill counts |
| Product docs + ADR | Done | `HOW_THE_APP_WORKS.md`, `docs/decisions/2026-05-login-hero-marketing.md` |
| Build gates | Pass | `npm run check` — types, lint, 153 tests |

### Login hero rules (hard constraint)

See ADR: `docs/decisions/2026-05-login-hero-marketing.md`

- **Must NOT show on hero:** item counts, “calibrated items”, IRT claims, “4 domains / 45 skills”
- **Copy source:** `LOGIN_HERO_FEATURES` + `LOGIN_HERO_STEPS` in `src/components/LoginScreen.tsx`
- **Ground truth mockup:** `public/mockup-login-generalized.html`

### Functional features preserved (never regress)

- `DashboardHome.tsx` structure
- `TutorChatPage.tsx` grounding rail (`activeSession`, `artifactsInSession`, `quizItemsInSession`)
- `useRedemptionRounds.ts` → `recordDiagnosticMiss` / migration `0022`
- `useAssessmentFlow.ts`, `AdaptiveDiagnostic.tsx`
- `learningModules.ts`, `src/config/admin.ts` (both admin emails incl. `clebronrivera@gmail.com`)
- Login form a11y attrs (`autoComplete`, `id`, `name`, `inputMode`)

### Explicitly out of scope (follow-up PRs)

- `QuestionCard.tsx` internal `isAtelier` branches (callers use `editorial`)
- `TermsOfService.tsx` / `PrivacyPolicy.tsx` `font-serif`
- Delete/archive stale Atelier mockup HTMLs
- Merge to `main`

---

## Visual assets

```
visual-diff/
├── before/01-hero.png, 01b-hero-full.png     ← Atelier baseline
└── after/
    ├── 01-login-hero.png, 02-login-full.png
    ├── 03-mockup-reference-top.png           ← mockup-cognitive-clarity.html
    ├── 04-login-generalized-mockup-v2.png
    └── 05-login-hero-implemented.png         ← live React hero
```

| Mockup | Purpose |
|---|---|
| `public/mockup-cognitive-clarity.html` | Authenticated app screens (dashboard, practice, study guide, etc.) |
| `public/mockup-login-generalized.html` | Login hero ground truth |

---

## Your job (pre-merge only)

### 1. Environment

```bash
cd /Users/lebron/Documents/PraxisMakesPerfect
git checkout feat/restore-cognitive-clarity
git pull

netlify login   # if needed
npm run dev:netlify   # → http://localhost:8888  (NOT :5173 for API features)
```

### 2. Authenticated visual walkthrough

Screenshot each to `visual-diff/after/<screen>.png`:

| Screen | Trigger |
|---|---|
| Dashboard | Home after login |
| Practice hub + session | Start practice |
| Adaptive diagnostic | Start diagnostic |
| Results / Progress | Results mode |
| Study guide (3 tabs) | Study guide |
| AI Tutor + grounding rail | Tutor — verify artifact/quiz counts in side panel |
| Learning path module | Open any module |
| Glossary, Help, Study notebook | Respective modes |
| Admin | `clebronrivera@gmail.com` |

Compare against `public/mockup-cognitive-clarity.html`. **DashboardHome `RedemptionMoon` panel stays dark** (intentional CC dual-tone).

### 3. Functional regression (live, signed-in on `:8888`)

- [ ] Cross-device diagnostic resume (#24)
- [ ] Orphan-user error banner (#25)
- [ ] Login autofill still works
- [ ] Admin dashboard loads for allowlisted email
- [ ] Diagnostic wrong answer increments `wrong_count` via RPC (Supabase or admin Student Detail)
- [ ] Tutor grounding rail shows real artifact/quiz counts

### 4. PR housekeeping

```bash
npm run check
gh pr view 27
gh pr checks 27
gh pr edit 27 --body "..."   # check off completed items; [FOLLOWUP] for deferred
```

**Do not merge** without explicit user approval.

---

## Key file paths

| Path | Role |
|---|---|
| `tailwind.config.js`, `src/index.css`, `index.html` | CC tokens |
| `src/App.tsx` | Shell (`editorial-shell`, no Atelier mode) |
| `src/components/LoginScreen.tsx` | Login hero + sign-in |
| `docs/HOW_THE_APP_WORKS.md` | Canonical product copy (update if login/marketing changes) |
| `docs/handoff/COGNITIVE_CLARITY_RESTORATION.md` | Original plan + hard constraints |
| `CLAUDE.md`, `AGENTS.md` | Repo operating rules |

---

## Abort

```bash
git reset --hard pre-cognitive-clarity-revert   # on branch, if abandoning
# Close PR #27 without merge
```

---

## Paste-ready prompt (Claude Code)

```
You are picking up the Cognitive Clarity restoration on PraxisMakesPerfect.

READ FIRST:
1. docs/handoff/COGNITIVE_CLARITY_CLAUDE_CODE_HANDOFF.md  ← this sheet
2. docs/handoff/COGNITIVE_CLARITY_RESTORATION.md          ← original plan
3. CLAUDE.md and AGENTS.md

BRANCH: feat/restore-cognitive-clarity
PR: https://github.com/clebronrivera/PraxisMakesPerfect/pull/27 (OPEN — do not merge without user approval)
BAILOUT: git reset --hard pre-cognitive-clarity-revert

STATUS: Design + login hero are DONE on branch. Your job is PRE-MERGE QA only.

LOGIN HERO RULES (do not violate):
- No question-bank size, calibrated items, IRT marketing, or domain/skill counts on hero
- ADR: docs/decisions/2026-05-login-hero-marketing.md
- Ground truth: public/mockup-login-generalized.html + src/components/LoginScreen.tsx

ENVIRONMENT:
  netlify login && npm run dev:netlify  → http://localhost:8888
  (Use :5173 only for static/login preview; NOT for diagnostic/admin/tutor APIs)

TASKS:
1. Authenticated visual walkthrough — screenshot every screen in handoff §2 table → visual-diff/after/
2. Live functional regression on :8888 (diagnostic resume, orphan banner, admin, miss RPC, tutor rail)
3. npm run check after any fixes
4. Update PR #27 body — check off completed; [FOLLOWUP] for deferred
5. Do NOT merge to main without user approval

DO NOT:
- Revert PR #14 mechanically
- Re-add item counts or exam stats to login hero
- Touch functional logic in DashboardHome structure, TutorChatPage grounding, useRedemptionRounds, useAssessmentFlow, AdaptiveDiagnostic, learningModules.ts, admin.ts
- Bundle QuestionCard isAtelier cleanup unless user asks
- Delete mockup HTML files

WHEN BLOCKED: stop and ask user. Bailout: git reset --hard pre-cognitive-clarity-revert
```
