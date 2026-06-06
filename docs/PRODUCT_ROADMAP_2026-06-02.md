# Product Roadmap — captured 2026-06-02

> **Origin.** This document captures a wide-ranging direction-setting session (a single long brain
> dump) and expands it into one consolidated, actionable list. It is the detailed companion to
> `docs/PENDING_IDEAS.md` (the short canonical backlog) — when items here move to *Active*, mirror a
> one-liner into PENDING_IDEAS and update `docs/HOW_THE_APP_WORKS.md` on ship.
>
> **Confirmed up front this session:**
> 1. The **glossary overhaul is the #1 build priority** (fully designed in §C below).
> 2. The new glossary = **full 396-term glossary from the start**, "weak areas" as a *filter* driven by
>    a new per-term smart weight; the "write your definition / reveal" flow is **removed**.
> 3. Everything else here is documented backlog, ordered but not yet scheduled.
>
> **Mockup-first is mandatory** for every UI screen (standalone HTML in `public/`, rendered in preview,
> screenshot, explicit sign-off) before any React. See `CLAUDE.md`.

---

## §A — Tutorial / copy corrections

### A1. The "1,150 practice questions" claim — *finding: it is TRUE and sanctioned; needs a user decision, not an automatic removal*
The user flagged the welcome slide ("1,150 practice questions across 45 skills", `src/data/tutorial-slides.ts:19`) as something "we addressed but it's still there." Investigation shows:
- The count is **factually accurate**: `src/data/questions.json` holds ~1,150 items; `question-vocabulary-tags.json` reports `totalQuestions: 1150`. (The "466" in `question-skill-map.json` is a **known-stale map**, not the real bank size — `docs/ISSUE_LEDGER.md:179`.)
- `docs/HOW_THE_APP_WORKS.md:41` explicitly says: *"The '1,150 items / 45 skills / 4 domains' counts are true and may appear."*
- What was actually flagged false and fixed earlier was the **hero's "1,150 *calibrated* items / IRT-calibrated / 2PL IRT model"** psychometric framing (`docs/PASS_STORY.md:99,114`, `HANDOFF_2026-05-31:62`) — the word "calibrated" + IRT, **not** the raw count. Different copy, different place.

**So:** removing the count from the tutorial/boot would contradict the canonical doc. This is now a **user preference decision** (keep the true count vs. drop the raw number for tone), not an honesty fix. Pending that decision (see "Open decisions").

Same count appears, doc-sanctioned, in the `?boot=1` terminal: `src/components/LoginScreen.tsx:44,67`.

### A2. Tutorial slide restructure (`src/data/tutorial-slides.ts`)
- **Dashboard slide (3)** — reframe around *readiness · strengths · weaknesses*; mention the new "Set a test date" action (depends on §C-dashboard / B3).
- **Vocabulary & Fluency slide (5)** — reframe to explain *why* fluency matters: automatic recall frees working memory for application / analysis / higher-order items rather than decoding terms. Tie to the glossary's new role.
- **AI Tutor slide (6)** — keep "your on-demand study partner"; **add** that the tutor creates *artifacts you can print or save*, and that **artifacts expire in 7 days — save the ones you want to keep.** ⚠ Confirm the 7-day expiry against `tutor_artifacts` / migration `0010` before stating it (today artifacts are inline-only, downloadable as `.md` — see the "AI Tutor worksheet locker" parked item in PENDING_IDEAS; the 7-day TTL may not exist yet).
- **Track Your Progress slide (7)** — align to the reconceived Progress area (§E).
- **New "Features" page** — the user wants the Glossary grouped under "Features" with a matching tutorial page. Copy/IA change once the glossary overhaul lands.

---

## §B — Glossary overhaul *(PRIORITY #1 — fully designed; see also the approved plan `.claude/plans/okay-currently-uh-currently-reactive-lantern.md`)*

Replace the wrong-answer-only "My Terms" glossary with a **full 396-term, filterable, searchable
reference** backed by a **per-term "smart weight"** that rises on correct exposure and falls on misses.
The weight powers a weak-areas filter, a per-term proficiency meter, and a seam for AI-tutor flashcards.

> Supersedes/absorbs two existing PENDING_IDEAS entries: the PARKED *"Glossary → pure-reference
> refactor"* and the NEXT *"Retire the embedded glossary vocab quiz."* The COWORKER *glossary citations*
> task feeds the official definitions shown here.
>
> ⚠ **Dependency:** migration `0024_vocab_attempts.sql` is **not yet applied to Supabase** (per
> PENDING_IDEAS). `0026` below extends the `user_glossary_terms.miss_count` / `increment_glossary_miss`
> that `0024` introduces — apply `0024` first.

### B1. Data model — new migration `supabase/migrations/0026_glossary_smart_weight.sql`
Extend `user_glossary_terms` (do **not** add a second stat table; the drill RPC already upserts here and
`UNIQUE(user_id, term)` is the right grain):
- Add `exposure_count INT DEFAULT 0`, `correct_count INT DEFAULT 0`, `wrong_count INT DEFAULT 0`,
  `weight REAL DEFAULT 0` (clamped [-1, 1]), `last_seen TIMESTAMPTZ`.
- Index `(user_id, weight)` for the weak-areas filter + tutor read.
- **Backfill** legacy wrong-answer rows to a negative weight from `miss_count` (land them "at-risk" day one).
- New RPC **`apply_term_exposures(p_user_id, p_terms TEXT[], p_skill_id, p_is_correct)`** — set-based
  upsert (one round-trip per answered question), recomputes `weight` server-side. Follows the existing
  `increment_wrong_count` / `increment_glossary_miss` convention (`SECURITY DEFINER`, `auth.uid()`
  owner-guard).
- **Modify `increment_glossary_miss`** to also nudge `weight` negative + set `last_seen` so drill and
  question signals converge. Keep `miss_count`. No client change in `vocabDrillService.ts`.
- RLS: existing per-user policies (0008) already cover new columns.

### B2. Weight algorithm — new `src/utils/glossaryWeight.ts`
Bounded **EWMA**, clamped [-1, +1], computed in the RPC (deterministic, no AI, recency-biased):
```
weight_new = clamp(-1, +1,  weight_old * 0.8  +  delta)
delta: correct +0.15 ; wrong −0.30 ; drill miss −0.20
```
Map weight → 4 bands reusing `skillProficiency.ts` `PROFICIENCY_META` labels/colors:

| Band | Range | Reused label/color |
|---|---|---|
| Low-risk | `weight ≥ 0.5` | Demonstrating (emerald) |
| On track | `0 ≤ weight < 0.5` | Approaching (amber) |
| At-risk | `weight < 0` (any exposure) | Emerging (rose) |
| Not started | no exposure & no miss | Not started (slate) |

Exports `getTermRiskBand(): SkillProficiencyLevel`, thresholds, meter normalization `(weight+1)/2 → 0..1`.
"Weak areas" filter = band `emerging`.

### B3. Term ↔ question association
- **v1 (ship now):** derive via skill membership — associated-question count = count of questions whose
  `current_skill_id` belongs to any skill listing the term in `vocabularyTerms` (`skill-vocabulary-map.json`).
  Precompute a tiny `{ skillId: questionCount }` map (45 entries) rather than bundling `questions.json`.
  New util `src/utils/questionCounts.ts` with `getQuestionCountForTerm(term)`.
- **v2 (follow-up):** real per-question term index (offline scan of stem/case/explanation/core_concept,
  word-boundary + acronym-aware). Ships behind the same `questionCounts.ts` interface (data swap, not code).

### B4. Exposure wiring — `src/components/PracticeSession.tsx`
Replace the wrong-answer-only glossary block (~L470–489) with a single batched
`recordTermExposure(userId, skillId, terms, isCorrect)` on **every** answered question (correct AND wrong)
→ one `apply_term_exposures` RPC, fire-and-forget with `.catch()`. Drill misses unchanged at call site.

### B5. Service layer — `src/services/glossaryService.ts`
- Extend `GlossaryTerm` with the 5 new columns (keep deprecated fields `| null`).
- Add `recordTermExposure(...)` → `apply_term_exposures`.
- Add **`getWeakTermsForTutor(userId, opts?)`** → ranked `WeakTerm[]` (weight asc, band ≠ proficient by
  default), the seam for §F flashcards (mirrors `tutorContextBuilder.ts`; do not build the tutor consumer).
- **Delete** `addTermsFromWrongAnswer`, `saveUserDefinition`, `revealDefinition`.

### B6. UI rebuild — `src/components/GlossaryPage.tsx` *(mockup-first; gated on sign-off)*
- Source = full 396 terms from `master-glossary.json` left-joined by `term` with `loadGlossaryTerms(userId)`.
  No-user-row terms render "Not started." Official definition shown **outright** (reveal removed).
- Controls: search-by-term · **Domain dropdown** (4) · **Skill dropdown** (45, scoped to domain) ·
  **"Weak areas / high-risk" toggle** (band `emerging`) · **Sort** (Alphabetical / Weakest-first /
  Most-exposed / Recently-seen) — all client-side.
- **Term card** (`GlossaryTermCard`): term, domain/skill chips, official definition, compact weight meter
  (fill `(weight+1)/2`, colored via `PROFICIENCY_META[band]`), band badge. Click → detail.
- **Term detail** (`GlossaryTermDetail`): full definition + citation, **associated-question count**
  ("Appears in ~N practice questions" — count only, never identities), proficiency meter + legend,
  exposure/correct/wrong/miss tallies, last-seen.
- **Delete**: `VocabularyQuizMode` import + Quiz tab + tab bar; textarea/reveal flow; old "answer wrong to
  populate" `EmptyState`. Remove `src/components/VocabularyQuizMode.tsx`. Fluency Drill is the single
  canonical drill (this closes the PENDING_IDEAS "retire embedded quiz" item).
- Keep `GlossaryPage({ userId })` self-contained (no hardcoded nav) so a later "Features" move is a remount.

### B7. Back-compat
- Keep legacy rows (real miss signal; backfilled negative). **Deprecate-in-place** `user_definition` /
  `revealed` / `revealed_at` (stop reading/writing; drop in a later cleanup migration after grep-confirming
  no readers). Keep `miss_count` + `increment_glossary_miss`; drill-only terms still get rows.

### B8. Build order
DB (`0024` then `0026`) → utils (`glossaryWeight`, `questionCounts`) + service → wiring (`PracticeSession`)
→ UI rebuild (mockup-first).

---

## §C — Dashboard + test date + study-guide refresh
- **Dashboard** (`src/components/DashboardHome.tsx`) already shows a readiness ring + domain cards. Add an
  explicit **strengths / weaknesses** summary and a **"Set a test date"** button.
- **Test-date editing**: `planned_test_date` exists (`0002_user_profile_fields.sql`), captured in
  onboarding (`OnboardingFlow.tsx`), but has **no post-onboarding edit UI**. Add a dashboard button →
  modal writing `planned_test_date`.
- **Study-guide refresh on "major events"**: today regeneration is manual-only behind a hard 7-day limit
  (`studyPlanService.ts` ~L771, `api/study-plan-background.ts` ~L133). Define the major-event set and
  whether each **bypasses or resets** the limit:
  - Changing the test date (timeline shift → re-plan the weekly schedule).
  - A future **second assessment / readiness re-check** (to be designed). **Open decision:** does a retake
    let a user *newly master* skills, or *average/weight in* with existing scores? (Leaning average/weight-in
    so one good day can't erase a real gap — confirm with user.)
  - "Studied N hours outside the app, re-plan" — a user-initiated refresh.

---

## §D — Practice area reorganization ("Toolshed" → "Practice")
- **Rename** the "Toolshed" surface to **"Practice"** (it has outgrown "three ways to practice"). Modes
  live in `src/components/StudyModesSection.tsx` (By Domain/`DomainPanel`, By Skill/`SkillPanel`, Learning
  Path, Spaced Review) + Fluency Drill + Redemption Rounds + "Feeling Spicy".
- **Demote By-Domain / By-Skill** to "random review"; move the domain/skill *breakdown & sorting*
  ("find my lowest skill") into the **Full Report tab** (§E). Keep the ability to practice a specific
  domain/skill, but lead with the guided/adaptive flow.
- **Guided practice flow** — wire modes into a walk-through that builds on itself (e.g. foundational →
  review a module → adaptive → fluency → redemption), adapting as the user progresses. Draw on
  `useAdaptiveLearning.ts` and the locked-section pattern in `LearningPathModulePage.tsx`. **Design task —
  spec the flow before building.**
- **Update tutorial slide 4** once the reorg lands.

---

## §E — Progress reconception + "Full Report" tab
- **Problem:** the "journey" timeline (`ResultsDashboard.tsx` `JourneyTimeline`) "dies" once steps complete.
- **Reframe Progress around proximity-to-proficiency** — how close the user is to mastering each thing
  (% accuracy / # questions needed to reach Demonstrating, optionally per-skill).
- **Full Report tab** — dedicated home for the domain & skill breakdown moved from Practice (§D), sortable
  (lowest-first). Mostly re-homing existing `ResultsDashboard.tsx` analytics, not new work.
- **"Track Your Progress" stats section:**
  - *Already tracked:* overall accuracy, questions answered, tier counts, avg time per question/domain,
    confidence-weighted accuracy, time-on-task (`responses.time_on_item_seconds`, `useProgressTracking`).
  - *Net-new:* highest accuracy streak, time per *feature* (questions vs modules vs drills), highest
    vocabulary/fluency results, response-speed/fluency trend — new aggregation, maybe new columns.
  - *Vocabulary/fluency progress:* surface `vocab_attempts` (speed, correctness) + the new glossary weight
    distribution here.

---

## §F — AI Tutor: differentiated flashcards from glossary weights
First downstream consumer of the glossary weight model: tutor calls `getWeakTermsForTutor()` (§B5) to
generate **individualized flashcards on high-risk terms, with examples**, and skip low-risk terms.
Tutor-side build is a separate ticket. (Relates to the "AI Tutor worksheet locker" parked item.)

---

## §G — Study Notebook reconception
Current `StudyNotebookPage.tsx` = "My Notes" (`module_notes`) + "Focus Items" (study-plan `focus_items`).
The user wants a richer rethink and Claude's ideas. **Design task — not yet specced.** Directions to offer:
free-form entries (not tied to a module), tagging notes to skills/terms, pulling a missed question or a
glossary term directly into a note, and surfacing notes in the relevant practice/glossary context. (Note:
the PARKED "Glossary → pure-reference refactor" originally proposed relocating personal definitions here —
since the glossary's write-your-definition flow is being removed entirely, decide whether the notebook
should absorb any of it.) Decide scope with the user.

---

## §H — Smaller items / QA
- **Proficiency labels** (Emerging / Approaching / Demonstrating, `src/utils/skillProficiency.ts`) — user
  wants to confirm these are the agreed terms. **No code change unless renaming** (which touches many files
  + `HOW_THE_APP_WORKS.md`). Decision checkpoint.
- **Redemption Rounds** — "make sure it's tight." Fully wired (`useRedemptionRounds.ts`,
  `RedemptionRoundSession.tsx`). **Action = QA/verification pass, not a rebuild.**

---

## §I — Future / parked
- **"See less of this"** — let a user down-rank a specific question or topic (would weight into
  `useAdaptiveLearning` selection). Not scheduled.
- **Daily "mini-conversation" task** — a greeting + choice on the Practice surface: *"Welcome back, [name].
  Your highest-potential skill to master right now is X — study it now, or go to your weakest area?"* A
  light conversational entry into the guided flow (§D).

---

## Open decisions (need the user)
1. **"1,150" count** — keep the true, doc-sanctioned count in the tutorial/boot, or drop the raw number for
   tone? (§A1)
2. **Retake-assessment scoring** — newly *master* unmastered skills, or *average/weight-in*? (§C)
3. **Proficiency labels** — keep or rename? (§H)
4. **Study Notebook** reconception scope. (§G)
