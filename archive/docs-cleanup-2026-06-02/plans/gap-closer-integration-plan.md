# Gap-Closer Integration Plan

**Status:** Draft — awaiting Phase 0 decisions before Phase 1 edits begin.
**Created:** 2026-04-19
**Scope:** Integrate the 9 gap-closer modules drafted in `content-authoring/phase-E-thickening/gap-closers/` into the live Praxis Makes Perfect codebase.
**Outcome:** Every gap in the April 2026 ETS 5403 competency audit flips from ❌ to ✅, with the skill count, question bank, study-plan pipeline, and UI all consistent.

---

## Artifacts This Plan Integrates

The nine modules awaiting integration:

| File | ETS Gap | Proposed New Skill | App Domain |
|------|---------|--------------------|------------|
| MOD-GAP-01-trauma-informed-practice.md | II.B.1.d | MBH-06 | 2 |
| MOD-GAP-02-classroom-management.md | II.B.1.a | ACA-10 | 2 |
| MOD-GAP-03-performance-based-assessment.md | I.A.2.f | DBD-11 | 1 |
| MOD-GAP-04-ESSA.md | IV.C.2.a | LEG-05 *(or sub-concept of LEG-02)* | 4 |
| MOD-GAP-05-seclusion-restraint.md | IV.C.2.c | LEG-06 *(or sub-concept of LEG-02)* | 4 |
| MOD-GAP-06-implementation-science.md | IV.B.4 | RES-04 | 4 |
| MOD-GAP-07-low-incidence-exceptionalities.md | I.A.4.c | DBD-12 | 1 |
| MOD-GAP-08-assessment-technology.md | I.A.2.i | DBD-13 *(or sub-concept of DBD-01/02)* | 1 |
| MOD-GAP-09-school-climate-measurement.md | III.B.5 | SSV-09 | 3 |

---

## Phase 0 — Decisions to Lock Before Any Edits

Three decisions change every downstream phase. Recommendations below; final call is the user's.

### Decision 0.1 — New Skills vs. Sub-Concepts

**Recommendation:** 6 new top-level skills, 3 as sub-concepts → taxonomy grows from **45 → 51 skills**.

| Module | Recommended Treatment | Rationale |
|--------|-----------------------|-----------|
| MBH-06 Trauma-Informed | **New skill** | Distinct domain of practice, testable on its own, NASP-prominent |
| ACA-10 Classroom Management | **New skill** | Directly maps to sample Q17; stands alone |
| DBD-11 Performance-Based Assessment | **New skill** | Distinct assessment methodology, separate from CBM |
| DBD-12 Low-Incidence | **New skill** | Population-specific; heterogeneous enough to warrant standalone skill |
| RES-04 Implementation Science | **New skill** | Crosses existing RES-02/03; merits its own thread |
| SSV-09 School Climate Measurement | **New skill** | Distinct from SAF-01 schoolwide prevention |
| LEG-05 ESSA | **Sub-concept under LEG-02** | ESSA is one federal law among several; LEG-02 already covers IDEA. Merging keeps the "federal laws" story coherent. |
| LEG-06 Seclusion/Restraint/MD | **Sub-concept under LEG-02 or LEG-03** | Procedural safeguards belong with the core IDEA skill |
| DBD-13 Assessment Tech | **Sub-concept under DBD-01 or DBD-08** | RIOT/CBM skills naturally encompass the digital platforms that run them |

**If user disagrees:** flip any "sub-concept" to "new skill" to reach a 52–54 count, or flip any "new skill" to "sub-concept" to stay at 48–49. Re-run the readiness math per the table in Decision 0.3.

### Decision 0.2 — Existing-User Grandfathering

**Recommendation:** Add a `skill_taxonomy_version` column (default `'v1'`) on `user_progress`. Existing users stay on `v1` readiness math (32 of 45 target) until they opt into v2 from the settings panel. New users get `v2`.

**Alternative (simpler but harsher):** Migrate everyone to v2 on release day. Users who were at "Ready" under 45 skills may drop to "Approaching" under 51. The new skills start at 0 attempts for everyone, so their status is "Not started" until practiced.

### Decision 0.3 — Readiness Target Math

Depends on Decision 0.1. `readinessTarget = Math.ceil(totalSkills * 0.7)`.

| Path | Total Skills | Readiness Target |
|------|--------------|------------------|
| Status quo (no integration) | 45 | 32 |
| 6 new + 3 sub-concepts (recommended) | 51 | 36 |
| 9 new (maximalist) | 54 | 38 |
| 3 new + 6 sub-concepts | 48 | 34 |
| All 9 as sub-concepts | 45 | 32 |

---

## Phase 1 — Taxonomy Registration (Code)

Three files in strict order: `progressTaxonomy.ts` → `skillIdMap.ts` → `skill-metadata-v1.ts`. TypeScript will surface mismatches as you go.

### 1a. `src/utils/progressTaxonomy.ts`

Append the six new-skill entries to `PROGRESS_SKILLS` (insert at the end of each domain block so existing ordinals don't shift):

```typescript
// Domain 1 additions (after PSY-04)
{ skillId: 'DBD-11', shortLabel: 'Performance Assessment', fullLabel: 'Performance-Based and Portfolio Assessment', domainId: 1, knowledgeType: 'application' },
{ skillId: 'DBD-12', shortLabel: 'Low-Incidence Assessment', fullLabel: 'Assessment of Low-Incidence Exceptionalities', domainId: 1, knowledgeType: 'application' },

// Domain 2 additions (after MBH-05)
{ skillId: 'MBH-06', shortLabel: 'Trauma-Informed Practice', fullLabel: 'Trauma Impact and Trauma-Informed Practice', domainId: 2, knowledgeType: 'application' },
{ skillId: 'ACA-10', shortLabel: 'Classroom Management', fullLabel: 'Classroom Organization and Behavior Management', domainId: 2, knowledgeType: 'application' },

// Domain 3 additions (after SWP-04)
{ skillId: 'SSV-09', shortLabel: 'Climate Measurement', fullLabel: 'School Climate Measurement and Evaluation', domainId: 3, knowledgeType: 'application' },

// Domain 4 additions (after RES-03)
{ skillId: 'RES-04', shortLabel: 'Implementation Science', fullLabel: 'Implementation Science and Change Management', domainId: 4, knowledgeType: 'concept-relationship' },
```

**New domain counts:** Domain 1 = 15, Domain 2 = 14, Domain 3 = 9, Domain 4 = 13. Total = 51.

### 1b. `src/data/skillIdMap.ts`

Append six new entries. Metadata IDs follow existing convention:

```typescript
'DBD-11': 'DBDM-S11',              // Performance-Based Assessment (new metadata)
'DBD-12': 'DBDM-S12',              // Low-Incidence Exceptionalities (new metadata)
'MBH-06': 'MBH-S06',               // Trauma-Informed Practice (new metadata)
'ACA-10': 'ACAD-S10',              // Classroom Management (new metadata)
'SSV-09': 'SWP-S09',               // School Climate Measurement (new metadata)
'RES-04': 'RES-S04',               // Implementation Science (new metadata)
```

Sub-concept additions do NOT get new progressTaxonomy rows; they attach to existing skills through the module's `concepts` array (Phase 3).

### 1c. `src/data/skill-metadata-v1.ts`

Add six new skill records. Each needs:

- `skillId` (matches 1b metadata ID)
- `title`
- `shortDescription`
- `vocabulary` — pull from module's "Concept Tags" section + key terms from "First-Principles Explanation"
- `misconceptions` — pull verbatim from module's "Named Misconceptions" section (framing: "Believing X when in fact Y")
- `caseArchetypes` — distill from module's "Worked Example"
- `lawsAndFrameworks` — pull from module body (e.g., MBH-06: ACEs, SAMHSA 4 R's, CBITS, TF-CBT; LEG-06: 34 CFR §300.530(e))

This is the heaviest file edit — ~500–800 lines across 6 new records. The preprocessor reads this directly into study-plan prompts, so shortcuts here degrade AI output quality.

---

## Phase 2 — Downstream Constants and Copy Updates

Once taxonomy is expanded, audit every hardcoded "45 skills" string. Confirmed hits from `grep`:

| File | Line | Current | Change |
|------|------|---------|--------|
| `src/utils/assessment-builder.ts` | 8 | `// Maps each of the 45 skills` | Update to 51 |
| `src/utils/assessment-builder.ts` | 9–62 | `SKILL_BLUEPRINT` dictionary | Add 6 new skill entries with domain + slot counts |
| `src/data/master-glossary.json` | 4 | `"all 45 skills"` | Update to 51 |
| `src/data/skill-vocabulary-map.json` | 3 | `"totalSkills": 45` | Update to 51 |
| `src/components/HelpFAQ.tsx` | 20 | `"all 45 skills"` | Update to 51 |
| `src/components/StudyModesSection.tsx` | 334, 617 | `"all 45 skills"` × 2 | Update to 51 |
| `src/components/LoginScreen.tsx` | 78, 487, 493, 557 | `"45 skills"` × 4 | Update to 51 |
| `src/data/tutorial-slides.ts` | 19, 28, 118, 121 | `"45 skills"` × 4 | Update to 51 |
| `src/data/app-guide.ts` | 14, 64, 82, 136, 139 | `"32 of 45 skills"` × 5 | Update to "36 of 51 skills" |
| `src/scripts/full-simulation.ts` | 136 | derives from `getAllSkills().length` | No change needed |

`readinessTarget` in `App.tsx` is already computed dynamically (`Math.ceil(totalSkills * 0.7)`) — no edit required there.

### SKILL_BLUEPRINT expansion (assessment-builder.ts)

The screener/full-assessment builders allocate question slots per skill per Praxis content-area distribution (32% / 23% / 20% / 25%). Adding 6 skills requires recomputing slot counts so the totals still land at 50 (screener) and 125 (full). Provisional allocation:

```typescript
// Domain 1: 16 questions → now 18 (still ~32% at 51 total)
// (existing 13 skills unchanged, add 2 new with slots: 1 each)
'DBD-11': { domain: 1, slots: 1, recallTarget: 5 },
'DBD-12': { domain: 1, slots: 1, recallTarget: 5 },

// Domain 2: 12 questions → now 14
'MBH-06': { domain: 2, slots: 1, recallTarget: 3 },
'ACA-10': { domain: 2, slots: 1, recallTarget: 3 },

// Domain 3: 10 questions → now 11
'SSV-09': { domain: 3, slots: 1, recallTarget: 3 },

// Domain 4: 12 questions → now 13
'RES-04': { domain: 4, slots: 1, recallTarget: 4 },
```

New total: 56. If we want to hold 50 questions, rebalance existing slots (reduce 6 existing skills from 2→1). If we expand to 55–56, also update `HelpFAQ` copy ("50-question screener" → "55-question screener").

**Recommendation:** expand screener to 55 questions rather than shrink existing coverage, because existing slot allocations were tuned to recall-vs-application targets that shouldn't be compromised.

---

## Phase 3 — Module Registration

Add 9 `LearningModule` entries to `src/data/learningModules.ts`. Template per module:

```typescript
{
  id: 'mod-mbh-06-trauma-informed',
  title: 'Trauma Impact and Trauma-Informed Practice',
  primarySkillId: 'MBH-06',
  role: 'primary',
  sequenceGroup: 'student-level-services',
  sequenceIndex: /* place after MBH-05 */,
  prerequisiteModuleIds: ['mod-mbh-01-intro'],
  concepts: ['ACEs', 'SAMHSA-4Rs', 'CBITS', 'TF-CBT', 'trauma-informed-tier-1'],
  sections: [
    { heading: 'In Plain Language', body: /* from .md */ },
    { heading: 'First-Principles Explanation', body: /* from .md */ },
    { heading: 'Worked Example', body: /* from .md */ },
    { heading: 'Named Misconceptions', body: /* from .md */ },
    { heading: 'If You Only Remember One Thing', body: /* from .md */ },
    { heading: 'Analogy', body: /* from .md */ },
    { heading: 'Visual Primitive', body: /* from .md — note: diagrams not built */ },
    { heading: 'Mini-Quiz Stems', body: /* from .md, labeled as preview */ }
  ]
}
```

Sub-concept modules (LEG-05, LEG-06, DBD-13) attach to their parent skill via `concepts: ['ESSA', ...]` and do not get a new `primarySkillId`. The UI can surface sub-concept modules within the parent skill's detail panel.

### Prerequisite graph additions

- MBH-06 ← MBH-01 (intro), MBH-04 (psychopathology)
- ACA-10 ← ACA-04 (instructional strategies)
- DBD-11 ← DBD-08 (progress monitoring)
- DBD-12 ← DBD-03 (cognitive assessment), PSY-04 (CLD assessment)
- RES-04 ← RES-02 (research to practice)
- SSV-09 ← SAF-01 (schoolwide prevention)
- LEG-05, LEG-06 ← LEG-02 (IDEA)
- DBD-13 ← DBD-01 (RIOT), DBD-08 (progress monitoring)

---

## Phase 4 — Question-Bank Seeding

Largest piece of labor. Minimum viable bank per skill = 10 items (for adaptive diagnostic's 1-per-skill-plus-follow-ups model to have range). Target for new skills = 15 items. Total new items needed: **6 × 15 = 90 items minimum**; sub-concepts share bank with parent skills but need at least 3 items each, so add 9 more = **99 items total**.

### Per-item deliverables

Each question needs:

1. Stem (typically 40–80 words, scenario-based)
2. Four answer choices — one best, three principled distractors
3. Correct-answer rationale (why this is best, anchored in the module content)
4. Distractor rationales (why each wrong answer is plausible but wrong — diagnostic for specific misconceptions)
5. Tags: `skillId`, `concept`, `cognitiveComplexity` (recall/application/analysis)
6. Time estimate (based on stem length and complexity)
7. ETS gap citation (e.g., "Closes I.A.2.f")

### Starting point

The 27 mini-quiz stems inside the nine gap-closer `.md` files become seed items. Each stem already has a correct answer sketch; still needs 3 distractors + rationales each = ~80 hours of SME work at 20 min per fully-specified item.

### Suggested batch order

1. MBH-06 and ACA-10 first (highest NASP 2020 visibility, Q17 already validates ACA-10)
2. DBD-11, DBD-12 next (assessment methodology — aligns with Domain 1's 32% weight)
3. SSV-09, RES-04 (systems-level, smaller Praxis weight)
4. Sub-concepts (LEG-05, LEG-06, DBD-13) last

### Psychometric expectations

Post-integration, the admin Item Analysis tab will flag new items as "insufficient data" until ≥ 5 attempts accumulate. Plan for a 4–6 week stabilization window before flagging items as too easy/hard/low-discrimination.

---

## Phase 5 — Assessment Pipeline Reconciliation

### 5a. Adaptive diagnostic

Per CLAUDE.md: "adaptive diagnostic (45–90 questions, 1 per skill + follow-ups)." At 51 skills this becomes **51–102 questions**. Verify:

- `useAdaptiveLearning.ts` pulls from `progressTaxonomy`, not a hardcoded count
- The diagnostic controller's skill queue derives from `PROGRESS_SKILLS`
- `skill_question_index` increments correctly for new skills (starts at 0)
- The "complete assessment" gate checks all 51 skills have ≥ 1 answered, not ≥ 45

### 5b. Legacy 50-question screener

`SKILL_BLUEPRINT` expansion in Phase 2 handles this. Confirm:

- Screener builder runs without errors at new 55-question length (or rebalanced 50)
- HelpFAQ copy reflects actual count
- Old completed screeners are still valid (they cover 45 skills; the 6 new skills start at zero for those users — natural)

### 5c. Legacy 125-question full assessment

Same treatment as screener. Target distribution (32/23/20/25) × 125 = 40/29/25/31 questions across domains. Holds approximately at 51 skills with minor per-skill rebalancing.

---

## Phase 6 — Study-Plan Pipeline

### 6a. Preprocessor

`src/utils/studyPlanPreprocessor.ts` should automatically iterate over the expanded skill set if it reads from `progressTaxonomy`. Confirm:

- `StudentSkillState` includes all 51 skills for every user
- Status labels (unlearned/misconception/.../mastered) apply to new skills
- Urgency scoring treats new skills with 0 attempts as `unlearned` (lowest data, highest uncertainty)
- Clusters include new skills where priority warrants

### 6b. Synthesis prompt

`buildPromptV2` serializes skill metadata. Confirm new `skill-metadata-v1.ts` records flow through:

- Vocabulary for each new skill appears in the prompt
- Misconceptions are listed
- Case archetypes are available for the AI to reference

### 6c. Dry-run

Run study plan generation for a synthetic user with zero data on the 6 new skills. Confirm the plan surfaces at least one of the new skills in a priority cluster (it should — unlearned status is high urgency).

---

## Phase 7 — Migration, Feature Flag, QA

### 7a. Supabase migration

`supabase/migrations/0023_skill_taxonomy_v2.sql`:

```sql
-- Add taxonomy version column to user_progress
ALTER TABLE user_progress
ADD COLUMN skill_taxonomy_version TEXT DEFAULT 'v1';

-- Existing users stay on v1; new users default to v2 via app-layer insert
-- No backfill; v1 keeps 45-skill readiness math
```

### 7b. Feature flag

Add `VITE_TAXONOMY_V2_DEFAULT` env var. When true, new signups write `'v2'`. App-layer reads this column to decide readiness-target math, total-skill display copy, etc.

### 7c. QA paths

1. **New user, v2:** Signs up → onboarding → adaptive diagnostic covers 51 skills → readiness math = 36/51.
2. **Existing user, v1:** Logs in → readiness math still 32/45 → 6 new skills visible in Practice tab but excluded from readiness denominator.
3. **Existing user upgrades to v2:** Settings → "upgrade taxonomy" button → confirm dialog explaining readiness recalculation → user_progress row updated → dashboard refreshes with 36/51 math.
4. **Admin dashboard:** Users tab still works. Item Analysis shows new items as "insufficient data" until attempts accumulate.
5. **Study plan regeneration:** Produces plan including at least one new skill for users with zero data on them.

### 7d. Audit rerun

Rerun `docs/audits/ets-5403-competency-audit.md` against the post-integration taxonomy. Each of the 9 ❌ gaps should flip to ✅. Any that don't indicate a mapping error, not a content error.

---

## Phase 8 — Documentation and Release

### 8a. HOW_THE_APP_WORKS.md (mandatory per CLAUDE.md)

Must be updated in the same PR. Changes:

- Skill count: 45 → 51
- Readiness target: 32 → 36
- Screener length: 50 → 55 (if we go with expansion rather than rebalance)
- Adaptive diagnostic length: 45–90 → 51–102
- Domain skill counts: D1 13→15, D2 12→14, D3 8→9, D4 12→13

### 8b. README updates

- `content-authoring/phase-E-thickening/gap-closers/README.md` — mark "integration complete" once Phases 1–7 ship
- Main `README.md` — update any skill-count stats

### 8c. Release notes

Frame for users as: "9 new skills added to cover previously-unaddressed ETS competencies (trauma, classroom management, implementation science, and more). Your existing progress is preserved; new skills begin at zero until practiced."

### 8d. Admin communication

Surface a banner in the admin dashboard flagging the taxonomy change, with a link to the audit rerun report.

---

## Sequencing and Estimated Effort

| Phase | Description | Est. Effort | Reversibility |
|-------|-------------|-------------|---------------|
| 0 | Decision memo sign-off | 30 min (user) | n/a |
| 1 | Taxonomy registration | 4–6 hours | High — pure additions |
| 2 | Constants and copy | 2–3 hours | High — cosmetic |
| 3 | Module registration | 6–10 hours | High — additive |
| 4 | Question-bank seeding | **80–120 hours** (SME) | High — additive |
| 5 | Assessment pipeline | 3–5 hours | Medium — pipeline logic |
| 6 | Study-plan pipeline | 2–4 hours | Medium — AI-adjacent |
| 7 | Migration + QA | 6–10 hours | Low — production |
| 8 | Docs and release | 2–3 hours | High |

**Critical path:** Phase 4 (question writing) is 2–3 weeks of SME labor and can run in parallel with Phases 2–3. Everything else could ship in a single focused week of engineering.

**Minimum viable release (MVR):** Phases 0–3 + Phase 8 docs = app has 51 skills visible, 9 new modules readable, readiness math correct. Users can learn the content even before the question bank expands. Questions arrive in a follow-up release.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing users lose "Ready" status on release | High under maximalist path | High | Grandfather via `skill_taxonomy_version` (Decision 0.2) |
| New-skill question bank is too thin for adaptive engine | Certain at release | Medium | Ship MVR without adaptive coverage of new skills; expand bank in follow-up |
| Skill-metadata-v1 records are skimpy → weak study-plan output | Medium | Medium | Invest in metadata quality before merging |
| Hardcoded "45 skills" copy missed somewhere | Medium | Low | Grep audit before merge; snapshot tests |
| Sub-concept/skill decisions flip after Phase 1 ship | Low once locked | High | Require Decision 0.1 sign-off before Phase 1 begins |
| Database migration fails on existing users | Low | High | Migration is additive-only (new column with default); test in branch |

---

## Open Questions Carried Over

From prior session, still awaiting user decision:

1. Triage clearing threshold (3/5 vs. 4/5 correct)
2. AI tutor continuity inside triage (fresh vs. continued)
3. Weekly "skills mastered" rule (first-time only vs. any-week)
4. Content integration cadence (big bang vs. rolling)
5. FTCE 036 roadmap — does this integration work get replicated for the FTCE taxonomy?

Questions 4 and 5 directly affect this integration: a big-bang ship would include all 9 skills at once; a rolling ship might release 2 skills per week over 5 weeks to let question-bank seeding catch up.

---

## Recommended Next Action

1. User reviews Phase 0 recommendations (Decisions 0.1, 0.2, 0.3).
2. With Decision 0.1 locked at "6 new skills, 3 sub-concepts" (or whatever user chooses), Claude begins Phase 1 TypeScript edits in a dedicated branch (`feat/gap-closer-taxonomy`).
3. In parallel, Claude drafts the 6 new skill-metadata-v1.ts records from the gap-closer .md files, so Phase 1c does not bottleneck.
4. Phase 4 (question writing) queued for SME review or separate dedicated work.
5. Phases 5–8 run after Phases 1–4 are clean on the branch.

---

*This document exists to prevent Phase-1 edits from happening before decisions are locked. Once Decision 0.1 is made, the rest of the plan executes cleanly.*
