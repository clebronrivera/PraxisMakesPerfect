# AI Tutor Integration with Module Learning Path: Comprehensive Spec

**Status:** Specification for implementation  
**Last Updated:** 2026-04-18  
**Audience:** Product, Engineering  

---

## Overview

The AI Tutor (`TutorChatPage.tsx`, `FloatingTutorWidget.tsx`) currently receives only a **user skill snapshot** as context—a high-level view of what the student knows about each skill based on past quiz performance. It does NOT receive module content or recent quiz failures.

This spec integrates the tutor into the module learning experience by:

1. Adding two new **invocation points:** inside lesson content and post-quiz results
2. Enriching **tutor context** with module prose, missed questions, and concept tags
3. Defining new **artifact types** the tutor can generate (re-teaches, worked examples, micro-quizzes)
4. Establishing **session continuity** and **metrics** for measuring engagement

The goal: students can ask the tutor to "explain this concept differently" without leaving the module, and the tutor has the exact content and quiz failures in view.

---

## 1. Two New Invocation Points

### 1.1 Invocation Point A: "Ask Tutor About This Module" (In-Lesson)

**Location:** Top-right corner of `ModuleLessonViewer.tsx` header (same row as density toggle, skill terms, etc.)

**Visual:**
```
┌────────────────────────────────────────────┐
│ Lesson Title                   [💬] [✓] [∴] │  ← Tutor button (💬)
└────────────────────────────────────────────┘
```

**Button:**
- **Icon:** Chat bubble (💬) or "?" in a circle
- **Label (on hover):** "Ask tutor about this module"
- **Disabled state:** Greyed out if user is not authenticated or diagnostic is incomplete
- **Position:** Top-right, before density/print/study center toggles

**Behavior on click:**
1. **Open tutor modal/panel** (floating or full-screen, TBD by design)
2. **Auto-select active session:** If a tutor session already exists for this skill/module, re-use it. Otherwise, create a new session with `sessionType = 'module-lesson'`
3. **Inject context:** Populate the tutor's system prompt with:
   - Full module content (title, all sections, text, interactives)
   - Skill snapshot (same as today)
   - Concept tags for the skill
   - (See **Section 2** for exact context format)
4. **Focus suggestion:** Tutor's first message is a warm greeting with a suggestion: "I can explain any concept from this lesson, walk through examples, or answer specific questions. What would help?"
5. **Return on close:** When the student closes the tutor, they're back in the module lesson viewer at the same scroll position

### 1.2 Invocation Point B: "Get This Explained Differently" (Post-Quiz Results)

**Location:** Results screen in `LearningPathModulePage.tsx` → `QuizResults` component (or new `TriageQuizResults` variant)

**Context:** Appears only if the quiz score is ≤3/5 (emerging or approaching; not demonstrating).

**Visual:**
```
┌───────────────────────────────────────────────┐
│ Trophy 60%                                    │
│ Approaching                                   │
│ 3 of 5 correct                                │
│                                               │
│ [Tutor can help →]  [Try again]  [Next]      │ ← New button
└───────────────────────────────────────────────┘
```

**Button:**
- **Label:** "Get this explained differently"
- **Icon:** Chat bubble + arrow, or "🤔 Tutor"
- **Only shown if:** score < 0.8 (approaching or emerging)
- **Position:** Primary call-to-action, left-aligned (before "Try again" or alongside)

**Behavior on click:**
1. **Open tutor modal/panel** (same UI as Invocation Point A)
2. **Create new session:** Always create a fresh session for post-quiz context (`sessionType = 'post-quiz'`)
   - Do NOT re-use an existing module lesson session from the same module
   - Reason: post-quiz context is much more specific (missed Q&A); mixing it with a general lesson session creates clutter
3. **Inject context:** Populate with:
   - The 5 quiz questions (full question text, all answer choices)
   - Which answers the student selected
   - Which answers were correct
   - The skill snapshot and concept tags (same as tutor base context)
   - Explicit note: "These are the questions the student got wrong or found hard."
4. **Tutor's opening:** "I can see the questions you found tricky. Let me explain the concepts behind them. Which one would you like to focus on first?" + Inline quiz question cards (see **Artifact Types**)
5. **Return on close:** Back to the results screen

---

## 2. Context Passed to the Tutor

### 2.1 Current Context (Baseline)

Today, the tutor receives `TutorUserContext` (from `tutorContextBuilder.ts`):

```
USER SKILL PROFILE (427 questions answered):
Readiness: 45% (10/22 skills Demonstrating)

EMERGING SKILLS (highest priority — these need the most work):
  - S-CALCULUS-DERIVATIVES: Calculus - Derivatives — 42% (31 attempts | trend: improving) [LOW SAMPLE — only 15 attempts]
    Common misconceptions: Power rule can be applied to any exponent, not just integers; Chain rule is only for composite functions
  ...
```

This is **generic and skill-level**. It tells the tutor "the student is weak at Derivatives" but not "the student just got the chain rule and power rule questions wrong in a quiz."

### 2.2 New Context for Invocation Point A (In-Lesson)

When the tutor is opened from `ModuleLessonViewer`, add a **`CURRENT MODULE CONTEXT`** section:

```
─────────────────────────────────────────────────────────
CURRENT MODULE CONTEXT
─────────────────────────────────────────────────────────

Module: Limits and Continuity – Introduction
Skill: S-LIMITS-DEFINITION

Sections covered in this lesson:
1. What is a limit? [Section type: paragraph]
   "A limit is the value that a function approaches as the input..."
   
2. Epsilon-Delta Definition [Section type: anchor, label: "DEFINITION"]
   "For any ε > 0, there exists δ > 0 such that..."
   
3. Limit Examples [Section type: list]
   • lim(x→2) (x² + 1) = 5
   • lim(x→0) sin(x)/x = 1
   
4. Left and Right Limits [Section type: comparison]
   Left-hand limit vs. Right-hand limit [comparison table rows...]

5. Continuity Definition [Section type: paragraph]
   "A function is continuous at a point if..."

Concept tags in this module: limit, epsilon-delta, continuity, left-limit, right-limit

Interactives in this lesson:
• "Match the definition to the graph" [interactive-type: ClickSelector] — student completed, score: 85%
• "Drag to order the steps" [interactive-type: DragToOrder] — not yet attempted

────────────────────────────────────────────────────────
```

**Placement:** After the base `USER SKILL PROFILE` and `EMERGING SKILLS` sections, before any closing summary.

**Content:**
- Module title + skill ID
- All sections (paragraph, anchor, list, comparison) with their type and full text
- Concept tags associated with the module
- Completed interactives with student's score

**Why:** The tutor can now reference specific definitions, examples, and exercises from the lesson and explain them in context—or suggest alternative explanations.

### 2.3 New Context for Invocation Point B (Post-Quiz)

When the tutor is opened from quiz results, add two new sections: **`RECENT QUIZ PERFORMANCE`** and **`INCORRECT ANSWERS DETAIL`**:

```
─────────────────────────────────────────────────────────
RECENT QUIZ PERFORMANCE
─────────────────────────────────────────────────────────

Quiz completed at: 2026-04-18 14:32:00
Skill: S-LIMITS-DEFINITION
Quiz type: Module mini-quiz
Score: 2 of 5 (40%) — Emerging

Questions correct: Q-002, Q-004
Questions incorrect: Q-001, Q-003, Q-005

────────────────────────────────────────────────────────
INCORRECT ANSWERS DETAIL
────────────────────────────────────────────────────────

Q-001 (Incorrect)
─────────────────────────────────────────────────────────
Question text:
"Which of the following is the epsilon-delta definition of a limit?"

Answer choices:
A) For any ε > 0, there exists δ > 0 such that |x - a| < δ implies |f(x) - L| < ε
B) For any ε > 0, there exists δ > 0 such that |f(x) - L| < ε implies |x - a| < δ
C) A function is continuous if it has no breaks
D) The limit is the output when x equals a

Correct answer: A
Student selected: B
Rationale: The implication direction matters—epsilon-delta starts with proximity of x to a, not the output.

Concept tag: epsilon-delta


Q-003 (Incorrect)
─────────────────────────────────────────────────────────
Question text:
"As x approaches 2 from the right, what is the right-hand limit of f(x) = 1/(x - 2)?"

Answer choices:
A) 0
B) +∞
C) -∞
D) Does not exist

Correct answer: B
Student selected: C
Rationale: The sign of (x - 2) is always positive when x > 2, so 1/(x - 2) → +∞.

Concept tag: right-limit, asymptote


Q-005 (Incorrect)
─────────────────────────────────────────────────────────
[Similar detail...]

────────────────────────────────────────────────────────
CONCEPT TAGS MISSED IN THIS QUIZ
────────────────────────────────────────────────────────

epsilon-delta (Q-001)
right-limit (Q-003)
asymptote (Q-005)

────────────────────────────────────────────────────────
```

**Placement:** After base skill profile, before or after the module context (if both are present; they shouldn't be in the same session, so ordering is moot).

**Content:**
- Quiz metadata (time, skill, type, score)
- Summary of correct vs. incorrect questions
- For each incorrect question:
  - Full question text
  - All answer choices (A, B, C, D)
  - Correct answer
  - Student's selected answer
  - Brief rationale explaining why the student's choice was wrong
  - Concept tag(s) associated with that question
- Aggregated list of concept tags missed

**Why:** The tutor can now say things like: "I see you selected C on the right-limit question, but the sign is actually positive, so the limit is +∞. Here's why..." This is **hyperspecific feedback**, not generic explanations.

### 2.4 Base Context (Preserved)

The existing `USER SKILL PROFILE` section from `tutorContextBuilder.ts` is **always included**, regardless of invocation point. It provides the broader context:

```
USER SKILL PROFILE (427 questions answered):
Readiness: 45% (10/22 skills Demonstrating)

EMERGING SKILLS (highest priority...):
...

APPROACHING SKILLS (close — targeted practice...):
...

10 skills Demonstrating (≥80%)
12 skills Not Started
```

---

## 3. Prompt Construction

### 3.1 Current Structure

Today, `formatContextForPrompt()` in `tutorContextBuilder.ts` builds a string by concatenating:

1. Header: `USER SKILL PROFILE...`
2. Readiness metric
3. Emerging skills list with misconceptions
4. Approaching skills list
5. Demonstrating + Not Started counts

The full output is injected as system context (either via system prompt or user message prefix).

### 3.2 New Sections (Post-Tutor Integration)

Extend `formatContextForPrompt()` to conditionally include two new sections:

```typescript
export function formatContextForPrompt(
  ctx: TutorUserContext,
  moduleContext?: TutorModuleContext,    // ← new param
  recentQuizContext?: TutorRecentQuizContext, // ← new param
): string {
  const lines: string[] = [];

  // ── Base section (always included) ────────────────────────────────────
  lines.push(`USER SKILL PROFILE (${ctx.totalQuestionsSeen} questions answered):`);
  lines.push(`Readiness: ${Math.round(ctx.readinessRatio * 100)}%...`);
  // ... existing code ...

  // ── Module context (if provided) ─────────────────────────────────────
  if (moduleContext) {
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('CURRENT MODULE CONTEXT');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('');
    lines.push(`Module: ${moduleContext.title}`);
    lines.push(`Skill: ${moduleContext.skillId}`);
    lines.push('');
    lines.push('Sections covered in this lesson:');
    for (const [i, section] of moduleContext.sections.entries()) {
      lines.push(`${i + 1}. ${section.title ?? 'Untitled'} [${section.type}]`);
      if (section.label) lines.push(`   Label: ${section.label}`);
      lines.push(`   ${section.text.substring(0, 200)}...`);
      lines.push('');
    }
    if (moduleContext.conceptTags.length > 0) {
      lines.push(`Concept tags in this module: ${moduleContext.conceptTags.join(', ')}`);
      lines.push('');
    }
    if (moduleContext.completedInteractives.length > 0) {
      lines.push('Interactives student completed:');
      for (const ia of moduleContext.completedInteractives) {
        lines.push(`  • ${ia.title} [${ia.type}] — score: ${ia.score}%`);
      }
      lines.push('');
    }
  }

  // ── Recent quiz context (if provided) ────────────────────────────────
  if (recentQuizContext) {
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('RECENT QUIZ PERFORMANCE');
    lines.push('─────────────────────────────────────────────────────────────────');
    lines.push('');
    lines.push(`Quiz completed at: ${recentQuizContext.completedAt}`);
    lines.push(`Skill: ${recentQuizContext.skillId}`);
    lines.push(`Score: ${recentQuizContext.correctCount} of ${recentQuizContext.totalCount} (${Math.round((recentQuizContext.correctCount / recentQuizContext.totalCount) * 100)}%)`);
    lines.push('');
    lines.push('Correct questions: ' + recentQuizContext.correctQuestions.map(q => q.id).join(', '));
    lines.push('Incorrect questions: ' + recentQuizContext.incorrectQuestions.map(q => q.id).join(', '));
    lines.push('');

    if (recentQuizContext.incorrectQuestions.length > 0) {
      lines.push('INCORRECT ANSWERS DETAIL');
      lines.push('');
      for (const q of recentQuizContext.incorrectQuestions) {
        lines.push(`${q.id}`);
        lines.push('─'.repeat(40));
        lines.push(`Question: ${q.questionText}`);
        lines.push('');
        lines.push('Answer choices:');
        for (const [idx, choice] of q.choices.entries()) {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          lines.push(`${letter}) ${choice}`);
        }
        lines.push('');
        lines.push(`Correct answer: ${q.correctAnswer}`);
        lines.push(`Student selected: ${q.studentAnswer}`);
        lines.push(`Rationale: ${q.rationale}`);
        lines.push(`Concept: ${q.conceptTag}`);
        lines.push('');
      }

      const missedConcepts = [...new Set(recentQuizContext.incorrectQuestions.map(q => q.conceptTag))];
      lines.push('CONCEPT TAGS MISSED IN THIS QUIZ');
      lines.push(missedConcepts.join(', '));
      lines.push('');
    }
  }

  return lines.join('\n');
}
```

### 3.3 Type Definitions

Add to `src/types/tutorChat.ts`:

```typescript
export interface TutorModuleSection {
  title?: string;
  type: 'paragraph' | 'anchor' | 'list' | 'comparison' | 'interactive';
  label?: string; // e.g., "DEFINITION"
  text: string;   // Full prose
}

export interface TutorCompletedInteractive {
  title: string;
  type: string; // e.g., 'DragToOrder', 'ClickSelector'
  score: number; // 0–100
  completed: boolean;
}

export interface TutorModuleContext {
  title: string;
  skillId: string;
  sections: TutorModuleSection[];
  conceptTags: string[];
  completedInteractives: TutorCompletedInteractive[];
}

export interface TutorQuizQuestion {
  id: string;
  questionText: string;
  choices: string[]; // [A, B, C, D]
  correctAnswer: string; // e.g., "A"
  studentAnswer: string; // e.g., "B"
  rationale: string; // Why the student's answer was wrong
  conceptTag: string;
}

export interface TutorRecentQuizContext {
  completedAt: string; // ISO8601
  skillId: string;
  correctCount: number;
  totalCount: number;
  correctQuestions: Array<{ id: string }>; // Just IDs for correct ones
  incorrectQuestions: TutorQuizQuestion[];
}
```

### 3.4 Example Full Prompt Output

When a student opens the tutor post-quiz:

```
USER SKILL PROFILE (427 questions answered):
Readiness: 45% (10/22 skills Demonstrating)

EMERGING SKILLS (highest priority — these need the most work):
  - S-LIMITS-DEFINITION: Calculus - Limits & Continuity — 40% (18 attempts | trend: stable) [LOW SAMPLE — only 18 attempts]
    Common misconceptions: Epsilon-delta direction is often reversed; right-limit vs. left-limit confusion

...

───────────────────────────────────────────────────────────
CURRENT MODULE CONTEXT
───────────────────────────────────────────────────────────

Module: Limits and Continuity – Introduction
Skill: S-LIMITS-DEFINITION

Sections covered in this lesson:
1. What is a limit? [paragraph]
   A limit is the value that a function approaches as the input approaches some value. Limits are the foundation...

2. Epsilon-Delta Definition [anchor, label: "DEFINITION"]
   For any ε > 0, there exists δ > 0 such that |x - a| < δ implies |f(x) - L| < ε. This formal definition...

3. Limit Examples [list]
   • lim(x→2) (x² + 1) = 5
   • lim(x→0) sin(x)/x = 1

Concept tags in this module: limit, epsilon-delta, continuity, left-limit, right-limit

───────────────────────────────────────────────────────────
RECENT QUIZ PERFORMANCE
───────────────────────────────────────────────────────────

Quiz completed at: 2026-04-18T14:32:00Z
Skill: S-LIMITS-DEFINITION
Score: 2 of 5 (40%)

Correct questions: Q-002, Q-004
Incorrect questions: Q-001, Q-003, Q-005

INCORRECT ANSWERS DETAIL

Q-001
────────────────────────────────────────────────────────
Question: Which of the following is the epsilon-delta definition of a limit?

Answer choices:
A) For any ε > 0, there exists δ > 0 such that |x - a| < δ implies |f(x) - L| < ε
B) For any ε > 0, there exists δ > 0 such that |f(x) - L| < ε implies |x - a| < δ
C) A function is continuous if it has no breaks
D) The limit is the output when x equals a

Correct answer: A
Student selected: B
Rationale: The implication direction matters. We start with proximity of x to a (|x - a| < δ), then conclude proximity of f(x) to L (|f(x) - L| < ε). The student reversed this.
Concept: epsilon-delta

...

CONCEPT TAGS MISSED IN THIS QUIZ
epsilon-delta, right-limit, asymptote
```

---

## 4. Artifact Types

The tutor can now generate **four new artifact types** beyond the existing chat messages and quiz questions:

### 4.1 `concept-reteach`

**Purpose:** A prose explanation of a concept, tailored to the student's missed answer.

**Trigger:** Student asks "can you explain epsilon-delta again?" or tutor proactively offers it post-quiz.

**Format:**
```json
{
  "type": "concept-reteach",
  "conceptTag": "epsilon-delta",
  "title": "Epsilon-Delta Definition (Explained)",
  "content": "# The Epsilon-Delta Definition\n\nLet's build this step by step...",
  "relatedQuestions": ["Q-001"],
  "visualAid": "diagram-url" // optional: image/SVG
}
```

**UI:** Rendered as a collapsible card with prose, LaTeX, and optional embedded diagram.

### 4.2 `worked-example`

**Purpose:** A step-by-step walkthrough of a similar problem, showing all work.

**Trigger:** Student asks "can you work through an example?" or tutor offers it.

**Format:**
```json
{
  "type": "worked-example",
  "conceptTag": "epsilon-delta",
  "title": "Worked Example: Finding δ given ε",
  "problem": "Find δ such that |f(x) - L| < 0.1 when |x - a| < δ for f(x) = 2x + 1 at x = 3.",
  "steps": [
    {
      "number": 1,
      "action": "Substitute the function and point",
      "work": "|2x + 1 - 7| < 0.1"
    },
    {
      "number": 2,
      "action": "Simplify",
      "work": "|2(x - 3)| < 0.1"
    },
    {
      "number": 3,
      "action": "Factor and divide",
      "work": "2|x - 3| < 0.1  =>  |x - 3| < 0.05"
    },
    {
      "number": 4,
      "action": "Conclude",
      "work": "Therefore, δ = 0.05"
    }
  ],
  "conceptTag": "epsilon-delta",
  "relatedQuestions": ["Q-001"]
}
```

**UI:** Rendered as numbered steps with LaTeX, each step visible or collapsible.

### 4.3 `micro-quiz`

**Purpose:** 3 new practice questions on the missed concept, with immediate feedback.

**Trigger:** "Can you give me more practice on this?" or tutor proactively offers.

**Format:**
```json
{
  "type": "micro-quiz",
  "conceptTag": "epsilon-delta",
  "title": "Quick Practice: Epsilon-Delta",
  "questions": [
    {
      "id": "micro-q-001",
      "text": "Which direction is the implication in epsilon-delta?",
      "choices": ["...", "...", "...", "..."],
      "correctAnswer": "A",
      "rationale": "...",
      "hint": "Start with x, conclude with f(x)."
    },
    // 2 more questions
  ],
  "timeLimit": 180 // seconds (optional)
}
```

**UI:** Interactive quiz card. Student answers, sees immediate feedback, gets encouragement to try the module quiz again.

### 4.4 `analogy`

**Purpose:** A real-world or intuitive explanation of an abstract concept.

**Trigger:** "Can you explain this in simpler terms?" or tutor offers.

**Format:**
```json
{
  "type": "analogy",
  "conceptTag": "epsilon-delta",
  "title": "Epsilon-Delta in Plain English",
  "analogy": "Imagine you're trying to prove to a friend that a cat can get arbitrarily close to a piece of yarn without touching it...",
  "relatedQuestions": ["Q-001"]
}
```

**UI:** Rendered as a prose card with an optional illustration.

### 4.5 Storage in Supabase

Each artifact is stored in `tutor_artifacts` table (already exists, from migration 0010):

```sql
INSERT INTO tutor_artifacts (
  session_id,
  message_id,
  artifact_type,
  content,
  metadata,
  created_at
) VALUES (
  '...',
  '...',
  'concept-reteach',
  '{"conceptTag": "epsilon-delta", "title": "...", "content": "..."}',
  '{"invocation_source": "post-quiz", "related_questions": ["Q-001"]}',
  now()
);
```

**New metadata field:** `invocation_source` = `'module-header'` | `'post-quiz'` | `'triage'` | `'standalone'` (see **Section 7** for metrics).

---

## 5. Session Continuity

### 5.1 New Session vs. Continuing Existing Session

**Rule 1: In-Module Context**
- If the student opens the tutor from within `ModuleLessonViewer` (Invocation Point A), and a session with `sessionType = 'module-lesson'` for this skill already exists, **reuse it**.
- Rationale: The student is in the same module; continuing the conversation is natural.
- New module = new session (different skill or module ID).

**Rule 2: Post-Quiz Context**
- If the student opens the tutor from quiz results (Invocation Point B), **always create a new session** with `sessionType = 'post-quiz'`.
- Rationale: Post-quiz context is highly specific (exact wrong answers). Mixing it with a general lesson conversation creates cognitive load. A fresh session is cleaner.
- Exception: If the student opened the module tutor first (Rule 1), then failed the quiz and clicks "Get this explained differently," we allow them to **continue in the same session**. The session type remains `'module-lesson'`, but we inject the quiz context into the next prompt.

### 5.2 Session Type Enum

Add to `src/types/tutorChat.ts`:

```typescript
export type TutorSessionType = 
  | 'page-tutor'        // existing: full-page tutor (sidebar + chat)
  | 'floating'          // existing: floating widget
  | 'module-lesson'     // new: opened from inside lesson viewer
  | 'post-quiz'         // new: opened from quiz results
  | 'triage';           // new: opened from triage escalation
```

### 5.3 Session Creation Logic

In `useTutorChat.ts` (or a new hook `useTutorModuleChat`):

```typescript
interface StartTutorSessionOptions {
  sessionType: TutorSessionType;
  skillId: string;
  moduleContext?: TutorModuleContext;
  recentQuizContext?: TutorRecentQuizContext;
}

async function startOrContinueSession(options: StartTutorSessionOptions) {
  const { sessionType, skillId, moduleContext, recentQuizContext } = options;

  // If module-lesson: check for existing session
  if (sessionType === 'module-lesson') {
    const existing = sessions.find(s => 
      s.session_type === 'module-lesson' &&
      s.metadata?.skillId === skillId &&
      s.metadata?.moduleId === moduleContext?.title // or a stable module ID
    );
    if (existing) {
      selectSession(existing.id); // Reuse
      injectContextIntoPrompt(moduleContext, recentQuizContext);
      return;
    }
  }

  // Otherwise: create new session
  const newSession = await createSession({
    sessionType,
    skillId,
    metadata: {
      moduleId: moduleContext?.title,
      quizAttemptTime: recentQuizContext?.completedAt,
    },
  });

  selectSession(newSession.id);
  injectContextIntoPrompt(moduleContext, recentQuizContext);
}
```

---

## 6. Opt-Out & Optional Tutor Invitation

### 6.1 Tutor is Always Optional

- The "Ask tutor" button is always present but never mandatory
- A student can complete the triage loop (focused lesson + re-quiz) without invoking the tutor
- If a student is escalated to "forced tutor" (2nd re-quiz failure), they still have the option to dismiss the modal and move on (logged as abandonment)

### 6.2 No Forced Pop-ups

- The tutor is never auto-opened on module completion or quiz failure
- It's always a student choice to click the button
- Reason: Respect for student autonomy; some students prefer to struggle and learn on their own

### 6.3 Smart Suggestions (Optional)

- When appropriate, the tutor's opening message includes a suggestion: "I noticed you got the chain rule questions wrong. Would you like me to explain that concept?"
- Student can respond "yes" or type their own question
- No modal pop-up, no interruption—just a conversational prompt

---

## 7. Metrics & Logging

Every tutor invocation is logged with rich metadata to measure engagement and learning impact.

### 7.1 New `invocation_source` Field

Add to `tutor_sessions` table (as a column or metadata JSONB):

```sql
ALTER TABLE tutor_sessions ADD COLUMN invocation_source VARCHAR(20);
-- Values: 'module-header', 'post-quiz', 'triage', 'standalone'
```

### 7.2 Per-Artifact Metadata

Each `tutor_artifacts` row includes:

```json
{
  "artifact_type": "concept-reteach",
  "invocation_source": "post-quiz",
  "related_questions": ["Q-001", "Q-003"],
  "concept_tags": ["epsilon-delta"],
  "generated_by_claude_model": "claude-sonnet-4-5",
  "tokens_used": 1240
}
```

### 7.3 Metrics Dashboard (Internal)

Track:
- **Entry rate by source:** How many students invoke the tutor from module-header vs. post-quiz vs. triage?
- **Session duration by source:** Average time in tutor session, broken down by invocation source
- **Artifact generation:** Which artifact types are generated most often? (re-teach, worked example, etc.)
- **Follow-up accuracy:** For students who invoke tutor post-quiz, what's their accuracy 24h later on the same skill?
- **Escalation to forced tutor:** How many students fail the re-quiz and are escalated?
- **Artifact engagement:** Do students click into re-teaches, worked examples, and micro-quizzes? (via page interaction tracking)

### 7.4 Querying Learning Impact

Example query (pseudocode):

```sql
SELECT
  invocation_source,
  COUNT(*) as invocations,
  AVG(session_duration_seconds) as avg_session_duration,
  (SELECT COUNT(*) FROM user_progress up2
   WHERE up2.user_id = s.user_id
   AND up2.skill_id = s.skill_id
   AND up2.updated_at > s.started_at + '1 day'
   AND up2.accuracy > (initial_accuracy + 0.1)
  ) as accuracy_improved_1d_later
FROM tutor_sessions s
WHERE s.invocation_source = 'post-quiz'
GROUP BY invocation_source;
```

---

## 8. UX/Copy for Tutor Integration

### 8.1 Module-Header Button Hover Text

```
"Ask tutor about this module"
```

### 8.2 Module-Header Opening Message (Tutor's First Response)

```
Hi! I can walk you through any concept from this lesson, work through examples, 
or answer specific questions. What would help you most right now?

Quick suggestions:
  💡 Explain [Concept A] differently
  📝 Work through an example
  ❓ Answer my question
```

### 8.3 Post-Quiz Button Label

```
Get this explained differently
```

(Or simpler: `Ask tutor` with icon 💬)

### 8.4 Post-Quiz Opening Message

```
I can see you found some questions tricky. Let me break down the concepts 
step-by-step so it clicks.

Which question would you like to focus on?

  Q-001: Epsilon-delta definition (you selected B, correct is A)
  Q-003: Right-hand limit behavior (you selected C, correct is B)
  Q-005: Asymptote definition (you selected D, correct is A)
```

Cards show question text, student's answer, and correct answer inline.

### 8.5 Artifact Titles

- `concept-reteach`: **"Epsilon-Delta, Explained"**
- `worked-example`: **"Worked Example: Finding δ"**
- `micro-quiz`: **"Quick Practice: 3 Questions"**
- `analogy`: **"Epsilon-Delta in Plain English"**

---

## 9. Non-Goals

This spec does NOT cover:

1. **Generating new lesson content.** The tutor explains existing module content; it does not author new lessons or create alternative lesson sequences.

2. **Forcing tutor use.** Tutor invitations are always optional. Only in the escalation case (failed re-quiz twice) is the tutor strongly suggested, and even then, the student can dismiss it.

3. **Tutor modifying quiz or study plan.** The tutor's responses do not alter quiz behavior, question pools, or the student's study schedule.

4. **Real-time tutor assistance during quiz.** The tutor is not available while the student is taking a quiz (only before or after).

5. **Tutor summarizing or grading work.** The tutor does not assign grades, create reports, or communicate directly with instructors.

6. **Multi-turn concept refinement loops.** While the tutor can engage in multi-turn conversation, this spec does not mandate automated tracking of misconception resolution or guaranteed mastery (that's measured by quiz retakes, not tutor interaction).

7. **Social or competitive features.** Tutor sessions are private; no leaderboards or peer interaction.

---

## 10. Implementation Checklist

- [ ] Add `invocation_source` column to `tutor_sessions` table (migration)
- [ ] Extend `TutorUserContext` type to include optional `moduleContext` and `recentQuizContext`
- [ ] Update `formatContextForPrompt()` to inject module and quiz context sections
- [ ] Add "Ask tutor" button to `ModuleLessonViewer.tsx` header
- [ ] Add "Get this explained differently" button to `QuizResults` component (appears if score < 0.8)
- [ ] Create `useTutorModuleChat.ts` hook with session continuity logic (reuse module session, create new post-quiz)
- [ ] Extend `tutor_artifacts` metadata to include `invocation_source` and `concept_tags`
- [ ] Implement 4 new artifact types in tutor UI (concept-reteach, worked-example, micro-quiz, analogy)
- [ ] Wire tutor modal/panel to accept and display module + quiz context
- [ ] Build internal metrics dashboard (entry rate, artifact engagement, learning impact)
- [ ] Write E2E test: open module → invoke tutor → receive concept-reteach artifact
- [ ] Write E2E test: fail quiz → invoke tutor → receive micro-quiz artifact
- [ ] Write E2E test: session continuity (module session reuse vs. post-quiz new session)

---

## 11. Success Criteria

- **Adoption:** >40% of students who score <80% on a quiz use the tutor at least once
- **Session engagement:** Average tutor session duration from module-header is >3 minutes; from post-quiz is >5 minutes
- **Artifact generation:** >70% of tutor responses include at least one artifact (re-teach, worked example, etc.)
- **Follow-up accuracy:** Students who invoke the tutor post-quiz show >10pp accuracy improvement 24h later on the same skill, vs. students who don't
- **Retention:** Tutor sessions from triage are <10 minutes (focused, efficient)
- **Escalation clarity:** >80% of forced tutor escalations (failed re-quiz twice) are understood by students; low abandonment rate (<5%)
