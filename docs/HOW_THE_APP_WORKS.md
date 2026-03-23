# How the App Works

**Praxis Makes Perfect — School Psychology 5403**

> This document is the canonical plain-language description of the product. It is written for marketing, onboarding guides, and how-to documentation — not for developers. Keep it accurate and up to date.
>
> **Maintenance rule: Any time a feature is added, changed, or removed — including thresholds, counts, labels, unlock conditions, or study guide behavior — this file must be updated in the same change.**

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

### Step 1b: Complete Your Profile (Onboarding Wizard)
Immediately after creating an account, new users are guided through a **3- or 4-step onboarding wizard** before reaching the main app. The step count depends on the role selected — users who choose "Other" get 3 steps (Role → Exam → Goals), while Graduate Students and Certification-Only candidates get 4 steps (Role → Pathway Details → Exam → Goals). This is how the platform personalizes the experience from day one.

**Step 1 — Role**
The user identifies which path they're on:
- Graduate Student (enrolled in a school psychology graduate program)
- Certification-Only / Alternative Route (working in education, pursuing certification without a full graduate program)
- Other

**Step 2 — Program or Pathway Details**
Fields shown depend on the role selected.

*Graduate students provide:*
- Program state chosen from a dropdown of NASP-listed jurisdictions
- School psychology program chosen from a NASP-backed dropdown filtered to that state
- Program type (Ed.S., Ph.D., M.A./M.S., or Other)
- Delivery mode (On-campus, Hybrid, or Online)
- Training stage (Early Program, Mid Program, Approaching Internship, or In Internship)

*Certification-only candidates provide:*
- Target certification state chosen from a dropdown
- Current role (Teacher, School Counselor, Psychologist Trainee, or Other)
- Certification route (Initial, Add-on, Reciprocity/Transfer, or Other)

Users who selected "Other" skip Step 2 entirely.

**Step 3 — Exam Details**
Collected for everyone:
- Primary exam (Praxis 5403, FTCE School Psychologist PK-12, or Other)
- Planned test date
- Attempt status (First attempt or Retake)
- Number of prior attempts (shown only if Retake selected)
- Target score

**Step 4 — Goals and Study Habits**
- Study goals (multi-select): Pass the exam, Improve weak domains, Build timed practice, Build confidence
- Weekly study availability: 1–2, 3–5, 6–10, or 10+ hours per week
- Biggest challenge (multi-select): Test anxiety, Content knowledge gaps, Time management, Not enough good questions, No clear study plan, Staying motivated
- Whether the user has used other prep resources (Yes/No)
- If Yes: which resources (ETS/Pearson study guide, YouTube/videos, Flashcards/Quizlet, Another prep app, Private tutoring, Other)
- If Yes: what was missing from those resources (open text)

**Required fields by step:**
- Step 1: Role (required)
- Step 2 — Graduate students: Program type, Delivery mode, Training stage (required); State, University (optional)
- Step 2 — Certification candidates: Current role, Certification route (required); State (optional)
- Step 3: Primary exam, Retake status (required); Test date, Prior attempts, Target score (optional)
- Step 4: Study goals, Weekly availability (required); others optional

Users can also tap **Skip for now** on the first step to bypass the wizard entirely and go straight to the app. Profile data is stored in the user's account and can inform future study plan generation. The user's name is collected at sign-up (not repeated in onboarding).

### Step 2: Take the Adaptive Diagnostic
The adaptive diagnostic is your **baseline map**. It starts with one question per skill (45 questions total), interleaved across all four domains.

**How it adapts:** When you answer a question incorrectly, the system queues a follow-up question for that skill — with alternating cognitive complexity (if the first was Recall, the follow-up is Application, and vice versa). A maximum of 3 questions per skill (1 initial + 2 follow-ups). This means:
- Minimum: 45 questions (all correct)
- Typical: ~60–70 questions
- Maximum: ~90 questions (all wrong with follow-ups)

**Pause and resume:** You can pause the diagnostic at any time and return to the home dashboard. Your progress is saved. You can start practicing immediately — even before finishing the diagnostic. When you return, you pick up exactly where you left off.

After completing the diagnostic, you get a **Score Report** — a breakdown of which domains and skills are strong and which need work. Practice is available immediately, with no gates.

> **Legacy assessment path:** The app also supports a legacy two-step assessment flow (50-question Skills Screener + 125-question Full Assessment) for users who started before the adaptive diagnostic was introduced. Both paths unlock the same features. New users always see the adaptive diagnostic.

### Step 4: Study, Practice, and Track
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
- A baseline-recorded state for users who completed a legacy screener
- A fully unlocked dashboard after the adaptive diagnostic (or legacy screener + full assessment) is complete

On the fully unlocked dashboard, the main sections are:
- A greeting hero with a spicy-practice call to action
- Four summary cards: Number of questions answered, Readiness phase, Skills to reach goal, and Weekly usage
- A Daily goal card showing progress toward the daily question target
- A High-Impact Skills list showing the current lowest-performing skills

The High-Impact Skills list is intentionally action-oriented. On Home, each row uses a simple **Practice** button instead of exposing raw accuracy percentages. Those buttons drop the user into the existing skill-focused learning path or practice flow for that skill.

Practice, Progress, and Study Plan keep their existing behaviors and unlock rules. In this release, those pages were restyled to match the same shell and color system as Home rather than being redesigned from scratch.

---

## How Tracking Works — The Intelligence Layer

The app doesn't just record right vs. wrong. It watches for patterns.

### What It Tracks Per Skill
For every one of the 45 skills:
- **Total attempts** — how many times you've been tested on it
- **Accuracy** — percentage correct
- **Confidence signals** — whether answers are chosen confidently or appear to be guesses
- **Distractor patterns** — which wrong answer keeps getting selected (reveals specific misconceptions)
- **Trend** — improving or declining over time (requires at least 6 attempts to calculate)

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

**Important:** Proficiency tiers (Emerging / Approaching / Demonstrating) are calculated from **raw accuracy only** — the simple percentage of correct answers. Confidence ratings do not affect these badges.

A separate **confidence-adjusted accuracy** metric is available in the Advanced Statistics section of the Progress page. This score penalizes high-confidence wrong answers more heavily (answering "Sure" and getting it wrong counts against you more than a "Guess" that is wrong). A large gap between raw and confidence-adjusted accuracy is a signal that misconceptions — not just knowledge gaps — are present. This metric is supplemental and does not change the proficiency tier calculation.

### Readiness Target
70% of all 45 skills must reach Demonstrating (≥ 80% accuracy) for overall exam readiness. That's 32 out of 45 skills.

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

## Feeling Spicy — Quick Recalibration Mode

**Feeling Spicy** is a rapid-fire practice mode accessible from the Home dashboard hero. It is designed for quick daily recalibration across every skill — one question per skill, cycling through all 45 skills in a shuffled order.

**How it works:**
- The system picks a random order for all 45 skills and presents one question per skill.
- After you answer all 45 (completing one full cycle), the order reshuffles automatically into a new random sequence and starts again from skill 1.
- Every completed cycle generates fresh signal across the whole skill map, which improves the accuracy of status labels and study guide recommendations.

**What it shows:** The session header displays which skill you're on (e.g. "Skill 7 of 45") instead of the standard correct/wrong counters. The answer experience uses the same question card and confidence selector as other practice modes.

**State persistence:** Your position in the current cycle is saved in the browser (`localStorage`, keyed per user) so you can pick up exactly where you left off across sessions.

---

## The Three Practice Modes

The Practice Hub offers three distinct modes. All three live under the **Practice** tab and are accessible from the same screen via a three-tab selector: **By Domain / By Skill / Learning Path**.

---

### By Domain
Practice by Praxis section. Choose from the 4 domains and work through questions in that category. Progress bars show your percentage score per domain, color-coded (green = ≥ 80%, amber = 60–79%, red = < 60%).

**Unlocks after:** completing the adaptive diagnostic (or the legacy Skills Screener).

---

### By Skill
Practice on a specific skill — any of the 45 individual competency areas. The skill list is sorted from lowest-performing to highest-performing. Each skill row shows:
- The skill name and its primary module code (e.g. `MOD-D1-03`)
- The user's current proficiency level (Emerging / Approaching / Demonstrating / Not started)
- A **Practice** button — launches question practice for that skill
- A **Help icon** — opens a slide-up lesson drawer with the micro-lesson content for that skill

**The Help drawer (Skill lesson during practice):** When a user is answering questions in By Skill mode, tapping **Help** in the session header opens the same lesson drawer. This drawer shows the full micro-lesson so users can review concept content while practicing — but does not reveal answers. Users must scroll through the lesson to find what they need.

**Unlocks after:** completing the adaptive diagnostic (or the legacy screener + full assessment).

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

**Unlocks after:** completing the adaptive diagnostic (or the legacy screener + full assessment).

---

## The AI Study Guide — The Core Differentiator

After completing the adaptive diagnostic (or the legacy screener + full assessment), you can generate a **personalized study guide** written specifically about you — not a generic "how to study for Praxis 5403" template, but a document that reads your actual performance data, identifies your exact problem areas, explains why they're problems, and gives you a week-by-week action plan.

### Unlock Condition
Requires: adaptive diagnostic complete — OR — legacy screener complete + at least one full assessment on record.

### Generation Limit
1 generation per 7 days. (Disabled during testing — see `CLAUDE.md` for the rate-limit toggle location.)

### How It Gets Generated (Three Phases)

**Phase 1 — Deterministic preprocessing (no AI)**
The system processes all your responses. It calculates every skill's status label, detects trends, ranks skills by urgency, groups related skills into "priority clusters," estimates available study time from your settings, and lays out a weekly schedule frame. All pure calculation — no AI involved.

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
| Question bank size | ~1,150 questions |
| Adaptive diagnostic length | 45–90 questions (adaptive follow-ups) |
| Legacy screener length | 50 questions |
| Legacy full assessment length | 125 questions |
| Onboarding wizard steps | 3 or 4 (depends on role) |
| Interactive exercise types | 5 (ScenarioSorter, DragToOrder, TermMatcher, ClickSelector, CardFlip) |
| Skill status categories | 6 (internal AI/preprocessor labels) |
| User-facing proficiency levels | 3 (Emerging / Approaching / Demonstrating) |
| Learning Path status labels | 5 (not_started / emerging / approaching / demonstrating / mastered) |
| Learning Path practice questions per session | Up to 5 (random sample per skill) |
| Readiness target (skills at ≥ 80%) | 32 of 45 (70%) |
| Study guide tabs | 6 + side rail |
| Readiness levels | 4 (Early / Developing / Approaching / Ready) |
| Time between guide regenerations | 7 days (once live) |
| Supabase migrations applied | 6 (0000–0005) |

---

## What Makes It Different

1. **It diagnoses, not just scores.** It doesn't just report a percentage — it identifies *which* mental models are wrong and labels them.

2. **The study plan is built from your data, not a template.** Two students using this app will get completely different study guides because their answer patterns are different.

3. **The AI has guardrails.** Claude doesn't invent session lengths or priorities — the code calculates those from hard thresholds. The AI writes narrative around a mathematical foundation. The advice is grounded, not hallucinated.

4. **It gets smarter as you use it.** Every question sharpens the skill states. Every guide regeneration reflects the most current performance profile.

5. **It retires what you know.** You're never stuck grinding questions you've already mastered. The system moves the work to where it matters.

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
- [ ] Onboarding wizard step count, field names, or answer options
- [ ] Which onboarding fields are required vs. optional
- [ ] Role types or pathway branches in the onboarding flow
