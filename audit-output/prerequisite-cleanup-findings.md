# Prerequisite Cleanup — Phase 1 Findings

**Date:** 2026-04-09
**Branch:** `audit-fixes-april-2026`
**Scope:** Read-only discovery — item bank reconciliation + documentation drift inventory

---

## 1. Item Bank Accounting

### Headline Numbers

| Metric | Count |
|--------|-------|
| Total items in `src/data/questions.json` | **1,150** |
| Items with populated `current_skill_id` (live-serving field) | **1,150** (100%) |
| Items with populated `original_skill_id` | **900** (78%) |
| Items with blank `original_skill_id` | **250** (22%) |
| Unique `current_skill_id` values | **45** (matches `SKILL_BLUEPRINT` exactly) |
| Items with `current_skill_id` NOT in canonical set | **0** |
| Items with orphan `original_skill_id` (non-empty, not in canonical) | **0** |
| Items flagged `was_remapped` | **0** (field present but always empty string) |

### Four-Bucket Classification

| Bucket | Definition | Count | Live-eligible? |
|--------|-----------|-------|---------------|
| **(a)** | Blank `original_skill_id`, `current_skill_id` matches canonical | **250** | Yes |
| **(b)** | `original_skill_id` populated and matches canonical | **900** | Yes |
| **(c)** | `original_skill_id` non-empty but NOT in canonical (orphans) | **0** | N/A |
| **(d)** | `current_skill_id` does not match any canonical skill | **0** | No |

**Total: 250 + 900 = 1,150** (sanity check passes)

### Critical Reframing

The audit task defined "unassigned" as items with blank `original_skill_id`. However, the **live code path** (`src/brain/question-analyzer.ts:194`) resolves `skillId` from:

```ts
const resolvedSkillId = q.skillId || q.current_skill_id || QUESTION_SKILL_LOOKUP[questionId];
```

`original_skill_id` is **never consulted** by the live code. Because all 1,150 items have `current_skill_id` populated, **all 1,150 are currently eligible** for the adaptive diagnostic. The 250 "blank `original_skill_id`" items represent a **provenance gap** (we don't know what skill they were originally tagged with before the current mapping), not a live-serving gap.

### Output Files

- `audit-output/unassigned-items.json` — 250 items with blank `original_skill_id` (full item objects: UNIQUEID, question_stem, current_skill_id, cognitive_complexity, DOMAIN, domain_name, skill_nasp_domain, audit_status)
- `audit-output/orphan-skill-items.json` — 0 items (empty array)

### Origin of the "466" Myth

`src/data/question-skill-map.json` contains `totalQuestions: 466` and `mappedQuestions.length: 466`. This is a **legacy fallback** file loaded by `question-analyzer.ts:160–175` as `QUESTION_SKILL_LOOKUP`, used only when both `q.skillId` and `q.current_skill_id` are empty. Since all 1,150 items now have `current_skill_id`, **this fallback is never reached**. The file is dead code.

`CLAUDE.md` inherited the "466" figure from this file and never updated when the bank grew to 1,150. `docs/ISSUE_LEDGER.md:422` already notes: "Regenerate `question-skill-map.json` to cover all 1,150 questions (currently maps only the old 466)."

---

## 2. Per-Skill Coverage Table

All counts are by `current_skill_id` (the live-serving field). The `original_skill_id` column shows the count from the provenance field (always 20 where populated, always 0 where blank).

| Skill | Domain | Items (current) | Items (original) | Flag |
|-------|--------|---------------:|------------------:|------|
| ACA-02 | 2 | 23 | 20 | |
| ACA-03 | 2 | 23 | 20 | |
| ACA-04 | 2 | 26 | 20 | |
| ACA-06 | 2 | 28 | 20 | |
| ACA-07 | 2 | 24 | 20 | |
| ACA-08 | 2 | 28 | 20 | |
| ACA-09 | 2 | 20 | 20 | |
| CON-01 | 1 | 34 | 20 | |
| DBD-01 | 1 | 32 | 20 | |
| DBD-03 | 1 | 33 | 20 | |
| DBD-05 | 1 | 23 | 20 | |
| DBD-06 | 1 | 27 | 20 | |
| DBD-07 | 1 | 26 | 20 | |
| DBD-08 | 1 | 24 | 20 | |
| DBD-09 | 1 | 22 | 20 | |
| DBD-10 | 1 | 20 | 20 | |
| DEV-01 | 2 | 23 | 20 | |
| DIV-01 | 4 | 20 | 20 | |
| DIV-03 | 4 | 21 | 20 | |
| DIV-05 | 4 | 20 | 20 | |
| ETH-01 | 4 | 33 | 20 | |
| ETH-02 | 4 | 25 | 20 | |
| ETH-03 | 4 | 23 | 20 | |
| FAM-02 | 3 | 22 | 20 | |
| FAM-03 | 3 | 20 | 20 | |
| LEG-01 | 4 | 27 | 20 | |
| LEG-02 | 4 | 37 | 20 | |
| LEG-03 | 4 | 22 | 20 | |
| LEG-04 | 4 | 24 | 20 | |
| MBH-02 | 2 | 24 | 20 | |
| MBH-03 | 2 | 38 | 20 | |
| MBH-04 | 2 | 24 | 20 | |
| MBH-05 | 2 | 26 | 20 | |
| PSY-01 | 1 | 22 | 20 | |
| PSY-02 | 1 | 24 | 20 | |
| PSY-03 | 1 | 26 | 20 | |
| PSY-04 | 1 | 22 | 20 | |
| RES-02 | 4 | 23 | 20 | |
| RES-03 | 4 | 24 | 20 | |
| SAF-01 | 3 | 29 | 20 | |
| SAF-03 | 3 | 32 | 20 | |
| SAF-04 | 3 | 27 | 20 | |
| SWP-02 | 3 | 23 | 20 | |
| SWP-03 | 3 | 24 | 20 | |
| SWP-04 | 3 | 32 | 20 | |

**No skill has fewer than 8 items.** Minimum is 20 (ACA-09, DBD-10, DIV-01, DIV-05, FAM-03). Maximum is 38 (MBH-03). The 250 additional items (current minus original) are distributed unevenly across skills, with the heaviest concentration in MBH-03 (+18), LEG-02 (+17), and CON-01 (+14).

---

## 3. Per-Domain Coverage Table

| Domain | Name | Skills | Items | % of Bank | PRAXIS_DISTRIBUTION Target % |
|--------|------|--------|------:|----------:|----------------------------:|
| 1 | Professional Practices | 13 | 335 | 29.1% | 32% |
| 2 | Student-Level Services | 12 | 307 | 26.7% | 23% |
| 3 | Systems-Level Services | 8 | 209 | 18.2% | 20% |
| 4 | Foundations | 12 | 299 | 26.0% | 25% |
| | **Total** | **45** | **1,150** | **100%** | **100%** |

Domain 1 is slightly underrepresented (29.1% vs 32% target). Domain 2 is slightly overrepresented (26.7% vs 23%). These are bank-level proportions and do not affect diagnostic delivery (the adaptive diagnostic picks 1 item per skill regardless of domain proportion).

---

## 4. Live Diagnostic Eligibility Analysis

### Data Loading Pipeline

1. `App.tsx:75` — `CANONICAL_QUESTION_BANK_URL` points to `./src/data/questions.json`
2. `App.tsx:109` — Fetched via `fetch()`, stored in `canonicalQuestions` state
3. `App.tsx:220–222` — Each item mapped through `analyzeQuestion()` to produce `analyzedQuestions`

### Skill Resolution in `analyzeQuestion()` (`src/brain/question-analyzer.ts:194`)

```ts
const resolvedSkillId = q.skillId || q.current_skill_id || QUESTION_SKILL_LOOKUP[questionId];
```

- `q.skillId` — not present in `questions.json` items (the `Question` type allows it but the raw JSON does not set it)
- `q.current_skill_id` — populated for ALL 1,150 items, always matches a canonical skill
- `QUESTION_SKILL_LOOKUP` — legacy fallback from `question-skill-map.json` (466 entries), **never reached** because `current_skill_id` is always truthy

**Result:** All 1,150 items receive a valid `skillId` matching one of the 45 canonical skills.

### Filtering in `buildAdaptiveDiagnostic()` (`src/utils/assessment-builder.ts:460–550`)

```ts
// Line 467: exclude previously-seen questions
const filtered = analyzedQuestions.filter(q => !excludeSet.has(q.id));

// Line 470: group by skill — items without skillId are skipped
if (!q.skillId) continue;

// Line 479: iterate canonical SKILL_BLUEPRINT keys
for (const [skillId, config] of Object.entries(SKILL_BLUEPRINT)) {
    const skillPool = poolBySkill.get(skillId) || [];
    // ...selects 1 initial + up to 2 follow-ups per skill
}
```

Because all 1,150 items have a valid `skillId` after `analyzeQuestion()`, the `if (!q.skillId) continue` guard on line 470 filters out **zero items**.

### Eligibility Summary

| Category | Count |
|----------|------:|
| Total items in bank | 1,150 |
| Items with valid `skillId` after analysis | 1,150 |
| Items eligible for adaptive diagnostic | **1,150** |
| Items filtered out (no skillId) | **0** |
| Items in legacy fallback only (question-skill-map.json) | 466 (but never used) |

**All 1,150 items are live-eligible.** Zero items are filtered out by the diagnostic builder.

---

## 5. Documentation Drift Report

### Critical Findings (affects scoring/psychometrics/B2B story)

| ID | File | Line(s) | Current Claim | Actual State | Notes |
|----|------|---------|---------------|-------------|-------|
| D-01 | `CLAUDE.md` | 116 | "466-question bank" (Item Analysis table) | Bank is 1,150 items | 466 comes from stale `question-skill-map.json` |
| D-02 | `CLAUDE.md` | 434 | "Spicy Mode...pull from the same 466-question bank" | Bank is 1,150 items | Same origin as D-01 |
| D-03 | `docs/HOW_THE_APP_WORKS.md` | audit table row 13 | Audit table says line 191's confidence-weighted scoring claim is "STALE" | **The body claim is ACCURATE.** `weightedAccuracy` is populated end-to-end: confidence recorded in `QuestionCard.tsx:216–236`, aggregated in `useProgressTracking.ts:631` via `calculateWeightedAccuracy()` (`learning-state.ts:28–43`), persisted in Supabase `user_progress.skill_scores` JSONB, read by 4 callers and passed to `getSkillProficiency()`. The audit table row 13 is itself wrong. | Meta-error: the audit table overrides an accurate body claim |
| D-04 | `docs/HOW_THE_APP_WORKS.md` | 690 | Key Numbers: "Inactivity auto-logout: 15 minutes" | `useElapsedTimer.ts:78` fires auto-PAUSE at 120 seconds (2 min), not logout, not 15 min | Already flagged in audit table row 3, but Key Numbers table was never corrected |
| D-05 | `docs/HOW_THE_APP_WORKS.md` | 748–753 | "These appear as small badges on Learning Path tiles" (NASP domains) | `LearningPathNodeMap.tsx` does NOT render NASP badges. Fields exist in `skillPhaseDLookup.ts` and feed the study guide prompt, but no tile UI. | Already flagged in audit table row 6, but body text was never corrected |

### Moderate Findings (affects user-facing claims)

| ID | File | Line(s) | Current Claim | Actual State | Notes |
|----|------|---------|---------------|-------------|-------|
| D-06 | `CLAUDE.md` | 354–369 | Migration table lists 0000–0016 (17 entries) | Actual migrations directory has 19 files: 0000–0018. Missing `0017_simplified_onboarding.sql` and `0018_post_assessment_snapshot.sql`. | Dev following CLAUDE.md will think schema is complete at 0016 |
| D-07 | `docs/HOW_THE_APP_WORKS.md` | 599 | "Vocabulary quizzes are now the Term Sprint feature" | `VocabularyQuizMode.tsx` still exists separately (quiz sizes 5/10/15/20). `TermSprintSession.tsx` is a distinct fixed-20-question rapid-fire mode. They are not the same component. | The "5, 10, 15, or 20" Key Numbers entry (line 689) applies to VocabularyQuizMode, not Term Sprint |
| D-08 | `docs/HOW_THE_APP_WORKS.md` | 585 | Body says `tutorChat` set to `false` | `src/utils/launchConfig.ts:9`: `tutorChat: true` | Already flagged in audit table row 8 (MINOR FIX), but body text was never corrected |
| D-09 | `docs/DISTRACTOR_CLASSIFICATION_HANDOFF.md` | 11 | "45 skills in 4 NASP domains" | Domains are Praxis 5403 domains, not NASP domains. NASP has 10 domains. | `.cursor/rules/domain_rules.mdc:28` explicitly warns against this |

### Minor Findings (internal-only or stylistic)

| ID | File | Line(s) | Current Claim | Actual State |
|----|------|---------|---------------|-------------|
| D-10 | `CLAUDE.md` | 193 | Rate limit at `~line 728` of `studyPlanService.ts` | Actual line is 764 |
| D-11 | `CLAUDE.md` | 169–174 | "No longer needed" fix note reads as global | Applies only to `study-plan-background.ts`; admin endpoints still need service role key |

### Structural Issue: Split-Brain in HOW_THE_APP_WORKS.md

The 2026-04-08 audit table (lines 11–33) correctly identified stale claims in several rows. However, **the document body was not updated in the same change**. This creates a split-brain where:

- The audit table says "STALE" but the prose still publishes the stale claim (D-04, D-05, D-08)
- In one case (D-03), the audit table says "STALE" but the body is actually **correct** — the audit table is wrong

This is the highest-priority editing risk. Readers of the Key Numbers table or feature description sections cannot tell which version is authoritative.

### Verified Accurate (no changes needed)

The following were checked and are correct:

- `docs/HOW_THE_APP_WORKS.md`: question bank = 1,150 (line 661); skill count = 45 (multiple); domain count = 4 (lines 44–52); readiness target = 32/45 at 70% (line 196); master glossary = 396 terms (lines 19, 284, 417, 591, 687); adaptive diagnostic range 45–~90 (line 107); legacy screener = 50, full = 125; all 6 internal status labels and thresholds (lines 167–177); misconception label conditions including OR logic (line 173); redemption round mechanics (lines 223–262); study guide $5 paywall (line 451); Supabase migrations = 19 (0000–0018, line 678)
- `docs/Praxis_5403_Complete_Reference.md`: domain/skill structure is accurate (4 domains, 45 skills, 13+12+8+12)
- `.cursor/rules/domain_rules.mdc`: 4-domain rule correct; skill counts per domain correct
- `.cursor/rules/audit-rubric.mdc`: CAT-9 question count "~1,150" correct; proficiency labels correct
- `README.md`: no factual claims about counts or features
- `content-authoring/README.md`: 1,150 count correct
- `docs/COWORKER_HANDOFF.md`: 1,150 count correct
- `docs/ISSUE_LEDGER.md:422`: correctly identifies 466→1,150 gap as technical debt

---

## 6. Decisions Needed from Carlos

Phase 2 cannot begin until each of these is answered.

### Decision 1: 250 items with blank `original_skill_id`

These items are fully live-eligible via `current_skill_id`. Three options:

- **(a) Backfill** — set `original_skill_id = current_skill_id` for all 250. Simple, makes the field consistent. My recommendation.
- **(b) Move to separate file** — e.g. `questions-unassigned.json`. Would require code changes to still serve them (contradicts "no code changes" constraint).
- **(c) Tag with status** — add `provenance: "backfilled"` or similar. Preserves the audit trail but adds a new field.

### Decision 2: CLAUDE.md "466-question bank" claim

- **(a) Replace with 1,150** in both locations (lines 116 and 434).
- **(b) Replace with 1,150 AND add a note** explaining the legacy `question-skill-map.json` (466 entries) for historical context.

### Decision 3: Proficiency-tier scoring claim (HOW_THE_APP_WORKS.md line 191)

`weightedAccuracy` IS populated end-to-end. The body claim at line 191 is **accurate**.

- **(a) Fix audit table row 13** — change its status from "STALE" to "CONFIRMED" and update its Finding text to reflect the correct code path. Leave body text (lines 190–193) as-is.
- **(b) Remove audit table entirely** — the body is correct and the table is causing confusion. See Decision 6.

### Decision 4: SRS Review Suggestions (HOW_THE_APP_WORKS.md line 165)

The SRS engine code exists (`srsEngine.ts`, `learning-state.ts`) but is not wired to any UI. Already flagged in audit table row 5.

- **(a) Rewrite** — change line 165 to explicitly state this is internal tracking with no user-facing surface. Keep the informational content.
- **(b) Delete** — remove the SRS sentence entirely. Mention only in a "planned features" section if one exists.
- **(c) Keep as-is** — the current wording ("will surface as a Review Suggestions feature in a future update. It does not currently affect practice queuing or any visible badge.") is already accurate about its non-implementation. The audit table row 5 calls it STALE, but the body text is arguably honest about the current state.

### Decision 5: NASP badges on Learning Path tiles (HOW_THE_APP_WORKS.md lines 748–753)

NASP domain mapping data exists in `skillPhaseDLookup.ts` and feeds the study guide prompt. But no badge UI is rendered on Learning Path tiles.

- **(a) Rewrite** — keep the mapping description, remove "These appear as small badges on Learning Path tiles", clarify badges are study-guide-only.
- **(b) Delete section** — remove the entire NASP Domain Alignment section.

### Decision 6: Published audit table in HOW_THE_APP_WORKS.md (lines 11–33)

The audit table has 17 rows. Several body paragraphs were never corrected to match the audit findings, creating the split-brain issue documented above. One row (13) is itself wrong.

- **(a) Rewrite body paragraphs + delete audit table** — fix all stale body text in place, then remove the audit table since it will have served its purpose. Cleanest end state.
- **(b) Rewrite body paragraphs + keep audit table as resolved** — update each audit row to show "RESOLVED" and a date, keep for historical reference.
- **(c) Keep audit table as-is** — only fix row 13 (confidence-weighted scoring). Leave body text for a separate pass. Smallest change.

### Decision 7: Orphan skill items

**None found.** Bucket (c) is empty. No decision needed.

### Decision 8: Changelog destination

- **(a) Both** — update `CLAUDE.md` (bottom) AND add an entry to `docs/ISSUE_LEDGER.md`.
- **(b) CLAUDE.md only** — simpler.
- **(c) ISSUE_LEDGER.md only** — keeps CLAUDE.md focused on developer instructions.

---

*Phase 1 is complete. Awaiting Carlos's decisions before proceeding to Phase 2.*
