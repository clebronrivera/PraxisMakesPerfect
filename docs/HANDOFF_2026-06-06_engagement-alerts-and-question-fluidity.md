# Handoff — Module Engagement Metrics, Alert/Trigger Engine & Question-Fluidity Audit
**Date:** 2026-06-06 · **Repo:** Praxis Makes Perfect · **Branch:** `explore/dashboard-redesign`

> **What this is.** This refines the earlier `HANDOFF_2026-06-06_activity-enhancement-and-wiring.md` after a re-audit and a product redirect. The original handoff proposed folding interactive activities into the *diagnostic proficiency* system. The product owner instead wants activities/modules to drive a **separate engagement signal + an alert/trigger system**, and flagged a **question-reuse ("fluidity") concern** that must be resolved before any real-question "exit ticket" work. Every factual claim below is cited `file:line` and was verified by script/agent against the repo on 2026-06-06.

---

## 0 — TL;DR

- **Re-audit corrected the original premise.** Activities are *not* a total dead-end: a live **70/30 blend** (`quizAccuracy*0.7 + interactiveScore*0.3`) already feeds **Learning-Path status** ([useLearningPathSupabase.ts:288](../src/hooks/useLearningPathSupabase.ts), gathered in [LearningPathModulePage.tsx:460-470](../src/components/LearningPathModulePage.tsx)). The LP **mini-quiz** already has full diagnostic parity (writes `skill_scores` + `responses` as `assessmentType="practice"`).
- **Decision (product owner, 2026-06-06):** Do **not** fold the bespoke interactive activities (sorters/matchers/etc.) into diagnostic proficiency. Make module engagement a **separate, reported metric** + an **alert/trigger** layer.
- **Two tracks.** **Track A** (engagement metrics, alerts, completion→practice) has **no dependency** on the fluidity issue — buildable now. **Track B** (real-question exit tickets / full parity) is **blocked** on a question-pool-architecture decision.
- **Fluidity finding:** the LP mini-quiz and practice-by-skill draw from the **same per-skill pool**; the only exclusion is the redemption blacklist; **proficiency aggregation does not dedupe by `question_id`**, so a question answered in both surfaces **double-counts** in the 30% practice bucket.

---

## 1 — Verified reality (the corrected baseline)

### 1.1 What already works (don't rebuild)
| Fact | Evidence |
|---|---|
| Interactive scores blend into LP status at 30% | `blendedAccuracy = quizAccuracy*0.7 + interactiveScore.score*0.3` — [useLearningPathSupabase.ts:288](../src/hooks/useLearningPathSupabase.ts); gathered from in-session `completedInteractives` in [LearningPathModulePage.tsx:460-470](../src/components/LearningPathModulePage.tsx) |
| LP mini-quiz has diagnostic parity | logs as `assessmentType="practice"` ([LearningPathModulePage.tsx:248](../src/components/LearningPathModulePage.tsx)); updates `skill_scores` via `onSkillProgressUpdate` (:473-475) and feeds redemption (:477-484) |
| Module engagement is **written** to Supabase | `useModuleVisitTracking` writes `module_visit_sessions` (`duration_seconds`, `scroll_depth_pct`, `visit_number`), `section_interactions` (`visible_seconds`, `exercise_score`), `learning_path_progress` (`visit_count`, `last_visited_at`, `total_interactive_score`) — [useModuleVisitTracking.ts](../src/hooks/useModuleVisitTracking.ts) |

### 1.2 What does NOT happen today (the real gaps)
| Gap | Evidence |
|---|---|
| Module engagement is **never read** for display | `DashboardHome.tsx` reads none of `module_visit_sessions` / `section_interactions` / `learning_path_progress.visit_count` |
| Bespoke activities don't touch diagnostic proficiency | `onSkillProgressUpdate` fires only for mini-quiz `results`, not interactives ([LearningPathModulePage.tsx:473-475](../src/components/LearningPathModulePage.tsx)) — **this is intentional per the product decision** |
| No alert/trigger layer exists | no consumer joins "flagged-for-review" signals against "module used?" signals |
| No "completion → practice" handoff | module completion does not invoke any practice entry point |

---

## 2 — Track A — Engagement metric + Alert/Trigger engine (buildable now)

No dependency on the fluidity issue. All read paths over data **already being written**.

### A1 — Module-engagement dashboard metric (separate from diagnostic)
- **Source (already written):** `learning_path_progress` (`visit_count`, `last_visited_at`, `total_interactive_score`, `interactive_exercises_completed/_total`) + `module_visit_sessions.duration_seconds`.
- **New read path:** a hook (e.g. `useModuleEngagement(userId)`) that aggregates per-skill/per-domain: total active time, modules opened, interactive completion %, last-active.
- **Surface:** a new card on `DashboardHome.tsx` (it already receives `weeklyUsageSeconds`-style stats, so the pattern exists). Engagement is reported **alongside**, never inside, the readiness ring.
- **Explicitly NOT** wired into `skill_scores`, readiness, or the Emerging/Approaching/Demonstrating labels.

### A2 — Backend correlation: does module time improve scores?
- **Question:** for a (user, skill), does `responses` accuracy **after** `last_visited_at` exceed accuracy **before**?
- **Approach:** an admin/analytics query (mirrors existing admin endpoints in `api/`, service-role) joining `learning_path_progress.last_visited_at` against pre/post `responses` accuracy per skill. Start as an **admin Item-Analysis-style** report; no user-facing surface required initially.
- **Privacy:** aggregate, consistent with existing admin analytics.

### A3 — Alert/Trigger engine (detailed scope)
A small rules layer that reads existing signals and emits dashboard nudges. **All signals already exist:**

| Signal | Where it lives | Read via |
|---|---|---|
| Skill flagged (high-confidence-wrong > 30%) | `user_progress.global_scores.flaggedSkills` | [globalScoreCalculator.ts:225-231](../src/utils/globalScoreCalculator.ts) |
| Proficiency = Emerging | `skill_scores[skillId].learningState` | [skillProficiency.ts](../src/utils/skillProficiency.ts) |
| In redemption / quarantined | `practice_missed_questions.in_redemption` | [useRedemptionRounds.ts](../src/hooks/useRedemptionRounds.ts) |
| Recent high-confidence wrongs | `skill_scores[skillId].recentHighConfidenceWrongCount` | [useProgressTracking.ts:660-672](../src/hooks/useProgressTracking.ts) |
| Module used? | `learning_path_progress.visit_count`, `last_visited_at` | [useModuleVisitTracking.ts](../src/hooks/useModuleVisitTracking.ts) |

**Trigger rules (initial set):**
1. **Review-needed-but-not-studying:** skill is flagged/Emerging/quarantined **AND** `visit_count === 0` (or `last_visited_at` older than the flag) → nudge: "Review the [skill] module." → opens module via existing `onOpenLearningPathModule(skillId)`.
2. **Completion → practice (A4):** lesson complete + mini-quiz done for a skill → nudge: "Lock it in — practice [skill]." → existing `onStartSkillPractice(skillId)`.
3. **Stale strong skill (optional later):** SRS-overdue (`srsOverdueSkills` already passed to dashboard) → review nudge.

**Where it runs:** client-side, computed on dashboard load from data already loaded into App.tsx props (cheapest path; no new backend). A backend/scheduled variant (e.g. email) is a later option.

**Surface:** an "Action items" / alert card on `DashboardHome.tsx`, reusing the existing `srsOverdueSkills` / `weakestSkill` card patterns.

### A4 — Completion → independent practice
- **Hook point:** practice launches via `usePracticeFlow`: `startSkillPractice(skillId)` / `startPractice(domainId?)` → `onNavigate('practice')` → `PracticeSession` ([App.tsx ~1749](../src/App.tsx)).
- **Wire:** after a module's lesson + mini-quiz complete, surface a primary CTA that calls `onStartSkillPractice(skillId)`. No new infra — it's an existing callback already on `DashboardHome`/module pages.

---

## 3 — Track B — Question fluidity / pool architecture (BLOCKED on a decision)

The product owner's exit-ticket / full-parity idea collides with question reuse. **Resolve the architecture before building exit tickets.**

### 3.1 The audit (quantified)
- **Pools:** mini-quiz = `analyzedQuestions.filter(q => q.skillId === skillId && !redemptionBlacklist)` then random 5 ([LearningPathModulePage.tsx:401-411](../src/components/LearningPathModulePage.tsx)); practice-by-skill = `analyzedQuestions.filter(q => q.skillId === skillId)` ([PracticeSession.tsx:293](../src/components/PracticeSession.tsx)). **Mini-quiz pool ⊆ practice pool, always.**
- **Pool sizes:** 1,150 questions / 45 skills; per-skill **min 20, median 24, mean 25.6, max 38**. Mini-quiz consumes ~5 of ~20-38 (≈25%).
- **No origin tagging:** nothing records that a question was "used in a module" vs "in practice."
- **Retirement doesn't cross surfaces:** practice retirement is **localStorage-only, practice-only** ([PracticeSession.tsx:33-51](../src/components/PracticeSession.tsx)); a question retired in practice can still appear in the mini-quiz and vice versa.
- **Double-count:** proficiency aggregation has **no `question_id` dedupe** ([globalScoreCalculator.ts:150-262](../src/utils/globalScoreCalculator.ts)); mini-quiz answers log as `"practice"` (30% bucket). So the same item answered in mini-quiz **and** practice counts as **two** practice attempts for that skill.

### 3.2 Options
| Option | What it does | Trade-off |
|---|---|---|
| **B1 — Role tagging** | Tag/partition each question's role (teaching-example vs assessment) or maintain per-skill sub-pools | Cleanest separation; requires authoring/migration over 1,150 items |
| **B2 — Cross-surface exclusion window** | Reuse the redemption-blacklist pattern: a question shown in a module is excluded from practice for N days (and vice versa) | Low effort, reuses precedent; needs shared (Supabase) "recently seen" state — retirement must move off localStorage |
| **B3 — Reuse, reframe + dedupe** | Allow reuse but present repeats as reinforcement/retry practice and rely on the deduped scoring layer so the repeat doesn't inflate proficiency/readiness | Keeps pool flexibility ("fluidity" as a feature); no exposure controls |
| **B4 — Status quo + accept** | Mini-quiz *is* the exit ticket; accept reuse | Zero work; leaves the repeat-encounter framing unaddressed |

### 3.3 ✅ DECISION — Track B V1 = **B3** (product owner, 2026-06-06)
**Chosen:** **B3 — allow encounter reuse, reframe repeats as practice/reinforcement, and prevent score inflation through `question_id` dedupe.**

The scoring half of B3 is **already shipped** (commit `cea4af9` — dedupe in `updateSkillProgress` by `question_id`, latest-wins, legacy totals preserved, source-tagged). The remaining B3 work is presentation-only: frame a repeated item as reinforcement/retry rather than a fresh graded question. No pool/bank changes.

**Explicitly NOT in scope for V1 (do not build yet):**
- **B1** — do **not** split the bank into teaching vs assessment roles.
- **B2** — do **not** build a Supabase-backed cross-surface exclusion/retirement system, and do **not** move practice retirement off localStorage in this pass.

**Revisit trigger:** future exit-ticket or assessment-validity work may reopen B1/B2 if cleaner item-exposure controls are needed.

---

## 4 — Schema / file touchpoints

| Concern | File(s) |
|---|---|
| Engagement read hook (new) | `src/hooks/useModuleEngagement.ts` (new) reading `learning_path_progress` / `module_visit_sessions` |
| Engagement + alert cards | `src/components/DashboardHome.tsx`; props assembled in `src/App.tsx` |
| Alert rules (new) | `src/utils/reviewTriggers.ts` (new) — pure function over existing signals |
| Practice launch | `src/hooks/usePracticeFlow.ts` (`startSkillPractice`) |
| Correlation report | new `api/admin-module-impact.ts` (service-role, mirrors existing admin endpoints) |
| Fluidity fix (Track B) | `src/components/PracticeSession.tsx` (retirement→Supabase), `src/utils/globalScoreCalculator.ts` (dedupe), `src/data/questions.json` (role tags, if B1) |
| Doc rule | `docs/HOW_THE_APP_WORKS.md` must be updated when any of this ships (see §6) |

---

## 5 — Suggested order
1. **A1** engagement read hook + a read-only dashboard card (mockup-first).
2. **A3/A4** alert engine + completion→practice CTA (mockup-first for the card).
3. **A2** admin correlation report.
4. ~~Decide Track B option~~ → **DONE: B3 chosen (§3.3); scoring half shipped (`cea4af9`). Remaining B3 work = reframe repeats as reinforcement (presentation only).**

---

## 6 — Non-negotiable constraints (from `CLAUDE.md`)
- **Mockup-first** for any dashboard/UI: static HTML mockup in `public/`, visual sign-off, *then* React.
- **`docs/HOW_THE_APP_WORKS.md`** must be updated in the same change if engagement/alerts become user-facing, or if proficiency aggregation or unlock/practice behavior changes.
- **Never rename `MOD-*` or skill IDs.**
- Supabase: `sb_publishable_*` / `sb_secret_*` only; no `eyJ...` JWTs, no `auth.admin.*`.
- Branch reality: this work + the activity work is committed on `explore/dashboard-redesign` (commits `3f7e14f`, `079d0c3`), not on `main`.

---

## 7 — Open decisions for the product owner
1. ~~**Track B option** (B1–B4 above)~~ — **RESOLVED 2026-06-06: B3 (see §3.3).** Allow reuse, reframe repeats as reinforcement, rely on `question_id` dedupe (shipped). B1/B2 deferred until exit-ticket/assessment-validity work needs exposure controls.
2. **Engagement metric surface** — user-facing card now, or backend-only until A2 correlation proves it matters?
3. **Alert delivery** — in-app dashboard only, or later email/push?
4. **Fix the proficiency double-count now** (dedupe by `question_id`) regardless of Track B? (Recommended yes — it's a latent diagnostic-accuracy bug independent of exit tickets.)

*Verified against the repo on 2026-06-06 via script + subagent tracing. Build on the existing 70/30 blend and the already-written engagement tables; do not duplicate them.*
