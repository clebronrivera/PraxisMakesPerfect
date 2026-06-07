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
  recommended: boolean;                  // !mastered  → gap-closing bucket
  flagged: boolean;
  priorityScore: number;                 // ranking, higher = more urgent
  estMinutes: number; activityCount: number;
}
```
**Derivation rules:**
- `status`: `new` = no `module_visit_sessions` row; `in_progress` = visited but lesson/interactives incomplete; `reviewed` = lesson viewed **and** the module's interactive sections completed (see §5 caveat).
- `mastered`/`recommended`: from skill proficiency. `recommended = proficiency !== 'proficient'`. (Confirm threshold with owner — default = below Demonstrating.)
- `priorityScore`: weight by (1) lower proficiency, (2) `flagged`, (3) prereq depth/# dependents from `prereqGraph`. Reuse the deficit-first ordering already in `LearningPathNodeMap` so behavior is consistent.
- `estMinutes` / `activityCount`: compute from `module.sections` — `activityCount = sections.filter(interactive).length`; `estMinutes` = heuristic (≈1 min per paragraph/anchor + 1 min per activity), rounded.

## 4 — View + grouping logic (component state, not persisted for v1)
- **Regular vs Adaptive:** Adaptive filters to `recommended` entries (mastered hidden) and computes the **recommended-bucket progress** = `reviewed && recommended` / `recommended` (the "3 / 11 · 27%" + "N mastered hidden"). Regular shows all, overall progress = `reviewed` / 58.
- **Group by Domain vs Weakness:** domain → group by `domainId` (4 sections, each domain's gradient + "X reviewed / Y total"); weakness → flat list sorted by `proficiency` asc then `priorityScore` desc.
- **Priority ("Close these first")**: top N by `priorityScore` (e.g. 2–3), always shown; in Adaptive it's the lead.

## 5 — Key data decision (the one real gap)
**Per-module completion granularity.** `learning_path_progress` is **per skill**, but cards are **per module** and a skill has 1–4 modules. For v1, derive per-module `reviewed` from `section_interactions` (all the module's sections `became_visible` + all its interactive sections `exercise_completed`). If that proves noisy, add a per-module completion flag (small migration) — **flag for owner**, don't assume. Until decided, `reviewed` can fall back to "skill mastered" as a coarse proxy.

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

## 10 — Open decisions for the owner
1. **"Recommended" threshold** — below Demonstrating (≥80%) = gap-closing? Or a different cutoff.
2. **Per-module completion** (§5) — derive from `section_interactions`, or add a per-module flag?
3. **Priority count** — how many in "Close these first" (2 / 3 / 5)?
4. **View persistence** — remember Regular/Adaptive + group choice per user, or reset each visit?
