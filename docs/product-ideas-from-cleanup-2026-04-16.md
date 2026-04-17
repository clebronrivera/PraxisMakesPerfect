# Product Ideas from Branch Cleanup — 2026-04-16

Captured during the 2026-04-16 GitHub repo cleanup before deleting branches whose code was not re-mergeable onto current `main`. Nothing here has been implemented; nothing here is a commitment. These are durable product ideas worth considering for future sprints, with pointers back to the archived branches for the original implementation references.

Source branches — both archived on origin before deletion:
- `archive/audit-fixes-2026-04` (from `audit-fixes-april-2026`, PR #3)
- `archive/skill-modules-2026-03` (from `claude/skill-modules-practice-YJB3q`)

---

## From PR #3 (`archive/audit-fixes-2026-04`)

### 1. Two-tone `SkillProgressBar` with mastery-line indicator
Source commit: `910de01` — `src/components/SkillProgressBar.tsx` (173 lines).

- Two-tone bar showing **baseline-at-diagnostic** (dark indigo) and **current growth since** (bright indigo).
- Four visual states: growth, regression (rose-500/70 + thin baseline tick), no baseline (single indigo), no change (solid indigo).
- Optional vertical indicator at 80% marking the Demonstrating threshold.
- Optional legend row with colored swatches (Baseline / Current / Mastery).
- This was part of the documented but never-shipped Admin UI Sprint (project memory: `project_admin_ui_sprint.md`, item #2). The UI target it was built against (pre-Cognitive-Clarity ResultsDashboard) no longer exists.

### 2. Term Sprint — rapid-fire vocab game
Source commit: `35db028` — `TermSprintSession.tsx` + `TermSprintIntro.tsx`.

- 20 questions per session from the 396-term master glossary.
- 10-second countdown per question with visual timer bar.
- Mixed mode: term→definition and definition→term (random per item).
- 4 choices per question; auto-advance 1.5s after feedback.
- Score screen on completion; Play Again / Exit.
- Reuses existing `generateVocabQuiz()` from `vocabQuizGenerator.ts`.
- Self-contained enough to rebuild cleanly on today's UI.

### 3. `PreAssessmentGateway` flow
Source commit: `988f388` — `src/components/PreAssessmentGateway.tsx` (162 lines).

- Pre-diagnostic gateway screen introduced as part of the accessibility + mockup-alignment pass. Implementation details in the commit; fit with current onboarding + diagnostic flow should be reassessed before rebuilding.

### 4. Simplified onboarding schema + post-assessment snapshot
Source commits: `0667ec8` — migrations `0017_simplified_onboarding.sql` and `0018_post_assessment_snapshot.sql`.

⚠ **Before resurrecting, check production Supabase schema.** Main has placeholder migrations `0017_remote_history_placeholder.sql` / `0018_remote_history_placeholder.sql` whose comment states:

> migration version 0017 is recorded on the linked remote database but the original SQL file was not in this repo.

This means the columns may already be live in prod. Do not re-apply blindly — risk of double-apply.

**Schema proposed in the commit:**
- `0017_simplified_onboarding.sql`:
  - Adds `first_name`, `last_name`, `zip_code`, `school_attending`, `purpose`, `how_did_you_hear` to `user_progress`.
  - Backfills first/last name from existing `full_name` via regex split (handles single-name, multi-name, empty-name cases).
  - Preserves existing `account_role`, `full_name`, `study_goals`, etc. — non-destructive.
- `0018_post_assessment_snapshot.sql`:
  - Adds `post_assessment_snapshot JSONB` and `post_assessment_completed_at TIMESTAMPTZ` to `user_progress`.
  - Same one-shot pattern as the existing `baseline_snapshot` in migration 0016.
  - Triggered when `demonstratingCount >= READINESS_TARGET (32)` AND snapshot is still NULL.

**Associated UI concepts (from same commit, all superseded by Cognitive Clarity):**
- `StudyGuidePaywallScreen.tsx` — $5 one-time pricing, 7-item checklist, "Coming soon" disabled button.
- `MyFocusTermsPage.tsx` — user's bookmarked glossary terms from `user_glossary_terms`.
- DashboardHome reorg with persistent Spaced Review mini-card + always-visible Redemption tile.

### 5. Item bank reconciliation + audit-output artifacts
Source commit: `b98f301`.

- Tags 250 items in `questions.json` with `provenance_status: "missing_original_skill_id"` — a valid data-quality improvement if not superseded by later item-bank work.
- Adds `audit-output/` files: `orphan-skill-items.json`, `unassigned-items.json` (2502 lines), `prerequisite-cleanup-findings.md`, `incidental-findings.md`.
- These are net-new documentation artifacts. Should be reviewed for staleness against the current question bank before re-introducing.

---

## From `archive/skill-modules-2026-03`

### 6. Unified per-skill lesson + practice page
Source commit: `5f871a1` — `src/components/SkillModulePage.tsx` (550 lines).

- Tapping a skill card opens a two-section page:
  - **Section 1 "Let's Explore"** — lesson content via `ModuleLessonViewer`, with tab pills when the skill maps to multiple modules; local time-on-content counter.
  - **Section 2 "Practice Questions"** — continuous quiz from the skill's question pool (shuffled, loops); paused rather than unmounted when the lesson section re-opens, so state preserves across toggles.
- Each answered question calls `updateSkillProgress` so streak/scores track exactly as in normal practice.
- Priority color bar (rose → amber → emerald) grading skill cards by accuracy.
- Removed separate Practice + Help buttons (both accessible from the module page itself).
- Fit with current Learning Path + Redemption v2 needs reassessment.

### 7. Seven small engagement features
Source commit: `75fa16c`.

**A. Tap-to-reveal key terms in `ModuleLessonViewer`.** Sections labelled "key term" render as collapsible rows — term always visible, definition revealed on tap.

**B. Self-explanation prompt.** Replace static "Ready to apply?" CTA in the skill page with a textarea asking students to summarize the core idea in their own words before opening practice.

**C. Recency badge ("Last Practiced" + "Review Due").** New `practiceRecency.ts` utility derives days-since-last-attempt from `attemptHistory` timestamps. Skills >7 days stale AND below Demonstrating show an amber "Review Due" pill on SkillPanel cards and the SkillModulePage stats strip.

**D. "Review this skill" link in ExplanationPanel.** Shown after a wrong answer — navigates the user to the skill's module lesson via an existing openSkillModule callback.

**E. False-confidence alert.** Surfaces the pre-existing `confidenceFlags` field in the profile — inline callout in ExplanationPanel when confidence was high but the answer was wrong; ⚠ badge on SkillPanel cards; surfaced in SkillModulePage stats strip.

**F. Save-for-Review bookmark.** Bookmark button in ExplanationPanel during practice. Saved state persists in `UserProfile.flaggedQuestions`. ResultsDashboard gets a new "Saved for Review" section listing flagged questions with review/remove actions.

**G. Domain milestone celebrations.** New `domainMilestones.ts` checks 25/50/75/100% Demonstrating thresholds per domain, using `localStorage` under `pmp-milestones-{userId}` as a high-water mark. New `MilestoneToast.tsx` slides in and auto-dismisses after 4s. No Supabase schema changes required.

Features F (save-for-review), G (milestone toasts), E (false-confidence surfacing), and B (self-explanation) are small, high-clarity wins that could each ship independently.

---

## How to use this document

When starting any of the ideas above:
1. Run `git log archive/<branch>..main -- <path>` to see what has changed in the touchpoint since the branch was made.
2. Rebuild on current `main` — do not attempt to cherry-pick the old code. The surrounding UI and data model have moved.
3. For migrations, always verify the prod schema state before applying.
4. Update this doc (or remove the idea entry) when the feature ships.

The archives on origin are not an official release channel — they exist so nothing is lost. Treat them as read-only research material.
