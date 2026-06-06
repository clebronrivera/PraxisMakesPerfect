# Handoff — Indigo/Violet Re-theme (Stage 2)

> Self-contained continuation doc. The previous session finished **Stage 1** (a readability +
> a11y fix pass, now in PR #28) and produced an approved-pending mockup for **Stage 2** (re-theming
> the app from the amber "Cognitive Clarity" palette to the **indigo/violet gradient** scheme the
> user actually wants). This doc has everything needed to continue without prior context.

---

## TL;DR

- **Stage 1 (DONE, in review):** Fixed dark-navy/invisible-text bugs the original CC pass missed,
  across ~16 components + `index.css`, plus a11y (focus rings, aria labels). All on branch
  **`fix/cc-clarity-missed-components`** → **PR #28** (base `main`), `npm run check` green.
  These are **palette-agnostic readability fixes** — they stand regardless of the re-theme.
- **Stage 2 (THIS HANDOFF):** Re-theme the app's accent from **amber** (`#f59e0b`/`amber-*`) to the
  **violet→indigo gradient** language seen in the Tutorial walkthrough. Mockup built and awaiting
  the user's confirmation on 3 direction questions (below). **No React changes yet.**

## Why the re-theme

During a live walkthrough the user pointed at the **Tutorial/intro modal**
(`src/components/TutorialWalkthrough.tsx`) and said **its color scheme is the one they originally
wanted** — not the amber CC scheme the rest of the app uses. That scheme:
- Header gradients cycle: `violet-500→indigo-600`, `amber→orange`, `cyan→blue`, `emerald→teal`,
  `rose→pink`, `indigo→purple`, `sky→cyan`, `orange→red` (see `GRADIENT_CLASSES` in that file)
- Primary action / active state: `indigo-600` / `indigo-500`
- White card bodies, vibrant gradient hero panels, white iconography

(Also captured in memory: `project_preferred_design_scheme`.)

## The mockup (approval gate)

`public/mockup-indigo-violet-dashboard.html` — the Dashboard translated into violet→indigo while
keeping light editorial surfaces. **Mandatory: per `CLAUDE.md` (mockup-first rule) and repeated
past failures, get visual sign-off on the mockup direction BEFORE editing React components.** Serve
via `npm run dev` and open `localhost:5173/mockup-indigo-violet-dashboard.html`.

## OPEN — confirm with user before building (recommended defaults in bold)

1. **Primary accent:** does indigo/violet **fully replace amber** app-wide? (bold = yes) or keep amber somewhere?
2. **Gradients:** **one consistent violet→indigo for chrome**, rotating per-section gradients reserved for hero moments? or rotate everywhere?
3. **Surfaces:** **keep the light editorial surfaces** (white / `#f7f6f8`), swap only the accent? or also darken/saturate?

## Staged implementation plan (each = its own all-green commit)

- **2a — Tokens / shared chrome:** `src/index.css` (`.editorial-button-primary/secondary/dark/ghost`,
  `.editorial-sidebar-item-active`, `.eyebrow`, focus-ring color, `.editorial-progress-fill`
  gradient) + `tailwind.config.js`. Flips most chrome in one shot.
- **2b — Accent/domain colors:** `src/utils/domainColors.ts` (currently `#3B82F6/#10B981/#8B5CF6/#F59E0B`)
  and the **inline** `amber-*` / `#f59e0b` / `#d97706` usages, swept by area:
  dashboard → practice → study plan → tutor → glossary → results.
- **2c — Gradients & heroes:** readiness arc (`DashboardHome` `ReadinessArc`), progress fills,
  hero panels, any per-section gradient moments.

## Technical landscape (read before editing)

- **Colors are NOT centralized.** The accent is `amber-*` Tailwind classes + raw hex
  `#f59e0b`/`#d97706` scattered across ~50 components. Expect a wide sweep, not a one-line token
  change. `src/utils/domainColors.ts` only maps the 4 domain colors.
- **Shared button/chrome styles** live in `src/index.css` under `@layer components`
  (`.editorial-button-*`, `.editorial-surface*`, `.editorial-panel-dark` (#0f172a — the one
  intentionally-dark surface), `.eyebrow`, `.editorial-sidebar-item*`, `.editorial-progress-*`).
  Start here for maximum leverage.
- **Dead code — do NOT waste time on it:** components with a `variant` prop (`'atelier' | 'editorial'`)
  never receive `'atelier'` at any call site (all pass/default `'editorial'`). The `isAtelier`
  branches are unreachable. Files: `QuestionCard`, `ArtifactCard`, `ModuleLessonViewer`,
  `ModuleInteractives/*`. Ignore their dark styling.
- **Intentionally dark, leave unless re-theming deliberately:** `.editorial-panel-dark`, the
  `RedemptionMoon` card in `DashboardHome` (`#0f172a`), and the `LearningPathNodeMap` SVG
  "constellation" container (`bg-[rgba(10,22,40,0.5)]` + connectors designed for dark). Converting
  the node-map SVG to light is risky without visual verification — treat as its own sub-task.
- **`docs/HOW_THE_APP_WORKS.md` update rule** (`CLAUDE.md`): only triggers if user-facing copy/labels
  change. A pure color re-theme does NOT trigger it. Don't rename status/proficiency labels.
- **`LoginScreen.tsx` is sensitive** (`CLAUDE.md`) — it's the public auth page; change carefully,
  it already has error display + focus rings.

## Verification

- `npm run check` = types + lint + **153 tests**; must stay green after every commit (there's also a
  pre-commit hook running types + lint).
- App is **auth-gated**; visual checks need a login. Run `npm run dev` (Vite :5173) for UI;
  `npm run dev:netlify` (:8888) only if you need study-plan generation / leaderboard functions.
- The Chrome extension can drive the live app for visual QA (the previous session did this). You
  **cannot enter the user's password** — hand login to the user.

## Artifacts from Stage 1

- `local/cc-redesign-gap-audit.md` — the original gap audit (which components, which bugs).
- `public/mockup-cc-gap-beforeafter.html` — before/after of the Stage 1 readability fixes.
- `public/mockup-indigo-violet-dashboard.html` — the Stage 2 re-theme mockup (this stage).
- PR #28 (branch `fix/cc-clarity-missed-components`) — Stage 1 fixes; merge gates the prod deploy.

## Recommended first move in the new chat

1. Read this doc + `local/cc-redesign-gap-audit.md` + skim `src/index.css` `@layer components`.
2. Confirm the 3 open direction questions with the user (don't assume).
3. Build/extend the mockup if the user wants more screens; get sign-off.
4. Implement 2a → 2b → 2c, `npm run check` + commit per stage, on a new branch
   (e.g. `feat/indigo-violet-retheme`) off `main` (after PR #28 merges) or off PR #28's branch.

---

## SESSION 2 UPDATE — 2026-05-31 (direction LOCKED, mockups built, NO code yet)

The 3 open direction questions are **resolved**. The user reviewed static mockups and locked the
visual direction. **No React changes were made** — this session was mockups + decisions only.
PR #28 is still OPEN/unmerged.

### Locked design direction — "brighter multi-gradient"
- **Density:** MAXIMAL / multi-gradient (NOT dialed-back). Gradients on sidebar nav tiles, the
  readiness hero (full-gradient panel, white content), every domain card, the priority focus card,
  stat accents, hero moments on every screen.
- **Domain palette (BRIGHTER set — deliberately NOT the current `domainColors.ts`):**
  - Professional Practices → **cyan→blue** (`from-cyan-500 to-blue-600`)
  - Student-Level Services → **emerald→teal** (`from-emerald-500 to-teal-600`)
  - Systems-Level Services → **rose→pink** (`from-rose-500 to-pink-600`)
  - Foundations → **amber→orange** (`from-amber-500 to-orange-600`)
  - ⚠️ This DIVERGES from `domainColors.ts` (blue/green/purple/amber). Implementation must decide:
    update `domainColors.ts` to the brighter set so charts/badges/results stay consistent app-wide.
- **Chrome / hero / primary action / active states:** **violet→indigo** (`from-violet-500 to-indigo-600`).
- **Surfaces:** KEEP light editorial (`#f7f6f8` page, white cards, `rounded-3xl`). Amber stays only
  as the Foundations domain hue — otherwise the amber CC accent is fully replaced.

### The Toolshed (explicit user ask — keep the CONCEPT, drop the old colors)
Origin: `git log -S "Toolshed"` → commit **76e1eca (2026-04-21)**, the dark-navy "atelier" design
(`DashboardHome.tsx` section #5, `FeatureTile`). User wants the **pattern**, NOT the atelier colors.
Keep ALL of these:
- The **name** "The Toolshed" + tagline "Every tool at hand".
- **Data-bearing tiles** (metric/chip on each tile): Fluency Drill = **NEW** chip; Vocab Quiz =
  **"38 terms"** count; Learning Path = **NEXT** chip + next-module name; Study Guide = **avg time**
  ("avg 9 min"); AI Tutor = **AI** chip.
- Each tile its own hue ("a spectrum, not a box of crayons") — render as gradient icon tiles on
  white cards in the brighter palette.
Also keep: **readiness-phase language** ("Readiness phase: Developing" — uses the Early/Developing/
Approaching/Ready readiness levels) shown as a hero mini-stat row, and **This Week** surfacing
**Study time + Accuracy** (plus Questions, Today's goal).

### Mockups built this session (all in `public/`, served by the mockup server, UNCOMMITTED)
- **`mockup-retheme-allscreens.html`** ← CANONICAL. 5 screens via top switcher: Dashboard
  (incl. the new Toolshed + readiness-phase row + This Week study-time), Practice, Study Plan,
  Progress, Full Report. This is the approved reference for implementation.
- `mockup-tutorial-gradients-dashboard.html` — original vibrant dashboard (superseded by allscreens).
- `mockup-dialed-real-colors.html` / `mockup-dialed-bright-colors.html` — the dialed-back comparison
  (NOT chosen; kept for reference).
- `mockup-compare.html` — side-by-side real-vs-bright (iframes).
- (historical atelier dashboard, Toolshed origin, was restored then deleted — re-restore anytime
  with `git show 76e1eca:public/mockup-dashboard-atelier.html` if you need it for reference.)
- (`mockup-indigo-violet-dashboard.html` — the very first single-violet dashboard; superseded.)

### Tooling fix (committed to working tree, uncommitted to git)
The preview/mockup server was broken: `.claude/launch.json` ("mockup" config) and
`.claude/mockup-server.cjs` both hardcoded a stale path from another checkout
(`/Users/lebron/Documents/Documents - Lebron's MacBook Pro/...`). Fixed to relative paths:
- launch.json → `"./.claude/mockup-server.cjs"`
- mockup-server.cjs → `ROOT = path.resolve(__dirname, '..', 'public')`, and `/` now aliases to
  `mockup-retheme-allscreens.html`.
Start with `preview_start("mockup")` (port 3033). NOTE: the server kept dropping between turns —
just restart it. Viewport scroll on the all-screens page is finicky; resize the viewport taller to
capture lower sections.

### Still OPEN for the next session
1. ~~**Version control:** UNCOMMITTED~~ — **DONE 2026-05-31 (session 3):** these artifacts had been
   left untracked and were swept into `stash@{0}` on a branch switch (nearly lost). Recovered from the
   stash's untracked-files commit (`9ff5e74`) and committed on branch `explore/dashboard-redesign`
   (`2730784` recovery; the 3-screen extension follows). They can't be silently lost again.
2. **PR #28 not merged** — still gates the branching decision (merge then branch off `main`, vs
   branch off #28). User leaned toward neither explicitly yet.
3. **`domainColors.ts` divergence** (see above) — decide whether to adopt the brighter set globally.
4. ~~Screens NOT yet mocked~~ — **DONE 2026-05-31 (session 3):** AI Tutor, Glossary, and Login are now
   mocked inside `mockup-retheme-allscreens.html` (now **8 screens** via the top switcher; Login is a
   full-bleed pre-auth screen with the Adaptive-Engine orb + 4 domain feeder nodes). **Awaiting user
   sign-off** on these 3 before coding those areas.
5. Then implement **2a → 2b → 2c** per the plan above. A pure color/Toolshed re-theme does NOT
   trigger the `HOW_THE_APP_WORKS.md` update rule (no copy/label/threshold changes) — but adding
   visible metrics to Toolshed tiles is cosmetic, also no doc trigger. Don't rename status labels.

### Memory updated
`project_preferred_design_scheme` memory now records the resolved direction (same facts as above).
