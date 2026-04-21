# Decision Memo — Skill Taxonomy v2

**Date:** 2026-04-19
**Decider:** Carlos
**Status:** ✅ SIGNED OFF 2026-04-19
**Unblocks:** All Phase β and γ work on the gap-closer integration

---

## Context

The April 2026 ETS 5403 audit identified 9 hard gaps in the current 45-skill taxonomy. Nine gap-closer modules have been drafted in `content-authoring/phase-E-thickening/gap-closers/`. Before any code edits begin, three decisions need to be locked. These decisions determine skill count, existing-user behavior, and assessment length — and every downstream task depends on them.

---

## Decision 0.1 — New Skills vs. Sub-Concepts

**Question:** For each of the 9 gap-closer modules, does the content become a full top-level skill in the taxonomy, or a sub-concept attached to an existing skill?

### Options

| Option | Result | Tradeoffs |
|--------|--------|-----------|
| **A. All 9 as full skills** (maximalist) | 54 skills total | Cleanest reporting per gap, but 9 new columns in user_progress, biggest shift in readiness math (32→38), longest assessment |
| **B. 6 new skills + 3 sub-concepts** (recommended) | 51 skills total | New skills for the 6 genuinely distinct practice domains; sub-concept treatment for 3 items that naturally fit under existing skills |
| **C. 3 new skills + 6 sub-concepts** | 48 skills total | Conservative; keeps more content under existing skills but loses the distinctness of trauma-informed, classroom management, low-incidence, and implementation science |
| **D. All 9 as sub-concepts** | 45 skills (no change) | No taxonomy disruption, but reporting is muddier — gap closures live inside existing skill detail pages rather than as first-class skills |

### Recommendation: **Option B**

| Module | Treatment under B | Why |
|--------|-------------------|-----|
| MBH-06 Trauma-Informed Practice | **New skill** | Distinct domain of practice; NASP 2020 D4 prominence; high testable surface area |
| ACA-10 Classroom Management | **New skill** | Validated by sample Q17; standalone topic; teacher-facing |
| DBD-11 Performance-Based Assessment | **New skill** | Distinct methodology from CBM and standardized testing |
| DBD-12 Low-Incidence Exceptionalities | **New skill** | Population-specific; heterogeneous enough to warrant its own thread |
| RES-04 Implementation Science | **New skill** | Crosses RES-02/03 but has its own literature (Fixsen, NIRN) |
| SSV-09 School Climate Measurement | **New skill** | Distinct from SAF-01 schoolwide prevention; ESSA-linked |
| LEG-05 ESSA | **Sub-concept under LEG-02** | ESSA is one federal law; LEG-02 already owns IDEA; merging keeps the "federal laws" story coherent |
| LEG-06 Seclusion/Restraint/MD | **Sub-concept under LEG-02** | Procedural safeguards under IDEA; natural fit |
| DBD-13 Assessment Technology | **Sub-concept under DBD-01** | RIOT framework naturally encompasses the digital platforms that run it |

**Downstream impact under B:** 51 skills, readiness target 36, domain counts D1 = 15, D2 = 14, D3 = 9, D4 = 13.

### Decision

**✅ Option B — 51 skills (6 new top-level + 3 sub-concepts).**

Locked taxonomy:
- New top-level skills: MBH-06, ACA-10, DBD-11, DBD-12, RES-04, SSV-09
- Sub-concepts (attached to parent skills via concept tags): LEG-05 (under LEG-02), LEG-06 (under LEG-02), DBD-13 (under DBD-01)
- Total: 51 skills, readiness target 36
- Domain counts: D1 = 15, D2 = 14, D3 = 9, D4 = 13

---

## Decision 0.2 — Existing-User Grandfathering

**Question:** What happens to existing users' readiness status on the day taxonomy v2 ships?

### The problem

Adding skills resets the denominator. A user who had 32 of 45 skills at Demonstrating under v1 (at Ready status) will, under a 51-skill regime, have 32 of 51 — which falls below the 36/51 readiness target. Their status drops from Ready to Approaching on the day of release even though their actual knowledge hasn't changed.

### Options

| Option | Behavior | Tradeoffs |
|--------|----------|-----------|
| **A. Migrate everyone immediately** | All users move to v2 math on release day | Simplest code path; loses goodwill with users whose status regresses |
| **B. Grandfather via `skill_taxonomy_version` column** (recommended) | Existing users stay on v1 math until they opt in from Settings | Preserves earned status; requires a migration, feature flag, and a settings-page upgrade dialog |
| **C. Grandfather permanently** | Existing users stay on v1 forever; only new users get v2 | Forks the codebase; unsustainable long-term; forces a future forced migration |

### Recommendation: **Option B**

Add `skill_taxonomy_version` column (default `'v1'`) on `user_progress`. New signups get `'v2'` via app-layer insert. Existing users see a one-time banner inviting them to upgrade, with a dialog explaining that their 6 new skills start at zero and their readiness math will recalculate.

**Content cost of B:** C10 task exists (write banner + dialog copy — ~30 min).
**Code cost of B:** K10a migration + K10b feature flag + K10c settings UI (~4–6 hours).

### Decision

**✅ Option A-modified — "Migrate with Catch-Up Gating."**

Hybrid approach that migrates everyone to v2 immediately but gates new-skill contribution to readiness math behind a user-completed action.

**Mechanics:**

1. On release, all users migrate to v2 taxonomy (51 skills visible everywhere).
2. A new column on `user_progress`: `taxonomy_v2_catchup_completed_at TIMESTAMPTZ NULL`.
3. **Until that column is set** (i.e., user has not completed the catch-up action):
   - The 6 new top-level skills are **locked** in the user's view — visible in the taxonomy map but marked "Locked · Complete catch-up to unlock"
   - Locked skills are **excluded from the readiness denominator** (user's readiness math continues to treat 45 skills as the denominator)
   - Locked skills are **excluded from all practice pools** (adaptive diagnostic, skill-by-skill practice, Feeling Spicy cycles)
   - A persistent banner/CTA appears on the dashboard: "6 new skills were added. Complete a short catch-up to unlock them and refresh your readiness stats."
4. When the user clicks the CTA, they run the **catch-up diagnostic** — a short assessment covering just the 6 new skills (1 application-level primary per new skill + adaptive follow-ups on miss, so 6–18 questions depending on performance).
5. On completion, `taxonomy_v2_catchup_completed_at` is set to `now()`; the 6 new skills unlock; readiness math recalculates to 51-skill denominator; user sees a confirmation toast.

**Why this shape:**
- Existing users don't get surprise-dropped from Ready status on release day.
- The catch-up is a one-time action, not a permanent grandfathering fork.
- Stats refresh is deterministic and user-initiated.
- New users skip this entirely; they default to v2 with the timestamp set at signup.

**Downstream tasks created by this choice:**
- Supabase migration 0023: adds `taxonomy_v2_catchup_completed_at` column.
- App-layer readiness calculation: conditionally excludes locked skills from denominator.
- Catch-up diagnostic flow: new screen, new controller, reuses adaptive engine with a 6-skill scope.
- UI: locked-skill styling, banner/CTA, completion toast, explainer dialog.
- Content: banner copy, dialog explaining what's happening, locked-skill tooltip, completion confirmation.

---

## Decision 0.3 — Screener Length

**Question:** The legacy 50-question screener allocates 1–2 question slots per skill based on Praxis distribution (32%/23%/20%/25%). Adding 6 new skills adds 6 slots. Do we expand screener length or rebalance?

### Options

| Option | Result | Tradeoffs |
|--------|--------|-----------|
| **A. Expand screener to 55 questions** (recommended) | Each existing skill keeps its slots; 6 new skills each get 1 slot | Longer screener (55 vs. 50) but existing psychometrics preserved |
| **B. Rebalance to 50 questions** | Reduce 6 existing skills from 2 slots → 1 slot to make room | Holds the 50-question promise but degrades coverage on 6 existing skills that were allocated 2 slots for good reason |
| **C. Adaptive-only going forward** | Deprecate the legacy 50-question screener entirely; new users go directly to adaptive diagnostic | Cleanest but removes a path some users may prefer |

### Recommendation: **Option A**

Why: existing slot allocations were tuned to recall-vs-application targets. Shrinking coverage on skills that were deliberately given 2 slots (CON-01, DBD-01, DBD-03, SAF-01, SWP-04, and one more) is a worse tradeoff than five extra minutes of screener time. Users already accept 45–90 questions on the adaptive diagnostic; 55 on the screener is a small adjustment.

**Content cost of A:** C5 copy-update spec changes "50-question screener" to "55-question screener" wherever it appears (tutorial-slides, HelpFAQ, login marketing, app-guide).

### Decision

**✅ Option A with adaptive prerequisite loop.**

The 55-question screener is not a flat 55-question pass. It is:

**Structure:**
- **55 primary questions**, one per skill, all at **application** cognitive level.
- Each skill has a **pool of fallback/prerequisite questions** at recall/foundational level.
- **Adaptive loop:** if a user misses the primary application question, the engine serves a fallback prerequisite question from that skill's recall pool. If they miss the fallback, additional follow-ups may fire until signal is sufficient.
- **Length range:** 55 questions minimum (user gets every primary correct) to ~110 questions maximum (user misses every primary and triggers 1 follow-up each; additional follow-ups can push longer for genuinely struggling users).

**Why this shape:**
- Strong students finish in ~55 questions.
- Struggling students are diagnosed more precisely — the follow-ups tell us whether a missed application question reflects a foundational gap or just a single-item fumble.
- Matches the existing adaptive diagnostic pattern (1 per skill + follow-ups) and extends it to the screener.
- Produces much richer signal for placing users into Tier 2 practice work.

**Downstream implications for content and code:**
- **Question authoring per skill** now requires both tiers:
  - ≥ 1 application-level primary (target: 3+ for pool variety)
  - ≥ 1 recall/foundational fallback (target: 3+ for pool variety)
  - Target per new skill: **6 items minimum** (3 primary + 3 fallback), ideally 10+ for full adaptive coverage.
  - Target for 6 new skills: **36 items minimum**, ideally 60+.
  - Sub-concepts: 3 items minimum each (LEG-05, LEG-06, DBD-13), tagged with parent skill + concept.
- **Prerequisite mapping:** for each new skill, content staging must specify *what* the fallback question should probe (e.g., MBH-06's application-level question about trauma-informed response might have a fallback probing the ACEs definition or the SAMHSA 4 R's).
- **Engine verification:** the adaptive loop may already exist in `useAdaptiveLearning.ts`. Confirm it handles the primary-to-fallback routing; if not, implement.
- **Item schema:** each question needs a `cognitiveTier` field: `"primary-application"` or `"fallback-recall"` (or equivalent). Check whether the existing `cognitive_complexity` column on `responses` covers this.

---

## What Gets Locked by This Memo

Once all three decisions are signed:

1. **Taxonomy target** locked for Phase γ code edits.
2. **Existing-user path** locked for Phase θ migration design.
3. **Screener blueprint** locked for Phase γ `SKILL_BLUEPRINT` updates and Phase β copy-spec drafting.
4. **HOW_THE_APP_WORKS.md** draft numbers locked (held in `.draft.md` until κ release).
5. **All 13 C/K tasks** in the tracker become executable in their phase order.

---

## Sign-Off

**Decider:** Carlos
**Date signed:** 2026-04-19
**Decisions applied:**
- 0.1: **B** (51 skills: 6 new top-level + 3 sub-concepts)
- 0.2: **A-modified** (migrate with catch-up gating via `taxonomy_v2_catchup_completed_at` column)
- 0.3: **A with adaptive prerequisite loop** (55 primaries at application level + recall/foundational fallbacks per skill + follow-up on miss)

**Modifications to original recommendations:**

- **0.2 was upgraded from "grandfather via version column" to "migrate with catch-up gating."** Cleaner UX: all users end up on v2, but locked-skill gating prevents surprise status regression. Requires a catch-up diagnostic flow + locked-skill UI treatment.
- **0.3 was clarified to specify adaptive loop.** Primary questions are application-level; each skill has a fallback pool at recall/foundational level; miss triggers fallback; additional follow-ups continue until signal is sufficient. This elongates the test adaptively for struggling users while keeping strong students at ~55 questions.

## New Tasks Created by These Decisions

**From Decision 0.2-modified:**
- C11 — Catch-up diagnostic UX copy (banner, CTA, dialog, locked-skill tooltip, completion toast)
- K13 — Catch-up diagnostic flow implementation
- K14 — Locked-skill gating in readiness math + practice pool filters

**From Decision 0.3:**
- Modified C7 batches — now require primary + fallback item pairs per skill
- C12 — Per-skill fallback prerequisite mapping (specifies what each skill's fallback questions should probe)
- K15 — Adaptive-loop verification / implementation in screener engine

---

*Decisions locked. Claude proceeding to Phase β: feature-branch creation (K2) + content staging (C3, C4, C5, C6, C11, C12) + citation verification (C2) running in parallel.*
