# Developer Handoff — Practice Session & Learning Module Rendering

**Section of the product this covers:** Everything a user sees and interacts with during a Practice session, including questions, answer feedback, hints, and the embedded learning module content (lesson viewer + interactive exercises).

---

## 1. The Big Picture

When a user starts a practice session, three distinct rendering layers work together:

```
PracticeSession.tsx          ← session controller (state machine)
  └── QuestionCard.tsx        ← renders the current question + answer choices
  └── ExplanationPanel.tsx    ← renders post-answer feedback
  └── ModuleSnippetCard.tsx   ← renders inline hint / post-wrong-answer module excerpt
  └── SkillHelpDrawer.tsx     ← full-height slide-up drawer for the module lesson
        └── ModuleLessonViewer.tsx  ← renders lesson sections (text, lists, comparisons)
              └── ModuleInteractives/*  ← embedded interactive exercises inside the lesson
```

**Core principle:** `PracticeSession` owns all state. Every child component is controlled — they receive data via props and communicate back through callbacks. None of the child components hold "truth" about the question or score.

---

## 2. File-by-File Reference

### `src/components/PracticeSession.tsx`
**Role:** Session state machine and orchestrator.

**What it owns:**
- Current question selection (calls `selectNextQuestion` prop from parent)
- `selectedAnswers` — which option letters the user has chosen
- `showFeedback` — boolean gate that switches the card from "answering" to "reviewing" mode
- `confidence` — low/medium/high selected before submit
- `hintUsed` / `hintVisible` — whether the hint was opened (marks question as not counting toward score)
- `helpDrawerOpen` — controls `SkillHelpDrawer`
- Question retirement logic (localStorage, keyed to user ID)
- Streak message display
- Elapsed time tracking via `useElapsedTimer`
- Daily question count and study-time hooks

**Scoring rule to know:** If `hintUsed === true` when the user submits, the response is logged but **does not count toward skill accuracy**. This is set the moment the hint panel is opened — it cannot be undone for that question.

**Question retirement rules (in-file comments at top):**
1. Every question must be shown at least once before retirement starts (first-pass protection).
2. A question is retired when `times_correct >= 2` AND the first pass is done.
3. If the entire pool is retired, all flags reset and it starts over.
4. State lives in `localStorage` (not Supabase — cross-device migration is deferred).

---

### `src/components/QuestionCard.tsx`
**Role:** Renders a single question with answer choices, confidence selector, and submit/next button.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `question` | `AnalyzedQuestion` | The question object (text, options, correct answers) |
| `selectedAnswers` | `string[]` | Letters currently selected (e.g. `['C']`) |
| `onSelectAnswer` | fn | Called when user taps an option |
| `onSubmit` | fn | Called when Submit is clicked |
| `onNext` | fn | Called when Next Question is clicked |
| `showFeedback` | boolean | **The flip switch** — false = answering, true = reviewing |
| `confidence` | `'low'\|'medium'\|'high'` | Current confidence level |
| `onConfidenceChange` | fn | Confidence selector callback |
| `disabled` | boolean | Locks all interaction (used during submission) |
| `hideFooterControls` | boolean | Hides submit/next + confidence (used in diagnostic flow) |
| `assessmentType` | string | `'practice'`, `'adaptive'`, etc. — affects source badge display |

**Color system for answer options (`getChoiceTone`):**
- Unselected default: `border-slate-200 bg-[#fbfaf7]` — warm off-white surface
- Selected (pre-submit): `border-amber-300 bg-amber-50` — amber highlight
- Correct (post-submit): `border-emerald-300 bg-emerald-50` — green
- Wrong selection (post-submit): `border-rose-300 bg-rose-50` — red
- The letter chip takes the same color family as its container row

**Multi-correct questions:** If `correct_answer` has more than one letter, a "Select N" badge appears above the choices. The submit button is disabled until the right count is selected.

**Do not change:** The `showFeedback` toggle is the single gate that transforms the card from interactive to read-only. Do not add a separate "locked" state — use `showFeedback` consistently.

---

### `src/components/ExplanationPanel.tsx`
**Role:** Post-answer feedback panel shown below the question after submit.

**Shown when:** `showFeedback === true` in `PracticeSession`.

**What it renders:**
- Correct/Incorrect result badge (emerald or rose)
- User's selection vs. correct answer (when wrong)
- The question's `rationale` text
- Optional extended fields: `correctExplanation`, `contentLimit`, `complexityRationale`, `keyConcepts` tags
- A `DiagnosticFeedback` block (only when `userProfile` is available — gives skill-specific coaching based on the user's current proficiency pattern)

**Key dependency:** `src/brain/diagnostic-feedback.ts` — generates the personalized coaching copy. This is pure logic — it does not call an API.

---

### `src/components/ModuleSnippetCard.tsx`
**Role:** Compact inline card that surfaces a verbatim module text passage. Used in two modes.

**Modes:**
| Mode | When shown | Visual |
|---|---|---|
| `'hint'` | User opens hint before answering | Amber (`border-amber-200 bg-amber-50`) |
| `'feedback'` | After a wrong answer | Sky blue (`border-sky-200 bg-sky-50`) |

**Hint mode specifics:**
- Shows a dismiss button (X)
- Shows the scoring notice: *"Hint opened — this answer will not count toward your score."*
- Has a "Study the full module" link that opens `SkillHelpDrawer`

**Feedback mode specifics:**
- No dismiss button (stays visible)
- Supports multi-module questions: shows secondary module snippets below the primary in a "Also covered in" section

**Data flow:** The snippet text comes from `question.moduleRefs[0].snippet` — a verbatim quote pre-tagged in the question bank to the exact module passage that teaches this concept. If no snippet exists, the component returns `null`.

---

### `src/components/SkillHelpDrawer.tsx`
**Role:** Full-height bottom drawer that surfaces the complete module lesson for the skill currently being practiced.

**Trigger:** User clicks the lightbulb/hint button in the session header. `PracticeSession` sets `helpDrawerOpen = true`.

**Structure:**
```
Fixed overlay (backdrop blur, z-40)
└── Fixed drawer panel (bottom-0, max-h-85vh, z-50)
      ├── Drag handle pill
      ├── Header bar (skill label, lesson count, close button)
      ├── Module tab row (only shown when skill has >1 module)
      └── Scrollable content area
            └── ModuleLessonViewer (compact=true)
```

**Module navigation:** A skill can have multiple modules. The tab row lets users switch between the primary module and extras. Each switch fires `progress.onCloseModule` / `progress.onOpenModule` to track time spent.

**Tracking hooks it uses:**
- `useLearningPathProgress` — viewed state + time-on-module
- `useModuleVisitTracking` — section visibility events, interactive completions
- `useSectionObserver` — IntersectionObserver that fires when sections scroll into view

**Important:** The drawer does not auto-scroll to any section. It intentionally makes the user read through the lesson to find what they need. Do not add auto-scroll or answer highlighting.

---

### `src/components/ModuleLessonViewer.tsx`
**Role:** Renders the full content of a `LearningModule` object — all sections in sequence.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `module` | `LearningModule` | The module data object |
| `compact` | `boolean` | `true` = smaller text/padding for use inside SkillHelpDrawer |
| `isViewed` | `boolean` | Controls the "Mark as viewed" toggle state |
| `onSetViewed` | fn | Callback when user toggles the viewed button |
| `sectionRefs` | `MutableRefObject<...>` | Array of refs for scroll-depth tracking |
| `completedInteractives` | Record | Map of `{sectionIndex: {score, completed}}` |
| `onInteractiveComplete` | fn | Fires when user submits an interactive exercise |
| `relatedModules` | array | Secondary modules to show as "See also" links |
| `onOpenRelated` | fn | Callback when user clicks a related module link |

**Section types rendered by `SectionRenderer`:**

| Type | What it renders |
|---|---|
| `paragraph` | Plain prose — `text-base text-slate-700 leading-relaxed` |
| `anchor` | Left amber border callout box — used for "KEY RULE" type callouts |
| `list` | Amber bullet dots with optional section label |
| `comparison` | Two-column card layout — left (slate) vs right (amber) — for contrast tables |
| `interactive` | Delegates to the correct interactive component (see below) |
| `visual` | Placeholder box `[Visual: type]` — not yet implemented |

**`compact` prop behavior:**
- `compact=true`: `text-sm` body, `text-lg` heading, `px-4` padding
- `compact=false` (default): `text-base` body, `text-2xl` heading, `px-6` padding

**Visual design rules (established, do not regress):**
- Outer wrapper: `bg-white rounded-2xl shadow-sm border border-slate-100`
- Module ID badge: `bg-amber-100 text-amber-700 text-xs font-bold rounded-md uppercase tracking-wider`
- Title: `font-black text-slate-900 tracking-tight leading-snug`
- All body text: `text-slate-700 leading-relaxed`
- Callout (anchor): `border-l-4 border-amber-400 bg-amber-50`
- Comparison left column: `bg-slate-50 border-slate-200`
- Comparison right column: `bg-amber-50 border-amber-200`

---

## 3. Interactive Components (`src/components/ModuleInteractives/`)

All five components share the same behavioral contract:

> **"Submit separates action from feedback."**
> - The user can interact freely before submitting.
> - Correct/incorrect state is **never shown** until the submit button is clicked.
> - After submit, options lock. Incorrect attempts show a retry path.
> - `onComplete` fires once on the first submit.

### `DragToOrder.tsx`
Reorder items by drag-and-drop into the correct sequence.

**Key implementation detail:** Items are **shuffled on mount** using Fisher-Yates. The correct order is `initialItems` (the prop as received). Never initialize `items` to `initialItems` directly — the activity would start already correct.

**State:** `items` (current order), `submitted`, `draggedIndex`

**Feedback:**
- Correct: `bg-emerald-50` panel, "✓ Correct sequence!"
- Wrong: `bg-rose-50` panel, "✗ Not quite" + "Try again" button that re-shuffles

**Submit button:** Always enabled (drag has already happened). Hidden once submitted correctly.

---

### `ClickSelector.tsx`
Click to select one or more options.

**Modes:** `singleSelect=true` (default, clears previous selection) or `singleSelect=false` (multi-select).

**Correct answer logic:**
- If no option has `isCorrect: true`, all selections are treated as valid (open-ended activity).
- If any option has `isCorrect: true`, the full set of correct IDs must match exactly.

**State:** `selected: Set<string>`, `submitted`

**Feedback (post-submit, inline on the option button):**
- Selected + correct: `bg-emerald-50 border-emerald-300`
- Selected + wrong: `bg-rose-50 border-rose-300`
- Unselected: faded `opacity-60`

**Submit button:** Disabled if nothing is selected. Hidden after submit.

---

### `TermMatcher.tsx`
Drag definitions onto the matching term boxes.

**State:** `matches: Map<termIndex, defIndex>`, `definitions` (shuffled array), `draggedDefIndex`

**Feedback:** Shown live as user drags (before submit):
- Correct match: `border-emerald-300 bg-emerald-50`
- Wrong match: `border-amber-300 bg-amber-50`

**All-matched state:** When `matches.size === pairs.length`, a result panel appears:
- All correct: emerald "✓ Perfect match!"
- Partial: amber `"{n}/{total} correct — remove and retry the incorrect ones"`

**Complete button:** Only appears when all terms have been matched. Calls `onComplete(correctMatches)`.

---

### `ScenarioSorter.tsx`
Drag scenarios from a source bank into category columns.

**State:** `categorization: Record<category, scenarioId[]>`, `draggedScenario`

**Category colors (auto-assigned by keyword matching on the category string):**
- Contains "GREEN", "YES", "ENDORSED" → emerald
- Contains "RED", "NO", "NOT" → rose
- Everything else → blue

**Complete button:** Only appears when `unassignedScenarios.length === 0` (all sorted). Calls `onComplete(categorization)`.

**Note:** There is no correctness check inside this component — scoring is done by the parent (`ModuleLessonViewer`) by comparing against expected categories in the module data.

---

### `CardFlip.tsx`
Click-to-reveal flashcards with a CSS 3D flip animation.

**State:** `flipped: Set<cardId>`

**Animation:** Uses inline `style={{ transform: 'rotateY(180deg)' }}` with `transformStyle: 'preserve-3d'` and `backfaceVisibility: 'hidden'` on each face. Pure CSS — no JS animation library.

**Complete trigger:** When all cards are flipped, fires `onComplete({ flipped, total })` via a `useEffect` with a `useRef` guard to prevent double-firing on re-renders.

**No submit button:** Completion is automatic when all cards are revealed.

---

## 4. Data Shape — `LearningModule`

Defined in `src/data/learningModules.ts`. This is the data contract all of the above components consume.

```ts
interface LearningModule {
  id: string;           // e.g. "MOD-D4-01"
  title: string;        // e.g. "CBT: The Most Supported School-Based Counseling Approach"
  skillId: string;      // links to skill-map
  domainId: number;
  sections: ModuleSection[];
}

type ModuleSection =
  | { type: 'paragraph'; text: string }
  | { type: 'anchor'; text: string; label?: string }
  | { type: 'list'; items: string[]; label?: string }
  | { type: 'comparison'; rows: Array<{left:string; right:string}>; leftHeader: string; rightHeader: string; label?: string }
  | { type: 'interactive'; interactiveType: InteractiveType; prompt?: string; label?: string; /* + type-specific data */ }
  | { type: 'visual'; visualType: string }
```

The question bank links to modules via `moduleRefs`:
```ts
interface ModuleRef {
  moduleId: string;
  moduleTitle: string;
  snippet: string;   // verbatim excerpt used in the hint/feedback card
}
```

---

## 5. Design System — Rules for This Section

All components in this section render inside the **light editorial shell** (`bg-[#fbfaf7]`). Never use dark-mode Tailwind classes here (`bg-slate-800`, `text-slate-300`, `bg-navy-*`, etc.). All text must be readable on a white/warm-white surface.

**Accent color:** Amber (`amber-400`, `amber-700`, `amber-50`) is the primary accent throughout. Cyan is legacy — it still appears in some interactive submit buttons and drag states but should be migrated to amber on future passes.

**Established class conventions:**
```
Heading:        font-black text-slate-900 tracking-tight
Body text:      text-slate-700 leading-relaxed
Muted label:    text-[10px] font-black uppercase tracking-wider text-slate-400
Amber label:    text-[10px] font-black uppercase tracking-wider text-amber-700
Correct state:  bg-emerald-50 border-emerald-200 text-emerald-700
Wrong state:    bg-rose-50 border-rose-200 text-rose-700
Hint/callout:   bg-amber-50 border-amber-200 text-amber-700
Submit button:  bg-amber-400 text-slate-900 font-bold (primary)
               bg-cyan-600 text-white (legacy — in interactives)
Card wrapper:   bg-white rounded-2xl shadow-sm border border-slate-100
```

**Tailwind utility classes from `index.css`:**
- `.editorial-surface` — white card with rounded corners and border
- `.editorial-surface-soft` — slightly warm background panel
- `.editorial-button-primary` — amber filled button
- `.editorial-button-dark` — dark slate filled button (used for Next Question)

---

## 6. State Flow Summary

```
User opens Practice session
  → PracticeSession selects question
  → QuestionCard renders (showFeedback=false)

User selects an answer
  → selectedAnswers updates (PracticeSession state)
  → QuestionCard re-renders with amber highlight on selected option

User opens hint
  → hintUsed=true (cannot be undone for this question)
  → ModuleSnippetCard renders in 'hint' mode (amber)
  → "Study the full module" → helpDrawerOpen=true → SkillHelpDrawer opens

User submits
  → PracticeSession calls updateSkillProgress (skipped if hintUsed)
  → showFeedback=true
  → QuestionCard flips to review mode (emerald/rose on options)
  → ExplanationPanel appears below
  → If wrong: ModuleSnippetCard appears in 'feedback' mode (sky blue)

User clicks Next Question
  → PracticeSession advances, resets showFeedback, selectedAnswers, hintUsed
  → New question selected and rendered
```

---

## 7. Things Not to Break

1. **`showFeedback` is the single source of truth** for whether a question is in answering or reviewing state. Do not add a second "submitted" boolean in QuestionCard.

2. **`hintUsed` is permanent for the current question.** Once set to `true`, no code path sets it back to `false` until `onNext()` fires. Do not add a way to "undo" hint usage.

3. **Interactives shuffle on mount.** `DragToOrder` and `TermMatcher` must never render in the correct answer order. The Fisher-Yates shuffle in the `useState` initializer function is load-bearing.

4. **`onComplete` fires once.** `CardFlip` uses a `useRef` guard to prevent double-firing. Other interactives fire `onComplete` inside the submit handler (one click = one call). Do not add `useEffect`-based auto-fire to components that have a submit button.

5. **The SkillHelpDrawer does not highlight answers.** It shows the full module lesson starting from the top. There is intentionally no scroll-to-relevant-section behavior.

6. **Hint questions are not scored.** In `PracticeSession`, the call to `updateSkillProgress` is wrapped in `if (!hintUsed)`. Removing this guard would corrupt all skill accuracy metrics.
