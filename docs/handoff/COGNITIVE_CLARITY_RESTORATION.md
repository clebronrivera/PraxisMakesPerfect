# Handoff: Restore Cognitive Clarity Aesthetic on Current Architecture

**Status:** Ready to execute. Branch already cut, no commits yet.
**Branch:** `feat/restore-cognitive-clarity`
**Repo:** `/Users/lebron/Documents/PraxisMakesPerfect/`
**Tag (bailout):** `pre-cognitive-clarity-revert` → points at `0910363` on main
**Approved by:** clebronrivera@gmail.com (2026-05-23)

---

## 1. Mission (read this first)

The app currently ships a dark-navy "Atelier" design from PR #14 ([`76e1eca`](https://github.com/clebronrivera/PraxisMakesPerfect/pull/14), merged 2026-04-21). The user has decided the previous **Cognitive Clarity** design from PR #9 ([`293d865`](https://github.com/clebronrivera/PraxisMakesPerfect/pull/9), merged 2026-04-16) is the correct direction.

**Your job:** Apply the Cognitive Clarity *aesthetic* on top of the *current* architecture. This is a **forward redesign**, not a revert.

### ⚠️ Design decision already made by user (2026-05-24)

The user has explicitly chosen **faithful Cognitive Clarity including its proficiency-coded color system**. This means:

- **Domain identity is NOT color-coded.** The Atelier `d1-peach`/`d2-mint`/`d3-ice`/`d4-lavender` per-domain palette is **dropped entirely**. Domains are distinguished by label, icon, and position only — not color.
- **Color encodes proficiency only**, tied to the canonical thresholds in [`src/utils/skillProficiency.ts`](../../src/utils/skillProficiency.ts):
  - **Demonstrating** (≥80%) → green family
  - **Approaching** (60–79%) → amber family
  - **Emerging** (<60%) → rose/orange family (the "peach" tone in the PR #9 mockup)
  - **Not started** (0 attempts) → slate/neutral

The PR #9 mockup `public/mockup-cognitive-clarity.html` is the visual ground truth — open it in a browser before starting Phase 3.

### Why this can't be a revert

A prior session attempted `git revert 76e1eca` and discovered PR #14 was a kitchen-sink commit bundling:

- 40 source-file design changes (intended)
- 59 added files including:
  - `supabase/migrations/0022_diagnostic_wrong_count.sql` — database migration
  - 33 content-authoring docs
  - 9 spec/audit/decision docs
  - 9 mockup HTMLs + 6 mockup PNGs
- **Functional features baked into "design" components**:
  - Full rewrite of `DashboardHome.tsx` structure
  - New `recordDiagnosticMiss` RPC integration in `useRedemptionRounds.ts` (depends on migration 0022)
  - Tutor grounding rail (`activeSession`, `artifactsInSession`, `quizItemsInSession`) in `TutorChatPage.tsx`
  - Module schema extensions (`role`, `sequenceGroup`, `sequenceIndex`, `prerequisiteModuleIds`, `concepts`) in `learningModules.ts`
  - Adaptive diagnostic retake guard in `useAssessmentFlow.ts`
  - **Added `clebronrivera@gmail.com` to admin allowlist in `src/config/admin.ts`** (do not remove)

A mechanical revert would regress all of the above. The bailout was clean — no commits made. You're starting from a clean working tree at the merge base.

---

## 2. Hard constraints

**NEVER undo these (functional gains from #14 and post-#14 PRs):**

| File | What to preserve |
|---|---|
| `src/components/DashboardHome.tsx` | Current component structure entirely |
| `src/components/TutorChatPage.tsx` | Grounding rail derived state (`activeSession`, `artifactsInSession`, `quizItemsInSession`) |
| `src/hooks/useRedemptionRounds.ts` | `recordDiagnosticMiss` callback + `record_diagnostic_miss` RPC integration |
| `src/data/learningModules.ts` | All schema extensions and module data |
| `src/config/admin.ts` | Both admin emails in the allowlist |
| `src/hooks/useAssessmentFlow.ts` | All of it — including #14's retake guard, #24's cross-device resume (`AdaptiveDiagnosticStartOptions`, `beginFreshAdaptiveDiagnostic`, `adaptiveResumeError`), and #25's orphan-user error handling |
| `src/components/AdaptiveDiagnostic.tsx` | All resume/baseline/queue logic |
| `src/components/LoginScreen.tsx` | All form accessibility attrs (`id`, `name`, `autoComplete`, `inputMode`) added by #24 |
| `supabase/migrations/0022_diagnostic_wrong_count.sql` | Do not delete |
| `content-authoring/**`, `docs/audits/**`, `docs/decisions/**`, `docs/plans/**`, `docs/specs/**` | Do not delete |
| `archive/2026-04-blueprint-alt/**` | Do not delete |
| `public/mockup-*.html`, `public/mockup-previews/*.png` | Leave alone (reference assets) |

**DO modify (visual layer only):**

| File | What to change |
|---|---|
| `tailwind.config.js` | Drop Atelier palette/animations/Fraunces, add CC tokens |
| `src/index.css` | Rewrite semantic class definitions (`.editorial-*`, `.card`, etc.) to CC theme |
| 27 components (see §6) | Replace utility class usages: navy→cream/white, Fraunces→sans, glass→light borders, etc. |
| Login screen JSX | Remove decorative orb/halo/starfield elements (visual-only) |

---

## 3. Current state

```
$ git branch --show-current
feat/restore-cognitive-clarity

$ git log -3 --oneline
0910363 fix(admin): use adaptiveDiagnosticComplete for in-progress detection (#26)
e137311 fix(diagnostic): orphan user + Supabase failure surfaces error banner (#25)
b31799b fix(diagnostic): cross-device adaptive resume + admin diagnostic story panel (#24)

$ git status
On branch feat/restore-cognitive-clarity
Untracked files:
  visual-diff/   ← contains BEFORE Atelier hero screenshot at visual-diff/before/01-hero.png; safe to ignore or commit
```

Bailout tag `pre-cognitive-clarity-revert` exists locally at `0910363` (same as HEAD now). To abort everything cleanly: `git reset --hard pre-cognitive-clarity-revert`.

PR #26 (AdminDashboard typo fix) was already merged to main as part of Phase 0 setup. Local main is current.

---

## 4. Cognitive Clarity design DNA (target aesthetic)

**Important: Cognitive Clarity is NOT pure-light.** It's mostly cream with selective dark accents.

From `src/index.css` at PR #9 (`git show 293d865:src/index.css`):

| Element | CC token |
|---|---|
| Body background | `#f7f6f2` (cream) |
| Editorial surface (cards) | `bg-white` with `border-color: #e6dfd4`, `border-radius: 2rem`, soft shadow |
| Editorial surface soft | `#fbfaf7` cream with `#ece4d7` border |
| **Editorial panel DARK** (deliberate accent) | `#0f172a` background, white text, `2.5rem` radius, prominent shadow |
| `.card` (semantic) | `bg-slate-900/60 border-slate-800/60` ← **kept dark in CC** |
| `.stat-card` (semantic) | `bg-navy-900/80 border-navy-700/60` ← **kept dark in CC** |
| Primary button | `bg-cyan-500` text-slate-950 |
| Body text | `#1a1a1a` (near-black slate) |
| Display font | **Inter only** — no Fraunces serif |

**Key takeaway:** Mostly cream/white surfaces with `editorial-surface` look, BUT some stat panels and cards stay dark navy as visual anchors. This dual-tone is intentional. Don't fight it.

**Reference the full PR #9 baseline:**
```bash
git show 293d865:tailwind.config.js
git show 293d865:src/index.css
```

---

## 5. Execution plan

### Phase 1 — Token foundation (1 commit)

**Goal:** Get tailwind + index.css matching PR #9, with surgical adjustments for things that have changed since.

#### Phase 1a: `tailwind.config.js`

- Drop these from `theme.extend`:
  - `colors.'d1-peach'`, `'d2-mint'`, `'d3-ice'`, `'d4-lavender'`, `'accent-rose'`, `'accent-cream'`
  - `backgroundImage.'gradient-atelier'`, `'gradient-atelier-warm'`
  - `keyframes.'orb-pulse'`, `'halo-breathe'`, `'node-ring'`, `'starfield-drift'`
  - `animation.'orb-pulse'`, `'halo-breathe'`, `'node-ring'`, `'starfield-drift'`
- Drop `fontFamily.serif` (no more Fraunces)
- Keep `navy` palette (used by CC dark accents)
- Keep `gradient-navy` and `gradient-hero` (used by dark accent panels)
- Keep `boxShadow.glow-*` and `card`/`card-lg` (used by CC)

Verify by `diff tailwind.config.js <(git show 293d865:tailwind.config.js)` — they should match modulo additions you keep for forward-functionality (none expected).

#### Phase 1b: `src/index.css`

Replace the file's contents with PR #9's version, then re-apply any post-#14 additions if they exist:
```bash
git log --oneline 76e1eca..HEAD -- src/index.css
```
At time of writing: no post-#14 commits touched `src/index.css`. Safe to do a full replace:
```bash
git show 293d865:src/index.css > src/index.css
```

Then audit: search for any `@apply` rules that reference utility classes that no longer exist in tailwind.config. Adjust.

**Commit:** `feat(design): restore Cognitive Clarity tokens (tailwind + base CSS)`

#### Phase 1c: Verify gates after token-only change

```bash
npm run scan:types    # must pass
npm run lint          # must pass
npm run build         # must pass
npm test              # must pass (153 tests last known passing)
```

If lint flags unknown utility classes (e.g., `bg-d1-peach` in some component), do not silence — that's a real broken class. Note it for Phase 3.

#### Phase 1d: Quick visual checkpoint

```bash
npm run dev   # vite alone is fine for visual; netlify dev not needed yet
```

Open `http://localhost:5173/` and screenshot the login screen. Compare against `visual-diff/before/01-hero.png` (Atelier baseline). Some screens will already look closer to CC just from the token swap. The login screen will probably still look 90% Atelier because the hero JSX references atelier classes directly.

---

### Phase 2 — Strip decorative Atelier JSX (1 commit)

**Goal:** Remove orb/halo/starfield decorative elements from JSX. These are visual-only — no logic depends on them.

Search and destroy:

```bash
grep -rn "animate-orb-pulse\|animate-halo-breathe\|animate-starfield-drift\|animate-node-ring" src/
```

In each hit (likely concentrated in `LoginScreen.tsx`, possibly `DashboardHome.tsx`):
- Find the `<div>` wrapping the animated element. If the div has no other purpose, delete it entirely.
- If it has other purpose, just remove the animation classes.

The login hero's central orb with starfield is the biggest piece — it'll go away. CC replacement is just clean typography on cream. Keep the page title, CTAs, and stats strip.

**Commit:** `feat(design): remove orb/halo/starfield decorative JSX`

Visual checkpoint again — login should now look much closer to CC.

---

### Phase 3 — Component class sweep (2–4 commits, group logically)

**Goal:** Replace remaining Atelier utility classes with CC equivalents across 27 components.

#### Phase 3a: Build the swap rules

From the prior agent's straggler scan (read-only Explore on 2026-05-23), the distribution at HEAD was:

| Category | Files affected | Approach |
|---|---|---|
| **`bg-navy-*`, `from-navy-*`** (10 occurrences) | LoginScreen (4), GlossaryPage (3), index.css (1), PracticeSession (1), HelpFAQ (1) | Replace with white/cream surfaces, OR keep navy if it's a `.stat-card`/`editorial-panel-dark` semantic accent |
| **`font-serif`, `Fraunces`** (4 occurrences) | LoginScreen (2), TermsOfService (1), PrivacyPolicy (1) | **DO NOT touch TermsOfService/PrivacyPolicy** (pre-existing legal-doc styling, not in #14's scope). Remove from LoginScreen. |
| **`bg-white/[0.04]`, `border-white/10`** (69 occurrences) | StudyPlanViewer (14), GlossaryPage (6), PracticeSession (7), ModuleLessonViewer (5), StudyModesSection (4), DiagnosticFeedback (4), StudyPlanCard (4), QuestionCard (3), ScreenerResults (3), + others | Glass cards over dark → light cards. Replace with `bg-white border border-[#e6dfd4]` or use `.editorial-surface` class |
| **`d1-peach`, `d2-mint`, `d3-ice`, `d4-lavender`, `accent-rose`, `accent-cream`** (~507 occurrences) | StudyPlanViewer (80), ResultsDashboard (49), DashboardHome (30), PracticeSession (35), StudyModesSection (35), LearningPathNodeMap (31), GlossaryPage (25), LoginScreen (23), ModuleLessonViewer (18), StudyPlanCard (18), ArtifactCard (15), + 17 others | **Highest scrutiny.** These are the domain palette accents. Replace with CC-appropriate accents (amber for D1, mint→emerald-200, ice→sky-100, lavender→indigo-100 — confirm with user). Document the mapping you choose. |

#### Phase 3b: Token mapping (decision per §1; confirm only Tier color exact shades with user)

##### Surface/typography tokens (mechanical swaps)

| Atelier token | CC replacement | Rationale |
|---|---|---|
| `bg-navy-900` (page bg) | `bg-[#f7f6f2]` (cream) | CC body |
| `bg-navy-800` (card) | `bg-white` + `border-[#e6dfd4]` | CC surface |
| `bg-navy-700` (inset) | `bg-[#fbfaf7]` + `border-[#ece4d7]` | CC soft surface |
| `text-slate-100` | `text-slate-900` | Body text |
| `text-slate-300` | `text-slate-700` | Secondary |
| `text-slate-400` | `text-slate-500` | Muted |
| `border-white/10` | `border-slate-200` | Soft border |
| `bg-white/[0.04]` | `bg-white` (opaque, not glass) | Drop glass effect |
| `font-serif` / Fraunces | (remove — default Inter sans takes over) | CC has no display serif |
| `bg-gradient-navy` | `bg-[#f7f6f2]` | CC body |
| `bg-gradient-hero` | `bg-[#fbfaf7]` | CC soft surface |

##### Domain tokens (d1–d4) — context-dependent, NOT a 1:1 swap

Per the user's decision in §1, domain identity is **not** color-coded. For every `d1-peach`/`d2-mint`/`d3-ice`/`d4-lavender`/`accent-rose`/`accent-cream` reference (~507 occurrences across 27 components), classify the usage:

| Usage context | Replacement |
|---|---|
| **Pure domain identifier** (e.g., the 4-domain hero arc, domain card headers, constellation rows where each row is a domain) | Drop the color entirely. Use white/cream surface (`bg-white border-[#e6dfd4]`) + slate text. Distinguish domains by label, icon, and position only. |
| **Domain badge/chip** (small label like "D1 · Professional Practices") | Neutral chip: `bg-slate-100 text-slate-700 border-slate-200`. Optionally a tiny monochrome icon. |
| **Accidentally coincident with proficiency** (e.g., a "weak D1 skill" got `d1-peach` because peach was D1's color) | Use the proficiency-tier swap below — read context to determine the tier from accuracy. |
| **Pure decoration** (background gradients, accent flourishes) | Remove. CC is restrained — no decorative color. |

##### Proficiency-tier tokens (NEW — replaces domain coloring for skill chips)

Tied to the canonical thresholds in [`src/utils/skillProficiency.ts`](../../src/utils/skillProficiency.ts). Open the PR #9 mockup at `public/mockup-cognitive-clarity.html` to confirm exact shades before applying.

| Proficiency tier | Threshold | Background | Text | Border | Notes |
|---|---|---|---|---|---|
| **Demonstrating** | ≥ 0.80 | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | CC mockup uses soft green |
| **Approaching** | 0.60 – 0.79 | `bg-amber-50` | `text-amber-700` | `border-amber-200` | CC mockup uses soft amber |
| **Emerging** | < 0.60 | `bg-orange-50` | `text-orange-700` | `border-orange-200` | CC mockup's "peach" tone (orange, not yellow/amber) |
| **Not started** | 0 attempts | `bg-slate-50` | `text-slate-500` | `border-slate-200` | Neutral |

**Verify these shades against `public/mockup-cognitive-clarity.html` before applying.** If `PROFICIENCY_META` in `src/utils/skillProficiency.ts` already exports color tokens, use those instead — they're the canonical source per CLAUDE.md.

##### General rule

**Do not apply mechanical swaps blindly.** Each component has its own context — a `bg-navy-800` might be a `.stat-card` that should stay dark (CC `.stat-card` is `bg-navy-900/80` — kept dark deliberately). Read each component's JSX to understand intent before swapping.

#### Phase 3c: Suggested order (commit per group)

1. **Login/marketing surface** — LoginScreen.tsx → biggest visual impact, easiest to verify
2. **Dashboard + practice core** — DashboardHome, PracticeSession, QuestionCard, DiagnosticFeedback, AdaptiveDiagnostic
3. **Study guide cluster** — StudyPlanCard, StudyPlanViewer, StudyConstraintsForm, StudyModesSection
4. **Tutor cluster** — TutorChatPage, TutorEmptyState, TutorMessageBubble, QuizQuestionBubble, ArtifactCard
5. **Learning path cluster** — LearningPathNodeMap, ModuleLessonViewer, ModuleSnippetCard, 5 ModuleInteractives, GlossaryPage
6. **Misc** — HelpFAQ, StudyNotebookPage, SkillHelpDrawer, ExplanationPanel, ResultsDashboard, ScreenerResults

After each group: visual checkpoint + typecheck + lint + build.

---

### Phase 4 — Verification

#### Build gates (must pass)
- `npm run scan:types`
- `npm run lint`
- `npm run build`
- `npm test`

#### Visual gates

The user's CLAUDE.md mandates `npm run dev:netlify` (port 8888) for visual verification because the diagnostic flow needs Netlify functions:
```bash
npm run dev:netlify
```

Walk every screen the redesign touched:
- LoginScreen — entry/boot/hero/auth subscreens (confirm form accessibility attrs still work)
- DashboardHome
- AdaptiveDiagnostic + DiagnosticFeedback + QuestionCard — diagnostic happy path
- PracticeSession
- ResultsDashboard + ScreenerResults
- StudyPlanCard + StudyPlanViewer + StudyConstraintsForm
- TutorChatPage + TutorEmptyState + TutorMessageBubble + QuizQuestionBubble + ArtifactCard
- LearningPathNodeMap + ModuleLessonViewer + ModuleSnippetCard + 5 ModuleInteractives
- GlossaryPage + HelpFAQ + StudyNotebookPage + SkillHelpDrawer + ExplanationPanel
- StudyModesSection
- AdminDashboard

#### Functional regression checks (must work)
1. Cross-device diagnostic resume — sign in on browser A, partially answer, sign in on B, confirm resume (#24)
2. Orphan-user error banner — trigger orphan flow, confirm banner (#25)
3. Form autofill — confirm browser autocomplete works on login (#24 accessibility)
4. Admin access for clebronrivera@gmail.com — confirm still works (preserved from #14)
5. Diagnostic miss recording — answer a diagnostic question wrong, confirm `wrong_count` increments in `practice_missed_questions` (preserved from #14, depends on migration 0022)
6. Tutor grounding rail — open AI Tutor, confirm side panel shows artifacts/quiz count (preserved from #14)

---

### Phase 5 — Docs & memory

Per `CLAUDE.md`, update `docs/HOW_THE_APP_WORKS.md` if any user-facing copy referenced navy/atelier/editorial/serif visuals.

Update user memory:
- `/Users/lebron/.claude/projects/-Users-lebron-Documents-PraxisMakesPerfect/memory/project_ui_redesign.md` — append entry dated `2026-05-XX` noting Cognitive Clarity restoration via forward redesign (not revert)
- Refresh `MEMORY.md` index line

---

### Phase 6 — PR

```bash
git push -u origin feat/restore-cognitive-clarity
gh pr create --title "Restore Cognitive Clarity aesthetic via forward redesign" --body "..."
```

PR body should include:
- Summary explaining this is a forward redesign, not a revert, and why
- Link to this handoff doc
- Functional features preserved (link #14/#16/#24/#25)
- Visual diff (screenshots from `visual-diff/before/` vs new captures)
- Test plan checklist
- Known followups (TermsOfService/PrivacyPolicy font-serif review, mockup file cleanup)

---

## 6. File inventory

### Component files PR #14 touched (27 components + 2 hooks + config)

```
src/components/AdaptiveDiagnostic.tsx
src/components/ArtifactCard.tsx
src/components/DashboardHome.tsx
src/components/DiagnosticFeedback.tsx
src/components/ExplanationPanel.tsx
src/components/GlossaryPage.tsx
src/components/HelpFAQ.tsx
src/components/LearningPathNodeMap.tsx
src/components/LoginScreen.tsx
src/components/ModuleInteractives/CardFlip.tsx
src/components/ModuleInteractives/ClickSelector.tsx
src/components/ModuleInteractives/DragToOrder.tsx
src/components/ModuleInteractives/ScenarioSorter.tsx
src/components/ModuleInteractives/TermMatcher.tsx
src/components/ModuleLessonViewer.tsx
src/components/ModuleSnippetCard.tsx
src/components/PracticeSession.tsx
src/components/QuestionCard.tsx
src/components/QuizQuestionBubble.tsx
src/components/ResultsDashboard.tsx
src/components/SkillHelpDrawer.tsx
src/components/StudyConstraintsForm.tsx
src/components/StudyModesSection.tsx
src/components/StudyNotebookPage.tsx
src/components/StudyPlanCard.tsx
src/components/StudyPlanViewer.tsx
src/components/TutorChatPage.tsx
src/components/TutorEmptyState.tsx
src/components/TutorMessageBubble.tsx
src/config/admin.ts                         ← preserve admin emails
src/contexts/ContentContext.tsx             ← path changed from src/context/ (#21 rename)
src/data/learningModules.ts                 ← preserve schema extensions
src/hooks/useAssessmentFlow.ts              ← preserve all logic
src/hooks/useRedemptionRounds.ts            ← preserve recordDiagnosticMiss
src/index.css                               ← rewrite to CC
tailwind.config.js                          ← rewrite to CC
App.tsx                                     ← visual changes only (no logic touch)
CLAUDE.md                                   ← docs (visual notes only if any)
docs/HOW_THE_APP_WORKS.md                   ← docs
index.html                                  ← visual (font links, meta theme color)
```

### Reference helpers

```bash
# Pre-#14 baseline (Cognitive Clarity) — read-only reference, do not check out
git show 293d865:tailwind.config.js
git show 293d865:src/index.css
git show 293d865:src/components/LoginScreen.tsx

# What #14 did to a given file (read-only)
git diff 76e1eca^..76e1eca -- src/components/<file>.tsx

# What happened after #14
git log --oneline 76e1eca..HEAD -- src/components/<file>.tsx
```

---

## 7. Bailout protocol

If at any phase the work spirals (broken tests, broken visual regression, conflicts with #24/#25 logic you can't resolve):

```bash
git reset --hard pre-cognitive-clarity-revert    # back to clean HEAD on revert branch
# OR if you want to nuke the branch entirely:
git checkout main
git branch -D feat/restore-cognitive-clarity
git tag -d pre-cognitive-clarity-revert
```

The branch hasn't been pushed yet, so a hard reset is safe.

**Stop conditions:**
- Typecheck/lint/build fails and root cause is unclear → stop, ask user
- A functional regression check fails (e.g., diagnostic resume breaks) → stop, ask user
- A component's intent is unclear (which Atelier token maps to which CC token in context) → stop, ask user; don't guess
- Sweep affects more than ~5 components per commit → break it up, commit per logical group

---

## 8. Pre-flight checklist for the new agent

- [ ] Confirm you're on branch `feat/restore-cognitive-clarity` and HEAD is `0910363`
- [ ] Confirm tag `pre-cognitive-clarity-revert` exists locally (`git tag | grep pre-cognitive`)
- [ ] Read this entire handoff doc, especially §1 (design decision: proficiency-coded, NOT domain-coded)
- [ ] Read `CLAUDE.md` in repo root (project-specific rules, especially the mockup-first workflow note and the HOW_THE_APP_WORKS update rule)
- [ ] Open `public/mockup-cognitive-clarity.html` in a browser — this is the visual ground truth
- [ ] Read `src/utils/skillProficiency.ts` — canonical source for tier thresholds + any existing color tokens (`PROFICIENCY_META`)
- [ ] Confirm user's hard constraints in §2 above (admin email, migration 0022, etc.)
- [ ] Confirm the exact proficiency-tier shades in Phase 3b match the PR #9 mockup; ask the user if they don't
- [ ] If unsure about a token swap in context (domain identifier vs proficiency vs decoration), ask — don't guess
- [ ] Use TaskCreate to track phases as you execute

---

## 9. Quick start for the new agent

```bash
# Verify state
git branch --show-current               # → feat/restore-cognitive-clarity
git log -1 --oneline                    # → 0910363 fix(admin)…
git status                              # → clean (visual-diff/ untracked is OK)

# Phase 1a — start here
git show 293d865:tailwind.config.js     # study the target
# Edit tailwind.config.js per Phase 1a spec
npm run scan:types && npm run lint      # gate

# Phase 1b
git show 293d865:src/index.css > src/index.css
npm run scan:types && npm run lint && npm run build

# Phase 1c
git add tailwind.config.js src/index.css
git commit -m "feat(design): restore Cognitive Clarity tokens (tailwind + base CSS)"

# Phase 1d — visual check
npm run dev    # then open http://localhost:5173/
```

Then continue with Phase 2 (decorative JSX strip) and Phase 3 (component sweep).

---

## 10. Context from prior session (for the new agent)

- The user spent multiple turns aligning on this: Cognitive Clarity (PR #9) is the correct visual; Atelier (PR #14) was a drift that needs to be undone.
- The prior session approved a "Path A mechanical revert" plan, then discovered it would destroy ~33 unrelated files and regress major functionality. The plan was bailed out cleanly per the pre-agreed catastrophic-chaos protocol.
- The user is comfortable with autonomous execution but expects clear stops when blocked.
- The user values: clean PRs (not direct-to-main), pre-commit hooks honored (no `--no-verify`), real verification (not just typecheck — full `npm run dev:netlify` walkthrough).
- The user's email `clebronrivera@gmail.com` is the admin email and must remain in the allowlist.
- **2026-05-24 design decision (recorded in §1):** the user explicitly chose faithful Cognitive Clarity *including* its proficiency-coded color system. They do NOT want Atelier's domain-coloring scheme preserved. Domains lose their colors; only proficiency tiers get color.
- Today's date at handoff: 2026-05-24.

Good luck.
