# Gap-Closer Execution Plan — Content vs. Code, Phased for Sequential Implementation

**Status:** Canonical execution plan. Supersedes the detailed spec in `gap-closer-integration-plan.md` for day-to-day sequencing.
**Created:** 2026-04-19
**Phase 0 decisions locked:** 2026-04-19 — see `docs/decisions/2026-04-skill-taxonomy-v2.md`. Taxonomy = 51 skills (6 new + 3 sub-concepts); existing users migrate with catch-up gating; screener = 55 primaries + adaptive fallback loop.
**Core principle:** Content always precedes the code that depends on it. No code edit goes live without the content deliverables that feed it already being complete and reviewed.

---

## The Two Tracks

### Track 1 — CONTENT (non-code deliverables)

Everything that's writing, deciding, researching, reviewing, or verifying. These live in `.md` files, `.json` staging docs, Google Docs, or review tickets. No TypeScript, no database, no build artifacts.

### Track 2 — CODE (codebase changes)

Everything that edits `.ts`, `.tsx`, `.sql`, `.toml`, or `package.json`. All code changes happen inside a feature branch (`feat/gap-closer-taxonomy`) and ship in reviewed PRs.

**Dependency rule:** Every code task has named content prerequisites listed explicitly. A code task cannot start until its content prerequisites are marked complete in the task tracker.

---

## Complete Content Deliverables List

| ID | Content Deliverable | Status | Blocks Code Task |
|----|---------------------|--------|------------------|
| **C0** | Phase 0 decisions signed off (skill vs. sub-concept; grandfathering; screener expansion) | ✅ **Complete 2026-04-19** | (was blocking all code tasks) |
| **C1** | 9 gap-closer .md modules drafted | ✅ **Complete** | (was blocking C2, C3, C4) |
| **C2** | `[VERIFY:]` citation checks resolved (RTI terminology, WISC-5 thresholds, reliability coefficients, DLPFC, Rorschach, SAMHSA, Fixsen timeframes) | Pending | K1 (publication) |
| **C3** | Skill metadata content staged — 6 new skills' worth of vocabulary lists, misconception prose, case archetypes, laws/frameworks (in `content-authoring/staging/skill-metadata-drafts.md`) | Pending | K3 (skill-metadata-v1.ts) |
| **C4** | Module section bodies — each of the 9 .md files reformatted into section-tagged JSON matching `LearningModule` schema, saved to `content-authoring/staging/module-sections.json` | Pending | K6 (learningModules.ts) |
| **C5** | Copy spec sheet — every hardcoded "45 skills" string with its replacement, saved to `content-authoring/staging/copy-updates.md` | Pending (blocked on C0) | K4 (hardcoded strings) |
| **C6** | HOW_THE_APP_WORKS.md draft with new numbers (saved as .draft.md so it doesn't ship until code does) | Pending (blocked on C0) | K12 (ship) |
| **C7a** | Question bank batch 1 — 30 items for MBH-06 + ACA-10 (Tier-1 priority skills) | Pending | K8a (seed batch 1) |
| **C7b** | Question bank batch 2 — 30 items for DBD-11 + DBD-12 | Pending | K8b (seed batch 2) |
| **C7c** | Question bank batch 3 — 30 items for RES-04 + SSV-09 | Pending | K8c (seed batch 3) |
| **C7d** | Question bank batch 4 — 9 items for 3 sub-concepts (LEG-05, LEG-06, DBD-13) | Pending | K8d (seed batch 4) |
| **C8** | Audit rerun document — pre/post coverage comparison, each of 9 ❌ gaps flipped to ✅ | Pending | K12 (ship) |
| **C9** | Release notes — user-facing messaging about the taxonomy expansion | Pending | K12 (ship) |
| **C11** | Catch-up diagnostic UX copy — dashboard banner, CTA, intro dialog, locked-skill tooltip, completion toast, admin banner (Decision 0.2-modified) | Pending | K13, K14 (catch-up flow + locked gating) |
| **C12** | Per-skill fallback prerequisite mapping — for each of 6 new skills, specifies what recall/foundational concepts the fallback questions should probe (Decision 0.3) | Pending (blocked on C3) | C7a–C7d (scopes fallback question authoring), K15 (adaptive loop verification) |

### Per-item specifications

- **C3** (skill metadata): Each of the 6 new skills needs roughly 15–25 vocabulary terms, 3–5 misconceptions in "Believing X when in fact Y" framing, 2–4 case archetypes distilled from the module's worked example, and 3–6 laws/frameworks. Pulls directly from the corresponding gap-closer .md. Estimated effort: ~4 hours for all 6 skills.
- **C4** (module sections): Mechanical reformatting — the .md headings already match the target schema. Estimated effort: ~2 hours total.
- **C5** (copy spec): One-pager with a two-column table: "Current copy" / "Replacement copy." Ships together in K4 to keep a grep-able audit trail. Estimated effort: ~1 hour.
- **C7** (questions, per Decision 0.3 adaptive-loop spec): Each skill now requires both primary-application items AND fallback-recall items. Per-skill target: minimum 3 primary + 3 fallback = 6 items (10+ each pool preferred). For 6 new top-level skills: **36 items minimum, 60+ recommended**. For 3 sub-concepts: 4 items each (2 primary + 2 fallback) = 12 items minimum. Total: **48–120 items** depending on pool depth. At ~20 min per item, this is **16–40 SME hours**. This is the critical-path content deliverable.
- **C11** (catch-up UX copy): Full UX copy spec for the catch-up diagnostic flow introduced by Decision 0.2-modified. Banner, CTA, dialog, tooltip, toast, admin banner. Estimated effort: ~2 hours.
- **C12** (fallback prerequisite map): For each of the 6 new skills, a table specifying what the fallback questions should probe at the recall/foundational level. Example — MBH-06 primary probes trauma-informed response scenario; fallback probes ACEs definition + SAMHSA 4 R's components. Blocks C7 authoring because fallback writers need to know what to target. Estimated effort: ~2 hours.

---

## Complete Code Tasks List

| ID | Code Task | Content Prerequisites | Touches Production |
|----|-----------|----------------------|---------------------|
| **K1** | Verify [VERIFY:] citations in already-written .md files | C2 | No (edits .md) |
| **K2** | Create feature branch `feat/gap-closer-taxonomy` | C0 | No |
| **K3a** | Add 6 new skills to `src/utils/progressTaxonomy.ts` | C0 | Yes (branch) |
| **K3b** | Add 6 new entries to `src/data/skillIdMap.ts` | C0, K3a | Yes (branch) |
| **K3c** | Add 6 new skill records to `src/data/skill-metadata-v1.ts` | C3, K3b | Yes (branch) |
| **K4** | Update hardcoded strings across 15 files | C0, C5, K3a | Yes (branch) |
| **K5** | Update `SKILL_BLUEPRINT` in `src/utils/assessment-builder.ts` | C0, K3a | Yes (branch) |
| **K6** | Add 9 `LearningModule` entries to `src/data/learningModules.ts` | C4, K3a | Yes (branch) |
| **K7** | Wire prerequisite graph for new modules | K6 | Yes (branch) |
| **K8a** | Seed question bank with MBH-06 + ACA-10 items | C7a, K3a | Yes (branch) |
| **K8b** | Seed question bank with DBD-11 + DBD-12 items | C7b, K3a | Yes (branch) |
| **K8c** | Seed question bank with RES-04 + SSV-09 items | C7c, K3a | Yes (branch) |
| **K8d** | Seed question bank with sub-concept items | C7d, K3a | Yes (branch) |
| **K9a** | Verify/update `useAdaptiveLearning.ts` reads from live taxonomy | K3a, K5 | Yes (branch) |
| **K9b** | Verify/update `studyPlanPreprocessor.ts` handles new skills | K3c | Yes (branch) |
| **K9c** | Dry-run study-plan generation for test user covering new skills | K9b, K8a | No (test) |
| **K10a** | Write Supabase migration `0023_taxonomy_v2_catchup.sql` — adds `taxonomy_v2_catchup_completed_at TIMESTAMPTZ NULL` column to user_progress | C0 | Yes (migration file) |
| **K10b** | Add taxonomy-v2 flag + app-layer readiness math branching (reads catchup timestamp to decide denominator) | C0, K10a | Yes (branch) |
| **K13** | Build catch-up diagnostic flow — scoped adaptive assessment over 6 new skills; sets timestamp on completion; triggers stat refresh | C11, K3a, K10a | Yes (branch) |
| **K14** | Implement locked-skill gating — readiness math, practice pool filters, taxonomy display | C11, K3a, K10a | Yes (branch) |
| **K15** | Verify or implement adaptive prerequisite loop in screener engine (primary→fallback routing) | C12, K3a | Yes (branch) |
| **K11** | QA sweep — 4 user paths (new v2, existing v1, upgrade v1→v2, admin) | K3–K10 complete | No (test) |
| **K12** | Merge branch, run migration, ship HOW_THE_APP_WORKS.md + README + audit-rerun doc | C6, C8, C9, K11 | Yes (production) |

---

## Sequential Phases — Content Gates Precede Code

Each phase is a coherent chunk of work with an explicit gate. You cannot enter a phase until the previous phase's gate is green.

### Phase α — Decisions and Verifications [CONTENT-ONLY]

**Gate to exit:** C0 ✅ and C2 both complete. **C0 complete as of 2026-04-19.**

| Task | Track | Depends on | Status |
|------|-------|-----------|--------|
| C0 — Sign off Phase 0 decisions | Content | — | ✅ Complete |
| C2 — Resolve [VERIFY:] citations | Content | C1 ✅ | Available now |

C0 output: `docs/decisions/2026-04-skill-taxonomy-v2.md` with decisions locked.
C2 output: `.md` modules with `[VERIFY:]` flags cleared.

**Why this phase exists:** Every subsequent task depends on knowing the skill count (45 vs. 51 vs. 54), the grandfathering approach, and the citation-verified content. With C0 locked, only C2 remains to clear the phase gate.

---

### Phase β — Content Staging [CONTENT-HEAVY, CODE-LIGHT]

**Gate to exit:** C3, C4, C5, C6, C11, C12 drafted and reviewed. K2 (branch created) is the only code task.

| Task | Track | Depends on |
|------|-------|-----------|
| C3 — Stage skill metadata for 6 new skills | Content | α complete |
| C4 — Stage module section JSON for 9 modules | Content | α complete |
| C5 — Stage copy-update spec sheet | Content | α complete |
| C6 — Draft HOW_THE_APP_WORKS.md changes (saved as .draft.md) | Content | α complete |
| **C11 — Catch-up diagnostic UX copy (from Decision 0.2-modified)** | Content | α complete |
| **C12 — Per-skill fallback prerequisite map (from Decision 0.3)** | Content | α complete, C3 (needs vocabulary staged first) |
| K2 — Create feature branch | Code | α complete |

Staged content lives in `content-authoring/staging/` as human-reviewable Markdown and JSON. No TypeScript yet. The branch exists so Phase γ can land PRs, but nothing on it changes production.

**Why this phase exists:** The code in Phase γ, δ, and θ is mechanical translation of these staging docs into TypeScript. Separating them means the content can be reviewed without reading code, and the code PRs become trivial to review.

**New in Phase β since decisions locked:** C11 and C12 were added because Decisions 0.2-modified and 0.3 created new content prerequisites — the catch-up flow needs UX copy, and the fallback question authoring needs a prerequisite map.

---

### Phase γ — Core Taxonomy in Code [CODE, gated by Phase β content]

**Gate to exit:** K3a, K3b, K3c, K4, K5 all merged to the feature branch with CI passing.

| Task | Track | Depends on | Content source |
|------|-------|-----------|----------------|
| K3a — Add 6 new skills + 3 sub-concepts to progressTaxonomy.ts (D1=15, D2=14, D3=9, D4=13) | Code | β complete | C0 decision memo §0.1 |
| K3b — Add mappings to skillIdMap.ts (each new skill needs progress→metadata link) | Code | K3a, **C3** | C3 staging doc |
| K3c — Add records to skill-metadata-v1.ts (vocabulary, misconceptions, archetypes, frameworks) | Code | K3b, **C3** | C3 staging doc |
| K4 — Update hardcoded strings ("45 skills" → "51 skills"; readiness target 32 → 36) across 15 files | Code | K3a, **C5** | C5 copy spec |
| K5 — Update SKILL_BLUEPRINT in assessment-builder.ts (per-skill slots + recallTarget for new entries) | Code | K3a | C0 decision memo §0.3 |

At the end of Phase γ, the taxonomy knows about 51 skills everywhere, but users can't yet *do* anything with the 6 new skills because there are no modules and no questions. K5 lays the groundwork for Phase θ's K15 by adding screener slots — but the primary→fallback adaptive loop itself is implemented/verified in θ once the question bank exists.

**Why this phase exists:** Taxonomy is the foundation. Everything downstream (modules, questions, study plans, assessments) reads from it. Ship taxonomy first as a standalone internally-consistent change.

---

### Phase δ — Module Layer in Code [CODE, gated by Phase β content]

**Gate to exit:** K6, K7 merged; authenticated user can read new modules in the Learning Path UI.

| Task | Track | Depends on | Content source |
|------|-------|-----------|----------------|
| K6 — Add LearningModule entries | Code | γ complete, **C4** | C4 staging doc |
| K7 — Wire prerequisite graph | Code | K6 | C4 |

At end of Phase δ, the 9 modules are reachable, readable, and connected to their prerequisites. Users can learn the content even without questions yet.

**This is the Minimum Viable Release gate:** after Phase δ merges, we *could* ship to production with everything the user needs to study the 9 gap areas, even before the question bank expands. Decision on whether to ship at this point or wait for Phase ζ belongs to the user.

---

### Phase ε — Question Authoring [CONTENT, runs in parallel with γ + δ]

**Gate to exit:** C7a, C7b, C7c, C7d complete and reviewed. **C12 must be complete before any C7 batch starts.**

| Task | Track | Depends on |
|------|-------|-----------|
| C7a — Write primary + fallback items for MBH-06 + ACA-10 (min 6 items per skill; 10+ recommended) | Content | α complete, **C12** |
| C7b — Write primary + fallback items for DBD-11 + DBD-12 | Content | α complete, **C12** |
| C7c — Write primary + fallback items for RES-04 + SSV-09 | Content | α complete, **C12** |
| C7d — Write primary + fallback items for sub-concepts (LEG-05, LEG-06, DBD-13) — 4 items per sub-concept | Content | α complete, **C12** |

This is the critical-path content phase. Batches ship as they complete — do not wait for the full bank before starting Phase ζ.

**Per-skill authoring spec (locked by Decision 0.3 adaptive loop):**

- **Primary-application items:** test integrated application of the skill. The 55 screener primaries are drawn from this pool.
- **Fallback-recall items:** probe the recall / foundational prerequisite concepts behind the primary, per the per-skill map in **C12**. Served by the adaptive engine when a student misses the primary.
- **Minimum per new top-level skill:** 3 primary + 3 fallback = **6 items**. Recommended: 10+ per pool.
- **Minimum per sub-concept:** 2 primary + 2 fallback = **4 items**.
- **Item schema:** each item must carry a `cognitiveTier: 'primary-application' | 'fallback-recall'` field so the adaptive engine can route it correctly (K15 verifies this).

**Quality gate per batch:** SME review for content accuracy; distractor quality review (are wrong answers plausible and diagnostic?); psychometric sanity check (option length, keyword overlap); **cognitive-tier tagging audit** — each item labeled correctly primary vs. fallback and matches the C12 prerequisite map.

**Why this phase is separate:** Question writing is a different skill than module writing. Batches let us start Phase ζ (integration) earlier and surface any schema or tagging issues before the full bank is in. The adaptive-loop requirement (Decision 0.3) doubles the item count per skill, making this the longest content chain — starting it in parallel with Phase β/γ is essential.

---

### Phase ζ — Question Bank Integration [CODE, gated batch-by-batch by Phase ε]

**Gate to exit:** K8a–K8d merged; questions visible in practice mode for their target skills.

| Task | Track | Depends on | Content source |
|------|-------|-----------|----------------|
| K8a — Seed batch 1 | Code | γ complete, **C7a** | C7a |
| K8b — Seed batch 2 | Code | γ complete, **C7b** | C7b |
| K8c — Seed batch 3 | Code | γ complete, **C7c** | C7c |
| K8d — Seed sub-concept batch | Code | γ complete, **C7d** | C7d |

Each K8x lands as its C7x completes. No reason to gate on full bank completion.

---

### Phase η — Pipeline Verification [CODE, gated by γ + δ + at least ζ first batch]

**Gate to exit:** K9a, K9b, K9c pass.

| Task | Track | Depends on |
|------|-------|-----------|
| K9a — Verify useAdaptiveLearning.ts | Code | γ complete |
| K9b — Verify studyPlanPreprocessor.ts | Code | γ complete |
| K9c — Dry-run study plan generation | Code | K9a, K9b, at least K8a |

Discovers anything hardcoded that wasn't caught in the grep audit. Bugs found here route back to specific code files; no content changes needed.

---

### Phase θ — Migration, Catch-Up Flow, and Adaptive Loop [CODE, gated by locked Decisions 0.2 and 0.3]

**Gate to exit:** K10a applied to a dev Supabase branch; K10b, K13, K14, K15 shipped to the feature branch with CI passing.

| Task | Track | Depends on | Content source |
|------|-------|-----------|----------------|
| K10a — Supabase migration `0023_taxonomy_v2_catchup.sql` — adds `taxonomy_v2_catchup_completed_at TIMESTAMPTZ NULL` to user_progress | Code | C0 | C0 |
| K10b — App-layer readiness math branching (reads catchup timestamp to decide denominator: 45 if null, 51 if set) | Code | K10a | C0 |
| **K13 — Build catch-up diagnostic flow** — scoped adaptive assessment over 6 new skills (~6–18 questions); sets `taxonomy_v2_catchup_completed_at` on completion; triggers stat refresh | Code | K10a, **C11**, K3a, K15 | C11 UX copy |
| **K14 — Implement locked-skill gating** — until the catch-up timestamp is set, the 6 new skills are excluded from readiness denominator, practice pools, and progress aggregates; taxonomy UI shows lock badge + CTA | Code | K10a, **C11**, K3a | C11 UX copy |
| **K15 — Verify or implement adaptive prerequisite loop in screener engine** — on primary miss, serve a matching fallback-recall item; on sustained miss, extend with additional follow-ups per Decision 0.3 | Code | **C12**, K3a, K8 batches landed | C12 prerequisite map |

**Why Phase θ now has four code tasks instead of three:**

- **Decision 0.2 (modified)** rejected the pre-existing grandfathering proposal (`skill_taxonomy_version` column approach). Instead: everyone migrates immediately, but the 6 new skills are *locked* until the user completes a catch-up diagnostic. This requires K13 (the flow itself), K14 (the gating in readiness math + practice pools), and a TIMESTAMPTZ column for completion tracking.
- **Decision 0.3** introduced the primary→fallback adaptive loop in the screener. K15 verifies the screener engine honors the `cognitiveTier` tag and routes correctly when a primary is missed.

**QA path for θ:** new v2 user path (catch-up prompt never appears — all 51 skills available immediately); existing v1 user path (catch-up banner visible on login, can launch flow from dashboard, completion unlocks 6 new skills and refreshes stats); admin path (admin banner shows count of users who haven't completed catch-up).

---

### Phase ι — QA and Audit [BOTH TRACKS]

**Gate to exit:** All four QA paths green; audit-rerun document confirms 9/9 gaps closed.

| Task | Track | Depends on |
|------|-------|-----------|
| K11 — Full QA sweep | Code | γ, δ, ζ, η, θ all complete |
| C8 — Audit rerun document produced | Content | γ, δ complete (not dependent on ζ) |

---

### Phase κ — Release [CONTENT finalization + CODE ship]

**Gate to exit:** Production deploy tagged.

| Task | Track | Depends on |
|------|-------|-----------|
| C6 — Finalize HOW_THE_APP_WORKS.md from draft | Content | ι complete |
| C9 — Write release notes | Content | ι complete |
| K12 — Merge branch, run migration, deploy | Code | ι complete, C6 + C9 ready |

---

## Phase Gate Matrix

Visual summary of gating — which deliverable must be complete before the next phase starts. Updated to reflect locked Decisions 0.1 (B), 0.2 (modified A), 0.3 (A + adaptive loop).

```
α (Decisions + Verify)
  │ gate: C0 ✅ + C2 done
  ▼
β (Content Staging) ────────────────┐
  │ gate: C3 + C4 + C5 + C6 +        │
  │       C11 + C12 drafted;         │
  │       K2 branch created          │
  ▼                                  │
γ (Core Taxonomy Code) ← needs C3 + C5 from β
  │ gate: K3a + K3b + K3c + K4 + K5  │
  ▼                                  │
δ (Module Layer Code) ← needs C4 from β
  │ gate: K6 + K7                    │  ─────── MVR boundary (could ship here, w/o screener changes)
  │                                  │
  │                                  ▼
  │                           ε (Question Authoring) — starts when β complete (needs C12)
  │                                  │ batches C7a → C7b → C7c → C7d
  │                                  │ each item tagged primary-application | fallback-recall
  │                                  ▼
  │                           ζ (Question Integration)
  │                                  │ K8a as soon as C7a done, etc.
  │                                  │
  ▼                                  ▼
η (Pipeline Verification) ← needs γ + at least ζ first batch
  │ gate: K9a + K9b + K9c green
  ▼
θ (Migration + Catch-Up + Adaptive Loop) ← needs C11 + C12 from β; K8 batches from ζ
  │ gate: K10a applied; K10b + K13 + K14 + K15 green
  │       → catch-up diagnostic flow live in branch
  │       → locked-skill gating live in branch
  │       → screener primary→fallback routing verified
  ▼
ι (QA + Audit Rerun) ← needs γ + δ + ζ + η + θ
  │ gate: K11 4-path QA green + C8 produced
  │       (paths: new-v2 / existing-v1 / v1→v2 catch-up / admin)
  ▼
κ (Release) ← needs C6 finalized + C9 finalized
  │ ship: K12 (merge + migration + docs)
  ▼
DONE
```

**Key changes since Phase 0 decisions locked:**

- Phase β gate now includes C11 and C12 (added by Decisions 0.2-modified and 0.3).
- Phase ε task descriptions now require primary + fallback item authoring, gated by C12.
- Phase θ replaces single "feature flag" task with four tasks: K10a (timestamp column migration), K10b (readiness math branch), K13 (catch-up flow), K14 (locked-skill gating), K15 (adaptive loop verification).
- Phase ι QA matrix expanded to 4 paths to cover the catch-up flow.

---

## What to Do This Week — Concrete Starting Moves

**C0 is signed off (2026-04-19). We are now in Phase α tail + Phase β kickoff. The only remaining Phase α task is C2.**

### Day 1 (today)

1. **[Claude, code]** Create feature branch `feat/gap-closer-taxonomy` (K2) and the staging directory `content-authoring/staging/`.
2. **[Claude, content]** Begin C2 — work through the 7 `[VERIFY:]` flags across the 9 gap-closer modules. Update .md files and commit.

### Day 2–3

3. **[Claude, content]** Draft C3 — skill metadata for the 6 new skills (MBH-06, ACA-10, DBD-11, DBD-12, RES-04, SSV-09) + 3 sub-concepts (LEG-05, LEG-06, DBD-13), pulled from the gap-closer .md files into `content-authoring/staging/skill-metadata-drafts.md`. User reviews.
4. **[Claude, content]** Draft C4 — module section JSON for all 9 modules in `content-authoring/staging/module-sections.json`. User reviews.
5. **[Claude, content]** Draft C5 — copy-update spec in `content-authoring/staging/copy-updates.md`, including every "45 skills" → "51 skills" replacement and the readiness target change (32 → 36).
6. **[Claude, content]** Draft C6 — `docs/HOW_THE_APP_WORKS.draft.md` with new numbers. Held until κ.
7. **[Claude, content]** Draft **C11** — catch-up diagnostic UX copy (banner, CTA, dialog, tooltip, toast, admin banner) into `content-authoring/staging/catchup-copy.md`.

### Day 4

8. **[Claude, content]** Draft **C12** — per-skill fallback prerequisite map. For each of the 6 new skills, table out what foundational concepts the fallback-recall questions should probe (derived from C3 vocabulary lists). Save as `content-authoring/staging/fallback-prerequisite-map.md`.

### Day 5

9. **Gate check:** Is Phase β gate green? (C3, C4, C5, C6, C11, C12 drafts approved; C2 verifications done.) If yes, Phases γ and ε both start Day 6 in parallel.

### Days 6–10 — Parallel work

- **Phase γ (code)** — K3a + K3b + K3c + K4 + K5 TypeScript edits happen, all mechanical translations of the staged content. Lands as reviewable PRs on the feature branch.
- **Phase ε kickoff (content)** — first C7 batch begins. Now that C12 is staged, fallback item targets are known. **Batch 1 target: 20+ items (10+ primary + 10+ fallback) across MBH-06 + ACA-10.**

### Parallel, critical path

**[SME — user or contractor]** Phase ε is the longest chain. Each new top-level skill now requires 6–20+ items (vs. 15 under the old non-adaptive spec). Batches 2–4 should be scheduled back-to-back to avoid blocking Phase ζ and, downstream, Phase θ's K15 adaptive-loop verification.

---

## Why This Structure Works

1. **Content-first means no blocked code.** Every time a code task starts, its content prerequisites are already staged and reviewed. No mid-PR "wait, what should this misconception copy say?"
2. **Staging docs make code review trivial.** A reviewer can compare `staging/skill-metadata-drafts.md` to the TypeScript diff in one screen and confirm the translation is faithful.
3. **Question authoring runs in parallel without blocking everything else.** Phase ε is the longest chain — under the locked Decision 0.3 spec it's now 48–120 items with both primary-application and fallback-recall pools — and it sits beside the taxonomy work, not in front of it.
4. **MVR ships without the catch-up flow.** Phases γ + δ alone give users a readable, navigable taxonomy expansion. The catch-up diagnostic, locked-skill gating, and adaptive-loop verification are all isolated in Phase θ, so γ + δ can land standalone.
5. **Catch-up complexity is isolated to Phase θ.** Decision 0.2-modified introduced timestamp-based gating (K10a/b + K13 + K14) and Decision 0.3 introduced primary→fallback routing (K15). All four sit in θ — γ, δ, ε, ζ remain mechanical translations of staged content.
6. **Tagging schema work happens once, in ε.** The `cognitiveTier` field gets locked into items at authoring time, so K15's verification job in θ becomes "does the engine respect the tag?" rather than "let's go re-tag 100 items."

---

## Task-Tracker Commitments

Each of the Content and Code items above should become a task in the tracker with explicit `blockedBy` links. Suggested initial creation order:

1. Create all C-series and K-series tasks.
2. Mark C1 as complete (already done).
3. Add `blockedBy` for every task per the dependency columns above.
4. Phase α work (C0, C2) becomes the available pool on Day 1.

---

## Critical Reminders

- **Do not edit `src/` files before Phase γ.** All Phase β work lands in `content-authoring/staging/` or `docs/`.
- **Do not ship HOW_THE_APP_WORKS.md before κ.** Keep it as `.draft.md` in the branch until the code ships; otherwise docs contradict what's live.
- **Do not mark a C-task complete without SME review.** Especially C7 batches. A rubber-stamped question bank is worse than a delayed one.
- **Do not start Phase η (pipeline verification) without at least one C7 batch seeded.** Otherwise K9c has no data to exercise.

---

*C0 signed off 2026-04-19. This plan is ready to execute. Next concrete action is creating the feature branch (K2) and kicking off C2 + C3 + C4 + C5 + C6 + C11 + C12 staging in parallel.*
