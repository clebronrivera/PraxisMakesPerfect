# Refactoring Plan: Learning Science Alignment

## Context

The codebase is a deployed, working learning platform for the Praxis 5403 exam. It was built by a solo developer via AI-assisted "vibe coding" across multiple LLMs, resulting in a feature-rich but architecturally inconsistent app. The user consulted Gemini and ChatGPT for refactoring advice, but their recommendations contain factual errors about the codebase. This plan corrects those errors and proposes changes grounded in what the code *actually* does.

**The goal:** Align the codebase with learning science principles (skill modeling, practice engine, measurement system) without breaking the live app or inventing unnecessary complexity.

**Non-goal for this phase:** No schema renames on core shared contracts. No router migration. No component splitting of App.tsx.

**Organizing principle:** Every item in this plan serves exactly one of three purposes:

1. **Fix wrong data** — correct a measurement integrity problem that pollutes downstream decisions
2. **Prevent crashes** — harden a production boundary that is actively causing runtime failures
3. **Add low-risk learning value** — introduce a genuinely missing capability without destabilizing what works

Anything that does not clearly serve one of those three purposes is deferred.

---

## Corrections to LLM Advisory

Confidence levels: **Verified** = confirmed by reading the actual source. **High confidence** = supported by code inspection but should be re-verified during implementation. **Documented** = stated in CLAUDE.md but not independently verified from source.

| Claim | Assessment | Basis |
|---|---|---|
| "The app uses flat percentage math for mastery" | **Partially wrong.** `learning-state.ts` exports `calculateWeightedAccuracy()` with confidence modifiers and `checkPrerequisitesMet()` with DAG traversal. However, the UI layer (`skillProficiency.ts`) uses flat thresholds on raw `score`. The gap is real — the wiring is missing — but the claim that no weighted model exists is wrong. | **Verified** — read `learning-state.ts:14-43` and `skillProficiency.ts:16-21` |
| "You need an ELO-style scoring system" | **Wrong model for this use case.** ELO rates competitive entities against each other (chess). For a solo learner, the existing confidence-weighted accuracy is the appropriate approach. | Conceptual assessment — no file evidence needed |
| "TOTAL_SKILLS = 45 is scattered everywhere" | **Partially wrong.** `progressTaxonomy.ts` PROGRESS_SKILLS array has 46 `skillId` entries (grep count). The "45" appears in CLAUDE.md docs and some comments. Not a scattered-magic-number problem, but the count discrepancy itself needs investigation before any threshold work. | **Verified** — grep count on `progressTaxonomy.ts` |
| "Thresholds are hardcoded across 20 files" | **Wrong.** Thresholds are in two known files: `skillProficiency.ts` (0.8/0.6) and `studyPlanTypes.ts` (SKILL_STATUS_THRESHOLDS). | **Verified** — read both files |
| "Create a centralized appConfig.ts for all constants" | **Unnecessary indirection.** The thresholds are already in purpose-specific files. Adding another layer doesn't help a solo dev. | Assessment based on verified threshold locations |
| "attemptHistory tracks real per-answer data" | **Bug found.** `useFirebaseProgress.ts:564-570` reconstructs SkillAttempt objects from the `history` boolean array, stamping all entries with the current answer's confidence and timestamp. This means `weightedAccuracy` is computed from synthetic data, not real per-attempt history. | **Verified** — read `useFirebaseProgress.ts:564-571` |
| "Add elo_score column to user_progress" | **Wrong approach.** Skill-level data lives in the `skill_scores` JSONB blob inside `user_progress`. New per-skill fields belong on `SkillPerformance`, not as top-level columns. | **Verified** — read `useFirebaseProgress.ts:574-583` and `learning-state.ts:64-75` |
| "Study plan generation uses service role key" | **Outdated.** CLAUDE.md states the service role dependency was eliminated. | **Documented** — stated in CLAUDE.md, not independently verified from function source |

---

## Priority 1: Fix the Broken Confidence-Weighted Accuracy Pipeline

**Purpose:** Fix wrong data.

### What it does
Wire the confidence-weighted accuracy that `learning-state.ts` already computes into the UI proficiency layer, and fix the fake `attemptHistory` bug that undermines it.

### Why it matters
This is the single highest-value change. The codebase already has the right measurement model built, but a wiring bug prevents it from working. Fixing this achieves 80% of what Gemini's "ELO scoring" suggestion aimed for, with zero new algorithms. It corrects a real data integrity problem — not a cosmetic issue — and it improves the quality of every downstream decision around practice selection, proficiency labeling, and study plan generation.

### Why now
Because anything added later — especially SRS or more advanced skill logic — will sit on top of this data. If the history is wrong, the next layers are built on bad input. This must be the foundation.

### The Bug (Critical)
`useFirebaseProgress.ts:564-570`:
```typescript
const recentAttempts: SkillAttempt[] = newHistory.map((correct, idx) => ({
  questionId: questionId || `unknown-${Date.now()}-${idx}`,
  correct,
  confidence: confidence,  // <-- SAME confidence for ALL entries
  timestamp: Date.now(),   // <-- SAME timestamp for ALL entries
  timeSpent: timeSpent || 0
}));
```
This reconstructs fake attempts from the boolean `history` array (last 5 results), stamping them all with the current answer's confidence and timestamp. If you answered low-confidence yesterday and high-confidence today, all entries get today's confidence. The `weightedAccuracy` computed from these fakes is unreliable.

### Fix
1. **Store real attemptHistory** in `SkillPerformance`. On each answer, append a real `SkillAttempt` (with that answer's actual confidence, timestamp, timeSpent, questionId) and cap at 20 entries.
2. **Compute weightedAccuracy from real history** instead of synthesized fakes.
3. **Update `getSkillProficiency()`** in `skillProficiency.ts` to accept and use `weightedAccuracy` when available, falling back to raw `score` for legacy data.

This change affects the **UI proficiency layer only** — specifically `getSkillProficiency()` in `skillProficiency.ts`, which drives tier labels on the Results Dashboard, domain cards, and skill panels. It does not change the internal `learningState` calculation in `learning-state.ts`, the study plan preprocessor thresholds, or any Supabase-side scoring. Those systems continue to use their own inputs independently.

### Files to modify
- `src/hooks/useFirebaseProgress.ts` — lines 564-571: replace fake synthesis with real append
- `src/brain/learning-state.ts` — `SkillPerformance` interface: no changes needed (attemptHistory already declared at line 72)
- `src/utils/skillProficiency.ts` — `getSkillProficiency()`: add optional `weightedAccuracy` parameter

### Backward compatibility
- Existing users have `attemptHistory: undefined` or empty. The function falls back to raw `score` (current behavior). No data loss.
- The `history: boolean[]` field stays for streak/consecutive tracking. We're adding to, not replacing.

### Dependencies
None. This is self-contained.

### Tests (ship with this change — not after it)
Once you change measurement logic, you need a way to prove you did not quietly break proficiency classification. This is the first real logic change in the plan. If you do not lock it down here, every later change gets riskier.

After implementation, install Vitest and write the first smoke tests:
- Install: `vitest` as dev dependency, create `vitest.config.ts`
- Create `tests/skillProficiency.test.ts`:
  - Thresholds return correct tier for boundary values (0.59, 0.60, 0.79, 0.80)
  - When `weightedAccuracy` is provided and differs from `score`, the function uses `weightedAccuracy`
  - When `weightedAccuracy` is undefined, falls back to `score` (legacy behavior)
  - `attempts === 0` always returns `'unstarted'` regardless of other inputs

### Verification
- `npm test` passes the new skillProficiency tests
- Deploy locally with `npm run dev:netlify`
- Answer 5+ questions with varying confidence levels
- Check Supabase `user_progress.skill_scores` JSONB — confirm `attemptHistory` contains real per-answer objects with different timestamps/confidences
- Check that UI proficiency labels still display correctly on ResultsDashboard

---

## Priority 2: Harden the Tutor API Boundary with Zod

**Purpose:** Prevent crashes.

### What it does
Add runtime schema validation to `parseClaudeResponse()` in `api/tutor-chat.ts` (line 103) using Zod (already in package.json at v4.3.6). Replace silent null fallbacks with structured, validated responses.

### Why it matters
`api/tutor-chat.ts` is the most actively changed file (6+ commits/month) and sits at the boundary of unpredictable Claude output. The current `parseClaudeResponse()` (lines 103-163) does basic JSON extraction with artifact type normalization, but has no schema validation — if Claude emits a shape the code doesn't expect, nulls leak to the frontend. The tutor is one of the most volatile surfaces in the app. Zod belongs here because this is exactly where untrusted structured output should be validated and normalized before the rest of the app touches it.

### Why now
Because this is a production-risk fix. It is one of the few things here that can immediately reduce breakage in a user-facing feature. It does not depend on any other priority and can run in parallel with Priority 1.

### Implementation note: keep the parser extractable
The implementation will be cleaner if the core validation logic inside `parseClaudeResponse()` is structured as a pure function (or a clearly isolated helper) rather than staying entangled with the HTTP handler. The function is already standalone (lines 103-163), which is good — the Zod schemas and normalization logic should stay inside it or in a small helper it calls, so that the test file can import and exercise the parser directly without needing to mock the full Netlify function context.

### Specific gaps to close
1. **`parseClaudeResponse()` (lines 103-163):** Add Zod schema for `ClaudeResponseShape`. On validation failure, return a safe fallback message instead of forwarding nulls. The current catch block (line 156) already returns a fallback for non-JSON — extend this pattern to handle valid-JSON-but-wrong-shape.
2. **Artifact payload normalization:** Validate that artifact `payload` matches the expected shape for its `type` (vocabulary-list needs `terms[]`, fill-in-blank needs `wordBank[]`, etc.). The `CANONICAL` map (lines 121-132) handles type names but not payload shapes.
3. **Quiz question assembly:** Guard against `correct_answer` being null before `.split(',')`.
4. **Message history sanitization:** Filter out messages with null/empty `content` before sending to Claude API.

### Files to modify
- `api/tutor-chat.ts` — `parseClaudeResponse()`, quiz assembly, message history loop
- `src/components/ArtifactCard.tsx` — add runtime type guards before `as Type` casts (6 locations)

### Files NOT to modify
- `src/types/tutorChat.ts` — the TypeScript types are fine. Zod schemas supplement them at runtime, they don't replace them.

### Dependencies
None. Can be done in parallel with Priority 1.

### Tests (ship with this change — not after it)
Parser hardening without parser tests is incomplete. The logic and the test should land together. These are not broad tests — they are targeted protections for the exact failure modes the parser is supposed to handle.

- Create `tests/parseClaudeResponse.test.ts`:
  - Valid JSON with all fields parses correctly
  - JSON with `content: null` returns fallback content string
  - JSON with `suggestedFollowUps: "string"` (wrong type) normalizes to array
  - Completely malformed string (not JSON) returns safe fallback
  - Artifact with unknown `type` is stripped or normalized
  - Artifact with `study-activity` wrapper is unwrapped correctly

### Verification
- `npm test` passes the new parseClaudeResponse tests
- Manual test: tutor chat still works end-to-end with normal inputs
- Confirm valid artifact types still render correctly in ArtifactCard

---

## Priority 3: Add Spaced Repetition Scheduling (Shadow Mode)

**Purpose:** Add low-risk learning value.

### What it does
Create an SRS engine that computes `nextReviewDate` per skill and stores it in the existing `SkillPerformance` JSONB blob. The data is collected in shadow mode — computed and stored, but does NOT drive UI behavior until a later phase.

### Why it matters
The codebase has zero time-based scheduling. SRS is the single most impactful learning science addition because it addresses the forgetting curve. This is genuinely missing — unlike ELO, which duplicates existing functionality. Shadow mode is the right move: it lets you collect useful future-facing review data while keeping today's product behavior completely stable. It adds learning value without rewriting the current mastery system and preserves backward compatibility by using optional fields.

### Why after Priority 1
Because both touch the same progress-writing path (`updateSkillProgress()` in `useFirebaseProgress.ts`). Priority 1 fixes the attemptHistory write path; Priority 3 adds the SRS call to the same function. SRS should not be layered onto a broken attempt pipeline. If the history is wrong, the scheduling built on it is unreliable. Priority 1 must land first.

### Scope: skill-level, not item-level
SRS scheduling is tracked **per skill**, not per question. The `srsBox`, `nextReviewDate`, and `lastReviewDate` fields live on `SkillPerformance` inside the `skill_scores` JSONB blob — one set of SRS fields per skill, updated on every answer for that skill. There is no per-question scheduling. This is the right granularity for this exam prep app's skill taxonomy: users need to know which *skills* to revisit, not which individual questions.

### Explicit non-goals for this priority
Shadow mode means exactly that. This priority must NOT:
- Change readiness calculations or readiness labels
- Change study plan generation inputs or outputs
- Change tutor behavior or tutor context assembly
- Change any dashboard display, card, or widget
- Add any visible UI element

If SRS data is being stored but nothing in the live app reads it, the priority is working as intended.

### Design decisions
- **Algorithm:** Modified Leitner box (simpler than SM-2, appropriate for a finite-content exam prep app). 5 boxes with intervals: 1 day, 3 days, 7 days, 14 days, 30 days.
- **Storage:** New optional fields on `SkillPerformance` interface in `learning-state.ts`:
  ```typescript
  srsBox?: number;           // 0-4 (Leitner box)
  nextReviewDate?: string;   // ISO date string
  lastReviewDate?: string;   // ISO date string
  ```
- **No new tables.** Data lives inside the existing `skill_scores` JSONB in `user_progress`. This avoids creating new data contracts.
- **No mandatory queue.** This priority only computes and stores. A later phase can add a voluntary "Review Suggestions" card.

### Phase 3A: Engine + Storage (This Priority)
1. Create `src/utils/srsEngine.ts` — pure function: `calculateSrsUpdate(currentBox, isCorrect) => { newBox, nextReviewDate }`
2. Update `SkillPerformance` interface in `learning-state.ts` — add optional SRS fields
3. Update `updateSkillProgress()` in `useFirebaseProgress.ts` — call SRS engine after each answer, store results alongside existing data

### Phase 3B: UI Surface (Future Priority — NOT in this plan)
- Add "Review Suggestions" card to home dashboard showing skills past their `nextReviewDate`
- Never make it mandatory or blocking

### Cold start / migration
- Existing users have `srsBox: undefined`. Treat as box 0 (needs review within 1 day). First correct answer moves them to box 1.
- Users with existing high accuracy but no SRS data: their first interaction populates the fields. No retroactive calculation needed because SRS is about *future* scheduling, not past performance.

### Files to create
- `src/utils/srsEngine.ts` — pure, testable, ~40 lines

### Files to modify
- `src/brain/learning-state.ts` — add 3 optional fields to `SkillPerformance`
- `src/hooks/useFirebaseProgress.ts` — add SRS call in `updateSkillProgress()` after line 597

### Dependencies
- **Priority 1 must land first.** Both modify `updateSkillProgress()` in `useFirebaseProgress.ts`. Doing them out of order risks merge conflicts or writing SRS data on top of the broken attempt pipeline.

### Tests (ship with this change — not after it)
SRS logic is simple enough to test cheaply and important enough that you should not trust it untested. Box advancement, reset rules, max cap behavior, interval dates, and undefined defaults are all deterministic. If those rules are wrong, the stored review schedule becomes unreliable.

- Create `tests/srsEngine.test.ts`:
  - Correct answer advances box (0→1, 1→2, etc.)
  - Wrong answer resets to box 0
  - Box 4 (max) stays at 4 on correct
  - `nextReviewDate` matches expected interval for each box level
  - `undefined` currentBox treated as box 0

### Verification
- `npm test` passes the new srsEngine tests
- Answer questions across multiple skills
- Check `user_progress.skill_scores` JSONB in Supabase — confirm `srsBox`, `nextReviewDate`, `lastReviewDate` are populated
- Confirm existing UI behavior is unchanged (shadow mode — no visible difference)

---

## Priority 4: Add knowledgeType to Skill Taxonomy

**Purpose:** Add low-risk learning value (structural enrichment).

### Pre-step: Verify canonical skill count (required before classification)
The skill count is currently inconsistent across the codebase. `progressTaxonomy.ts` has 46 `skillId` entries by grep count, CLAUDE.md says 45 in multiple places, and the earlier version of this plan said 41. Before classifying every skill with a `knowledgeType`, you must resolve this discrepancy. Otherwise the classification will be applied to the wrong set of skills — some may be duplicates, deprecated, or from a stale taxonomy.

Do this before writing any `knowledgeType` values:
1. Count the unique `skillId` entries in `PROGRESS_SKILLS` array in `progressTaxonomy.ts`
2. Cross-reference against `skill-map.ts` (which `learning-state.ts` imports for prerequisite resolution)
3. Cross-reference against `skillIdMap.ts` (which bridges progressTaxonomy IDs to skill-metadata-v1 IDs)
4. Identify any duplicates, deprecated entries, or IDs present in one system but not the other
5. Document the canonical count and any discrepancies found

The classification table in this priority should cover exactly the canonical set — no more, no fewer.

### What it does
Add a `knowledgeType` classification to every skill definition, enabling future differentiated practice (generative recall for definitions, immediate MCQ for application questions).

### Why it matters
Right now the system treats all skills identically in terms of practice modality. A skill taxonomy that treats every skill the same limits your ability to later support generative recall, step ordering, concept comparison, or scenario-first practice in a principled way. This enriches the skill model so future features can distinguish between knowledge types. It is low risk because the field is optional and unused at first.

### Why not earlier
Because it does not fix a bug or reduce runtime risk. It is important, but not as urgent as measurement integrity (Priority 1) or tutor stability (Priority 2).

### Knowledge types
- `'definition'` — "What is FAPE?" / "Define LRE"
- `'procedure'` — "Steps of an FBA" / "RIOT Framework"
- `'concept-relationship'` — "Difference between IEP and 504"
- `'application'` — "Which law applies in scenario X?"

### Files to modify
- `src/types/content.ts` — add `knowledgeType?: 'definition' | 'procedure' | 'concept-relationship' | 'application'` to `Skill` interface
- `src/utils/progressTaxonomy.ts` — add `knowledgeType` to `ProgressSkillDefinition` interface and classify each skill

### Files NOT to modify (yet)
- `QuestionCard.tsx` — the generative recall UI is a separate future task
- `PracticeSession.tsx` — no behavior changes in this priority
- `skill-metadata-v1.ts` — metadata IDs are a separate system; knowledgeType goes on the progress taxonomy

### Dependencies
Requires canonical skill-count verification (the pre-step above) before classification work begins. The pre-step itself has no file conflicts with other priorities and can run anytime, but `knowledgeType` values must not be written until the taxonomy is reconciled.

### Honest assessment
Classifying the skills requires domain knowledge about the Praxis 5403. The classifications should be reviewed by the user (a domain expert) rather than auto-generated by an LLM. Recommend generating a first draft and presenting it as a table for review.

### Verification
- TypeScript compiles without errors
- No runtime behavior changes (field is optional, nothing reads it yet)
- Manual review of classifications against Praxis 5403 blueprint

---

## Priority 5: Rename useFirebaseProgress

**Purpose:** Reduce confusion after the meaningful logic work is done.

### What it does
Surgical rename of the misleading hook filename. Zero logic changes.

- Rename `src/hooks/useFirebaseProgress.ts` → `src/hooks/useProgressTracking.ts`
- Update all imports (App.tsx at project root, plus any other consumers)
- Update the exported function name if it's also called `useFirebaseProgress`

### Why it matters
This is purely cognitive load reduction. The hook is 874 lines of Supabase logic wearing a Firebase name. For a solo dev navigating via AI tools, the name is an active source of confusion. It makes the codebase easier to reason about and reduces naming confusion during future refactors.

### Why last
Because it is cosmetic, not behavioral. It does not improve runtime behavior. Both Priority 1 and Priority 3 modify this file's internals — renaming it too early would create unnecessary churn and merge pain. Rename after the logic changes land.

### Files to modify
- `src/hooks/useFirebaseProgress.ts` → rename to `src/hooks/useProgressTracking.ts`
- `App.tsx` (project root) — update import path
- Any other files importing useFirebaseProgress (grep to find all)

### Dependencies
- Should come after Priorities 1 and 3 (both modify this file's internals; rename after the logic changes land to avoid merge pain)

### Verification
- `npm run build` succeeds
- `npm test` still passes all tests from Priorities 1-3
- App boots without import errors

---

## Priority 6: Update Documentation

**Purpose:** Keep implementation and explanation aligned.

### What it does
Update `docs/HOW_THE_APP_WORKS.md` per the CLAUDE.md mandatory update rule, plus any other docs that reference changed behavior.

### Why it matters
Once you change how proficiency, SRS, and taxonomy work, the written system description becomes part of the product's operational truth. If the code and the docs drift apart, future work gets sloppier. This is especially important in an AI-assisted workflow, because the docs often become the reference layer for future prompts and code changes. It prevents future confusion without changing runtime behavior.

### Triggered updates
- **Priority 1:** If `getSkillProficiency()` signature changes, update the proficiency threshold description. Document that weighted accuracy is now used when available.
- **Priority 3:** Add mention of SRS scheduling in the skill proficiency section. Document shadow-mode behavior and the Leitner box intervals.
- **Priority 4:** Document the knowledgeType taxonomy and its intended future use.
- **Priority 5:** Update any doc references to `useFirebaseProgress` → `useProgressTracking`.

### Verification
- All mentions of proficiency thresholds, SRS, and knowledgeType in docs match the code
- CLAUDE.md mandatory update rules are satisfied

---

## What We Are NOT Doing (and Why)

The plan is focused on three things: fixing incorrect measurement input, hardening the tutor boundary, and adding one real new learning-science feature in a low-risk way. Everything below is skipped because it does not clearly serve one of those three purposes right now.

| Suggestion | Category | Why skipped |
|---|---|---|
| **ELO scoring system** | Over-engineered replacement | Wrong model. ELO rates entities against each other competitively. The codebase already has confidence-weighted accuracy — it just needs wiring (Priority 1). |
| **Bayesian Knowledge Tracing** | Over-engineered replacement | Over-engineered for a finite-content exam prep app. The existing threshold + confidence weighting system is appropriate for the use case. |
| **Centralized appConfig.ts** | Structural cleanup, weak payoff | Thresholds are already in purpose-specific files (`skillProficiency.ts`, `studyPlanTypes.ts`). Adding another file means one more place to check without reducing runtime risk. |
| **Router migration** | Structural cleanup, weak payoff | State-based navigation works for a solo dev. No back-button support is annoying but not breaking. Router adds file scatter that makes AI-assisted coding harder. No analytics, no tests, and no shareable URLs depend on it right now. |
| **Component splitting of App.tsx** | Structural cleanup, weak payoff | It's 1,742 lines but stable. The 18-mode switchboard is ugly but not fragile. Splitting scatters logic across files without reducing runtime risk. |
| **Mandatory Daily Review Queue** | Product decision, not engineering | SRS data infrastructure (Priority 3) enables this later. Making practice mandatory changes the product's UX contract with users. That is a product call, not an engineering one. |
| **Moving daily counts/study time to Supabase** | Valid tech debt, lower priority | These are ephemeral convenience metrics. Losing them on browser switch is annoying but not harmful. Protect DB bandwidth for mastery data. |
| **Question retirement migration to Supabase** | Valid tech debt, lower priority | Valid concern (retirement state is localStorage-only and does not sync across devices), but lower priority than fixing the broken measurement pipeline. Deferred to a future plan after Priorities 1-5 land. The storage design question (extend `practice_missed_questions` vs new table) should be answered first. |

---

## Execution Order

```
Priority 1 ──────────────────── Priority 2
(Fix confidence pipeline         (Harden tutor API
 + install Vitest                 + parseClaudeResponse tests)
 + skillProficiency tests)        [PARALLEL — no file conflicts]
         |
         |  (hard dependency — same file, same function)
         v
    Priority 3 ──────────────── Priority 4
    (SRS shadow engine              (Add knowledgeType —
     + srsEngine tests)              independent, any time)
         |
         v
    Priority 5
    (Rename useFirebaseProgress)
         |
         v
    Priority 6
    (Update docs)
```

### Hard sequencing rules
- **Priority 1 must complete before Priority 3.** Both modify `updateSkillProgress()` in `useFirebaseProgress.ts`. Landing 1 first ensures the attemptHistory fix is in place before SRS data is wired in. If the history is wrong, the scheduling built on it is unreliable.
- **Priority 2 has no file conflicts with Priority 1** and can run in parallel.
- **Priority 4 is independent** (different files entirely) and can slot in anytime.
- **Priority 5 goes after 1 and 3** because it renames the file both modify.
- **Priority 6 goes last** because it documents the final state of all changes.

### Testing is inline, not batched
Each priority that creates or modifies logic ships its own tests in the same change. Tests and the logic they protect land together — never separately. Vitest is installed as part of Priority 1 (the first to land). This is not optional. Once you change measurement logic, you need a way to prove you did not quietly break proficiency classification. If you do not lock it down at each step, every later change gets riskier.

---

## The first move

Fix the confidence pipeline and ship its tests with it. That is the foundation for the rest.
