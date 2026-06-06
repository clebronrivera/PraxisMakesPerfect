# Adaptive Diagnostic Engine — Code-Level Audit
*Audit date: 2026-03-29 | Constraint: read-only, no redesign*

---

## 1. End-to-End Flow Summary

The diagnostic is a two-phase system: **build-time** (before the session starts) and **runtime** (inside the session). These are entirely separate; the runtime component never calls the builder again.

```
startAdaptiveDiagnostic()                   ← useAssessmentFlow.ts : 285–349
  └─ buildAdaptiveDiagnostic()              ← assessment-builder.ts : 460–550
       ├─ groups questions by skillId
       ├─ selects 1 initial + up to 2 follow-ups per skill
       ├─ interleaves initial questions domain-round-robin
       └─ returns { initialQueue[45], followUpPool{skillId→q[]} }

AdaptiveDiagnostic component renders        ← AdaptiveDiagnostic.tsx
  ├─ queue state (starts as initialQueue, grows on wrong answers)
  ├─ followUpPool state (mutable; entries consumed on wrong answers)
  ├─ skillQuestionCount state (enforces max 3 per skill)
  └─ submitAnswer() → adaptive branch → nextQuestion() → onComplete()
```

---

## 2. Build Phase — `buildAdaptiveDiagnostic()`

**File:** `src/utils/assessment-builder.ts` lines 460–550

### Step-by-step

**Step 1 — Filter (line 467):**
Exclude any question IDs passed in `excludeQuestionIds` (these come from prior assessment history: `preAssessmentQuestionIds`, `screenerItemIds`, `fullAssessmentQuestionIds`). Note: redemption blacklist is NOT excluded here — that's only in `useAdaptiveLearning` for practice mode.

**Step 2 — Group by skill (lines 468–473):**
Bucket every remaining question into `poolBySkill: Map<skillId, AnalyzedQuestion[]>`.

**Step 3 — Select 1 initial + up to 2 follow-ups per skill (lines 479–528):**

For each of the 45 skills in `SKILL_BLUEPRINT`:
1. Shuffle single-select questions first, then multi-select (lines 487–492).
2. First item in shuffled list = **initial question** (line 495).
3. Remaining items are candidates for follow-ups.
4. **1st follow-up:** prefer opposite `cognitiveComplexity` (Recall→Application or vice versa). If not available, take whatever is next (lines 504–510).
5. **2nd follow-up:** prefer opposite of the 1st follow-up's complexity (lines 514–522).
6. If a skill has no questions at all, log a warning and skip (lines 481–484).

**Step 4 — Domain-round-robin interleave (lines 531–547):**
Sort each domain bucket randomly, then interleave one-at-a-time across D1→D2→D3→D4→D1…. This is the same algorithm as the screener.

**Step 5 — Return (line 549):**
`{ initialQueue: AnalyzedQuestion[45], followUpPool: Record<skillId, AnalyzedQuestion[0–2]> }`

### Important: what the builder does NOT do
- It does not look at any live user profile data.
- It does not weight skills by user weakness.
- It does not filter by `isFoundational`.
- It does not consider `dok`, `keyConcepts`, `confidence` (user-facing), or timing.
- Selection within a skill is purely random shuffle (single-select preferred over multi-select).

---

## 3. Session Initialization — `startAdaptiveDiagnostic()`

**File:** `src/hooks/useAssessmentFlow.ts` lines 285–349

On a fresh start (no resume):
- Collects `excludeIds` from three profile arrays (lines 311–315).
- Calls `buildAdaptiveDiagnostic(analyzedQuestions, excludeIds)`.
- Writes all initial + follow-up question IDs to `profile.diagnosticQuestionIds` (line 328).
- Navigates to `'adaptive-diagnostic'` route.
- Creates a localStorage session with only the **initial 45 IDs** — follow-up IDs are not in the initial session record (lines 336–344). This is a subtle asymmetry: the component re-hydrates follow-up pools from its own state, not from this initial save.

On resume:
- Reconstructs the queue from saved `questionIds` (which will include any follow-ups already queued at pause-time).
- Reconstructs `followUpPool` from `followUpPoolRemaining` (saved as ID arrays).
- Does **not** re-run the builder — this is correct and intentional (line 291–292 comment).

---

## 4. Runtime Phase — `AdaptiveDiagnostic` Component

**File:** `src/components/AdaptiveDiagnostic.tsx`

### State machine

| State var | Initial value | Mutates on |
|---|---|---|
| `queue` | `initialQueue` (45 items) | Wrong answer: append follow-up |
| `followUpPool` | deep copy of builder output | Wrong answer: consume one item |
| `skillQuestionCount` | `{skillId: 1}` for each skill | Wrong answer: increment |
| `currentIndex` | 0 (or saved index on resume) | Every `nextQuestion()` call |
| `confidence` | `'medium'` | User UI interaction |
| `responses` | `[]` | Every `submitAnswer()` call |

### Question selection (runtime)

There is **no runtime selection algorithm**. The queue is pre-built. The component is a queue consumer, not a selector. `useAdaptiveLearning.ts` is not used here at all — it is the practice-mode hook.

### `submitAnswer()` — lines 250–344

1. Compute `isCorrect` (exact match: selected set == correct set, line 258–260).
2. Match distractor pattern for wrong answers (lines 262–278).
3. Call `logResponse()` → writes to Supabase `responses` table (lines 281–296).
4. Call `updateSkillProgress()` (lines 303–305).
5. Build `UserResponse` object; append to local `responses` state (lines 307–319).
6. **Adaptive branch** (lines 321–336): if wrong AND skill has < 3 questions in queue, consume one item from `followUpPool[skillId]` and append it to `queue`. Increment `skillQuestionCount[skillId]`.
7. Call `nextQuestion()`.

### Follow-up logic — exact code (lines 321–336)

```typescript
if (!isCorrect && currentQuestion.skillId) {
  const skillId = currentQuestion.skillId;
  const count = skillQuestionCount[skillId] || 1;

  if (count < 3) {                          // hard cap: max 3 per skill
    const pool = followUpPool[skillId];
    if (pool && pool.length > 0) {
      const followUp = pool[0];             // FIFO — complexity already alternated by builder
      const updatedPool = { ...followUpPool, [skillId]: pool.slice(1) };
      setFollowUpPool(updatedPool);
      setQueue(prev => [...prev, followUp]);  // appended to END of queue
      setSkillQuestionCount(prev => ({ ...prev, [skillId]: count + 1 }));
    }
  }
}
```

**Key behaviors:**
- Triggered only on `isCorrect === false`. Correct answers produce no follow-up.
- Follow-up is appended to the **end** of the queue, not inserted after the current question.
- Confidence level (`'low'|'medium'|'high'`) is logged but plays no role in triggering follow-ups.
- If `pool` is empty or undefined for that skill (e.g., skill only had 1 question in the bank), no follow-up is queued silently.

### Stopping condition — `nextQuestion()` (lines 346–364)

```typescript
const nextIndex = currentIndex + 1;
if (nextIndex >= queue.length) {
  // complete: delete localStorage session, call onComplete(responses)
} else {
  setCurrentIndex(nextIndex);
  setSelectedAnswers([]);
  setIsSubmitted(false);
  setConfidence('medium');  // confidence resets to medium for each new question
}
```

The session ends when `currentIndex + 1 >= queue.length`. There is no time limit, minimum question count, accuracy threshold, or adaptive early-exit. The session length is determined purely by the number of wrong answers that have follow-ups available.

---

## 5. Question Counts

| Scenario | Count |
|---|---|
| **Minimum** | **45** — all 45 skills answered correctly on first try |
| **Maximum (theoretical)** | **135** — all 45 skills wrong twice (2 follow-ups each) |
| **Maximum (practical)** | **~90** — most skills in the bank only have 1–2 follow-up candidates |
| **Typical range** | Unlabeled in code; approximately 55–75 based on expected wrong-answer rates |

The comment at line 458 in `assessment-builder.ts` says "~90 max" — this is the practical bound, not the theoretical 135.

---

## 6. Cognitive Complexity Alternation — Exact Mechanism

**Where:** `assessment-builder.ts` lines 498–527 (build time only).
**What it alternates:** `cognitiveComplexity` field values `'Recall'` and `'Application'`.

### Algorithm per skill

```
initial = shuffled[0]  (arbitrary complexity)

followUp[0]:
  target = opposite of initial.cognitiveComplexity
  if target exists in remaining → use it
  else → use remaining[0]  (no guarantee)

followUp[1]:
  target = opposite of followUp[0].cognitiveComplexity
  if target exists in remaining → use it
  else → use remaining[0]  (no guarantee)
```

### Limitations
1. **Not enforced across the queue** — only within each skill's follow-up slots. There is no interleaving logic that prevents two consecutive Recall questions from different skills.
2. **Fallback breaks alternation** — if a skill's bank doesn't contain the target complexity type, any available question is taken. In banks where most questions are Application, Recall→Application→Application sequences are possible.
3. **Initial question is arbitrary** — the initial question's complexity is determined by which question surfaces first after shuffle. There is no target complexity for initials.
4. **The screener has stricter enforcement** — it uses a domain-level `recallTarget` counter with active swap logic (lines 370–413 of the same file). The adaptive diagnostic does not have equivalent enforcement.

---

## 7. Fields That Are Collected But Not Used in Branching

### Confidence (user-facing: `'low' | 'medium' | 'high'`)
- **Where collected:** `AdaptiveDiagnostic.tsx` line 134 (state), line 483 (UI input), reset to `'medium'` each question (line 361).
- **Where written:** Passed to `logResponse()` → Supabase `responses` table (line 289). Passed to `updateSkillProgress()` (line 304).
- **Where used in scoring:** `countConfidenceFlags()` in `learning-state.ts` lines 48–52 — counts `high` confidence + wrong answers across attempt history → stored in `skillScores[id].confidenceFlags`.
- **Where used in practice-mode priority:** `useAdaptiveLearning.ts` line 19 — `confidenceFlags > 0` raises skill priority to 3+.
- **NOT used in diagnostic branching:** The follow-up trigger (line 322) checks only `isCorrect`. A user who answers wrong with high confidence gets the same follow-up as one who answers wrong with low confidence.
- **What could be done:** High-confidence wrong answers are misconceptions. These could trigger a second follow-up even when the skill is already at count 2, or could prioritize the hardest available follow-up.

### Timing (`timeSpent` / `time_on_item_seconds`)
- **Where collected:** `resetQuestionTimer()` (line 255) returns seconds on the question; stored in `UserResponse.timeSpent` (line 312) and written to Supabase (line 291).
- **Where displayed:** Pacing feedback message (`pacingMessage`, lines 209–217) — advisory, 50 sec/question target.
- **NOT used in branching:** A question that takes 4× the expected time does not trigger any adaptive action.
- **What could be done:** Extreme timing outliers (>2× expected) could flag confusion even on a nominally correct answer, and trigger a follow-up for verification.

### `keyConcepts` (string array from `question-vocabulary-tags.json`)
- **Where populated:** `question-analyzer.ts` line 230 — looked up by question ID in a static JSON file.
- **Where used:** `assessmentReport.ts` line 165 — missed concepts are aggregated across wrong answers for the post-diagnostic report. Also shown in `ExplanationPanel.tsx` line 132, and used by `TeachMode.tsx` for routing content.
- **NOT used in question selection or branching.**
- **What could be done:** Follow-up questions could be filtered to match the same concept cluster as the missed initial question, rather than being selected only by complexity.

### `isFoundational` (boolean)
- **Where populated:** `question-analyzer.ts` line 254 — truthy if `is_foundational === true` in the bank JSON.
- **Where used:** `useAdaptiveLearning.ts` lines 143–165 — in practice mode (when `adaptivePractice` is enabled), foundational questions are preferred for low-attempt and unseen skills.
- **NOT used in the diagnostic builder or the diagnostic component at all.** A foundational question has no preferential treatment in the diagnostic.
- **What could be done:** The diagnostic initial question per skill could always prefer `isFoundational` questions, ensuring the anchor question is a validated entry point.

### `dok` (Depth of Knowledge, integer 1–3)
- **Where computed:** `question-analyzer.ts` lines 224–226 — heuristic: DOK 3 if scenario/first-step stem, DOK 1 if definition stem, DOK 2 otherwise.
- **Where used:** Nowhere in the current runtime. It exists on `AnalyzedQuestion` but no component or hook reads it for any decision.
- **What could be done:** Follow-up selection could use DOK to escalate difficulty (wrong on DOK 1 → follow-up is DOK 2, etc.).

### `stemType` (string: `'First Step'`, `'Most Appropriate'`, etc.)
- **Where computed:** `question-analyzer.ts` lines 216–221 — heuristic keyword detection.
- **Where used:** Nowhere in branching.

### Distractor pattern (`distractorPatternId`)
- **Where computed:** `AdaptiveDiagnostic.tsx` lines 262–278 — `matchDistractorPattern()` identifies which distractor type the user picked.
- **Where written:** Logged to Supabase via `logResponse()` (line 295).
- **NOT used in branching.** The specific wrong answer type doesn't influence which follow-up is selected.

---

## 8. `useAdaptiveLearning` — Its Actual Role

`src/hooks/useAdaptiveLearning.ts` is **not used in the adaptive diagnostic**. It is the practice-mode question selector. Its relationship to the diagnostic:

| Aspect | Adaptive Diagnostic | Practice Mode (`useAdaptiveLearning`) |
|---|---|---|
| Selection method | Pre-built queue (builder) | Runtime selection per answer |
| Adaptive feature gate | N/A — builder always runs | `ACTIVE_LAUNCH_FEATURES.adaptivePractice` (currently `false`) |
| Profile data used | `excludeIds` only | Full skill scores, weakest domains, confidence flags |
| Foundational preference | Not used | Used for low-attempt skills |
| Redemption blacklist | Not applied | Applied |

When `adaptivePractice` is `false` (current state), `selectNextQuestion()` returns a purely random question from the filtered pool (line 109). All the skill priority and domain weighting logic below line 111 is unreachable.

---

## 9. Session Persistence

**Save trigger:** `useEffect` watching `[currentIndex, responses, selectedAnswers, confidence, queue, followUpPool, elapsedSeconds]` (line 190). Saves after every state change.

**Saved fields:** `questionIds` (full current queue including appended follow-ups), `currentIndex`, `responses`, `selectedAnswers`, `confidence`, `followUpPoolRemaining` (as ID arrays), `elapsedSeconds`, `startTime`.

**Resume guard (line 69–71):** A session is only resumed if `savedSession.questionIds.length >= initialQueue.length` OR `currentIndex > 0`. This prevents a corrupted/short saved session from replacing a fresh 45-question build.

**Note on session creation asymmetry:** `createUserSession()` is called with only `result.initialQueue.map(q => q.id)` (line 339). The follow-up pool IDs are NOT in the initial session record. The component's own `useEffect` will overwrite this on first render with the full queue. This is safe but means there's a brief window where the session record is incomplete.

---

## 10. Limitations

### Structural
1. **No adaptive initial question selection.** Every student sees a random question for each skill regardless of prior diagnostic history, screener results, or any known profile data. The diagnostic is adaptive only in its follow-up behavior, not in its initial question selection.
2. **Follow-ups appended to end of queue, not inserted after current skill.** A student who misses skill A at question 3 won't see the follow-up until after all 45 initial questions. This significantly delays feedback and means the student's state may have shifted by the time the follow-up appears.
3. **No minimum diagnostic completion requirement.** A student who quits after 10 questions produces a partial profile, but there is no guard against this in the engine.
4. **Complexity alternation is best-effort only.** No enforcement mechanism exists at the queue level.
5. **The builder doesn't know about the student.** Build-time randomness means two students with identical profiles get different initial questions, and one might get an easier or harder version of the same skill anchor.

### Data collected but unused in decisions
6. **Confidence level** doesn't affect branching (only affects post-hoc `confidenceFlags` scoring).
7. **Timing** doesn't affect branching.
8. **`keyConcepts`** are not used to cluster follow-ups conceptually.
9. **`isFoundational`** is ignored in the diagnostic.
10. **`dok`** is ignored everywhere at runtime.
11. **`distractorPatternId`** is logged but not fed back into selection.

### Code structure
12. **`recentPracticeQuestionIds` exclusion** (line 72–74 of `useAdaptiveLearning.ts`) is a dead rule — there are no writes to this profile field anywhere in the codebase. It silently excludes nothing.
13. **`adaptivePractice` feature flag is `false`** — the sophisticated skill-priority logic in `useAdaptiveLearning` (lines 111–168) is entirely unreachable in production.

---

## 11. Smallest Safe Next Improvements (Pre-Redesign)

These changes are each independently safe, low-blast-radius, and don't require rearchitecting the engine.

### Improvement A — Prefer `isFoundational` for initial question per skill
**File:** `assessment-builder.ts`, lines 486–496
**Change:** After shuffle, if a foundational question exists in the pool, use it as the initial instead of `shuffled[0]`.
**Risk:** Very low. Purely selection preference within the same pool. If no foundational exists, falls back to current behavior.
**Value:** Ensures all students encounter the vetted anchor question first for every skill. The `is_foundational` flag was added to the bank for exactly this purpose but is never exercised in the diagnostic.

### Improvement B — Insert follow-up immediately after current position, not at queue end
**File:** `AdaptiveDiagnostic.tsx`, line 332
**Change:** Replace `setQueue(prev => [...prev, followUp])` with insertion at `currentIndex + 1`.
**Risk:** Low. The only behavioral change is when the follow-up appears. The `nextQuestion()` logic and stopping condition are unaffected.
**Value:** Student encounters the follow-up while the skill is still fresh, rather than after completing all remaining initial questions.

### Improvement C — Confidence-flagged wrong answers get a second follow-up regardless of count
**File:** `AdaptiveDiagnostic.tsx`, lines 321–336
**Change:** If `confidence === 'high'` and `isCorrect === false`, treat this as a misconception and queue both available follow-ups (if count allows), or lower the max-per-skill cap from 3 to 4 for this case only.
**Risk:** Low. Increases diagnostic length slightly in specific cases. The follow-up pool already has the questions pre-selected.
**Value:** High-confidence wrong answers are the highest-signal events in the diagnostic. The current system treats them identically to low-confidence wrong answers.

### Improvement D — Fallback to `isFoundational` when bank is thin on a skill
**File:** `assessment-builder.ts`, lines 502–527
**Change:** When no opposite-complexity follow-up exists (the fallback path), prefer any `isFoundational` question over any random remaining question.
**Risk:** Negligible. Pure preference ordering within an existing fallback.
**Value:** Reduces noise in the follow-up pool when a skill has few questions. Foundational questions are more diagnostic than arbitrary ones.

### Improvement E — Log when a skill has no follow-up pool (silent failure)
**File:** `AdaptiveDiagnostic.tsx`, lines 327–334
**Change:** When `pool` is empty or undefined after a wrong answer, `console.warn` with the skill ID.
**Risk:** Zero functional risk. Observability improvement.
**Value:** Currently when a skill has only 1 question in the bank, a wrong answer silently produces no follow-up. This is invisible to developers and makes it impossible to detect bank coverage gaps from runtime logs.

### Improvement F — Surface `dok` in session persistence for post-hoc analysis
**File:** `AdaptiveDiagnostic.tsx`, `UserResponse` type
**Change:** Add `dok?: number` to the `UserResponse` object when logging, without using it for branching.
**Risk:** Additive schema change only.
**Value:** Enables the admin item analysis tab to correlate DOK with timing, difficulty, and wrong-answer rates — data that currently has to be joined back from question metadata after the fact.

---

## File Reference Summary

| File | Role | Key Lines |
|---|---|---|
| `src/utils/assessment-builder.ts` | Build-time: queue + follow-up pool construction | 460–550 (adaptive), 323–437 (screener) |
| `src/components/AdaptiveDiagnostic.tsx` | Runtime: queue consumer, follow-up trigger, stopping condition | 74–130 (init), 250–344 (submit), 346–364 (next) |
| `src/hooks/useAssessmentFlow.ts` | Orchestration: start, resume, complete handlers | 285–349 (adaptive flow) |
| `src/hooks/useAdaptiveLearning.ts` | Practice-mode selector (not used in diagnostic) | 8–175 |
| `src/brain/question-analyzer.ts` | `AnalyzedQuestion` type; field computation | 46–67 (type), 185–259 (analyzeQuestion) |
| `src/brain/learning-state.ts` | `countConfidenceFlags` | 48–52 |
| `src/hooks/useProgressTracking.ts` | `confidenceFlags` calculation + persistence | ~555–590 |
| `src/utils/launchConfig.ts` | Feature flags | All (8 lines) |
| `src/brain/skill-map.ts` | Skill ID definitions | — |
| `src/utils/assessment-builder.ts` | `SKILL_BLUEPRINT` (45 skills) | 9–62 |
