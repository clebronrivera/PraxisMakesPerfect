# Handoff: Continue Cognitive Clarity Restoration (Post-PR #27)

**Status:** Phase 1–3 code complete. PR open. Visual + functional QA incomplete.  
**Branch:** `feat/restore-cognitive-clarity`  
**PR:** https://github.com/clebronrivera/PraxisMakesPerfect/pull/27  
**Prior handoff (planning):** [`COGNITIVE_CLARITY_RESTORATION.md`](./COGNITIVE_CLARITY_RESTORATION.md)  
**Bailout tag (still valid):** `pre-cognitive-clarity-revert` → `0910363`

---

## 1. What was done (do not redo)

| Commit | SHA | What |
|---|---|---|
| C1 tokens | `63c7f83` | PR #9 `tailwind.config.js` + `src/index.css`; Inter-only `index.html` |
| C2 shell + login | `1c78674` | Removed `ATELIER_MODES`/`isAtelier`; always `editorial-shell`; stripped starfield/orb/engine viz from `LoginScreen.tsx` |
| C3 component sweep | `08c2312` | All ~30 component files: Atelier vars/glass/navy → CC light surfaces + proficiency-coded accents |
| C4 docs + visuals | `4cba3c4` | This handoff chain + `visual-diff/` assets |

**All build gates pass:** `scan:types`, `lint`, `build`, `test` (153).

**Hard constraints from original handoff were preserved** — see §2 of `COGNITIVE_CLARITY_RESTORATION.md`.

---

## 2. Visual diff assets (start here)

```
visual-diff/
├── before/
│   ├── 01-hero.png          ← Atelier login hero (pre-sweep baseline)
│   └── 01b-hero-full.png
└── after/
    ├── 01-login-hero.png    ← CC login hero (viewport, vite :5173)
    ├── 02-login-full.png    ← CC login full page scroll
    └── 03-mockup-reference-top.png  ← top of mockup-cognitive-clarity.html
```

**Ground truth mockup:** `public/mockup-cognitive-clarity.html`  
**Compare in browser:** `http://localhost:5173/mockup-cognitive-clarity.html` vs `http://localhost:5173/` (login)

### Known visual gaps (flag as [FOLLOWUP] in PR, fix if user approves)

- **Login hero** is single-column centered; mockup may differ in layout density — compare screenshots before changing JSX again.
- **Authenticated screens** (dashboard, practice, tutor, study guide, learning path, results) were **not screenshot'd** — only login was captured.
- **DashboardHome** `RedemptionMoon` panel intentionally stays **dark** (CC dual-tone: cream + selective dark accents).
- **`QuestionCard.tsx`** still has internal `isAtelier` variant branches; all callers use `variant="editorial"`. Cleanup is a separate follow-up — do not bundle into QA fixes unless asked.
- **`TermsOfService.tsx` / `PrivacyPolicy.tsx`** — `font-serif` untouched (legal docs).

---

## 3. Your job (Phase 5 — finish before merge)

### 3a. Environment

```bash
cd /Users/lebron/Documents/PraxisMakesPerfect
git checkout feat/restore-cognitive-clarity
git pull

# REQUIRED for diagnostic / admin / tutor APIs — NOT raw vite
npm run dev:netlify    # → http://localhost:8888
```

If `netlify dev` fails with `Unauthorized` on addons: run `netlify login` and retry. Do **not** use port 5173 for functional regression checks.

### 3b. Visual walkthrough (capture to `visual-diff/after/`)

For each screen, save `visual-diff/after/<screen-name>.png` and note pass/fail vs mockup.

| Screen | Route / trigger |
|---|---|
| Login hero + sign-in | `/` (scroll to `#signin-panel`) |
| Dashboard | authenticated → home |
| Practice hub + session | practice-hub → start practice |
| Adaptive diagnostic | start diagnostic flow |
| Results / Progress | results mode |
| Study guide (3 tabs) | study-guide |
| AI Tutor + grounding rail | tutor (side panel artifact/quiz counts) |
| Learning path module | learning-path-module |
| Glossary, Help, Study notebook | respective modes |
| Admin dashboard | admin (clebronrivera@gmail.com) |

Reference: handoff §4 Visual gates in `COGNITIVE_CLARITY_RESTORATION.md`.

### 3c. Functional regression (must pass)

1. **Cross-device diagnostic resume** (#24) — partial session on browser A, resume on B  
2. **Orphan-user error banner** (#25)  
3. **Login autofill** — `autoComplete` attrs on email/password still present  
4. **Admin access** — `clebronrivera@gmail.com` in allowlist (`src/config/admin.ts`)  
5. **Diagnostic miss RPC** — wrong answer → `practice_missed_questions.wrong_count` increments (migration 0022)  
6. **Tutor grounding rail** — artifacts/quiz counts visible in side panel  

### 3d. If visual fixes needed

- **Visual-only changes** — OK on this branch or a follow-up commit on same PR  
- **Do not touch** functional logic in: `DashboardHome` structure, `TutorChatPage` grounding state, `useRedemptionRounds`, `useAssessmentFlow`, `AdaptiveDiagnostic`, `learningModules.ts`, `admin.ts`  
- Re-run full gates after any fix: `npm run check`

### 3e. PR housekeeping

- Update PR #27 body: check off completed visual/functional items  
- Add new `visual-diff/after/*.png` in a commit if capturing screenshots  
- Do **not** merge to main without user approval  
- Do **not** delete Atelier mockup HTMLs in this pass unless user explicitly asks  

---

## 4. Optional follow-up PR (after #27 merges)

| Item | File(s) | Notes |
|---|---|---|
| QuestionCard `isAtelier` cleanup | `src/components/QuestionCard.tsx` | Remove variant branch; editorial-only |
| Legal doc serif review | `TermsOfService.tsx`, `PrivacyPolicy.tsx` | User decision |
| Mockup HTML cleanup | `public/mockup-*.html` | Archive/delete stale Atelier mockups only after user OK |
| `HOW_THE_APP_WORKS.md` | `docs/` | Update only if user-facing copy references Atelier/navy |

---

## 5. Quick reference commands

```bash
# Gates
npm run check

# Compare CC baseline (read-only)
git show 293d865:src/index.css | head -60
git show 293d865:tailwind.config.js

# What #14 changed on a file (read-only)
git diff 76e1eca^..76e1eca -- src/components/DashboardHome.tsx

# PR
gh pr view 27
gh pr checks 27
```

---

## 6. Abort

```bash
git checkout main
git branch -D feat/restore-cognitive-clarity   # only if abandoning
# OR reset branch to bailout:
git reset --hard pre-cognitive-clarity-revert
```

PR #27 can be closed without merge if user abandons.
