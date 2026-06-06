# UI Structure Audit — PraxisMakesPerfect
*Generated 2026-04-08. Based on codebase at `App.tsx`, `src/components/`, `src/hooks/`.*

> **⚠ Staleness note (2026-04-16):** This audit was written before the Cognitive Clarity light-mode UI sweep merged (PRs #7 / #8 / #9 on 2026-04-16–17). The AppMode taxonomy and sidebar/navigation conditional rules are still accurate, but individual screen descriptions under "B. SCREEN INVENTORY" may reflect the pre-redesign components. Use the taxonomy as a structural reference; verify screen-level details against the current code before relying on them.

---

## A. GLOBAL APP STRUCTURE

### Navigation Model

The app uses **state-based navigation** (not React Router). A single `AppMode` string in `App.tsx:75` controls which screen renders. There are 17 distinct modes:

```
'home' | 'screener' | 'fullassessment' | 'adaptive-diagnostic'
| 'results' | 'score-report' | 'practice' | 'practice-hub'
| 'review' | 'admin' | 'study-guide' | 'study-notebook'
| 'glossary' | 'learning-path-module' | 'redemption-round'
| 'help' | 'tutor'
```

### Sidebar (Desktop, 8 items)

Defined in `App.tsx:643–651`. Items are conditionally shown:

| Item | Mode | Icon | Condition |
|------|------|------|-----------|
| Dashboard | `home` | Brain | Always |
| Practice | `practice-hub` | Zap | Always |
| Progress | `results` | BarChart3 | Only when `hasReadinessData` is true |
| Study Plan | `study-guide` | BookOpen | `ACTIVE_LAUNCH_FEATURES.studyGuide` |
| AI Tutor | `tutor` | Bot | `ACTIVE_LAUNCH_FEATURES.tutorChat && profile.adaptiveDiagnosticComplete` |
| Study Notebook | `study-notebook` | BookMarked | Always (dot badge when study plan exists) |
| Glossary | `glossary` | BookOpen | Always |
| Help | `help` | HelpCircle | Always |

### Mobile Navigation

Horizontal scroll tabs below the header (`App.tsx:874–900`). Same 8 items, slightly different conditions. No visual separator between primary and secondary tabs on either platform.

### App Hierarchy

```
Auth layer (LoginScreen / OnboardingFlow)
  └── Authenticated shell (sidebar + header + main)
        ├── Pre-assessment state (PreAssessmentGateway)
        ├── Assessment states (Screener / Full / Adaptive)
        ├── Post-assessment main app
        │     ├── Dashboard (home)
        │     ├── Practice Hub (practice-hub) ← launches Practice
        │     ├── Progress (results)
        │     ├── Study Plan (study-guide)
        │     ├── AI Tutor (tutor)
        │     ├── Study Notebook (study-notebook)
        │     ├── Glossary (glossary)
        │     └── Help (help)
        └── Overlay / transient modes
              ├── Redemption Round (redemption-round)
              ├── Learning Path Module (learning-path-module)
              └── Admin Dashboard (admin)
```

---

## B. SCREEN INVENTORY

### Screen 1 — Login Screen
- **File:** `src/components/LoginScreen.tsx`
- **Mode:** Pre-auth (rendered when `!user` in App.tsx)
- **Parent:** None (root entry)
- **Purpose:** Email/password authentication and account creation
- **UI Regions:** Center card with logo, email/password form, CTA buttons
- **Tabs/sub-nav:** None
- **Key Controls:**
  - "Sign in" → authenticates, routes to Onboarding or home
  - "Create account" → registration form
  - "Forgot password" → password reset
- **Data shown:** None (no user data yet)
- **UX issues:** Clean. No issues noted.

---

### Screen 2 — Onboarding Flow
- **File:** `src/components/OnboardingFlow.tsx`
- **Mode:** Overlay after first login, no dedicated AppMode
- **Parent:** Appears over home screen on `!profile.onboardingComplete`
- **Purpose:** Collect user context (role, program, goals)
- **UI Regions:** Multi-step form card
- **Tabs:** None (sequential steps)
- **Key Controls:**
  - Step navigation (Next / Back)
  - Form inputs: name, university, program, role, goals
  - "Finish" → saves via `saveOnboardingData()` → shows PreAssessmentGateway
- **Data shown:** None
- **UX issues:** Appears as an overlay with no dedicated route — if user refreshes mid-onboarding, state may be lost.

---

### Screen 3 — Pre-Assessment Gateway
- **File:** `src/components/PreAssessmentGateway.tsx`
- **Mode:** `home` (when `isNewUser || isScreenerDone`)
- **Parent:** Dashboard tab
- **Purpose:** Entry point for new users; explains the diagnostic, offers Spicy Mode
- **UI Regions:** Centered single-column, max-w-lg
  - Greeting header
  - Session resume card (conditional)
  - Adaptive Diagnostic card (recommended)
  - Divider
  - Feeling Spicy card
  - "Browse by domain/skill" text link
- **Tabs:** None
- **Key Controls:**
  - "Start Diagnostic →" → `startAdaptiveDiagnostic()` → mode=`adaptive-diagnostic`
  - "Try a Random Question →" → `startPractice()` → mode=`practice`
  - "Or browse by domain or skill →" → mode=`practice-hub`
  - Resume / Discard (if session in progress)
- **Data shown:** Static (45–90 questions, 25–45 minutes, ∞ pause)
- **UX issues:**
  - "Browse by domain or skill" is a small text link at the bottom — very easy to miss
  - Sessions mid-diagnostic show a Resume card here — users must scroll past the gateway content to see it
  - Spicy Mode description says "no unlocks" but it isn't clear if this resets or persists progress

---

### Screen 4 — Screener Assessment
- **File:** `src/components/ScreenerAssessment.tsx`
- **Mode:** `screener`
- **Parent:** Launched from PreAssessmentGateway or admin reset
- **Purpose:** Fixed ~40-50 question baseline screener
- **UI Regions:** Full-screen question card + header with progress/timer
- **Tabs:** None
- **Key Controls:**
  - Multiple choice radio/checkbox selection
  - "Next" / "Previous" navigation
  - Pause/resume timer
  - "Exit" or "Save & Pause" → returns to home with session resume card
- **Data shown:** Current question, question number X/N, time elapsed
- **UX issues:** Shares UI with Full Assessment — no clear visual distinction to the user about which assessment they're in.

---

### Screen 5 — Full Assessment
- **File:** `src/components/FullAssessment.tsx`
- **Mode:** `fullassessment`
- **Parent:** Launched post-screener or from admin
- **Purpose:** ~100–120 question comprehensive skill mapping
- **UI Regions:** Same as Screener Assessment
- **Tabs:** None
- **Key Controls:** Same as Screener (Next, Previous, Pause, Exit)
- **Data shown:** Question, progress indicator, timer
- **UX issues:** Identical UI to screener — user may not know which assessment they are in.

---

### Screen 6 — Adaptive Diagnostic
- **File:** `src/components/AdaptiveDiagnostic.tsx`
- **Mode:** `adaptive-diagnostic`
- **Parent:** Launched from PreAssessmentGateway (recommended path)
- **Purpose:** Smart 45–90 question assessment that adapts follow-up depth per skill
- **UI Regions:** Full-screen question card + header
- **Tabs:** None
- **Key Controls:**
  - Multiple choice answers
  - "Submit" → advances question
  - "Pause & Exit" → `onPauseExit()` → mode=`home`
- **Data shown:** Question number, skill being tested (not shown to user), adaptive pool progress
- **UX issues:** User has no visibility into how adaptive follow-ups work — just sees questions. No indication of "estimated remaining questions" as performance accumulates.

---

### Screen 7 — Screener Results
- **File:** `src/components/ScreenerResults.tsx`
- **Mode:** `score-report` + `lastAssessmentType='screener'`
- **Parent:** Triggered after screener completion
- **Purpose:** Show domain-level screener results; prompt next step
- **UI Regions:** Full-page results card
- **Tabs:** None
- **Key Controls:**
  - "Start Practice" → `onStartPractice()`
  - "Take Full Assessment" → `onTakeFullAssessment()`
  - "Go Home" → mode=`home`
- **Data shown:** Domain accuracy bars, weak spots, recommendations
- **UX issues:** Three CTAs competing for attention; "Take Full Assessment" may be confusing for users who just took the adaptive diagnostic path.

---

### Screen 8 — Full Assessment Score Report
- **File:** `src/components/ScoreReport.tsx`
- **Mode:** `score-report` + `lastAssessmentType='full'`
- **Parent:** Triggered after full assessment completion
- **Purpose:** Detailed skill report with concept gaps and diagnostic summary
- **UI Regions:** Multi-section page: skill breakdown, domain analysis, diagnostic summary
- **Tabs:** None (single scroll)
- **Key Controls:**
  - "Start Practice" → `onStartPractice()`
  - "Retake Assessment" → `onRetakeAssessment()` (disabled after both assessments done)
  - "Go Home" → mode=`home`
- **Data shown:** Skill-by-skill results, domain accuracy, concept gaps
- **UX issues:** Wrapped in `ErrorBoundary` (`App.tsx:1254`) — suggests it can fail on corrupted data. No error handling for missing data gracefully.

---

### Screen 9 — Dashboard Home (Post-Diagnostic)
- **File:** `src/components/DashboardHome.tsx`
- **Mode:** `home` (when `isFullyUnlocked`)
- **Parent:** Dashboard tab
- **Purpose:** Main hub after diagnostic completion; daily focus + stats + navigation tiles
- **UI Regions:** Single-column scroll, max content width
  1. Readiness Banner (progress bar, %, phase label)
  2. Two-column section:
     - Left (2/3): Today's Focus (SRS overdue, priority skill, vocab quiz suggestion)
     - Right (1/3): This Week stats card + Redemption card (conditional)
  3. Feature Tiles (5-card grid)
  4. Domain Performance (4 domain bars)
- **Tabs:** None
- **Key Controls:**
  - "Review Now →" (SRS card) → `onStartSkillPractice(srsOverdueSkills[0].skillId)` → mode=`practice`
  - "Practice →" (priority skill card) → `onStartSkillPractice(weakestSkill.skillId)` → mode=`practice`
  - "Quiz Now →" (vocab card) → `onNavigate('glossary')` → mode=`glossary`
  - "Enter Redemption →" → `onStartRedemption()` → mode=`redemption-round`
  - Feature tile: Fluency Drill → mode=`glossary`
  - Feature tile: Vocab Quiz → mode=`glossary`
  - Feature tile: Learning Path → `onOpenLearningPathModule(weakestSkill.skillId)` → mode=`learning-path-module`
  - Feature tile: Study Guide → mode=`study-guide`
  - Feature tile: AI Tutor → mode=`tutor`
  - Domain bar click → `onStartPractice(domainId)` → mode=`practice`
  - "Full report →" → mode=`results`
- **Data shown:** Readiness %, demonstrating count/45, SRS overdue count, weakest skill name/domain, weekly Q count, weekly accuracy, weekly study time, daily goal progress, redemption bank count/credits, 4 domain bars with %
- **UX issues:**
  - **Fluency Drill and Vocab Quiz** are separate tiles but both navigate to `glossary`. The "NEW" badge on Fluency Drill implies a distinct mode that doesn't exist yet.
  - Feature tiles (Learning Path, Study Guide, AI Tutor) duplicate the sidebar navigation — the dashboard becomes a second nav hub.
  - Domain bars are clickable to start practice but have no affordance signaling this (no chevron, no hover state beyond cursor pointer change at small sizes).
  - Right column is narrow; on mobile these stack, causing the Redemption card to appear below the fold.

---

### Screen 10 — Practice Hub
- **File:** `src/components/StudyModesSection.tsx`
- **Mode:** `practice-hub`
- **Parent:** Practice tab
- **Purpose:** Choose practice mode (domain / skill / learning path)
- **UI Regions:**
  - Header ("Practice Hub" + subtitle)
  - SRS nudge banner (conditional, if overdue skills)
  - Three tab pills (By Domain / By Skill / Learning Path)
  - Tab content area
- **Tabs:**
  - **By Domain:** 4 domain cards sorted by weakest first, each showing tier badge + accuracy %. Clicking → `startPractice(domainId)` → mode=`practice`
  - **By Skill:** Filterable list of 45 skills (filter chips: All / Emerging / Approaching / Demonstrating / Overdue). Each row: skill name, accuracy bar, help icon. Clicking row → `startSkillPractice(skillId)`. Help icon → `SkillHelpDrawer` (slide-in panel)
  - **Learning Path:** `LearningPathNodeMap` component showing ordered nodes (weakest first). Clicking node → `openLearningPathModule(skillId)` → mode=`learning-path-module`
- **Key Controls:**
  - Tab pills (By Domain, By Skill, Learning Path)
  - Domain card click → practice
  - Skill row click → practice
  - Skill help icon → SkillHelpDrawer overlay
  - SRS nudge → switches to By Skill tab, filter=overdue
  - Lock state CTAs → "Take the adaptive diagnostic" → `startFullAssessment()`
- **Data shown:** Per-domain: accuracy %, proficiency tier, skill count. Per-skill: accuracy bar, % score.
- **UX issues:**
  - All 3 tabs show lock icons and show "Unlocks after diagnostic" — but the lock icon appears in the tab pill even before clicking. Tab is still clickable, leading to a confusing locked state inside the tab.
  - Practice exits to Results (`mode='results'`) when coming from skill practice (`App.tsx:1323`) but to Practice Hub from domain practice. Inconsistent.
  - By Domain tab redundantly shows the same data as Dashboard domain bars and Progress domain cards.
  - By Skill tab is a scroll list capped at `max-h-[60vh]` — can feel cramped with 45 items.

---

### Screen 11 — Practice Session
- **File:** `src/components/PracticeSession.tsx` (~950 lines)
- **Mode:** `practice`
- **Parent:** Launched from Dashboard, Practice Hub, or Assessment Results
- **Purpose:** Active question-answer loop with hints, rationale, streaks
- **UI Regions:** Full-screen question card
  - Header: skill/domain context, streak counter, question number
  - Question stem
  - Answer choices (radio or checkbox)
  - Submit button
  - Post-submit: rationale panel, correct/incorrect feedback
  - Hint panel (expandable)
  - "Next Question" button
  - Exit/home control
- **Tabs:** None
- **Key Controls:**
  - Answer choices → select
  - "Submit" → reveal rationale
  - "Next Question" → advance
  - Hint button → show hint (flags question for redemption)
  - "Exit Practice" → returns to Practice Hub or Results
- **Data shown:** Question text, 4–6 answer choices, correct answer, rationale, streak count
- **UX issues:**
  - No session summary screen at the end — exits immediately to prior screen
  - Exit destination is non-deterministic to the user (goes to Results if was skill practice, Practice Hub otherwise — `App.tsx:1322–1331`)
  - Streak messages appear inline but there's no persistent progress indicator during the session (e.g., "15 questions this session")
  - Hint usage is silently tracked for redemption — no indication to the user that using a hint flags the question

---

### Screen 12 — Learning Path Module Page
- **File:** `src/components/LearningPathModulePage.tsx` (~600 lines)
- **Mode:** `learning-path-module`
- **Parent:** Practice Hub → Learning Path tab, or Dashboard → Learning Path tile
- **Purpose:** Skill deep-dive with micro-lesson content + embedded practice
- **UI Regions:**
  - Back button → Practice Hub
  - Module header (skill name, module ID)
  - Lesson content (text + video if available)
  - Snippet card (reference text)
  - Practice section (embedded questions for this skill)
  - Progress tracking (lesson viewed checkbox, time spent)
- **Tabs:** May include sub-sections within the module
- **Key Controls:**
  - "Back" → mode=`practice-hub`
  - "Mark as Viewed" → updates learning path progress
  - Embedded practice questions → same answer/rationale loop
- **Data shown:** Skill-specific lesson text, vocabulary, practice questions, completion status
- **UX issues:**
  - Back always returns to `practice-hub` (`App.tsx:1143–1146`) — if user entered from Dashboard tile, they get sent to Practice Hub instead of back to Dashboard
  - Module page mixes lesson content with embedded practice, making it unclear where learning ends and assessment begins

---

### Screen 13 — Progress Dashboard
- **File:** `src/components/ResultsDashboard.tsx`
- **Mode:** `results`
- **Parent:** Progress tab
- **Purpose:** Pure analytics page — no practice entry points
- **UI Regions (top to bottom):**
  1. Page header ("Progress Dashboard" + subtitle)
  2. 4 Domain cards (2x2 on mobile, 4-col on desktop): % score, proficiency tier, skill count, exam weight
  3. Skill Proficiency Map (compact color grid, conditional on `fullAssessmentUnlocked`)
  4. Session Stats (4 stats: total Q, overall accuracy, total study time, avg/Q)
  5. Growth Since Diagnostic (collapsible, conditional on `baselineSnapshot`)
  6. Concept Insights (collapsible, conditional on `analyzedQuestions`)
  7. Advanced Statistics (collapsible: avg time by domain, confidence-adjusted accuracy)
- **Tabs:** None (single scroll with collapsibles)
- **Key Controls:**
  - Domain cards: visual only, not clickable
  - Skill Proficiency Map cells: hover tooltip (skill name + %), not clickable
  - "Growth Since Diagnostic" toggle → expand/collapse
  - "Concept Insights" toggle → expand/collapse
  - "Advanced Statistics" toggle → expand/collapse
- **Data shown:** All skill performance data — see Section F for full list
- **UX issues:**
  - Most important growth data (Growth Since Diagnostic) is hidden in a collapsed section
  - Skill Proficiency Map cells show only a number (%), no skill name visible without hover
  - No way to drill into a specific skill from this page (skills are not clickable)
  - No way to initiate practice from this page (intentional, but creates dead end)
  - Domain data duplicated from Dashboard and Practice Hub

---

### Screen 14 — Study Plan (AI Study Guide)
- **File:** `src/components/StudyPlanCard.tsx`
- **Mode:** `study-guide`
- **Parent:** Study Plan tab
- **Purpose:** AI-generated personalized study plan; shows history + generation UI
- **UI Regions:**
  - Page header ("AI Study Guide")
  - Generation state panel (can generate / generating spinner / error)
  - Plan history timeline
  - Plan document viewer (when plan exists)
- **Tabs:** None visible in this component (plan document may have internal sections)
- **Key Controls:**
  - "Generate Study Plan" → `onGenerate()` → triggers background Netlify function
  - Plan history entries → expand to view
- **Data shown:** AI-generated plan text, generation history, rate limit status (1 per 7 days)
- **UX issues:**
  - Plan generation can take minutes (async) — user must return later to see result
  - Rate limit (7 days) is enforced but not clearly communicated in the UI before hitting it

---

### Screen 15 — AI Tutor
- **File:** `src/components/TutorChatPage.tsx`
- **Mode:** `tutor`
- **Parent:** AI Tutor tab
- **Purpose:** Conversational AI for exam prep questions
- **UI Regions:** Full-height chat interface (no sidebar scrolling — `App.tsx:905–912`)
  - Message history
  - Input field
  - Suggested prompts
  - Context-aware sidepanel (optional)
- **Tabs:** None
- **Key Controls:**
  - Text input → send message
  - Suggested prompt chips → populate input
- **Data shown:** Conversation history, AI responses, embedded quizzes (artifacts)
- **UX issues:**
  - TutorChatPage gets full-height treatment (`flex-1 min-h-0`) while all other pages go through the scrollable container — this is a one-off layout exception that may create inconsistency
  - FloatingTutorWidget also appears on other screens as a floating bubble — two entry points to the same AI with different context

---

### Screen 16 — Study Notebook
- **File:** `src/components/StudyNotebookPage.tsx`
- **Mode:** `study-notebook`
- **Parent:** Study Notebook tab
- **Purpose:** Personal notes organized by skill/module
- **UI Regions:** Notes editor with tag system, search, skill/domain organization
- **Data shown:** User's personal notes, linked to study plan when available
- **UX issues:** Sidebar badge dot only appears when study plan exists — the badge condition (`studyPlanHistory.length > 0`) is misleading as a signal for new notes.

---

### Screen 17 — Glossary
- **File:** `src/components/GlossaryPage.tsx`
- **Mode:** `glossary`
- **Parent:** Glossary tab
- **Purpose:** Vocabulary reference with quiz mode
- **UI Regions:** Search bar, term list, definition panels, quiz mode toggle
- **Key Controls:**
  - Search → filter terms
  - "Quiz Mode" toggle → randomized term/definition quiz
- **Data shown:** Terms from `master-glossary.json`, tagged from practice wrong answers
- **UX issues:** Both "Fluency Drill" and "Vocab Quiz" feature tiles on Dashboard link here — they are functionally identical from the user's perspective.

---

### Screen 18 — Help / FAQ
- **File:** `src/components/HelpFAQ.tsx`
- **Mode:** `help`
- **Parent:** Help tab
- **Key Controls:**
  - "Go Home" → mode=`home`
  - "Replay Tutorial" → `replayTutorial()`
- **UX issues:** Minimal — no known structural issues.

---

### Screen 19 — Redemption Round Session
- **File:** `src/components/RedemptionRoundSession.tsx`
- **Mode:** `redemption-round`
- **Parent:** Launched from Dashboard
- **Purpose:** Re-attempt questions from miss bank; 90s timer per question
- **UI Regions:** Similar to Practice Session but with round scoring, high-score tracking
- **Key Controls:**
  - Answer + submit → rationale
  - "Complete" / "Exit" → mode=`home`
- **Data shown:** Questions from miss bank, score %, personal best high score
- **UX issues:** Only accessible via Dashboard redemption card — no entry from Practice Hub.

---

### Screen 20 — Admin Dashboard
- **File:** `src/components/AdminDashboard.tsx` (~1000+ lines)
- **Mode:** `admin`
- **Parent:** Header admin icon (shown for `isAdminEmail` users only)
- **Purpose:** User management, content analytics, item analysis, AI tutor logs
- **Tabs:** Overview / Audit / Beta Feedback / Question Reports / Users / Item Analysis / AI Tutor
- **UX issues:** Not user-facing — out of scope for this audit.

---

## C. PRACTICE AREA BREAKDOWN

### All Practice-Related Screens

| Screen | Mode | Description |
|--------|------|-------------|
| PreAssessmentGateway | `home` | Entry choice (diagnostic vs spicy preview) |
| Practice Hub | `practice-hub` | Structured practice selection |
| Practice Session | `practice` | Active question loop |
| Learning Path Module | `learning-path-module` | Skill deep-dive with embedded practice |
| Redemption Round | `redemption-round` | Missed question re-attempt |
| Screener | `screener` | Assessment (not practice but same question format) |
| Full Assessment | `fullassessment` | Assessment |
| Adaptive Diagnostic | `adaptive-diagnostic` | Assessment |

### Practice Modes

| Mode | Where Accessible | Questions | Unlocked By |
|------|-----------------|-----------|-------------|
| Spicy Mode | PreAssessmentGateway | Random from all 466 | No requirement |
| By Domain | Practice Hub | Domain-scoped pool | Adaptive diagnostic |
| By Skill | Practice Hub | Skill-scoped pool | Adaptive diagnostic |
| Learning Path | Practice Hub → Learning Path | Skill-scoped (module page) | Adaptive diagnostic |
| Redemption Round | Dashboard | Missed/hint bank | Earning credits (20 non-hint Q = 1 credit) |

### Entry Points into Practice (all modes)

1. **PreAssessmentGateway** → "Try a Random Question" → Spicy Mode (generic `startPractice()`)
2. **PreAssessmentGateway** → "Browse by domain or skill" → Practice Hub
3. **Dashboard → Today's Focus** → "Review Now" (SRS skill) or "Practice →" (priority skill) → PracticeSession
4. **Dashboard → Domain Performance** → click any domain bar → PracticeSession by domain
5. **Dashboard → Feature Tile: Learning Path** → LearningPathModulePage
6. **Practice Hub → By Domain tab** → click domain card → PracticeSession
7. **Practice Hub → By Skill tab** → click skill row → PracticeSession
8. **Practice Hub → Learning Path tab** → click node → LearningPathModulePage
9. **Screener/Assessment Results** → "Start Practice" button
10. **Learning Path Module page** → embedded practice section

### Step-by-Step Flow Within Practice Session

```
1. User selects a question source (domain/skill/random)
2. PracticeSession loads, filters question pool
3. selectNextQuestion() picks next Q (adaptive: weakest skill weighted)
4. Question card shown: stem + 4–6 choices
5. User selects answer(s)
6. "Submit" → rationale revealed, correct/incorrect highlighted
   ├── If wrong + 3rd miss: flagged for redemption bank (silent)
   ├── If hint used: flagged for redemption bank on next transition
   └── Credit counter increments (+1 toward 20)
7. "Next Question" → return to step 3
8. Session continues until user exits
   └── "Exit Practice" → 
        ├── If came from skill practice → mode=results
        └── Otherwise → mode=practice-hub
```

### Missing: No End-of-Practice Screen

There is no session summary. When the user exits, they are immediately dumped back to the hub with no feedback about what they accomplished.

### UX Issues Specific to Practice

1. **Non-deterministic exit destination** — Exits go to `results` for skill practice, `practice-hub` for domain practice. The user doesn't choose; the destination is set by how they entered.
2. **No session progress indicator** — No "15 questions this session" counter during practice.
3. **Silent redemption flagging** — Hints and wrong answers are tracked for redemption without the user knowing. The connection between practice behavior and redemption bank is opaque.
4. **Redemption only accessible from Dashboard** — If you're in Practice Hub and want to do redemption, you must navigate away to Dashboard first.
5. **Learning Path practice is isolated** — The embedded practice in `LearningPathModulePage` uses `onSkillProgressUpdate` but does NOT integrate with the redemption system (only `addToMissedBankForMiss` is passed, not the hint callback).
6. **Spicy Mode starts identical to normal practice** — No visual distinction between "Spicy Mode" and structured practice once inside `PracticeSession`.

---

## D. PROGRESS AREA BREAKDOWN

### All Progress-Related Screens

| Screen | Mode | Progress Data |
|--------|------|--------------|
| DashboardHome | `home` | Readiness %, domain bars, SRS, weekly stats |
| Practice Hub (By Domain) | `practice-hub` | Domain accuracy + tier |
| Practice Hub (By Skill) | `practice-hub` | Skill accuracy bars |
| ResultsDashboard | `results` | Full analytics |
| LearningPathModulePage | `learning-path-module` | Lesson completion per skill |

### Metrics Shown on Each Screen

**DashboardHome** (`DashboardHome.tsx`):
- Readiness %: `demonstratingCount / readinessTarget * 100`
- Readiness target: `ceil(45 * 0.7) = 32 skills`
- SRS overdue count + skill names (up to 3)
- Weakest skill: name, domain, # skills below 60%
- Weekly: questions, accuracy %, study time, daily goal progress
- 4 domain bars: % strong, proficiency tier label

**ResultsDashboard** (`ResultsDashboard.tsx`):
- 4 domain cards: %, tier, skill count, exam weight %
- Skill proficiency map: compact grid of all attempted skills
- Session stats: total Q, overall accuracy, total study time, avg/Q
- Growth since diagnostic: reached Demonstrating, improved a tier (collapsed)
- Concept insights: cross-skill gaps, weakest concepts (collapsed)
- Advanced stats: avg time per Q, by domain, confidence-adjusted accuracy (collapsed)

**Practice Hub / By Domain tab**:
- Domain accuracy %, proficiency tier, skill count

**Practice Hub / By Skill tab**:
- Per-skill: accuracy %, proficiency tier, attempts count

### Structure Analysis

The progress data is **fragmented across 3 different screens** with significant overlap:

| Metric | Dashboard | Progress | Practice Hub |
|--------|-----------|----------|--------------|
| Domain accuracy % | ✓ (bars) | ✓ (cards) | ✓ (domain tab) |
| Domain proficiency tier | ✓ | ✓ | ✓ |
| Skill accuracy | ✗ | ✓ (map) | ✓ (skill tab) |
| Weekly questions | ✓ | ✗ | ✗ |
| Weekly accuracy | ✓ | ✗ | ✗ |
| Total questions | ✗ | ✓ | ✗ |
| Overall accuracy | ✗ | ✓ | ✗ |
| Total study time | ✗ | ✓ | ✗ |
| Growth since baseline | ✗ | ✓ (collapsed) | ✗ |
| SRS overdue | ✓ | ✗ | ✓ (nudge banner) |

### What Should Be Reorganized

- Domain data (accuracy, tier) does not need to live in 3 places. The Practice Hub version should be the canonical entry-point to practice; the Progress version should add context (exam weight, skill breakdown). Dashboard domain bars serve navigation, not analytics.
- Growth Since Diagnostic should be **visible by default** on Progress — it's the most motivating data point and currently hidden behind a collapsed section.
- Skill Proficiency Map in ResultsDashboard is too compact (5x9 grid of numbers) to be meaningful. Users can't identify which skill is which without hovering.

---

## E. DASHBOARD BREAKDOWN

### DashboardHome — Section Order (Top to Bottom)

| # | Section | Lines | Purpose | Actionable? |
|---|---------|-------|---------|-------------|
| 1 | Readiness Banner | 89–121 | Progress toward 70% skill mastery | No (informational) |
| 2a | Today's Focus — SRS card | 135–157 | Skills overdue for spaced review | Yes → skill practice |
| 2b | Today's Focus — Priority skill | 160–178 | Weakest emerging skill | Yes → skill practice |
| 2c | Today's Focus — Vocab suggestion | 181–197 | Review vocabulary | Yes → glossary |
| 2d | This Week stats | 203–227 | Weekly activity numbers | No (informational) |
| 2e | Redemption card | 230–264 | Missed question bank + credits | Yes → redemption round |
| 3 | Feature Tiles (5 cards) | 268–339 | Quick navigation shortcuts | Yes → various screens |
| 4 | Domain Performance bars | 341–385 | Domain accuracy overview | Yes → domain practice |

### Actionable vs Informational

- **Actionable (6 items):** SRS card, Priority skill card, Vocab card, Redemption card, Feature tiles, Domain bars
- **Informational (2 items):** Readiness Banner, This Week stats

### Density Analysis

The dashboard is **heavily action-oriented** — almost every block has a button or is clickable. This creates competing CTAs:

- **Today's Focus** has 3 different practice/navigation buttons
- **Feature Tiles** has 5 buttons — 2 go to the same place (Fluency Drill + Vocab Quiz → glossary), 3 duplicate sidebar nav items
- **Domain bars** are clickable but look like a progress chart, not a nav element

The result: a user landing on the Dashboard faces ~10–12 clickable elements before even scrolling.

### What Feels Too Dense

- Feature tile grid (5 cards) is the biggest problem: it duplicates the sidebar entirely. These tiles exist on the dashboard as a "quick actions" panel but they navigate to full sections rather than performing focused actions.
- The Today's Focus section has 3 separate cards when they could be collapsed into a single prioritized recommendation with secondary options.

### What Feels Too Sparse

- Readiness Banner is pure information with no action. A user who is at 40% readiness has no CTA from that banner.
- "This Week" stats card has no trend indication — just raw numbers with no context (up/down vs last week).

### Priority of Information

Current order puts **readiness progress** first (correct), but then immediately descends into Today's Focus without a clear separation between "what happened" and "what to do now." The Feature Tiles section (Section 3) creates a navigation-within-navigation anti-pattern.

---

## F. DATA / REPORTING BREAKDOWN

### All Places Where Performance Data Appears

1. `DashboardHome.tsx` — Domain bars, readiness, SRS, weekly stats, daily goal
2. `ResultsDashboard.tsx` — Full analytics (all metrics above + more)
3. `StudyModesSection.tsx` (By Domain tab) — Domain accuracy + tier
4. `StudyModesSection.tsx` (By Skill tab) — Per-skill accuracy bars
5. `ScoreReport.tsx` — Full assessment results
6. `ScreenerResults.tsx` — Screener results
7. `LearningPathModulePage.tsx` — Lesson completion + per-skill practice stats

### What Users Can Do With the Data

| Screen | Can user act? | Actions available |
|--------|--------------|-------------------|
| Dashboard | Yes | Start skill/domain/vocab practice |
| Progress | No | Read only |
| Practice Hub (Domain) | Yes | Start domain practice |
| Practice Hub (Skill) | Yes | Start skill practice or view lesson |
| Score Report | Yes | Start practice or retake |

### Major Duplications

1. **Domain accuracy + tier**: Dashboard (bars) + Progress (cards) + Practice Hub (domain tab) — 3 instances
2. **Skill accuracy**: Progress (map) + Practice Hub (skill tab) — 2 instances, slightly different formats
3. **SRS overdue**: Dashboard (Today's Focus) + Practice Hub (SRS nudge banner) — same data, both actionable

### Missing Context

- Progress domain cards show "exam weight %" (e.g., "36% of exam") but Dashboard domain bars do not — users who only see the Dashboard don't know which domains matter more
- Skill proficiency map in Progress shows only numbers (%) in colored boxes — no skill names visible at a glance
- Weekly stats (Dashboard) have no comparison to previous week — no trend
- Total study time (Progress) has no breakdown by week/month — just a cumulative total

### Data That Should Be Moved

- Domain accuracy data belongs primarily in **Practice Hub** (as the entry point to practice) and **Progress** (for deep analysis). The Dashboard version should be a summary redirect ("D1: 62% → Practice") rather than a full chart.
- Concept Insights (cross-skill gaps) is buried in a collapsed section in Progress but is one of the highest-value diagnostic outputs. It should be surfaced more prominently.

---

## G. NAVIGATION AND INTERACTION MAP

```
App Entry
│
├── [Not logged in]
│   └── LoginScreen
│       ├── Sign in → OnboardingFlow (first time) → PreAssessmentGateway
│       └── Sign in → DashboardHome (returning user)
│
├── [Logged in, not onboarded]
│   └── OnboardingFlow (overlay) → PreAssessmentGateway
│
├── [Logged in, no diagnostic]
│   └── PreAssessmentGateway (mode=home)
│       ├── "Start Diagnostic" → AdaptiveDiagnostic
│       │    └── Complete/Pause → DashboardHome (or resume card)
│       ├── "Try a Random Question" → PracticeSession (spicy)
│       │    └── Exit → PreAssessmentGateway
│       └── "Browse by domain or skill" → Practice Hub
│           └── All practice tabs show LOCKED state
│
├── [Logged in, diagnostic complete]
│   │
│   ├── DASHBOARD (mode=home)
│   │   ├── "Review Now" (SRS) → PracticeSession (skill)
│   │   │    └── Exit → ResultsDashboard
│   │   ├── "Practice" (priority skill) → PracticeSession (skill)
│   │   │    └── Exit → ResultsDashboard
│   │   ├── "Quiz Now" (vocab) → GlossaryPage
│   │   ├── "Enter Redemption" → RedemptionRoundSession
│   │   │    └── Complete/Exit → Dashboard
│   │   ├── Feature tile: Fluency Drill → GlossaryPage
│   │   ├── Feature tile: Vocab Quiz → GlossaryPage
│   │   ├── Feature tile: Learning Path → LearningPathModulePage (weakest skill)
│   │   │    └── Back → Practice Hub
│   │   ├── Feature tile: Study Guide → StudyPlanCard
│   │   ├── Feature tile: AI Tutor → TutorChatPage
│   │   └── Domain bar click → PracticeSession (domain)
│   │        └── Exit → Practice Hub
│   │
│   ├── PRACTICE HUB (mode=practice-hub)
│   │   ├── Tab: By Domain
│   │   │    └── Domain card click → PracticeSession (domain)
│   │   │         └── Exit → Practice Hub
│   │   ├── Tab: By Skill
│   │   │    ├── Skill row click → PracticeSession (skill)
│   │   │    │    └── Exit → ResultsDashboard   ← NOTE: different destination
│   │   │    └── Help icon → SkillHelpDrawer (slide-in, stays on Practice Hub)
│   │   └── Tab: Learning Path
│   │        └── Node click → LearningPathModulePage
│   │             └── Back → Practice Hub
│   │
│   ├── PROGRESS (mode=results)
│   │   └── All read-only. No outbound navigation except back via sidebar.
│   │
│   ├── STUDY PLAN (mode=study-guide)
│   │   └── "Generate" → async generation → view plan (same screen)
│   │
│   ├── AI TUTOR (mode=tutor)
│   │   └── Chat → responses (same screen)
│   │
│   ├── STUDY NOTEBOOK (mode=study-notebook)
│   │   └── Note editing (same screen)
│   │
│   ├── GLOSSARY (mode=glossary)
│   │   └── Search + quiz mode (same screen)
│   │
│   └── HELP (mode=help)
│        ├── "Go Home" → Dashboard
│        └── "Replay Tutorial" → TutorialWalkthrough overlay
│
└── ASSESSMENT MODES (accessible regardless of state)
    ├── Screener → ScreenerResults
    │    ├── "Start Practice" → PracticeSession
    │    ├── "Take Full Assessment" → FullAssessment
    │    └── "Go Home" → Dashboard/Gateway
    ├── Full Assessment → ScoreReport
    │    ├── "Start Practice" → PracticeSession
    │    └── "Go Home" → Dashboard
    └── Adaptive Diagnostic → Dashboard (with baseline snapshot saved)
```

---

## H. TOP 10 UI PROBLEMS TO FIX

### #1 — Mode confusion on the home screen
**File:** `App.tsx:924–1097`

The `mode='home'` renders completely different content based on user state (new user → PreAssessmentGateway; diagnostic complete → DashboardHome). There is no loading screen transition or visual change signal. If a user's diagnostic state changes (e.g., after completing diagnostic mid-session), the home screen changes without explanation.

**Impact:** Disorienting. Users can't build a mental model of "what's on the home tab."

---

### #2 — Feature tiles on Dashboard duplicate sidebar navigation
**File:** `src/components/DashboardHome.tsx:268–339`

5 feature tiles (Fluency Drill, Vocab Quiz, Learning Path, Study Guide, AI Tutor) act as a second navigation bar, 3 of which go to full sections also accessible via sidebar. This creates two competing navigation systems on the same screen.

**Impact:** Information overload. The Dashboard feels like a menu page rather than a home.

---

### #3 — Domain data in three places with no single canonical view
**Files:** `DashboardHome.tsx:341–385`, `ResultsDashboard.tsx:186–212`, `StudyModesSection.tsx:253–292`

Domain accuracy + proficiency tier appears on Dashboard (bars), Progress (cards), and Practice Hub (domain tab). Slightly different formats, same underlying data.

**Impact:** Users don't know where to go to understand their domain performance. Data drift risk if calculations ever differ.

---

### #4 — Inconsistent practice exit destinations
**File:** `App.tsx:1322–1331`

Exiting skill practice → `mode='results'`. Exiting domain practice → `mode='practice-hub'`. The user has no control over where they land; it depends on how they entered, which they may not remember.

**Impact:** Users get lost. "Why did I end up on Progress?" is a likely question.

---

### #5 — No practice session summary
**File:** `src/components/PracticeSession.tsx` — no end-of-session screen

When a practice session ends, the user exits immediately to the hub/results. There is no "you answered 18 questions, 14 correct (78%)" screen.

**Impact:** Users lose sense of accomplishment and session progress. No moment of reflection or motivation.

---

### #6 — Growth data hidden behind collapsed section
**File:** `src/components/ResultsDashboard.tsx:282–315`

"Growth Since Diagnostic" is collapsed by default. This is arguably the most motivating metric for a user studying for an exam (did I improve?), but it requires an extra click to see.

**Impact:** Users don't see their improvement. Low retention motivation.

---

### #7 — Fluency Drill and Vocab Quiz are identical
**File:** `src/components/DashboardHome.tsx:270–294`

Both feature tiles (`Fluency Drill`, `Vocab Quiz`) navigate to `mode='glossary'`. The "NEW" badge on Fluency Drill implies a distinct feature.

**Impact:** Wastes one of 5 valuable feature tile slots. May confuse users who click both expecting different experiences.

---

### #8 — Practice Hub lock state is misleading
**File:** `src/components/StudyModesSection.tsx:549–557`, `229–250`, `319–340`

All 3 practice tabs (By Domain, By Skill, Learning Path) show lock icons in their tab pills and show the same "Complete the diagnostic" message when clicked. The tabs are clickable but lead to a locked-out state rather than being disabled or hidden.

**Impact:** Users discover the lock state only after clicking, wasting a click and creating a dead-end interaction.

---

### #9 — Sidebar has no hierarchy — 8 items at same visual weight
**File:** `App.tsx:638–668`

All 8 sidebar items (Dashboard, Practice, Progress, Study Plan, AI Tutor, Study Notebook, Glossary, Help) are displayed at the same visual weight with no separator between primary navigation (Dashboard, Practice, Progress, Study Plan, AI Tutor) and utility pages (Notebook, Glossary, Help).

**Impact:** Sidebar feels overwhelming. Users must scan all 8 items to find what they need.

---

### #10 — Learning Path module always exits to Practice Hub
**File:** `App.tsx:1143–1146`

`onBack` in LearningPathModulePage is hardcoded to `setMode('practice-hub')`. However, users can reach Learning Path modules from Dashboard → Learning Path feature tile. Clicking Back in that flow sends them to Practice Hub, not back to Dashboard.

**Impact:** Navigation history is broken when entering from Dashboard shortcut.

---

## I. RECOMMENDED SIMPLIFICATION DIRECTION

### Dashboard

**Group together:** Readiness Banner + Today's Focus (3 action cards). These form a natural "status + action" block.

**Separate:** Feature tiles should not exist as navigation shortcuts. Remove Fluency Drill (duplicate), remove Learning Path tile (it's already in Practice), remove Study Guide tile (it's already in sidebar). Keep only AI-powered quick-start tiles that are NOT accessible from the sidebar — e.g., a "Quick Quiz" (5-question burst) or "Review Weakest Skill."

**Hide behind drill-down:** Concept Insights and Advanced Statistics belong in the Progress screen, not visible from Dashboard.

**Keep visible:** Readiness Banner, Today's Focus (action cards), This Week stats, Domain bars (as practice entry only).

**Format:** Cards for actionable items; flat rows for informational (This Week stats).

---

### Practice Hub

**Group together:** All 3 practice modes stay as tabs — this is a good structure.

**Separate:** Practice Hub from the Learning Path Module page. Currently `learning-path-module` is a mode that appears to be part of Practice but shares no visual frame with the Practice Hub. Consider a consistent back-navigation frame.

**Hide behind drill-down:** The skill filter chips (All / Emerging / Approaching / Demonstrating) could be replaced with a default "Weakest first" sorted list with a single "Filter" button that opens a bottom sheet.

**Show lock state better:** Either hide locked tabs entirely or show them as greyed-out pills with a tooltip — not navigable dead-ends.

**Keep visible:** Tab pills (By Domain / By Skill / Learning Path), SRS nudge, domain/skill data.

**Format:** Tabs for mode switching; cards for domains; rows for skills.

---

### Progress

**Group together:** All skill analytics (domain cards, skill map, concept insights) into one visible section. Growth Since Diagnostic should be the first section, not collapsed.

**Separate:** Time and confidence stats (Advanced Statistics) should stay collapsible since they are secondary.

**Hide behind drill-down:** Skill-level detail (per-skill attempts, time, accuracy) should be accessible by clicking a skill from the proficiency map — currently the map has no drill-down.

**Keep visible:** Domain cards, Growth Since Diagnostic, Skill Proficiency Map, Session Stats.

**Format:** Cards for summary metrics; rows for skill list; collapsible panels for advanced data.

---

### Navigation Structure

**What should be primary nav (5 items max):**
1. Dashboard
2. Practice
3. Progress
4. Study Plan
5. AI Tutor

**What should be secondary nav (utility, visible but de-emphasized):**
- Study Notebook
- Glossary
- Help

**Implementation:** Visual separator or section label ("Resources") between primary and utility items in the sidebar. On mobile, utility items could live in a secondary overflow menu or within a Settings/Tools panel.

**Format recommendation:** Sidebar stays; add a visual divider after the 5th primary item. Consider combining Notebook + Glossary into a single "Resources" page with tabs.

---

### Sidebar

**Problem:** Glossary and Study Notebook both use `BookOpen` / `BookMarked` icons — difficult to distinguish when collapsed.

**Recommendation:** Glossary icon should use a distinct icon (e.g., `GraduationCap` or `Tag`). Notebook should use a pen/notes icon.

---

*End of UI Structure Audit*
