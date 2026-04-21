# Triage Tier 3: Low Quiz Score Remediation Spec

**Status:** Specification for implementation  
**Last Updated:** 2026-04-18  
**Audience:** Product, Engineering  

---

## Overview

When a student completes a module mini-quiz with a poor score, the app currently shows an empathetic message and offers to return to the learning path. The student can then attempt the same quiz again or move on—there is no structured intervention.

This spec defines **Triage Tier 3**: a focused remediation loop that triggers on low quiz scores (≤2/5), guides the student through re-learning the specific concepts they missed, and clears the "triage" state only when they demonstrate mastery of those concepts via a fresh quiz attempt.

The triage state is transient and task-focused—it exists solely to help a student recover from a specific failure, then dissolves once they succeed.

---

## 1. Trigger Rules

### Quiz Score Thresholds

| Quiz Score | Action |
|---|---|
| **5/5 (100%)** | Pass. No triage. Update skill status based on existing accuracy. |
| **4/5 (80%)** | Pass. No triage. Show "great work" message. |
| **3/5 (60%)** | Soft nudge. Show "approaching" message with optional re-quiz button, but no forced triage entry. |
| **≤2/5 (≤40%)** | **Triage entry.** Student is in triage state for this skill. |

### When Does Triage Trigger?

- **First attempt only** — if a student scores ≤2/5 on their first mini-quiz attempt for a skill, they enter triage.
- **Retry after triage** — if a student scores ≤2/5 on a second attempt *while in triage*, they do NOT enter triage a second time. Instead, escalate (see **Edge Cases** → **Repeated failure**).
- **If already in triage** — new low scores do not re-trigger triage; they extend it or escalate it.

### Triage Re-Entry Rules

Once a student has been in triage for a skill and **successfully cleared it** (via re-quiz or re-engagement), if they score ≤2/5 again in the future, they re-enter triage. This allows multiple redemption cycles over time.

---

## 2. Triage State & Storage

### Definition

**Triage state** is a single-valued status that applies to one (user, skill) pair at a time. It indicates that a student's recent quiz score was poor and they are moving through the remediation loop.

### Storage: New Column on `user_progress`

Add a **`skill_triage_state`** JSONB column to the `user_progress` table:

```sql
ALTER TABLE user_progress 
ADD COLUMN skill_triage_state JSONB DEFAULT NULL;

-- Example row value:
{
  "active_skills": {
    "S-DERIVATIVE": {
      "entry_date": "2026-04-18T14:30:00Z",
      "quiz_score": 1,
      "quiz_total": 5,
      "missed_question_ids": ["q-001", "q-003"],
      "concept_tags_missed": ["chain-rule", "power-rule"],
      "re_quiz_offered": true,
      "tutor_invoked": false,
      "escalation_level": 0
    }
  }
}
```

### Rationale for Column vs. New Table

**Column approach (recommended):**
- Single row per user per skill → denormalized, fast lookup
- Fits the existing skill-level tracking pattern (skill_scores, learning_path_progress)
- JSONB is flexible for future triage substates
- Triage is transient; it doesn't merit its own relation

**Table approach (alternative):**
- Would require an additional `skill_triage_entries` table
- More complex joins in queries
- Better if triage needs historical audit trail (not a stated requirement)

**Decision:** Use JSONB column for simplicity.

### Columns & Types

```typescript
interface SkillTriageEntry {
  active_skills: {
    [skillId: string]: {
      entry_date: ISO8601;        // When triage was entered (quiz completion time)
      quiz_score: number;          // Student's score (e.g., 1 out of 5)
      quiz_total: number;          // Total points (e.g., 5)
      missed_question_ids: string[]; // IDs of questions answered incorrectly
      concept_tags_missed: string[]; // Concept tags from Stage 1 (e.g., ["chain-rule"])
      re_quiz_offered: boolean;     // Has student been shown the re-quiz prompt?
      tutor_invoked: boolean;       // Did student use "Ask tutor"?
      escalation_level: 0 | 1 | 2;  // 0=normal, 1=2nd attempt failed, 2=forced tutor
      re_attempts: number;          // Count of re-quiz attempts while in triage
      cleared_at?: ISO8601;         // When triage was cleared (if cleared)
    }
  }
}
```

---

## 3. The Remediation Loop — UX Flow

### 3.1 Results Screen (Immediate Post-Quiz)

When a student scores ≤2/5, the `QuizResults` component in `LearningPathModulePage.tsx` changes its tone and calls-to-action:

**Current behavior (for reference):**
```
Trophy icon + "Emerging" + "Review the lesson content and try again to build fluency."
[Return to Learning Path button]
```

**New behavior (triage entry):**
```
Trophy icon + "Emerging" badge (same styling)

🚨 **You're close—let's focus on the gaps.**

You answered 1 of 5 correctly. The concepts you missed are:
  • Chain Rule (2 questions)
  • Power Rule (1 question)

[Open Focused Lesson] [Ask tutor to explain differently] [Try a fresh quiz now]
```

**Copy:**
- **Headline:** "You're close—let's focus on the gaps." (warm, not shaming; implies proximity to mastery)
- **Subtext:** Enumerate the missed concepts from the question tags + the 2 most-commonly-missed rules/frameworks inferred from Supabase misconception registry for this skill.
- **Buttons:** Three options (see below)

### 3.2 "Open Focused Lesson" Button

Navigates student back to the module lesson viewer but with a **focus mode**:

- The module renders normally, BUT
- Sections are **color-coded by concept relevance**:
  - 🔴 **Red ring** around sections that address the missed concepts (e.g., "Chain Rule" section)
  - ⚪ **Neutral** for sections that cover other concepts
- A **"Focus Mode" pill** appears at the top of the lesson viewer, saying "Focusing on: Chain Rule, Power Rule"
- An explicit **"I'm ready to try again" button** appears at the bottom, unlocking the re-quiz

**Implementation note:** The focus mode flag is stored in component state; it does not persist across page reloads. If the student navigates away, they must re-enter triage via the results screen.

### 3.3 "Ask tutor to explain differently" Button

Launches the **AI Tutor** (see **Spec 2** for details), but:

- **Pre-loads context:** The tutor receives the exact questions the student missed, their incorrect answers, and the correct answers
- **Scoped to the skill:** The tutor focuses on explaining the missed concepts, not the entire skill
- **Session type:** `'triage'` (new enum value; used for metrics)
- **Returns to module** after tutor closes (or student navigates back)

When the tutor is invoked from triage:
- Set `tutor_invoked = true` in `skill_triage_state`
- The tutor session is independent; it does NOT automatically clear triage
- After the tutor conversation, the student is redirected back to the module with focus mode still active
- They can then click "Try a fresh quiz"

### 3.4 "Try a Fresh Quiz Now" Button

Shows **new mini-quiz questions** drawn from the skill's question pool, with constraints:

- **Exclude seen questions:** Any question the student already answered (correct or incorrect) in the last 24 hours for this skill is excluded
- **Exclude quarantine:** Any question in the Redemption quarantine is excluded (they don't belong here anyway)
- **New sample:** Shuffle and draw 5 fresh questions
- **Same assessment type:** Use the same mini-quiz assessment type and visual layout as the first attempt

After submission:

- If **≥3/5 (≥60%)**:
  - **Clear triage:** Delete the triage entry from `skill_triage_state` for this skill
  - **Show success message:** "Great work—you've built the fluency you needed."
  - **Update skill status:** Compute the updated skill accuracy and update `user_progress.skill_scores` based on all answers (including the re-quiz)
  - **Log metric:** `triage_cleared_at = now()`, `triage_duration = now() - entry_date`, `triage_exit_type = 're_quiz_pass'`
  - **Return to Learning Path:** Offer "Return to Learning Path" button
  
- If **<3/5 (< 60%)**:
  - **Escalate to tutor:** Do NOT re-enter the loop. Instead, set `escalation_level = 2` and **force tutor invocation**
  - **Lock re-quiz:** The "Try a fresh quiz" button is hidden; only "Ask tutor" is available
  - **Copy change:** "You've tried twice—let's get expert help." + "Ask the tutor to walk through this step-by-step."
  - **Log metric:** `triage_escalated_at = now()`, `escalation_reason = 'second_re_quiz_fail'`

---

## 4. Edge Cases

### 4.1 Student Closes the App Mid-Triage

**Scenario:** Student enters triage, starts reading the focused lesson, then closes the app. They return 2 hours later.

**Behavior:**
- Triage state is persisted in Supabase (`skill_triage_state` column)
- When the student re-opens the app and navigates back to the Learning Path for that skill, the system detects they are in triage
- The results screen is re-shown (or a triage status banner is displayed)
- Student can resume where they left off: read more of the focused lesson, invoke tutor, or attempt the re-quiz

**No data loss.** The triage state lives in the database, not just in memory.

### 4.2 Repeated Failure (Second Re-Quiz Fails)

**Scenario:** Student scores ≤2/5, attempts focused lesson + re-quiz, and scores <3/5 again.

**Behavior:**
- Do NOT re-enter the triage loop (no infinite loops)
- Set `escalation_level = 2`
- **Force tutor invocation:** Hide the re-quiz button; show only "Ask the tutor to walk through this step-by-step"
- Tutor session context includes both the original failed quiz AND the second failed quiz
- No third re-quiz attempt is offered; the only path forward is tutor engagement + moving on

**Metric:** Log this as `triage_escalated_to_forced_tutor`

### 4.3 Question Pool Exhaustion

**Scenario:** A skill has only 20 total questions in the bank. The student has seen 8 in the last 24 hours (screening + practice). They enter triage and need 5 fresh questions for the re-quiz. Only 12 unseen questions remain, so we have enough.

**But:** What if there are only 3 unseen questions left?

**Behavior:**
- The system STILL draws from the unseen pool, even if it means only 3 questions instead of 5
- The mini-quiz shows "Practice Quiz (3 questions)" instead of the usual 5
- Passing threshold scales: pass = ≥2/3 (≥66%) instead of ≥3/5 (≥60%)
- This is a **graceful degrade**, not an error. Small skills are expected to have small quiz pools.
- **Log:** `re_quiz_question_count: 3` (vs. the usual 5)

### 4.4 Triage and Study Plan Scheduling

**Scenario:** The study plan says "Work on Domain Review for 30 minutes" today, but the student just scored ≤2/5 on the Module mini-quiz for a skill that's NOT in the study plan's Domain Review.

**Behavior:**
- **Triage overrides the study plan** for that skill *while the student is engaged with the module*
- The focused lesson + re-quiz loop is the immediate task
- Once triage is cleared or escalated (not during the triage loop), the student returns to the broader schedule
- The study plan is not modified; it's just paused at that skill

**Rationale:** Triage is a micro-intervention on a specific failure. It's higher priority than a general study schedule because it's time-sensitive (student is already in the module).

### 4.5 Multiple Skills in Triage Simultaneously

**Scenario:** A student completes Module A's quiz (enters triage for Skill A), then moves to Module B and enters triage for Skill B.

**Behavior:**
- Each skill has its own triage entry in `skill_triage_state.active_skills[skillId]`
- Triage states are independent: clearing Skill A does not affect Skill B's triage
- The dashboard (see **Dashboard** section) shows both in a "Needs Repair" tile
- The student must resolve each one individually (focus + re-quiz per skill)

---

## 5. Dashboard: "Needs Repair" Tile

### Location

On the main authenticated dashboard (e.g., `ResultsDashboard.tsx`), add a new **summary tile** (same visual family as "Mastered," "Approaching," "Emerging"):

```
┌─────────────────────────────────────┐
│ 🔧 NEEDS REPAIR                     │
│                                     │
│ 2 skills need focused practice      │
│                                     │
│ • Derivatives (1 of 5 correct)      │
│ • Chain Rule (2 of 5 correct)       │
│                                     │
│ [Resume Repair]                     │
└─────────────────────────────────────┘
```

### Behavior

- **Title:** "Needs Repair"
- **Icon:** Wrench 🔧 or hammer 🔨
- **Count:** Number of skills currently in triage (populated from `skill_triage_state.active_skills`)
- **List:** Shows first 2–3 skills in triage with their quiz scores; truncates if more than 3
- **Button:** "Resume Repair" navigates to the Learning Path for the first skill in triage (chronologically)
- **Color:** Use rose/red tones (same as "Emerging" tile) to signal attention needed
- **Visibility:** Only shown if `skill_triage_state.active_skills` is non-empty

### Dismissal

The tile is **not dismissable**—it's persistent until triage is cleared. This is intentional: we want students to see it as a call to action.

---

## 6. Metrics & Logging

To measure triage effectiveness, log the following metrics to a new `triage_audit_log` table or as extended columns on `user_progress`:

| Metric | Type | Description |
|---|---|---|
| `triage_entry_at` | timestamp | When student entered triage (quiz completion time) |
| `triage_entry_score` | int | Quiz score (e.g., 1 out of 5) |
| `triage_entry_reason` | enum | `'low_quiz_score'` (future: other reasons) |
| `triage_first_action` | enum | `'focused_lesson'` \| `'tutor'` \| `'re_quiz'` (first button clicked) |
| `tutor_invoked_in_triage` | boolean | Did student click "Ask tutor"? |
| `focused_lesson_time_seconds` | int | Time spent in focused lesson |
| `re_quiz_attempts` | int | How many re-quiz attempts in this triage cycle? |
| `triage_exit_type` | enum | `'re_quiz_pass'` \| `'escalated_to_tutor'` \| `'abandoned'` |
| `triage_exit_score` | int | Final quiz score (if re-attempted) |
| `triage_duration_seconds` | int | `exit_at - entry_at` |
| `skill_accuracy_24h_after` | float | Student's accuracy on this skill 24 hours after triage exit |
| `skill_accuracy_7d_after` | float | Student's accuracy on this skill 7 days after triage exit |

### Monitoring Dashboard

Create an internal admin dashboard view that shows:
- **Triage entry rate:** How many (student, skill) pairs enter triage per week?
- **Exit rate:** Of those who enter, what % exit by each method?
- **Success rate:** Of those who exit via re-quiz, what % score ≥3/5?
- **Escalation rate:** Of those with 2nd attempt failures, what % are escalated to tutor?
- **24h/7d follow-up:** What's the average accuracy improvement after triage?

These metrics inform whether triage is actually helping students recover from module failures.

---

## 7. Copy & Tone

All copy is warm, encouraging, and action-oriented. We're not shaming—we're helping. Match the existing tone from `ResultsDashboard.tsx` and `LearningPathModulePage.tsx`.

### Results Screen (Triage Entry)

**Headline:**
> You're close—let's focus on the gaps.

**Body:**
> You answered 1 of 5 correctly. The concepts you missed:
> • Chain Rule (2 questions)
> • Power Rule (1 question)

**Call to action heading:**
> What would help most?

### Focused Lesson Header

**Mode indicator badge:**
> 🎯 Focus Mode: Chain Rule, Power Rule

**Help text (optional):**
> The sections below that teach these concepts are highlighted. Start there, or read the full lesson.

### Before Re-Quiz

**Button label:**
> Try a fresh quiz

**Intro text:**
> Here are 5 new questions focused on the concepts you missed.

### Re-Quiz Pass

**Success headline:**
> Great work—you've built the fluency you needed.

**Body:**
> You scored 4 of 5. You're ready to move forward.

**Button:**
> Return to Learning Path

### Escalation (2nd Attempt Fails)

**Headline:**
> You've given it a strong effort. Let's get expert help.

**Body:**
> A tutor can walk through these concepts step-by-step in a way that clicks for you.

**Button:**
> Ask the tutor to explain this

### Dashboard Tile

**Title:**
> 🔧 Needs Repair

**Body:**
> 2 skills need focused practice

**List:**
> • Derivatives (1 of 5 correct)
> • Chain Rule (2 of 5 correct)

**Button:**
> Resume Repair

---

## 8. Non-Goals

This spec explicitly does NOT cover:

1. **Triage for any reason other than low quiz scores.** Future triage triggers (e.g., "student got 5 wrong answers in a row during practice") are out of scope.

2. **Automatic lesson re-teaching.** Triage focuses the existing lesson on missed concepts; it does NOT generate new lesson content.

3. **Forced participation.** Triage is always optional. A student can close the module and abandon triage (it persists but is not enforced).

4. **Peer collaboration.** Triage is a solo intervention; no peer discussion or hints.

5. **Triage in other contexts.** Triage only applies to module mini-quizzes. It does NOT apply to:
   - Skill practice sessions
   - Domain review quizzes
   - The initial diagnostic
   - Learning path practice sections

6. **Historical triage data in the UI.** We log metrics, but we don't show students a "Triage history" or past failures in the dashboard. Triage is future-focused.

7. **Triage clearance via other means.** A student can only clear triage by:
   - Passing the re-quiz (≥3/5), OR
   - Being escalated to forced tutor (tutor clears it manually, or student must re-engage after tutor session)
   
   They cannot "skip" or "dismiss" triage without some form of engagement.

---

## 9. Implementation Checklist

- [ ] Add `skill_triage_state` JSONB column to `user_progress` table (migration)
- [ ] Modify `QuizResults` component in `LearningPathModulePage.tsx` to detect ≤2/5 and show triage UI
- [ ] Build "Focused Lesson" mode in `ModuleLessonViewer.tsx` (concept highlighting + focus mode pill)
- [ ] Implement "Ask tutor" button wired to `TutorChatPage` with triage context (see **Spec 2**)
- [ ] Build fresh re-quiz selector (exclude last-24h questions + quarantine)
- [ ] Implement re-quiz handling: pass → clear triage, fail → escalate to tutor
- [ ] Add "Needs Repair" tile to dashboard
- [ ] Create `triage_audit_log` table and logging hooks
- [ ] Update `buildTutorContext()` to include triage state in tutor prompts
- [ ] Write E2E test: enter triage → focused lesson → re-quiz pass → cleared
- [ ] Write E2E test: enter triage → 2nd attempt fail → forced tutor escalation

---

## 10. Success Criteria

- **Adoption:** >70% of students who score ≤2/5 on a quiz engage with triage (focused lesson or tutor)
- **Efficacy:** Of students who enter triage, >60% exit via re-quiz pass (not escalation)
- **Retention:** Students' accuracy on the skill 7 days after triage is ≥10 percentage points higher than students who didn't enter triage
- **Time:** Average triage duration is <15 minutes
- **Abandonment:** <5% of students who enter triage abandon it entirely (no focused lesson, no tutor, no re-quiz)
