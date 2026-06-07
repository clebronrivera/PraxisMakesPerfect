# Plan — React implementation of the Modules redesign (v2)

**Date:** 2026-06-07 · **Branch:** `explore/dashboard-redesign` · **Status:** plan only, no build yet.
**Approved visual:** `public/mockup-modules-redesign-v2.html` (Regular/Adaptive toggle, "Close these first" priority, group-by domain/weakness, recommended-bucket progress).

> Goal: replace the deficit-sorted snake **`LearningPathNodeMap`** with a student-friendly module browser, driven entirely by signals that already exist. No schema change required for v1 (one caveat — per-module completion, §5).

---

## 1 — Where it plugs in
- Current render site: **`src/components/StudyModesSection.tsx:552`** wraps `LearningPathNodeMap` with locked-state + Supabase progress loading. The new `ModulesBrowser` replaces that render. Keep the lock/loading wrapper.
- Opening a module already works: node click → `openLearningPathModule(skillId)` → `LearningPathModulePage`. Reuse it. Module cards resolve their `skillId` and call the same handler.

## 2 — Data sources (all already exist)
| Mockup element | Real signal | Source |
|---|---|---|
| Module → skill | `getSkillForModule(moduleId)` | `learningModules.ts:1346` (1 skill per module) |
| Skill → modules | `SKILL_MODULE_MAP` / `getModuleIdsForSkill` | `learningModules.ts:1259/1337` |
| Module → **domain** | module→skill→`domainId` | `getSkillForModule` + `progressTaxonomy` (**NOT** the `MOD-D{n}` id prefix — it doesn't match app domains; e.g. `CON-01` is App Domain 1 but uses `MOD-D2-*`) |
| Skill proficiency (Emerging/Approaching/Demonstrating) | `getSkillProficiency(score, attempts, weightedAccuracy)` over `profile.skillScores` | `skillProficiency.ts` (already blends screener/diagnostic/practice) |
| Module visited / time | `module_visit_sessions` (`visit_count`, `duration_seconds`), `learning_path_progress.last_visited_at` | `useModuleVisitTracking` |
| Interactive completion | `learning_path_progress.interactive_exercises_completed/_total`, `section_interactions.exercise_completed` | `useModuleVisitTracking` |
| Lesson viewed / LP status | `learning_path_progress.lessonViewed/status` | `useLearningPathSupabase` |
| Flagged-for-review | `global_scores.flaggedSkills`, `skill_scores[].recentHighConfidenceWrongCount` | `globalScoreCalculator`, `useProgressTracking` |
| Prereq weight (for priority) | `getPrereqDepth`, `prereqGraph` | `skillPrereqGraph` |

## 3 — Core selector: `useModuleCatalog(profile, lpProgress, visitData)`
A pure-ish hook returning a normalized list — the single place all view logic reads from:
```ts
interface ModuleCatalogEntry {
  moduleId: string; title: string;
  skillId: string; domainId: number; domainName: string;
  status: 'new' | 'in_progress' | 'reviewed';
  proficiency: SkillProficiencyLevel;   // emerging|approaching|proficient|unstarted
  scorePct: number | null;
  mastered: boolean;                     // proficiency === 'proficient' (≥80%)
  eligible: boolean;                     // !mastered → in play (gate, NOT the recommendation)
  flagged: boolean;
  examWeight: number;                    // SKILL_BLUEPRINT[skill].slots (× PRAXIS_WEIGHTS[domain] opt)
  gapToThreshold: number;                // max(0, 0.80 - score) — recoverable points to Demonstrating
  priorityScore: number;                 // examWeight × gapToThreshold × learnability  (NOT gap-only)
  estMinutes: number; activityCount: number;
}
```
**Derivation rules:**
- `status`: `new` = no `module_visit_sessions` row; `in_progress` = visited but lesson/interactives incomplete; `reviewed` = lesson viewed **and** the module's interactive sections completed (see §5 caveat).
- `eligible` (gate, not recommendation): `proficiency !== 'proficient'` (below Demonstrating). This only decides *whether a module is in play*.
- **`priorityScore = examWeight × gapToThreshold × learnability`** — THE key correction. Every runtime ranking today is **gap-only** and must NOT be copied: `LearningPathNodeMap` sorts by "overall deficit first", and `studyPlanPreprocessor.urgencyScore` is status+trend+accuracy with **no exam weight**. Blueprint-weight data exists but is unused at runtime (only in offline scripts `blueprint-alignment.ts` / `bottleneck-finder.ts`).
  - `examWeight`: **= `SKILL_BLUEPRINT[skill].slots` alone** (per-skill exam items, 1–2). RESOLVED empirically (§10): do **NOT** multiply by `PRAXIS_WEIGHTS[domain]`. `SKILL_BLUEPRINT.domain` is the **4 app domains** (slots sum to 32/24/20/24%); `PRAXIS_WEIGHTS` is keyed by the **10 Praxis blueprint domains** — indexing one with the other is a category error, not just double-counting. slots already operationalizes the blueprint at skill grain in the correct taxonomy. (Coarse — mostly 1–2; finer 10-domain weighting would need a skill→Praxis-domain map via `skillMetadata.domainId`, future.)
  - `gapToThreshold`: `max(0, 0.80 − score)` — **the ONLY place gap/proficiency enters the formula.**
  - `learnability` (0–1, **tractability ONLY — must not re-encode gap**): `trendFactor × prereqFactor`.
    - `trendFactor`: improving/flat = 1, declining < 1. Trend (momentum) is the *one* genuine tractability signal inside `urgencyScore` — take it, **discard the rest**. `urgencyScore` is a *priority* signal dominated by `status` + `accuracy` (both gap-like); reusing it wholesale would smuggle gap back in a 2nd/3rd time (the same error class this exercise exists to catch).
    - `prereqFactor`: prereqs met = 1, else < 1 (`prereqGraph`) — a tractability signal that is NOT in `urgencyScore`.
    - **Excluded on purpose:** *proximity-to-threshold* (that's `gapToThreshold` again), and `flagged`/`status`/`accuracy` (severity, not tractability — keep flagged as an optional separate additive bump, never inside learnability).

  For reference, the exact `urgencyScore` decomposition (pin before reuse): `statusWeight[status] + trendPenalty[trend] + (confidenceIssue?15:0) + (fragilityFlag?10:0) + (100−currentAccuracy)/10`. Only `trendPenalty[trend]` is tractability; the rest is gap/severity. (My earlier transcript described its inputs three inconsistent ways — this is the canonical one.)
  - **Honesty guard:** proficiency is a heuristic score (scripted-branch engine, not IRT). UI copy says "recommended / highest-impact", never a psychometric "mastery probability."
- `estMinutes` / `activityCount`: compute from `module.sections` — `activityCount = sections.filter(interactive).length`; `estMinutes` = heuristic (≈1 min per paragraph/anchor + 1 min per activity), rounded.

## 4 — View + grouping logic (persisted per user — §10.4)
- **Eligibility gate vs ranking — two distinct mechanisms (do not conflate):** `eligible` (`<80%`) decides *whether* a module is in play; `priorityScore` decides *order*. "Recommended" and "Close these first" are both just the top of the **single** ranked-eligible set — not separate threshold bands that can disagree.
- **Regular vs Adaptive:** Adaptive shows only `eligible` modules (mastered hidden) and the **recommended-bucket progress** = `reviewed && eligible` / `eligible` (the "3 / 11 · 27%" + "N mastered hidden"). Regular shows all; overall progress = `reviewed` / 58.
- **Group by Domain vs Weakness:** domain → group by app `domainId` (4 sections, each domain's gradient + "X reviewed / Y total"); weakness → flat list ranked by `priorityScore` desc (exam-weighted, not raw proficiency).
- **Priority ("Close these first")**: top **`min(3, count of genuinely-prioritized)`** by `priorityScore` — **unpadded**, so a near-mastered student doesn't see filler. Always shown; in Adaptive it's the lead.

## 5 — Key data decision (the one real gap)
**Per-module completion granularity (decided 2026-06-07: derive now).** `learning_path_progress` is **per skill**, but cards are **per module** (a skill has 1–4 modules). For v1, derive per-module status from `section_interactions`, computed once per selector pass (not per render):
- `reviewed` = every section `became_visible` **AND** every interactive section has `exercise_completed`. → "Reviewed" means **exposed to the material**, not a self-judged readiness.
- `in_progress` = visited but not all sections/interactives done.
- `new` = no `module_visit_sessions` row.

No migration, no backfill — existing users' history immediately yields correct state. **Future:** a learner-controlled self-assessment flag ("I've got this") is the more useful affordance for a study tool; when added, **seed it from this derived exposure value** so existing users aren't dumped into an empty state.

## 6 — Components
- `ModulesBrowser` (container: view/group state, renders the pieces) → replaces `LearningPathNodeMap` in `StudyModesSection`.
- `AdaptiveSummary` (the gap-closing strip, only in Adaptive).
- `PriorityModules` ("Close these first").
- `DomainSection` + `ModuleCard` (by-domain).
- `WeaknessList` + `ModuleRow` (by-weakness).
- `useModuleCatalog` selector (the data layer; unit-tested).

## 7 — Accessibility (carry the verify-agent findings into the build)
- Whole card = one `<button>`/`<a>` → opens the module; **no nested pseudo-CTA control** (the mockup's inner `→` becomes visual-only text, or the card is a link).
- `focus-visible` rings on all controls; segmented toggles are real buttons with `aria-pressed`.
- Collapsible domains = `<button aria-expanded>`.
- Status conveyed by **text + icon**, not color alone; muted meaningful text ≥ slate-500 (4.5:1).
- Real search `<input>` with a label; tap targets ≥ 44px on mobile.

## 8 — Build order
1. `useModuleCatalog` + unit tests (status/recommended/priority/counts) — pure logic first.
2. `ModuleCard` + `DomainSection`, wire into `StudyModesSection` behind a feature flag (Regular/by-domain only).
3. Adaptive view + `AdaptiveSummary` + recommended-bucket progress.
4. `PriorityModules` + `WeaknessList`.
5. Search + responsive/mobile polish.
6. Remove/retire `LearningPathNodeMap` once parity confirmed.

## 9 — Guardrails
- **Color guard:** any new component goes in `scripts/check-colors.mjs` `GUARDED`; cool tokens only (`docs/DESIGN_TOKENS.md`).
- **Never rename `MOD-*` / skill IDs.**
- **`docs/HOW_THE_APP_WORKS.md` MUST be updated** in the same change (module-browse behavior, the Adaptive view, and any unlock/recommended definition are all covered by the mandatory-update rule).
- Verify against the **real 58-module / 4-domain** counts when wiring (mockup counts are illustrative).
- This is the React phase — the mockup-first visual gate is already passed (`mockup-modules-redesign-v2.html`).

## 10 — Decisions (RESOLVED 2026-06-07 with owner)
1. **Recommended = ranking, not a threshold.** `<80%` is the eligibility gate only; the blueprint-weighted `priorityScore` does the recommending. (Collapses the old "threshold" + "priority count" into one mechanism.)
2. **Per-module completion:** derive from `section_interactions` now ("Reviewed = exposed", §5). Add a self-assessment flag later, seeded from the derived value.
3. **Priority count:** `min(3, genuinely-prioritized)` — unpadded; shrinks honestly near mastery.
4. **View persistence:** per-user, **server-side** (Supabase prefs row, not localStorage, since users switch devices); persist the last choice but **first-visit default = By weakness** (time-pays-off), not By domain (browse-the-curriculum). A localStorage stub is acceptable for step 1 to keep the selector pure.

### Resolved 2026-06-07 (post empirical check)
- **`examWeight` = `slots` alone.** Settled by summing `SKILL_BLUEPRINT` slots per domain vs `PRAXIS_WEIGHTS`: different taxonomies (4 app vs 10 Praxis), so `slots × PRAXIS_WEIGHTS[domain]` is a category error. slots is the per-skill blueprint signal in the right taxonomy.
- **`learnability` = `trendFactor × prereqFactor`** — tractability only. Proximity-to-threshold is excluded (= gap, already in `gapToThreshold`). `urgencyScore` is NOT reused wholesale (it's a gap-dominated priority signal); only its `trend` term feeds learnability.
- **Gap appears in exactly one term** (`gapToThreshold`). This is the invariant to hold when implementing — verify it in the selector's unit tests.

Nothing logic-affecting remains open; the formula's *constants* (e.g. how much `declining` or unmet-prereqs discounts learnability) are tuning, to be set against real student profiles during step 1.
