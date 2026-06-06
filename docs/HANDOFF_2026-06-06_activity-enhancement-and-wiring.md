# Handoff — Enhance, Re-wire & Instrument the Learning-Module Activities
**Date:** 2026-06-06 · **Repo:** Praxis Makes Perfect (NASP school-psychology exam prep) · **For:** a fresh agent session with no prior context.

> **Read this first.** You are picking this up cold. This sheet is self-contained: it tells you what the app is, what the activities are, how they're wired *today* (every claim is cited `file:line`), what's broken, and exactly what to build. Read Part 0 → Part 1 before touching code. Obey the project rules in `CLAUDE.md` (summarized in Part 6) — especially the **mockup-first rule** and the **`docs/HOW_THE_APP_WORKS.md` update rule**.

---

## Part 0 — Your mission (in one paragraph)

The app's learning modules contain 30 interactive activities (sorters, matchers, orderers, selectors, flip-cards). Today they are **decorative engagement widgets**: a student can complete them, but the result dead-ends in an engagement table and **never adjusts the student's proficiency, never feeds the misconception/distractor analytics, and never informs the live learning path.** Your job is to (1) **audit and fix the correctness** of every activity's answer key — including the multi-correct cases — (2) **tag every activity** to the right skill(s) and misconception cluster(s), (3) **re-wire activity results into the platform's performance + misconception pipeline** so that *every click* contributes to the student's overall performance and continuous-progress signal, and (4) **enhance the activities** with full UX/UI design freedom. Be creative; make them better, not just correct.

---

## Part 1 — What exists today (verified architecture)

### 1.1 Scale
- **45 skills** across 4 app domains (`src/utils/progressTaxonomy.ts`).
- **58 learning modules** (`src/data/learningModules.ts`), all IDs `MOD-D{1-10}-{seq}`. **Never rename or reorder module IDs** — they are stable linkage keys.
- **1,150 questions** (`src/data/questions.json`), each with rich per-distractor metadata (see 1.4).
- **30 interactive activities** live in 30 of the 58 modules. **28 modules have zero interactive content** — these are expansion candidates (see 1.6).

### 1.2 Section schema (the only legal building blocks)
Defined at the top of `src/data/learningModules.ts`. A module is `{ id, title, sections: ModuleSection[] }`. Section types:

| type | required fields |
|---|---|
| `paragraph` | `text` |
| `anchor` | `text` (+ optional `label`) — highlighted callout |
| `list` | `items: string[]` |
| `comparison` | `leftHeader`, `rightHeader`, `rows: {left,right}[]` |
| `visual` | `visualType: 'image'\|'diagram'`, `prompt?` |
| `interactive` | `interactiveType` + the fields that type needs (below) |

`interactiveType` ∈ `scenario-sorter` | `drag-to-order` | `term-matcher` | `click-selector` | `card-flip`.

| interactiveType | answer-bearing fields | count today |
|---|---|---:|
| `click-selector` | `options: {id,label,isCorrect?,explanation?}[]` | 10 |
| `scenario-sorter` | `scenarios: {id,text,category?}[]`, `categories: string[]` | 8 |
| `term-matcher` | `pairs: {term,definition}[]` | 5 |
| `drag-to-order` | `items: string[]` (correct order) | 4 |
| `card-flip` | `cards: {id,front,back}[]` | 3 |

### 1.3 How each activity is **scored** (renderer: `src/components/ModuleLessonViewer.tsx`)
This is where correctness lives. Read it carefully — several gotchas:

- **scenario-sorter** (`ModuleLessonViewer.tsx:246-275`): a scenario is correct only when the bucket label the student chose **starts with** the scenario's `category` key, case-insensitive: `cat.toUpperCase().startsWith(scenario.category.toUpperCase())` (`:261`). So the short `category` key on each scenario **must be a prefix of one of the `categories` display labels.** Mismatched keys silently score correct answers as wrong. **(This is the source of the bugs in 1.5.)**
- **drag-to-order** (`:277-296`): correct = student order equals the authored `items` order element-for-element (`:285`). So **the authored `items` array IS the answer key — it must be in the correct order.**
- **term-matcher** (`:298-316`): scored over `pairs`.
- **click-selector** (`:318-342`): supports **multiple correct answers** — it reads every option with `isCorrect: true` and builds `correctIds` (`:327-330`). Multi-select scoring already works in the renderer; today **0 of 10 click-selectors actually use multiple correct answers** (all single-answer). If you author multi-correct items, the engine supports them.
- **card-flip** (`:344-358`): scored over `cards`.

Each handler calls `onInteractiveComplete(index, { interactiveType, score, completed, attempts, data })`.

### 1.4 The misconception / distractor engine (the thing activities are NOT connected to)
Every MCQ in `questions.json` carries authored, structured error data:
- `distractor_misconception_{A..F}`, `distractor_error_type_{A..F}`, `distractor_skill_deficit_{A..F}`, `distractor_tier_{A..F}` — **3,430 authored misconception cells across 1,149/1,150 questions.**
- `error_cluster_tag` — a stable kebab-case cluster (e.g. `model-conflation`). **There are exactly 20 of these** (full list in `docs/cluster_ranking.csv`).
- `dominant_error_pattern`, `top_misconception_themes`, inline `moduleRefs[]` (per-question `{moduleId, moduleTitle, snippet}`, avg 2.6 each).

Runtime flow for **real questions** (not activities): a wrong answer in `PracticeSession.tsx` surfaces the picked distractor's misconception (`ExplanationPanel.tsx:67-76`, read off the raw question via fragile `as Record<string,unknown>` indexing) + the skill's module snippet (`ModuleSnippetCard.tsx`). The chosen letter is persisted to `responses.selected_answer` (`useProgressTracking.ts:570`, migration `0023`) and read back by the study-plan pipeline (`studyPlanService.ts:135 getDistractorSelected` → `studyPlanPreprocessor.ts`).

**Routing finding you must use (from the coverage audit):** `error_cluster_tag` **alone is too coarse to route** — each of the 20 tags spans 30-45 skills and 25-41 modules. The clean routing key is the **`(skill_id, error_cluster_tag)` pair**: 750 pairs, 90% map to exactly one module (median 100% concentration). Per-question `moduleRefs[]` already routes every question. See `docs/COVERAGE_MATRIX_2026-06-06.md` + `docs/coverage_matrix.csv`. **When you tag activities to misconceptions (Part 2.B), key on `(skill_id, cluster)`, not the cluster alone.**

### 1.5 The performance / progress engines (what "overall performance" means here)
- **Proficiency** is computed from the `responses` event log → skill scores. UI labels: Emerging / Approaching / Demonstrating (`src/utils/skillProficiency.ts`). Internal AI labels: unlearned / misconception / unstable / developing / near_mastery / mastered (`studyPlanPreprocessor.ts`).
- **Readiness** = 70% of the 45 skills at Demonstrating (≥80%) (`App.tsx`).
- **Redemption / quarantine** (`useRedemptionRounds.ts`, migration `0009`/`0013`): a question is quarantined after 3 total wrong OR 1 hint, cleared after 3 correct in redemption. **Currently applies to practice-by-skill, practice-by-domain, and learning-path mini-quiz — NOT to module activities.**
- **Live path** (planned, not built): `src/utils/livePath.ts` + `src/data/misconceptionModuleMap.ts` are to-create. See the redesign handoff for the build plan.

### 1.6 THE CORE GAP — activities are an engagement sidecar, disconnected from all of the above
Trace of what actually happens when a student completes an activity:

```
ModuleLessonViewer onInteractiveComplete
  → LearningPathModulePage.handleInteractiveComplete (LearningPathModulePage.tsx:360)
      → visitTracking.reportInteractiveComplete (useModuleVisitTracking.ts:278)
          → writes section_interactions.exercise_score / exercise_completed (migration 0005)
          → aggregates into learning_path_progress.total_interactive_score (avg) (useModuleVisitTracking.ts:222-236)
      → local React state completedInteractives (UI checkmarks only)
```

That is the **entire** downstream. Confirmed by grep: nothing reads `section_interactions` for scoring; activity results never touch `responses`, `skill_scores`, the redemption system, or any `distractor_*` / `error_cluster_tag` field. **So today: activities do not adjust proficiency, do not capture misconceptions, do not feed the live path, and do not affect readiness.** `SkillHelpDrawer.tsx` renders the same activities with the same dead-end wiring.

This is the gap your work closes.

---

## Part 2 — What to build (the actual work)

### A. Audit & fix every activity's answer key (correctness first)
1. **Fix the two known scoring bugs immediately** — scenario-sorter `category` keys that aren't prefixes of their `categories` labels, so correct sorts are scored wrong (`ModuleLessonViewer.tsx:261` rule):
   - **`MOD-D4-02`** — key `'NEG_REINF'` vs label `'NEGATIVE REINFORCEMENT (…)'`. Fix the key to `'NEGATIVE REINFORCEMENT'` (or make the label start with `NEG_REINF`).
   - **`MOD-D4-05`** — key `'NOT_BULLYING'` vs label `'NOT BULLYING (…)'`. Underscore vs space — fix to `'NOT BULLYING'`.
   - Then re-run the validator in Part 5 to prove 0 mismatches.
2. **Verify every activity of every type** against its renderer scoring rule (1.3). For `drag-to-order`, confirm `items` is in the *correct* order (it is the key). For `term-matcher`/`card-flip`, confirm pairings. For `click-selector`, confirm exactly the intended option(s) carry `isCorrect: true`.
3. **Handle multi-correct deliberately.** Where a concept legitimately has several right answers, author multiple `isCorrect: true` options (the renderer already scores these via `correctIds`). Make the `explanation` on each option teach *why* — correct options reinforce, incorrect options name the misconception.

### B. Tag every activity to skills + misconception clusters
Activities currently have no skill or misconception linkage of their own (the module's skill comes only from `SKILL_MODULE_MAP`). Add structured tags so an activity result can be attributed:
- Each interactive (or each option/scenario/pair within it) should resolve to a **`(skill_id, error_cluster_tag)`** — reuse the 20 existing clusters in `docs/cluster_ranking.csv`; **do not invent new free-text misconceptions.** Distractor options/scenarios should map to the cluster they represent, exactly mirroring the `distractor_*` model used for real questions (1.4).
- Prefer a typed, additive schema extension (the module/section interfaces already allow optional fields). Don't break the 28 plain modules.

### C. Re-wire results into the performance + misconception pipeline (the heart of the request)
Make activity completion a **first-class performance signal**, consistent with how real questions behave:
- When a student answers an activity item, capture **which wrong choice** they made and **which misconception cluster** it maps to — the activity analog of `selected_answer` + `distractor_misconception_*`.
- Feed that into the same machinery that real questions use: contribute to skill proficiency, and make repeated/2nd/3rd misses eligible for the **redemption/quarantine** flow (or a deliberate, documented variant for activities).
- Surface the misconception→module link after a wrong activity answer, the same way `ExplanationPanel` + `ModuleSnippetCard` do for practice (close the gap that this only renders in `PracticeSession` today).
- Route on `(skill_id, cluster)` per the finding in 1.4.
- **Decision to make explicit (ask the product owner):** should activity performance be weighted the same as graded practice, or as a softer "formative" signal? Default recommendation: lower weight than scored practice, but still moves proficiency and still captures misconceptions. Document whatever you choose.

### D. Telemetry — "every click monitored for continuous progress"
- Capture each interaction event (not just final score): selection, reorder, match, flip, attempt count, time-on-item, and the misconception cluster of any wrong choice. Extend `section_interactions` (migration 0005) or add a new table; persist via `useModuleVisitTracking`.
- Ensure the captured signal is **readable by the proficiency/live-path layer** (today nothing reads `section_interactions` for scoring — fix that).
- Keep it privacy-clean and consistent with existing event logging in `responses`.

### E. Enhance the experience (you have design freedom)
- Improve clarity, feedback, motion, accessibility, and instructional payoff of each activity. Better immediate feedback (why an answer is right/wrong, tied to the misconception), progress affordances, and satisfying completion states.
- You may introduce new interactive *variants* — but if you do, extend the `interactiveType` union **and** the renderer scoring in `ModuleLessonViewer.tsx` together, and add a validator rule. Don't ship a content shape the renderer can't score.
- Follow WCAG AA (there's a `design:accessibility-review` skill available).

---

## Part 3 — Suggested order of work
1. **A1 (fix the 2 scoring bugs)** + run validator → prove green. Lowest-risk, immediate correctness win.
2. **A2/A3 (full answer-key audit, multi-correct)** across all 30 activities.
3. **B (tagging schema)** — additive, typed, keyed on `(skill_id, cluster)`.
4. **C + D (wiring + telemetry)** — the big one; design the schema and the read path together. Probe the actual DB/MCP response shapes before building (don't assume).
5. **E (UX enhancement)** — build static mockups first (Part 6), get visual sign-off, then implement.
6. Backfill activities into some of the **28 empty modules** if scoped in.

---

## Part 4 — Inventory snapshot (so you can plan)
- Interactive activities: **30** total — `click-selector` 10, `scenario-sorter` 8, `term-matcher` 5, `drag-to-order` 4, `card-flip` 3.
- Modules with ≥1 activity: **30 / 58**. Modules with none: **28** (expansion candidates).
- Non-interactive sections: paragraph 112, anchor 51, comparison 18, list 11, visual 1.
- Known scoring bugs: **2** (`MOD-D4-02`, `MOD-D4-05`).
- Multi-correct click-selectors today: **0** (renderer supports them; content doesn't use them yet).
- Misconception clusters available for tagging: **20** (`docs/cluster_ranking.csv`).

---

## Part 5 — Verification / acceptance criteria
Definition of done:
- [ ] `npx tsc --noEmit -p tsconfig.json` exits 0.
- [ ] **0 scenario-sorter category-key/label mismatches** (validator below returns clean).
- [ ] Every activity's answer key verified against its renderer scoring rule; multi-correct items use multiple `isCorrect: true`.
- [ ] Every activity resolves to `(skill_id, error_cluster_tag)`; clusters are from the existing 20.
- [ ] A wrong activity answer (a) adjusts proficiency, (b) records the misconception cluster, (c) surfaces the misconception→module link, (d) is eligible for redemption per the documented policy.
- [ ] `section_interactions` (or successor) is actually **read** by the performance/live-path layer.
- [ ] `docs/HOW_THE_APP_WORKS.md` updated if any module behavior, counts, unlock logic, or activity-scoring behavior changed (mandatory — see Part 6).
- [ ] Verify with a subagent / second pass for high-stakes scoring logic.

**Drop-in validator for the scenario-sorter bug (run from repo root):**
```bash
python3 - <<'PY'
import re
src=open('src/data/learningModules.ts').read()
ids=[(m.start(),m.group(1)) for m in re.finditer(r"\n {4}id: '(MOD-[^']+)'",src)]
modof=lambda pos: next((mid for p,mid in reversed(ids) if p<=pos),'?')
bad=0
for m in re.finditer(r"interactiveType: 'scenario-sorter'.*?scenarios: \[(.*?)\],\s*categories: \[(.*?)\]", src, re.S):
    cats=re.findall(r"'([^']*)'", m.group(2))
    for k in set(re.findall(r"category: '([^']*)'", m.group(1))):
        if not any(c.upper().startswith(k.upper()) for c in cats):
            print("MISMATCH", modof(m.start()), repr(k), "vs", cats); bad+=1
print("violations:", bad)
PY
```

---

## Part 6 — Non-negotiable project rules (from `CLAUDE.md`)
- **Mockup-first for any UI redesign.** Build a standalone static HTML mockup (Tailwind CDN) in `public/`, view it at `localhost:5173/mockup-*.html`, walk every screen/state with the user for explicit visual approval **before** modifying React components. Do not jump from mockup to component surgery.
- **`docs/HOW_THE_APP_WORKS.md` is canonical and must be updated in the same change** whenever you alter: skill/module counts, status-label names/thresholds, proficiency or readiness levels, unlock conditions, or **anything about how activities are scored or how they affect progress.** This is mandatory, not optional.
- **Never rename or reorder `MOD-*` IDs** or skill IDs — they are stable linkage keys.
- Local dev: use `npm run dev:netlify` (port 8888), not raw `vite`, when anything server-side is involved.
- Supabase uses the new key format only (`sb_publishable_*` / `sb_secret_*`); never reintroduce `eyJ...` JWT keys or `auth.admin.*` calls.
- Study-plan generation is rate-limited (1 / 7 days) and runs as a Netlify Background Function.

---

## Part 7 — Key files & references
**Content & schema:** `src/data/learningModules.ts` (modules + section types + `SKILL_MODULE_MAP`).
**Renderer / scoring:** `src/components/ModuleLessonViewer.tsx` (all 5 interactive scorers).
**Wiring today:** `src/components/LearningPathModulePage.tsx` (`handleInteractiveComplete`), `src/hooks/useModuleVisitTracking.ts` (`reportInteractiveComplete` → `section_interactions` / `learning_path_progress`), `src/components/SkillHelpDrawer.tsx`.
**Misconception/distractor engine:** `src/data/questions.json`, `src/components/ExplanationPanel.tsx`, `src/components/ModuleSnippetCard.tsx`, `src/hooks/useProgressTracking.ts`, `src/services/studyPlanService.ts`, `src/utils/studyPlanPreprocessor.ts`.
**Performance / progress:** `src/utils/skillProficiency.ts`, `src/hooks/useRedemptionRounds.ts`, `src/App.tsx`.
**To-create (live path):** `src/data/misconceptionModuleMap.ts`, `src/utils/livePath.ts`.
**Supporting docs in this repo:** `docs/COVERAGE_MATRIX_2026-06-06.md`, `docs/coverage_matrix.csv`, `docs/cluster_ranking.csv`, the redesign/audit handoff, `docs/CONTENT_AUTHORING_HANDOFF.md`, `docs/DISTRACTOR_CLASSIFICATION_HANDOFF.md`.

---

*Everything in Parts 1, 4, and the bug list was verified by script against the repo on 2026-06-06. The (skill,cluster) routing finding and the 20-cluster space come from the coverage audit; reuse those artifacts rather than re-deriving them.*
