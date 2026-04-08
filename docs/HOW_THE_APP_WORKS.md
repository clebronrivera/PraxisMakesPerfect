# How the App Works

**Praxis Makes Perfect — School Psychology 5403**

> This document is the canonical plain-language description of the product. It is written for marketing, onboarding guides, and how-to documentation — not for developers. Keep it accurate and up to date.
>
> **Maintenance rule: Any time a feature is added, changed, or removed — including thresholds, counts, labels, unlock conditions, or study guide behavior — this file must be updated in the same change.**

---

## ⚠ Accuracy Audit — 2026-04-08

The following items were verified against the live codebase on 2026-04-08. Items marked **STALE** describe things that are no longer coded as described (but have not been deleted from the document, per policy). Items marked **MINOR FIX** are small factual corrections. Items marked **CONFIRMED** were verified accurate.

| # | Section | Status | Finding |
|---|---------|--------|---------|
| 1 | Streak Tracking | **STALE** | "Consecutive correct answers build a streak. Shown on the dashboard" — `streak` appears in `useProgressTracking` and `PracticeSession` (internal counter) but is **not rendered anywhere on DashboardHome**. There is no visible streak UI on the dashboard. The tracking field exists; the display does not. |
| 2 | Question Retirement | **CONFIRMED** | Mechanics match: `times_correct >= 2`, first-pass gate, pool reset on exhaustion — all confirmed in `PracticeSession.tsx`. Retired count is shown during a session, not on the dashboard. `localStorage` storage confirmed. |
| 3 | Inactivity Auto-Logout | **STALE** | Described as "15 minutes." Actual implementation in `useElapsedTimer.ts` is an **auto-PAUSE** at **120 seconds** (2 minutes) of inactivity — not a logout, and not 15 minutes. The 15-minute figure may come from Supabase session timeout, not an in-app timer. |
| 4 | Master Glossary Terms | **MINOR FIX** | Document says "396-term master glossary" in two places. `master-glossary.json` has `396` terms (confirmed). Accurate. |
| 5 | Leitner / Spaced Repetition | **STALE** | Document says spaced repetition is "collected now and will surface as a Review Suggestions feature." `src/utils/srsEngine.ts` and `src/brain/learning-state.ts` have SRS logic, but it is not wired into any UI component or visible user surface. No Review Suggestions badge or section exists anywhere. This is correctly flagged as future-facing but may never have been connected. |
| 6 | NASP Domain Badges on Learning Path Tiles | **STALE** | Document says "Each of the 45 skills is mapped to a NASP Practice Model domain. These appear as small badges on Learning Path tiles." No NASP badge rendering was found in `LearningPathNodeMap.tsx`. The `nasp_domain_primary` and `prereq_chain_narrative` fields exist in `skillPhaseDLookup.ts` and are used in the **study guide prompt** — but the badge UI on LP tiles is not present. |
| 7 | Study Guide — 6 Tabs | **CONFIRMED** | Overview / Priorities / Domains / Concepts / Weekly Plan / Milestones — all 6 confirmed in `StudyPlanViewer.tsx` line 103–111. |
| 8 | AI Tutor Feature Flag | **MINOR FIX** | Document says `tutorChat: false` (implied: not active). Actual value in `launchConfig.ts`: `tutorChat: true`. The tutor is live in production. |
| 9 | Home Dashboard — Practice Shortcuts Rail | **STALE** | Document describes a "Practice shortcuts rail (right side) — three one-tap buttons: Domain Review / Practice by Skill / Random Questions." The redesigned `DashboardHome.tsx` does not have a right-side rail with those three buttons. The dashboard structure changed during the April 2026 redesign. |
| 10 | Home Dashboard — Greeting Hero / 4 Summary Cards | **STALE** | Document describes "A greeting hero card… Four summary cards: Questions answered, Readiness phase, Skills to reach goal, Weekly usage." The actual DashboardHome props and JSX do not map exactly to this layout — the redesigned dashboard has Today's Focus, Weekly stats, SRS overdue, and Redemption sections, not a 4-tile hero layout. |
| 11 | Subscription Tiers | **STALE (by design)** | Section describes a planned freemium model at $14.99/month. `paywall: false` in `launchConfig.ts` — the paywall is confirmed not active. This section is intentionally future-facing. |
| 12 | High-Impact Skills "Practice" Button | **STALE** | Document says Home shows High-Impact Skills with a **Practice** button (not raw accuracy). The redesigned DashboardHome shows skill info via `weakestSkill` prop — the specific button wording should be verified against the actual rendered UI. |
| 13 | Proficiency — Confidence-Weighted Scoring | **STALE** | Document says "Proficiency tiers are calculated from confidence-weighted accuracy when available." Actual code in `skillProficiency.ts` uses raw accuracy only. The confidence-weighted score appears in **Advanced Statistics** (ResultsDashboard) but does not feed into the Emerging/Approaching/Demonstrating tier calculation. |
| 14 | Follow-Up Question System | **CONFIRMED** | 3-level follow-up logic (second chance → distractor hint → domain warning) confirmed in `PracticeSession.tsx` lines 176–530. |
| 15 | Interactive Exercises — 5 Types | **CONFIRMED** | ScenarioSorter, DragToOrder, TermMatcher, ClickSelector, CardFlip — all 5 confirmed as live components in `src/components/ModuleInteractives/`. |
| 16 | Concept Insights | **CONFIRMED + UPDATED** | `conceptAnalytics.ts` confirmed. UI was redesigned 2026-04-08 to add summary tiles, mini-bars, cross-skill gaps bars, strength chip cloud, and empty state. |
| 17 | question-vocabulary-tags.json | **CONFIRMED** | File exists at `src/data/question-vocabulary-tags.json`, used by `question-analyzer.ts`. |

---

## What It Is

Praxis Study is a personalized exam prep platform built specifically for the **Praxis School Psychology exam (5403)**. Unlike a generic flashcard app or a static practice test, it tracks every answer you give, builds a real-time picture of your strengths and weaknesses across all 45 exam skills, and generates an AI-powered study guide that is uniquely yours — not a template, but a plan built from your actual performance data.

---

## The Exam It Covers

The Praxis 5403 covers **4 domains** that map directly to what school psychologists actually do:

| # | Domain | What It Covers |
|---|--------|----------------|
| 1 | **Professional Practices** | Assessment, consultation, data-based decision making |
| 2 | **Student-Level Services** | Academic supports, developmental needs, mental health |
| 3 | **Systems-Level Services** | Family, school-wide systems, community practice |
| 4 | **Foundations of School Psychology** | Ethics, law, diversity, research methods |

Within those 4 domains there are **45 distinct skills** — specific competency areas the exam tests (e.g., Functional Behavioral Assessment, Cognitive Assessment, Reliability & Validity, Accommodations, Ethics & Legal Standards). The app tracks your mastery on every single one individually.

---

## The User Journey — Step by Step

### Step 1: Create an Account
Sign in with an email and password. All data lives in the cloud, so you can pick up exactly where you left off on any device.

Before sign-in, the public entry page leads with an outcome-first hero for Praxis 5403 candidates. It frames the product around three promises:
- take an adaptive diagnostic that adjusts to your performance across all 45 skills
- start practicing immediately — no gates or waiting required
- track your readiness with a structured learning path

That page also previews the signed-in practice and skill-tracking surfaces. A beta disclaimer is shown near the sign-up form: "Currently in beta. Not responsible for loss of data during the beta period."

### Step 1b: Complete Your Profile (Simplified Onboarding)
Immediately after creating an account, new users see a **single-page onboarding form** with six fields. The form is short by design — it takes less than a minute. All six fields are required; there is **no skip option**.

**The six fields:**
1. **First name** (required)
2. **Last name** (required)
3. **Zip code** (required)
4. **School / university attending** (required) — with a "Not currently enrolled in a program" checkbox that disables the field for users who don't apply
5. **What brings you here?** (required dropdown) — Graduate program requirement, Certification exam prep, Professional development, or Other
6. **How did you hear about us?** (required dropdown) — Google / Search, Social media, Professor / Instructor, Friend / Colleague, or Other

The user's name is split into First and Last for cleaner cohort data and personalized greetings. Email is collected at sign-up and is not repeated in onboarding. Profile data is stored in the user's account and can inform future study plan generation and admin reporting.

> **Note for product/marketing copy:** the legacy 4-step onboarding wizard (Role → Pathway → Exam → Goals, with 27 fields including study goals, target score, biggest challenge, etc.) still exists in the codebase as the **Profile Editor** for users who want to add detail later, but it is no longer the initial onboarding flow. Initial onboarding is the 6-field form described above.

### Step 2: The Pre-Assessment Gateway — Two Ways to Start

Every time a user logs in before completing the adaptive diagnostic, they land on the **Pre-Assessment Gateway**. This page presents two options:

**Option 1: Adaptive Diagnostic** (primary, recommended)
The full 45-skill assessment. Maps strengths and gaps across every testable competency. Unlocks all features on completion. 45–90 questions, 25–45 minutes, pausable anytime. This is the path that opens up the entire platform.

**Option 2: Feeling Spicy — Question Preview** (secondary)
A no-commitment way to try the platform before starting the diagnostic. The user answers random questions from the full 1,150-question bank in a continuous loop — as many as they want, for as long as they want. Every question shows full feedback (correct answer, explanation, distractor analysis) and hints, exactly like real practice.

**What Spicy Mode does:**
- Delivers random questions across all 45 skills
- Shows the same feedback, hints, and explanations as regular practice
- Tracks all responses with the same logic as practice (wrong-answer counting, time, confidence)
- Persists progress across sessions — does not reset on each login
- Data renders in the dashboard once the diagnostic is completed

**What Spicy Mode does NOT do:**
- Unlock any features (no practice modes, no study guide, no AI tutor, no learning path)
- Replace the diagnostic — the gateway page keeps showing both options until the diagnostic is complete
- Affect the diagnostic's ability to function — the diagnostic can still draw from the full question bank regardless of how many Spicy Mode questions the user has seen

**Returning users (diagnostic paused):** If a user started the diagnostic and paused halfway, the gateway shows "Resume Diagnostic" with a progress bar (X of 45 skills, Y questions answered, estimated time remaining) alongside the Spicy Mode option with their prior session stats (questions answered, accuracy, skills seen).

**Key behavior:** The user can freely switch between Spicy Mode and the diagnostic. Starting Spicy Mode does not interrupt or reset diagnostic progress. The diagnostic pauses cleanly, and Spicy Mode is accessible without breaking anything.

### Step 3: Take the Adaptive Diagnostic
The adaptive diagnostic is your **baseline map**. It starts with one question per skill (45 questions total), interleaved across all four domains.

**How it adapts:** When you answer a question incorrectly, the system queues a follow-up question for that skill — with alternating cognitive complexity (if the first was Recall, the follow-up is Application, and vice versa). A maximum of 3 questions per skill (1 initial + 2 follow-ups). This means:
- Minimum: 45 questions (all correct)
- Typical: ~60–70 questions
- Maximum: ~90 questions (all wrong with follow-ups)

**Pause and resume:** You can pause the diagnostic at any time and return to the home dashboard. Your progress is saved. You can start practicing immediately — even before finishing the diagnostic. When you return, you pick up exactly where you left off.

After completing the diagnostic, you get a **Score Report** — a breakdown of which domains and skills are strong and which need work. Practice is available immediately, with no gates.

> **Assessment timing:** The assessment is not timed — there is no per-question or total time limit. Time per question is tracked internally for analytics purposes only. Your score is determined by accuracy, not speed.

> **Legacy assessment path:** The app also supports a legacy two-step assessment flow (Skills Screener + Full Assessment) for users who started before the adaptive diagnostic was introduced. Legacy users are shown a "Baseline recorded" state on the dashboard and prompted to take the adaptive diagnostic to unlock all features. New users always see the adaptive diagnostic directly.

### Step 5: Study, Practice, and Track
From this point on, every session and every question feeds back into your profile. The system keeps learning about you as you go.

### The Main App Layout
Once a user is signed in, the main destinations share one consistent app shell:
- A left sidebar on desktop for Dashboard, Practice, Progress, and Study Plan
- A sticky top bar with lightweight encouragement and utility actions
- A warm, light visual system with white study surfaces and amber accents

The sidebar profile card shows the user's display name and, when available, a secondary onboarding-derived identity line such as Graduate Student, Teacher, Certification Route, or training-stage language like Early Program. Tapping the card opens **Profile & onboarding**, where the user can review every onboarding answer and edit fields such as preferred display name, program details, exam plans, and study goals (the same steps as the initial wizard). On smaller screens, a profile icon in the top bar opens the same panel.

### The Home Dashboard
The Home dashboard is the most guided page in the app. It is designed to help users see what to do next without changing the underlying product rules.

Depending on the user's state, Home can show:
- A diagnostic-first start state for brand-new users (with practice always available)
- A baseline-recorded state for users who completed a legacy screener (prompted to take the adaptive diagnostic)
- A fully unlocked dashboard after the adaptive diagnostic is complete

On the fully unlocked dashboard, the main sections are:
- A greeting hero card with readiness summary and your weakest domain as next focus
- Four summary cards: Number of questions answered, Readiness phase, Skills to reach goal, and Weekly usage
- A Daily goal card showing progress toward the daily question target
- A High-Impact Skills list showing the current lowest-performing skills
- A **Practice shortcuts rail** (right side) — three one-tap buttons to start a session immediately:
  - **Domain Review** — launches practice for your weakest domain
  - **Practice by Skill** — launches practice for your top gap skill
  - **Random Questions** — adaptive practice across all skills, weighted by need level
- An **AI Tutor** button — opens the tutor directly from the dashboard

The High-Impact Skills list is intentionally action-oriented. On Home, each row uses a simple **Practice** button instead of exposing raw accuracy percentages. Those buttons drop the user into the existing skill-focused learning path or practice flow for that skill.

---

## How Tracking Works — The Intelligence Layer

The app doesn't just record right vs. wrong. It watches for patterns.

### What It Tracks Per Skill
For every one of the 45 skills:
- **Total attempts** — how many times you've been tested on it
- **Accuracy** — percentage correct
- **Confidence signals** — whether answers are chosen confidently or appear to be guesses
- **Distractor patterns** — which wrong answer keeps getting selected. When the same wrong option is chosen 2+ times, the system flags a repeated misconception pattern. Every wrong-answer option in the bank carries pre-authored distractor data: a tier (L1 = fundamental knowledge gap / L2 = procedural application error / L3 = nuanced judgment call), an error type (Conceptual / Procedural / Lexical), the specific misconception it exploits, and the knowledge gap it reveals. This classification drives both the explanation panel feedback and the study guide's misconception context.
- **Trend** — improving or declining over time (requires at least 6 attempts to calculate)
- **Spaced repetition schedule** — the system internally calculates when each skill is next due for review, using a Leitner box algorithm (5 levels, intervals of 1 / 3 / 7 / 14 / 30 days). This data is collected now and will surface as a Review Suggestions feature in a future update. It does not currently affect practice queuing or any visible badge.

### The 6 Skill Status Labels
Each skill is assigned one of six status labels, calculated by hard rules — not AI opinion:

| Status | Condition | What It Means |
|--------|-----------|---------------|
| **Unlearned** | Fewer than 3 attempts | Not enough data yet |
| **Misconception** | ≥ 3 attempts, accuracy < 60%, AND a high-confidence wrong answer OR a repeated wrong-answer pattern | A specific incorrect belief — passive review won't fix it |
| **Unstable** | ≥ 3 attempts, accuracy < 40%, no misconception signal | Shaky foundation — not enough right yet to establish any pattern |
| **Developing** | 40–59% accuracy, no misconception signal | In progress |
| **Near Mastery** | 60–79% accuracy | Close but not locked in |
| **Mastered** | ≥ 80% accuracy | Solid |

The **misconception** label is especially important: it fires when the system detects *either* a high-confidence wrong answer (choosing incorrectly while marked "Sure") *or* the same wrong answer chosen at least twice. Both patterns signal a specific incorrect mental model — not random errors — and require active correction, not just more practice.

### User-Facing Proficiency Levels (UI Labels)
Separate from the internal status labels, the app shows three simplified levels on skill panels, domain cards, and the progress dashboard. The same wording is used for both skills and domains.

| Level | Accuracy | Meaning |
|------|----------|---------|
| **Demonstrating** | ≥ 80% | Meeting the threshold and applying foundational knowledge consistently in practice |
| **Approaching** | 60–79% | Near the threshold, with opportunities to strengthen foundational knowledge and apply it more consistently |
| **Emerging** | < 60% | Foundational gaps are still getting in the way, so targeted remediation is needed before performance is consistent |
| **Not started** | 0 attempts | No data yet |

**Important:** Proficiency tiers (Emerging / Approaching / Demonstrating) are calculated from **confidence-weighted accuracy** when available — a score that penalizes high-confidence wrong answers more heavily than low-confidence ones (answering "Sure" and getting it wrong counts against you more than a "Guess" that is wrong). For skills where no per-answer confidence history has been recorded yet (legacy data or brand-new accounts), raw accuracy is used as a fallback. The thresholds are the same either way: ≥ 80% = Demonstrating, 60–79% = Approaching, < 60% = Emerging.

This means a large gap between how confidently you answer and whether you are actually correct will be reflected in your proficiency tier — not just in a supplemental statistics panel. Answering correctly but always with low confidence keeps your effective score slightly lower than raw accuracy alone would suggest. Answering incorrectly with high confidence (a misconception signal) pulls the effective score down more sharply.

### Readiness Target
70% of all 45 skills must reach Demonstrating (≥ 80% accuracy) for overall exam readiness. That's 32 out of 45 skills.

### Reaching Readiness — The Post-Assessment
When a user crosses the readiness threshold (32 of 45 skills at Demonstrating), a **readiness banner** appears at the top of the dashboard inviting them to take the **post-assessment**. The post-assessment is a fresh adaptive diagnostic that re-measures every skill — the goal is to officially confirm growth since Day 1 by comparing baseline (frozen at original diagnostic completion) to post-assessment results.

After completing the post-assessment, the dashboard banner is replaced with a link to the **Growth Report**, a dedicated page that shows:
- Top-level stat tiles: skills improved, skills now at Demonstrating, skills regressed
- Per-domain three-segment bars showing Diagnostic baseline → Practice growth → Post-assessment result, color-coded for growth (emerald), regression (rose), or near-target (amber)
- A 70% goal marker on every domain bar

The post-assessment can only be taken once. Its results are written to a one-shot snapshot and the Growth Report becomes the user's permanent before/after view.

### Question Retirement
Once you've answered a question correctly at least **twice** and have seen every question in the pool at least once (completing the first pass), it gets **retired** — removed from your active practice rotation. Specific rules:

- **First pass required**: No question is retired until you've seen every question in the pool at least once. This ensures nothing is skipped early.
- **Retirement trigger**: `times_correct ≥ 2` once the first pass is complete.
- **Weak questions stay**: Questions you've never answered correctly, or only answered correctly once, are never retired — they stay in your pool until you've demonstrated consistent accuracy.
- **Pool reset**: If every question in your pool ends up retired, all retired questions are recycled back into the active pool so practice can continue.

Retirement state is stored per user in the browser (`localStorage`) and is separate per skill context. The retired count is shown on the dashboard.

### Streak Tracking
Consecutive correct answers build a streak. Shown on the dashboard; resets when you answer incorrectly.

---

## Redemption Rounds (Quarantine System)

**Redemption Rounds** is a quarantine-based review system for questions you struggle with in practice. When a question enters Redemption, it is removed from all normal practice and can only be cleared inside Redemption Rounds.

### How Questions Enter Redemption
A question enters Redemption (quarantine) in two ways:
1. **3rd wrong answer** — If you answer the same question incorrectly 3 times total across all sessions, it is automatically quarantined.
2. **Hint usage** — If you use a hint on a practice question, that question is immediately quarantined when you move to the next question. A notice appears explaining the move.

This applies across all practice sources: practice by skill, practice by domain, and learning path module quizzes.

### What Quarantine Means
- The question is **removed from all normal practice pools**. You will not see it again in regular practice by skill, by domain, or in learning path quizzes.
- It only appears inside **Redemption Rounds** until cleared.

### Credit System
- Every time you submit a practice answer (hint-revealed answers excluded), a counter increments.
- When the counter reaches **20**, you earn **1 Redemption Round credit**. The counter resets to zero.
- **1 credit = 1 full pass through all quarantined questions.** Not one question — one complete cycle through every question currently in Redemption.
- Credits accumulate and are stored in your account across devices.

### Running a Round
- From the Practice Hub, tap **Redemption Rounds** (visible when you have ≥ 1 quarantined question).
- Spending a credit loads all quarantined questions in a shuffled order.
- Each question has a **90-second countdown**. Letting the timer expire is treated as an incorrect skip.
- No feedback is shown after each answer — the session advances immediately.
- At the end of the round, a results screen shows your score and personal best.

### Clearance Rule
A question is cleared (returned to normal practice) when you answer it **correctly 3 times** inside Redemption Rounds. There are no shortcuts — confidence level does not matter, and all 3 correct answers must come from Redemption Round sessions.

Incorrect answers do not count toward clearance; the question stays quarantined.

---

## Follow-Up Question System (All Practice Modes)

Every practice session includes an automatic follow-up loop when you get a question wrong. This applies to all modes — Domain Review, By Skill, and Random Questions.

**How it works:**
1. **First wrong answer** — the next question is automatically pulled from the same skill ("second chance"). A subtle tip banner appears above the question: *"Second chance — read carefully."*
2. **Second wrong in a row on the same skill** — the next question is again from that skill, and the banner now shows the distractor explanation from your previous wrong answer as a fuller hint.
3. **Third consecutive wrong on the same skill** — the follow-up loop ends. A **domain warning banner** appears in the session: *"This domain needs extra attention."* The domain name is called out, signaling that a dedicated study session on that domain is needed.

A correct answer at any point clears the follow-up state for that skill and returns to normal question selection.

---

## Wrong Answer Explanation — What You See After a Miss

When you submit an incorrect answer in any practice mode, the app displays a structured explanation panel. Each section is grounded in pre-authored content specific to that question — not generic copy:

**Correct answer and rationale**
Identifies the right answer and explains why, drawn from the question's authored rationale.

**Complexity**
Explains the cognitive demand of the item: whether it tests direct **Recall** (factual recognition of a concept or definition) or **Application** (using a concept to reason through a scenario or case). This is a per-question classification authored for each item — not a label inferred from the stem length.

**What this tests**
The specific sub-construct the question measures — narrower than the broad skill label. For example, a question tagged to the Consultation skill might specify *"model-goal discrimination in Caplan consultation: identifying consultee internal vs. external factors."* This tells you exactly which competency gap the question is probing.

**Key concepts**
Vocabulary terms associated with this question, drawn from the 396-term master glossary.

**Why this was wrong** *(only shown on incorrect answers, when data is available)*
The specific misconception associated with the distractor you chose, and the knowledge gap it signals. This text was authored for that particular wrong-answer option — not derived generically. It answers: *what belief led you to that answer, and what do you need to understand instead?*

### The Distractor Classification System

Every wrong-answer option in the bank has been individually analyzed and classified across four dimensions:

| Field | What It Captures |
|-------|-----------------|
| **Tier** | How fundamental the error is: L1 (foundational knowledge gap) / L2 (procedural application error) / L3 (nuanced judgment call requiring fine distinctions) |
| **Error type** | The category of mistake: Conceptual (wrong mental model) / Procedural (correct concept, wrong application) / Lexical (terminology confusion) |
| **Misconception** | The specific incorrect belief the distractor exploits — written for that answer option |
| **Knowledge gap** | The specific knowledge deficit underlying the error |

This distractor data is used in three places:

1. **Explanation panel** — surfaces the misconception and knowledge gap for the specific distractor you chose after a wrong answer
2. **AI Study Guide** — when a skill is flagged as Misconception status (same wrong answer selected 2+ times), the dominant misconception and knowledge gap are passed directly to Claude, allowing the guide to name the specific incorrect belief rather than giving generic advice
3. **Admin Item Analysis** — each distractor's tier and error type appear alongside frequency counts so educators can see which error categories students are most commonly making

---

## The Practice Modes

The Practice Hub offers four distinct modes plus Redemption Rounds. All modes live under the **Practice** tab: **By Domain / By Skill / Learning Path / Feeling Spicy**, plus the Redemption Rounds section.

The **Home dashboard also has direct shortcuts** to the three most common session starts (see Home Dashboard section above), so users can begin practicing without going through the Practice Hub.

---

### By Domain
Practice by Praxis section. Choose from the 4 domains and work through questions in that category. Progress bars show your percentage score per domain, color-coded (green = ≥ 80%, amber = 60–79%, red = < 60%).

**Unlocks after:** completing the adaptive diagnostic.

---

### By Skill
Practice on a specific skill — any of the 45 individual competency areas. The skill list is sorted from lowest-performing to highest-performing. Each skill row shows:
- The skill name and its primary module code (e.g. `MOD-D1-03`)
- The user's current proficiency level (Emerging / Approaching / Demonstrating / Not started)
- A **Practice** button — launches question practice for that skill
- A **Help icon** — opens a slide-up lesson drawer with the micro-lesson content for that skill

**The Help drawer (Skill lesson during practice):** When a user is answering questions in By Skill mode, tapping **Help** in the session header opens the same lesson drawer. This drawer shows the full micro-lesson so users can review concept content while practicing — but does not reveal answers. Users must scroll through the lesson to find what they need.

**Unlocks after:** completing the adaptive diagnostic.

---

### Learning Path
A personalized **visual node map** — a winding road of skill nodes ordered from the user's lowest-performing skill to highest, styled like a game progression path.

**Visual design:** Nodes alternate left and right along a central dotted SVG connector line, creating an S-curve "road" effect. Each node is a circular card showing the skill name, status badge, accuracy %, and a lock icon on mastered skills.

**Node color rules:**
- Rose (red) — Emerging skills (< 60%)
- Amber — Approaching skills (60–79%)
- Emerald (green) — Demonstrating / Mastered skills
- Slate (grey) — Not started

**Ordering:** Nodes are sorted by accuracy ascending (lowest = top = first priority). Mastered skills sink to the bottom and are inactive (non-clickable).

**Clicking a node** opens the **Learning Path Module Page** — a full-screen experience for that skill with three sequential sections:

---

#### Learning Path Module Page — 3 Sections

**Section 1 — Lesson**
- Renders the full micro-lesson content (all modules for the skill, with tab pills if multiple)
- **Interactive exercises** embedded within the lesson — 5 types available:
  - *ScenarioSorter* — drag items into categorized buckets
  - *DragToOrder* — arrange steps or concepts in the correct sequence
  - *TermMatcher* — match terms to their definitions
  - *ClickSelector* — identify correct items from a set
  - *CardFlip* — spaced-repetition flashcards for key concepts
- Each interactive reports a completion score; a badge appears on the section once finished
- Live timer tracks time spent reading
- "Mark Lesson Complete →" button — saves elapsed time + marks lesson as viewed in Supabase, unlocks Section 2

**Section 2 — Practice Questions** *(locked until Section 1 complete)*
- Up to 5 practice questions for the skill (random sample), shown one at a time
- Uses the standard question card UI (multiple choice, confidence selector, immediate feedback)
- On completion: saves correct/total to Supabase (`learning_path_progress`) and updates skill scores in `user_progress`
- Shows a tiered results card (Demonstrating / Approaching / Emerging) with accuracy %
- "Return to Learning Path" button navigates back to the node map

**Section 3 — Extend** *(locked until Section 2 complete)*
- Placeholder — extended activities coming in a future update

---

**Lesson content structure:** Each lesson is a self-contained micro-lesson covering one testable exam concept. Lessons follow the naming convention `MOD-D{content_domain}-{sequence}` (e.g. `MOD-D1-01`). Each lesson includes:
- Core concept prose
- Memory anchor or clinical logic callout
- Comparison tables where applicable
- Bulleted lists of key terms or sequences

**Lesson naming convention:** Module IDs use the format `MOD-D{N}-{NN}` where `N` is the content domain (1–10, a content grouping distinct from the 4 app progress domains) and `NN` is the zero-padded sequence within that content domain. These IDs are **stable and must never be renamed** because they are used for code linkage and progress tracking.

**Learning Path progress tracking (Supabase):** Lesson completion, time spent, question results, and derived LP status are stored in the `learning_path_progress` table in Supabase, keyed to `(user_id, skill_id)`. This syncs across devices.

**LP status labels** (stored in `learning_path_progress.status`, separate from the main skill proficiency levels):

| LP Status | Condition |
|-----------|-----------|
| `not_started` | Lesson never viewed |
| `emerging` | Lesson viewed but no questions submitted, or accuracy < 60% |
| `approaching` | Questions submitted, 60% ≤ accuracy < 80% |
| `demonstrating` | Questions submitted, accuracy ≥ 80% |
| `mastered` | Demonstrating on two or more separate sessions |

**Blended accuracy scoring:** When a user completes both interactive exercises (inside the lesson) and the mini-quiz (Section 2), their LP accuracy is calculated as a blend: 70% quiz weight + 30% interactive exercise weight. If no interactive exercises were completed, quiz accuracy alone is used. This blended accuracy determines the LP status labels above.

**Interaction tracking (Supabase):** Every time a module is opened, a visit session is recorded in the `module_visit_sessions` table. Per-section engagement (time in viewport, interactive exercise scores/completion) is tracked in the `section_interactions` table. The `learning_path_progress` table also stores aggregate interactive metrics: `visit_count`, `total_interactive_score`, `interactive_exercises_completed`, and `interactive_exercises_total`.

**Interactive exercise tracking:** All 5 interactive section types (ScenarioSorter, DragToOrder, TermMatcher, ClickSelector, CardFlip) now report completion scores. These scores are persisted per-visit in `section_interactions` and aggregated into `learning_path_progress`. Completion badges appear on interactive sections after the user finishes them, and on Learning Path nodes when all exercises for a skill are done.

**Local tracking (localStorage):** Individual module viewed/time data is also stored in `localStorage` (`pmp-lp-{userId}`) for quick UI consistency. This is supplementary to the Supabase record — Supabase is the source of truth for node colors and status.

**The Learning Path is separate from By Skill Practice.** By Skill takes users into question practice. The Learning Path takes users into lesson content with a structured 3-section completion flow. These are intentionally distinct.

**Unlocks after:** completing the adaptive diagnostic.

---

### Feeling Spicy (Post-Diagnostic)
After the diagnostic, Feeling Spicy shifts from its pre-assessment preview role into a **45-skill recalibration cycle**. The user cycles through all 45 skills in a shuffled random order, one question per skill. After completing a full cycle, it reshuffles into a new order and starts again — generating fresh signal for every skill on each pass.

This is for users who want broad, low-stakes exposure across the entire skill map without choosing a specific domain or skill. It's the "I don't know what to practice, just give me something" mode.

**Persistence:** Cycle state (shuffled skill order + current position) is saved in `localStorage` per user. Progress survives browser refreshes and returns across sessions.

**Unlocks after:** completing the adaptive diagnostic. (Before the diagnostic, Spicy Mode is the question preview on the pre-assessment gateway — see Step 2 above.)

---

## The AI Study Guide — The Core Differentiator

After completing the adaptive diagnostic (or the legacy screener + full assessment), you can generate a **personalized study guide** written specifically about you — not a generic "how to study for Praxis 5403" template, but a document that reads your actual performance data, identifies your exact problem areas, explains why they're problems, and gives you a week-by-week action plan.

### Unlock Condition
Requires: adaptive diagnostic complete — OR — legacy screener complete + at least one full assessment on record.

### Generation Limit
1 generation per 7 days. (Disabled during testing — see `CLAUDE.md` for the rate-limit toggle location.)

### How It Gets Generated (Three Phases)

**Phase 1 — Deterministic preprocessing (no AI)**
The system processes all your responses. It calculates every skill's status label, detects trends, ranks skills by urgency, groups related skills into "priority clusters," estimates available study time from your settings, and lays out a weekly schedule frame. For skills flagged as Misconception status, it also identifies the dominant wrong answer you selected most repeatedly, looks up the specific misconception text and knowledge gap for that distractor, and passes it to Claude in Phase 3 — so the guide can name the exact incorrect belief rather than giving generic advice. All pure calculation — no AI involved.

**Phase 2 — Content retrieval (no AI)**
For each skill you need to work on, the system pulls pre-written expert content: vocabulary terms, common misconceptions, case study archetypes, relevant laws and frameworks. This content library was built specifically for Praxis 5403.

**Phase 3 — Claude writes the guide**
The structured data from Phases 1 and 2 is handed to Claude (Anthropic's AI). Claude's job is interpretation and narrative — explaining what the patterns mean, why a skill cluster matters, how to approach it strategically. Claude cannot change session types or durations; those are locked in by the code. It writes the human-readable layer on top of a calculated foundation.

Generation runs as a background process and typically completes within about a minute. When done, the app automatically navigates you to the guide.

### Study Guide Layout — 6 Tabs + Side Rail

**Overview tab**
Your readiness level with a plain-language summary of where you stand, key insights pulled from your data, and patterns the system observed in your answer history.

**Priorities tab**
Skills grouped into urgency clusters:
- *Urgent Now* — must address before the exam
- *Important Next* — secondary priorities once urgent items are handled
- *Reinforce Later* — skills doing well; just don't let them slip

Each cluster shows which skills are in it, their status labels, accuracy percentages, trend direction, and allocated study time. Also includes a three-card action plan: Do Right Now / This Week / Avoid.

**Domains tab**
A domain-by-domain study map. For each of the 4 Praxis domains, the guide explains the study approach tailored to your specific data in that domain.

**Concepts tab**
Vocabulary terms you need to lock down, and the specific misconceptions the system detected in your answer patterns. Names the wrong mental models directly so you can correct them.

**Weekly Plan tab**
A structured week-by-week schedule. Each week lists specific session types (Vocabulary, Case Practice, Concept Review, Wrong Answer Review) with time allocations, built from your settings: days per week, session length, and test date.

**Milestones tab**
Checkpoint logic that tells you what progress to expect at specific points in your plan, and what to do if you're ahead or behind.

**Side Rail (always visible)**
A permanent quick-reference panel showing:
- Readiness level and progress bar
- **Strongest Area** — what you're already good at
- **Next Best Move** — the single most impactful thing to do right now
- **Major Blockers** — skill areas flagged as critically urgent
- Plan summary: responses analyzed, domains covered, deficit skills, priority clusters

### The 4 Readiness Levels

| Level | What It Means |
|-------|--------------|
| **Early** | Significant gaps across multiple domains — a lot of ground to cover |
| **Developing** | Building knowledge, but real weaknesses remain |
| **Approaching** | Getting close — targeted work on specific clusters will close the gap |
| **Ready** | Strong across the board — reinforce and avoid slippage |

---

## The AI Tutor — Conversational Study Assistant

The AI Tutor (PraxisBot) is a conversational study assistant built on top of the same skill profile data as the study guide. It does **not** replace the study guide — both coexist. The study guide is a one-time generated report; the tutor is an interactive session.

### Two Experiences

**Full Tutor Page** (`mode === 'tutor'`):
- Requires completing the adaptive diagnostic to unlock
- Full personalization: knows your exact skill profile, accuracy per skill, trends
- Session sidebar: browse and resume previous conversations
- Chat mode + Quiz mode toggle
- Artifacts: generate vocabulary lists and weak-area summaries as downloadable `.md` files

**Floating Widget**:
- Persistent chat bubble (bottom-right) on every page except active assessments
- Works immediately after login — no diagnostic required
- Provides app navigation help and general Praxis 5403 content Q&A
- Suppressed during: `adaptive-diagnostic`, `screener`, `fullassessment`

### Quiz Mode

When the user asks to be quizzed:
- Questions are selected from the 1,150-question bank using weighted random selection: 60% from Emerging skills, 25% from Approaching, 15% from Demonstrating/maintenance
- Questions already used in the current session are excluded
- Answer evaluation is **all-or-nothing** for multi-select questions — computed deterministically before Claude is called
- Claude writes explanation prose around the pre-computed correctness result; it cannot change the scored outcome
- Quiz scoring lives entirely in `src/utils/tutorQuizEngine.ts` → `evaluateQuizAnswer()` and does not affect practice or assessment skill scores

### Adaptive Retry Loop

When a student misses a quiz question, the tutor forces a same-skill follow-up before returning to normal weighted selection. This ensures the student gets immediate reinforcement on the concept they just missed.

**State machine (tracked client-side via `quizRetryStateRef` in `useTutorChat.ts`):**

1. **Normal mode** — weighted random selection (60/25/15 split). Student answers wrong on skill X → retry state activates for skill X.
2. **Retry mode** — next quiz request sends `prioritySkillId` to the server, which selects a different question from the same skill. If no questions remain for that skill, falls back to weighted selection and retry state clears.
3. **Retry answer** — regardless of whether the student answers the retry correctly or incorrectly, retry state clears and normal selection resumes.
4. **Remediation trigger** — if the retry answer is also wrong (two consecutive misses on the same skill), the server appends a remediation instruction to the system prompt. Claude then provides: (a) plain-language concept explanation, (b) key terms/distinctions, (c) memory anchor or mnemonic, (d) one realistic Praxis scenario. The remediation trigger is deterministic in code — Claude only writes the prose.

**Key constraints:**
- No AI-generated questions — only the existing 1,150-question bank
- `prioritySkillId` is sent only on quiz-request turns, not general chat
- `quizRetryContext` is sent only on the retry answer submission, guarded by a skill-match check against `pendingQuizRef`
- Retry state clears on session switch or new session creation
- Does not affect the standalone diagnostic or practice scoring

### What the Tutor Can Do

- Answer Praxis 5403 content questions and explain concepts
- Quiz the user on weak-area skills (weighted toward Emerging skills)
- Generate artifact cards: vocabulary lists, weak-area summaries
- Guide app navigation: explain pages, suggest what to do next
- Provide hints when the user is viewing a specific question (floating widget)

### What the Tutor Cannot Do

- Change any skill score or assessment result (all scoring is deterministic; Claude only writes prose)
- Access ETS official materials or guarantee exam outcomes
- Replace the personalized study guide (the guide has deeper structure: weekly plans, milestones, priority clusters)

### Unlock Conditions

| Feature | Condition |
|---------|-----------|
| Tutor page | `adaptiveDiagnosticComplete === true` |
| Floating widget | User logged in |
| Full personalization | `adaptiveDiagnosticComplete === true` (floating widget works without it, but with limited skill context) |

### Feature Flag

`ACTIVE_LAUNCH_FEATURES.tutorChat` in `src/utils/launchConfig.ts` — set `false` until validated in production.

---

## Glossary & Vocabulary Quiz

The **Glossary** page is a personal vocabulary study tool, accessible from the main sidebar. It has two tabs: **My Terms** and **Quiz Mode**.

### My Terms Tab

When a student answers a practice question **incorrectly**, the vocabulary terms associated with that skill are automatically added to their personal glossary. Each term row has three columns:

1. **Term** — the vocabulary word, with skill ID and status indicator
2. **What does this mean to you?** — editable text area where the student writes their own definition (auto-saved on blur)
3. **Official Definition** — hidden by default; the student clicks "Reveal" to see the glossary definition and compare it with their own

Filter options: All, To Define, Defined, Revealed. A search bar filters by term name.

Stats chips at the top show total terms, to define, defined, and revealed counts.

### Quiz Mode Tab

An interactive vocabulary knowledge check using terms from the **master glossary** (396 Praxis terms with official definitions).

**Configuration options:**
- **Term Source**: "My Glossary Terms" (restricted to the user's personal word list) or "Full Glossary" (all 396 terms). "My Glossary Terms" requires at least 4 terms.
- **Quiz Type**: Mixed (both types randomly), "Know the Definition" (see a term → pick its definition), or "Name the Term" (see a definition → pick the correct term)
- **Number of Questions**: 5, 10, 15, or 20

**How it works:**
- Each question presents 4 multiple-choice answers
- Distractors are drawn from the same skill neighborhood for plausibility (terms that share the same skill as the correct answer are preferred over random terms)
- Immediate feedback after each answer: correct/incorrect with the right answer shown
- Progress bar and running score during the quiz
- End-of-quiz review screen: overall percentage, per-question breakdown showing correct answers and the user's wrong picks

**Scoring:** Quiz results are session-only — they do not affect skill proficiency scores or any persistent data. The quiz is a study tool, not an assessment.

---

## Concept Insights — Progress Dashboard

The **Progress** page includes a **Concept Insights** section that surfaces vocabulary-level performance analytics across all answered questions.

Every question in the bank is tagged with specific vocabulary concepts (e.g., "functional behavioral assessment", "IDEA", "reinforcement"). When a user answers questions, the system aggregates performance by concept — not just by skill — to reveal patterns invisible at the skill level.

### What It Shows

- **Cross-Skill Vocabulary Gaps** — concepts the user struggles with across 2 or more skills. These indicate a vocabulary gap (not understanding the term itself) rather than a skill gap (not understanding how to apply it in one context). Highest-signal finding.
- **Weakest Concepts** — concepts with accuracy below 60% and at least 3 attempts, sorted by accuracy ascending. Each shows an accuracy bar.
- **Strongest Concepts** — concepts with accuracy at or above 80% and at least 3 attempts.
- **Summary line** — total concepts tested, gaps, strengths, and cross-skill gaps.

### How Concepts Are Tagged

Each question is pre-tagged with vocabulary concepts via text-matching against the 396-term master glossary. Tags are stored in `src/data/question-vocabulary-tags.json` (separate from the question bank). The tagging pipeline matches glossary terms against question stems, answer choices, and explanations. Average: ~2.7 concepts per question.

### Where the Computation Happens

`src/utils/conceptAnalytics.ts` — a pure computation module (no DB calls, no side effects). It takes user responses + analyzed questions and produces:
- Per-concept accuracy, attempt count, trend, related skills
- Gap concepts (< 60% accuracy, ≥ 3 attempts)
- Strength concepts (≥ 80% accuracy, ≥ 3 attempts)
- Cross-skill gaps (concept weak across 2+ skills)

---

## How Data Flows — The Full Loop

```
You answer a question
        ↓
Response logged (correct/wrong, confidence, which distractor selected)
        ↓
Skill scores updated in real time
        ↓
Status labels recalculated per skill
        ↓
Dashboard reflects new data immediately
        ↓
When you generate the AI Study Guide:
  Phase 1 → Preprocessor calculates urgency, clusters, schedule
  Phase 2 → Content library retrieves vocabulary + misconceptions per skill
  Phase 3 → Claude synthesizes into a personalized narrative plan
        ↓
Guide saved to your account (viewable anytime, printable)
```

Every loop tightens the picture. The more questions you answer, the more accurate your skill states become, and the more precise your next study guide will be.

---

## Key Numbers

| Item | Number |
|------|--------|
| Exam domains | 4 |
| Tracked skills | 45 |
| Question bank size | 1,150 questions |
| Wrong-answer options with distractor classification | 3,587 (98.7% of slots) |
| Questions with complexity rationale | 1,150 (100%) |
| Questions with construct classification | 1,142 (99.3%) |
| Adaptive diagnostic length | 45–90 questions (adaptive follow-ups) |
| Legacy screener length | 50 questions |
| Legacy full assessment length | 125 questions |
| Onboarding form fields | 6 (single page, all required, no skip) |
| Interactive exercise types | 5 (ScenarioSorter, DragToOrder, TermMatcher, ClickSelector, CardFlip) |
| Skill status categories | 6 (internal AI/preprocessor labels) |
| User-facing proficiency levels | 3 (Emerging / Approaching / Demonstrating) |
| Learning Path status labels | 5 (not_started / emerging / approaching / demonstrating / mastered) |
| Learning Path practice questions per session | Up to 5 (random sample per skill) |
| Readiness target (skills at ≥ 80%) | 32 of 45 (70%) |
| Study guide tabs | 6 + side rail |
| Readiness levels | 4 (Early / Developing / Approaching / Ready) |
| Time between guide regenerations | 7 days (once live) |
| Supabase migrations applied | 19 (0000 through 0018) |
| Post-assessment trigger | demonstratingCount ≥ 32 of 45 (the readiness target) |
| Post-assessment snapshot | one-shot, written once on completion to `post_assessment_snapshot` |
| Redemption entry threshold (miss) | 3rd cumulative wrong answer on a question |
| Redemption entry (hint) | Immediate — any hint use quarantines the question |
| Redemption clearance threshold | 3 correct answers inside Redemption Rounds |
| Redemption Round credit cost | 1 credit = 1 full pass through entire quarantine bank |
| Redemption Round credit earning | 20 non-hint practice answers = 1 credit |
| Redemption Round timer per question | 90 seconds |
| Master glossary terms | 396 |
| Avg vocabulary concepts per question | ~2.7 |
| Vocabulary quiz sizes | 5, 10, 15, or 20 questions |
| Inactivity auto-logout | 15 minutes (separate from the "15 min avg session" marketing stat) |

---

## What Makes It Different

1. **It diagnoses, not just scores.** It doesn't just report a percentage — it identifies *which* mental models are wrong and labels them. Every wrong-answer option in the bank has been individually classified for the misconception it exploits and the knowledge gap it reveals. When you choose a wrong answer, the app tells you the specific belief behind that choice — not a generic explanation.

2. **The study plan is built from your data, not a template.** Two students using this app will get completely different study guides because their answer patterns are different. When the system detects a misconception pattern, it names the exact incorrect belief in the study guide — not just "work on this skill."

3. **The AI has guardrails.** Claude doesn't invent session lengths or priorities — the code calculates those from hard thresholds. The AI writes narrative around a mathematical foundation. The advice is grounded, not hallucinated.

4. **It gets smarter as you use it.** Every question sharpens the skill states. Every guide regeneration reflects the most current performance profile.

5. **It retires what you know.** You're never stuck grinding questions you've already mastered. The system moves the work to where it matters.

6. **The feedback is distractor-specific.** The explanation you see after a wrong answer is written for the specific choice you made — not the same text regardless of which option you selected. Tier, error type, misconception, and knowledge gap are all authored per distractor, covering 3,587 wrong-answer slots across the bank.

---

## Tutorial Walkthrough

New users see an **8-slide tutorial** automatically after completing onboarding. Each slide covers a major feature:

1. **Welcome** — overview of what the app offers
2. **Adaptive Diagnostic** — how it works and why to start here
3. **Dashboard** — domain cards, proficiency levels, color meanings
4. **Practice Modes** — By Domain, By Skill, Learning Path
5. **AI Tutor** — quizzes, remediation, practice activities
6. **Progress Tracking** — score report, skill breakdown, trends
7. **AI Study Guide** — personalized plan, 6 tabs, side rail
8. **Redemption Rounds** — quarantine mechanics, credits, clearing

The tutorial can be replayed anytime from the **Help** page.

---

## Subscription Tiers (Planned)

The app uses a **freemium model** with two tiers:

| Feature | Free | Premium |
|---------|------|---------|
| Adaptive Diagnostic | Full | Full |
| Practice Questions | 10/day | Unlimited |
| AI Tutor Messages | 3/day | Unlimited |
| Glossary | Full | Full |
| AI Study Guide | Locked | Full |
| Redemption Rounds | Locked | Full |
| Score Export | Locked | Full |
| Learning Path | Basic (2 modules) | Full |

**Pricing:** $14.99/month or $99.99/year (save $79.89).

Payments are processed via **Stripe Checkout**. Subscription state is synced to Supabase via webhooks. The paywall is currently behind a feature flag (`paywall: false`) and not active in production.

---

## NASP Domain Alignment

Each of the 45 skills is mapped to a **NASP Practice Model domain** (NASP-1 through NASP-10). These appear as small badges on Learning Path tiles and are used in the study guide to provide professional context (e.g., "This cluster maps to NASP-3: Interventions and Instructional Support"). Prerequisite knowledge for each skill is shown as a tooltip on hover and as a "Prerequisites" section at the top of each Learning Path module page.

The Phase D data is also injected into the AI Study Guide prompt: `prereq_chain_narrative` and `nasp_domain_primary` are passed per skill so Claude can write richer narrative about prerequisite knowledge gaps and align recommendations to NASP professional domains. The Learning Path sorts non-mastered skills by prerequisite depth (foundational skills first) so students encounter prerequisites before the skills that depend on them.

---

## Error Pattern Analysis (Phase C)

Every question in the bank has three error-pattern fields:

- **error_cluster_tag** — a categorical label for the type of error (e.g., "scope-overgeneralization", "definition-confusion")
- **dominant_error_pattern** — a sentence describing the most common way students get this question wrong
- **instructional_red_flags** — a teaching move to address the specific confusion

These are surfaced in three places:
1. **Admin Item Analysis** — colored chip + expanded detail per question
2. **AI Tutor** — injected into remediation mode when a student misses the same skill twice
3. **Study Guide** — aggregated across missed questions per cluster; dominant patterns called out in the narrative when 3+ misses share the same tag

---

## Maintenance Checklist

When any of the following change, update this document in the same pull request or commit:

- [ ] Number of domains or skills
- [ ] Screener or full assessment question counts
- [ ] Skill status label names or thresholds
- [ ] User-facing proficiency level names or thresholds (Emerging / Approaching / Demonstrating)
- [ ] Readiness level names (Early / Developing / Approaching / Ready)
- [ ] Readiness target percentage or count
- [ ] Study guide unlock conditions
- [ ] Study guide rate limit
- [ ] Study guide section names or tab layout
- [ ] Practice mode unlock conditions
- [ ] Question retirement behavior
- [ ] Any stat shown on the login/marketing page
- [ ] Onboarding form field count, names, or answer options
- [ ] Which onboarding fields are required vs. optional
- [ ] Whether the onboarding flow can be skipped
- [ ] Post-assessment trigger condition (currently `demonstratingCount >= 32`)
- [ ] Post-assessment Growth Report sections or per-domain bar segments
- [ ] Number of Supabase migrations applied (currently 0000–0018)
