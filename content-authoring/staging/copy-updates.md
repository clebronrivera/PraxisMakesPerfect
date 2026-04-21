# C5 — Copy Update Spec (Hardcoded Strings)

**Status:** Draft complete — pending SME review (voice + accuracy).
**Blocks code task:** K4 (hardcoded strings update).
**Scope:** Every user-visible string referencing "45 skills" or the old readiness target (32) must be updated to the new values under locked Decision 0.1B.

---

## Authoritative numbers under Taxonomy v2

| Concept | Old value | New value |
|---------|-----------|-----------|
| Total skills | 45 | **51** |
| Domain 1 skills | 13 | **15** |
| Domain 2 skills | 12 | **14** |
| Domain 3 skills | 8 | **9** |
| Domain 4 skills | 12 | **13** |
| Readiness target (Math.ceil(total × 0.7)) | 32 | **36** |
| Screener length (min / max) | 50 Q fixed | **55 primaries + adaptive fallbacks (55–110 Q)** |
| Full adaptive diagnostic range | 45–90 | **51–~130** (adaptive loop dependent) |
| Follow-ups per skill (primaries only) | up to 2 | up to 2 (unchanged) |

**Canonical source of truth:** `src/utils/skillProficiency.ts` — updating `TOTAL_SKILLS = 51` there auto-computes `READINESS_TARGET = 36`. Everywhere else in this spec, the number should be kept as a literal-in-prose update (no dynamic reference required since these are marketing/onboarding prose surfaces).

---

## Replacement table

Format: `file:line | current copy (verbatim) | replacement copy | reviewer note`

### High-priority user-visible copy (marketing + onboarding + FAQ + tutor knowledge)

| # | File:Line | Current copy | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 1 | `src/components/LoginScreen.tsx:78` | `detail: '45 skills · 1,150 items · 4 domains'` | `detail: '51 skills · 1,150+ items · 4 domains'` | Exam card on login screen. Item count will grow as C7 lands; "1,150+" is safe. |
| 2 | `src/components/LoginScreen.tsx:487` | `An adaptive diagnostic that maps your exact knowledge gaps across all 45 skills` | `An adaptive diagnostic that maps your exact knowledge gaps across all 51 skills` | Hero paragraph. |
| 3 | `src/components/LoginScreen.tsx:493` | `'45 skills tracked'` | `'51 skills tracked'` | Proof pill. |
| 4 | `src/components/LoginScreen.tsx:557` | `desc: 'Adaptive diagnostic maps all 45 skills in one session.'` | `desc: 'Adaptive diagnostic maps all 51 skills in one session.'` | Journey card "01 Diagnose". |
| 5 | `src/components/HelpFAQ.tsx:20` | `The assessment covers all 45 skills across 4 domains (45–90 questions total).` | `The assessment covers all 51 skills across 4 domains (51–~130 questions total with adaptive follow-ups).` | FAQ answer. Verify range wording with K15 owner. |
| 6 | `src/components/StudyModesSection.tsx:334` | `Complete the adaptive diagnostic to unlock targeted skill-by-skill practice across all 45 skills.` | `Complete the adaptive diagnostic to unlock targeted skill-by-skill practice across all 51 skills.` | Locked state message. |
| 7 | `src/components/StudyModesSection.tsx:617` | `sublabel: 'Target any of 45 skills — sorted weakest to strongest'` | `sublabel: 'Target any of 51 skills — sorted weakest to strongest'` | By Skill practice tile. |
| 8 | `src/components/HomeDashboardMock.tsx:137` | `supporting: \`Goal: 32 skills ${PROFICIENCY_META.proficient.label}\`,` | `supporting: \`Goal: 36 skills ${PROFICIENCY_META.proficient.label}\`,` | Mock dashboard demo copy. |

### Tutor app-knowledge (injected into every AI Tutor prompt)

| # | File:Line | Current copy | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 9 | `src/data/app-guide.ts:14` | `- READINESS TARGET: 32 of 45 skills at Demonstrating (≥80%).` | `- READINESS TARGET: 36 of 51 skills at Demonstrating (≥80%).` | APP_KNOWLEDGE_CORE — affects every tutor prompt. |
| 10 | `src/data/app-guide.ts:28` | `Starts with 45 questions (one per skill), then adapts: wrong answers trigger follow-up questions. Minimum 45, maximum ~90 questions.` | `Starts with 51 questions (one per skill), then adapts: wrong answers trigger follow-up questions. Minimum 51, maximum ~130 questions.` | Adaptive Diagnostic description. Range updated for adaptive fallback loop. |
| 11 | `src/data/app-guide.ts:64` | `READINESS TARGET: 32 of 45 skills at Demonstrating (≥80%) for exam readiness.` | `READINESS TARGET: 36 of 51 skills at Demonstrating (≥80%) for exam readiness.` | APP_GUIDE_CONTENT block. |
| 12 | `src/data/app-guide.ts:82` | `A: You need 80% accuracy on a skill to reach "Demonstrating." For overall exam readiness, you need 32 of your 45 skills at Demonstrating.` | `A: You need 80% accuracy on a skill to reach "Demonstrating." For overall exam readiness, you need 36 of your 51 skills at Demonstrating.` | FAQ in tutor guide. |
| 13 | `src/data/app-guide.ts:112` | `A: A 45–90 question baseline assessment.` | `A: A 51–~130 question baseline assessment with an adaptive follow-up loop.` | FAQ in tutor guide. |
| 14 | `src/data/app-guide.ts:136` | `A: 45 skills across 4 domains.` | `A: 51 skills across 4 domains.` | FAQ in tutor guide. |
| 15 | `src/data/app-guide.ts:139` | `A: Over 1,100 practice questions across all 45 skills.` | `A: Over 1,200 practice questions across all 51 skills.` | Update after C7 lands; item-count verification required before ship. |

### Tutorial slides (shown to new users)

| # | File:Line | Current copy | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 16 | `src/data/tutorial-slides.ts:19` | `'450+ practice questions across 45 skills'` | `'1,200+ practice questions across 51 skills'` | Welcome slide. Numbers were already stale (actual count is 1,150+). Fix in same pass. |
| 17 | `src/data/tutorial-slides.ts:28` | `It tests all 45 skills with 45–90 questions and builds your baseline profile.` | `It tests all 51 skills with 51–~130 questions and builds your baseline profile.` | Diagnostic slide. |
| 18 | `src/data/tutorial-slides.ts:118` | `This assessment maps your knowledge across all 45 skills in 4 domains.` | `This assessment maps your knowledge across all 51 skills in 4 domains.` | DIAGNOSTIC_TUTORIAL_SLIDES. |
| 19 | `src/data/tutorial-slides.ts:121` | `'45 skills across 4 Praxis 5403 domains'` | `'51 skills across 4 Praxis 5403 domains'` | DIAGNOSTIC_TUTORIAL_SLIDES bullet. |
| 20 | `src/data/tutorial-slides.ts:130` | `That's why the test can range from 45 to 90+ questions.` | `That's why the test can range from 51 to ~130 questions with adaptive follow-ups.` | DIAGNOSTIC_TUTORIAL_SLIDES description. |
| 21 | `src/data/tutorial-slides.ts:133` | `'Start with 1 question per skill (45 total)'` | `'Start with 1 question per skill (51 total)'` | DIAGNOSTIC_TUTORIAL_SLIDES bullet. |

### Data-file metadata

| # | File:Line | Current copy | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 22 | `src/data/master-glossary.json:4` | `"Master glossary of all vocabulary terms across all 45 skills in Praxis Makes Perfect (Praxis 5403)..."` | `"Master glossary of all vocabulary terms across all 51 skills in Praxis Makes Perfect (Praxis 5403)..."` | Description field. Regenerate totalTerms after C3 vocab merges. |
| 23 | `src/data/skill-vocabulary-map.json:3` | `"totalSkills": 45,` | `"totalSkills": 51,` | Metadata field. Must align with addition of 6 new skills. |

### Code comments (internal, not user-visible — but worth updating for maintainer clarity)

| # | File:Line | Current copy | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 24 | `src/utils/assessment-builder.ts:8` | `// Maps each of the 45 skills to its domain and slot count.` | `// Maps each of the 51 skills to its domain and slot count.` | Update in K3b (new skill blueprint entries land here). |
| 25 | `src/utils/assessment-builder.ts:443` | `/** 45 questions — one per skill, interleaved by domain. */` | `/** 51 questions — one per skill, interleaved by domain (primaries only). */` | Update in K3b/K15. Clarifies that fallback questions are separate from initial queue. |
| 26 | `src/utils/assessment-builder.ts:450` | `* Build an adaptive diagnostic: 1 initial question per skill (45 total),` | `* Build an adaptive diagnostic: 1 initial primary question per skill (51 total),` | JSDoc block in same file. |
| 27 | `src/data/misconception-taxonomy.ts:2` | `// Stage 2: Extended to all 45 progress skills — 98 entries across 48 unique metadata skills.` | `// Stage 2: Extended to all 51 progress skills — ~104 entries across ~54 unique metadata skills.` | Recount after C3/K3c ingest new misconception entries. |
| 28 | `src/types/tutorChat.ts:136` | `readinessRatio: number;                   // demonstrating / 32 (70% of 45)` | `readinessRatio: number;                   // demonstrating / 36 (70% of 51)` | Comment only — field is dynamic. |

### Canonical constant (single source of truth)

| # | File:Line | Current code | Replacement | Reviewer note |
|---|-----------|-------------|-------------|---------------|
| 29 | `src/utils/skillProficiency.ts:19` | `export const TOTAL_SKILLS = 45;` | `export const TOTAL_SKILLS = 51;` | **Single update propagates to `READINESS_TARGET = 36` via `Math.ceil(TOTAL_SKILLS * READINESS_GOAL_PCT)`**. This is the canonical change; all dynamic consumers pick it up automatically. |
| 30 | `src/utils/skillProficiency.ts:21` | `export const READINESS_TARGET = Math.ceil(TOTAL_SKILLS * READINESS_GOAL_PCT); // 32` | `export const READINESS_TARGET = Math.ceil(TOTAL_SKILLS * READINESS_GOAL_PCT); // 36` | Update trailing comment only — the computation is already dynamic. |

---

## Dynamic values (do NOT hardcode — verified they reference taxonomy at runtime)

- `App.tsx` → `readinessTarget = Math.ceil(totalSkills * 0.7)` — already dynamic, no edit needed.
- Anywhere using `PROGRESS_SKILLS.length` — already dynamic.
- Anywhere computing domain skill count from `getProgressSkillsForDomain(id).length` — already dynamic.
- `skillProficiency.ts#TOTAL_SKILLS` / `READINESS_TARGET` — already consumed as imports in `types/tutorChat.ts`, `HomeDashboardMock.tsx`, `ResultsDashboard.tsx`, `ScreenerResults.tsx`. After update #29, these surfaces pick up new values automatically.

---

## Files intentionally NOT included

- `src/data/skill-phase-d.json:155` — "45-day window" references the FERPA parent-records access timeline, NOT 45 skills. Do not touch.
- `src/data/questions.json.backup.*` — backup files; regenerated by K3b anyway.
- Any `PROGRESS_SKILLS.length` / `TOTAL_SKILLS` imports — dynamic; no edit.

---

## K4 execution order

1. **Update canonical constant (#29, #30)** — unblocks dynamic consumers.
2. **Run audit command** below to confirm no new "45 skills" / "32" stragglers appeared in branches merged during staging:
   ```bash
   rg -n '\b45\b.*skills?|skills?.*\b45\b|\b32\b.*skills?|mastery.*\b32\b|32 of 45|45–90 questions?|45\s*questions?' src/ --type=ts --type=tsx --type=json
   ```
3. **Apply updates #1–#28** in a single PR so reviewer sees the full sweep.
4. **Update `docs/HOW_THE_APP_WORKS.md`** as part of same PR (per CLAUDE.md mandatory-update rule) — this is tracked as C6.
5. **Verify by running the app** and screenshotting:
   - Login screen hero + proof pills
   - Home dashboard "Skills to reach goal" supporting text
   - Practice Hub By Skill tile sublabel
   - Help page FAQ rendering
   - Tutorial walkthrough slides 1–4 + diagnostic tutorial 1–2
6. **Regression check:** confirm the AI Tutor still answers "How many skills?" with 51 (verifies app-guide.ts injection path).

---

## Reviewer note on screener length wording

The Decision 0.3 locked value of "55 primaries + adaptive fallbacks" is technically correct but user-facing copy that reads "51–~130 questions" is more approachable than exposing the primary/fallback distinction. Per Decision 0.2-modified UX principle (non-punitive, no jargon), most surfaces use the range; only the K15 engine and the tutor app-knowledge reference the primary/fallback mechanic directly. Final wording to be reviewed with Carlos before K4 ships.
