# Praxis Makes Perfect — Comprehensive Design Reference

Everything available to render, organize, and reconceptualize the UI.

---

## 1. SCREENS / MODULES (expanded with user interactions)

### Pre-Auth Screens

**Hero / Landing Page**
The first thing any visitor sees — no login required. Communicates the value proposition: a purpose-built adaptive practice platform for the Praxis School Psychology 5403 exam. Shows proof points (1,150 questions, 45 skills, 4 domains), a visual domain/skill breakdown, and a "Get Started" CTA. The hero should convey the depth of the question bank and the adaptive engine that makes this tool unique in the market (see Section 9: Hero Page Content below).

**Login / Signup**
Email/password auth via Supabase. Minimal — email field, password, submit. "Sign up" and "Sign in" toggle. No social auth. After first signup, routes to Onboarding.

**Onboarding Flow**
Multi-step profile form collected on first login: full name, university, program type (Ed.S., Ph.D., Psy.D., other), delivery mode (in-person/hybrid/online), training stage, certification state, current role, planned test date, retake status, target score, study goals (multi-select), weekly study hours, biggest challenges, prior resources used. This data feeds the AI study plan generator and personalizes the dashboard.

### Pre-Dashboard Screens

**Pre-Assessment Gateway** (shown every login until diagnostic is complete)
Two-path choice page. The user sees this every time they log in until the diagnostic is done:
1. **Adaptive Diagnostic** (primary path) — maps all 45 skills, unlocks everything. 45–90 questions, 25–45 min, pausable.
2. **Feeling Spicy** (preview path) — random questions from the full 1,150-question bank with full feedback, hints, and explanations. No feature unlocks. Progress persists across sessions and renders in the dashboard after diagnostic completion.

If the user started the diagnostic and paused, this page shows "Resume Diagnostic" with a progress bar (X of 45 skills, Y questions answered) plus the Spicy Mode option with their prior session stats (questions answered, accuracy, skills seen).

**Adaptive Diagnostic**
The assessment engine. One question per skill minimum (45 baseline). Wrong answers generate up to 3 follow-up questions per skill, drilling deeper into that gap. No feedback shown during the test — answers are hidden to keep results clean. Can pause and resume anytime (progress auto-saved). Shows progress bar, pacing indicator, and skill count. Unlocks ALL features on completion.

**Tutorial Walkthrough (Pre-Assessment)**
Auto-triggers on first visit to the pre-assessment page. Step-by-step modal overlay (1 of 3 steps) explaining the two paths: Adaptive Diagnostic and Feeling Spicy. Includes "Skip tutorial" option.

**Tutorial Walkthrough (Dashboard)**
Auto-triggers after diagnostic completion on first dashboard visit. Numbered indicators (1, 2, 3...) on each UI feature. Clicking each number opens an info panel explaining what the feature is, how to get started, and an optional tip. The feature stays visible while the panel is open — user sees both the tool and the explanation simultaneously. Sequential progression through all features. Depends on finalized dashboard layout.

### Main Dashboard Tabs (post-diagnostic)

**Home Tab**
The daily action hub. Where users land after login (post-diagnostic). Shows:
- **Readiness banner** — progress toward the 32-skill Demonstrating target (e.g., "18 of 32 skills ready")
- **Today's Focus** — 2-3 actionable cards suggesting what to do next (weakest skill practice, overdue SRS review, redemption round available)
- **Quick Stats** — questions this week, accuracy trend, streak count, redemption credit progress
- **30-day activity calendar** — GitHub-style heatmap showing daily practice volume
- **SRS overdue row** — skills due for spaced review, one-click to start

**Practice Tab**
Where the actual studying happens. Four practice modes plus Redemption:
- **By Domain** — pick one of 4 domains, answer questions from that domain's skill pool
- **By Skill** — drill into a specific skill (e.g., "FERPA" or "FBA")
- **Learning Path** — structured sequence ordered by biggest gaps, with micro-lessons before practice
- **Feeling Spicy** — random questions across all skills in a continuous loop (post-diagnostic, this is the 45-skill recalibration cycle)
- **Redemption Rounds** — quarantine quiz for hinted/repeatedly-missed questions (requires credits earned through regular practice)

**Fluency Tab**
Rapid-fire flashcard drills by category. Concept preview — not yet fully built. Categories include: Key Terms, Assessment Tools, Legal Provisions, Intervention Models. Toggle between flashcard mode and timed challenge mode.

**Glossary Tab**
Personal vocabulary bank populated from wrong answers in practice. Each term has:
- A blank "write your own definition" field (the student writes first, no peeking)
- A "Reveal" button to show the official definition (permanent, can't undo)
- Filter by status: All / To Define / Defined / Revealed
- Search bar for quick term lookup
- "Quiz Mode" button launches a vocab quiz on defined terms

**Progress Tab**
Full analytics dashboard. Deepest data view in the app:
- **Summary stats row** — total questions, overall accuracy, skills at each proficiency tier
- **Radar/spider chart** — 4 domains with current performance vs. baseline overlay
- **Skill heatmap** — 45 colored cells grouped by domain (green=Demonstrating, amber=Approaching, red=Emerging, gray=Not Started)
- **Most-missed skills** — ranked list of weakest skills with accuracy and attempt counts
- **Confidence calibration bars** — raw accuracy vs. confidence-weighted accuracy with delta indicator
- **Growth since baseline** — tier changes per skill since diagnostic completion

**Study Guide Tab**
AI-generated personalized study plan (Claude-powered, rate-limited to 1 per 7 days). Shows:
- **Header stats** — plan generation date, skills analyzed, constraints set
- **Priority clusters** — P1 (critical), P2 (important), P3 (reinforce) groupings of skills
- **Domain study maps** — per-domain tactical guidance
- **Weekly schedule** — day-by-day plan with session types and durations, "Start →" buttons
- **Vocabulary and case patterns** — key terms and scenario archetypes to study
- **Checkpoint logic** — when to re-assess

**AI Tutor Tab**
Multi-session chat interface with PraxisBot (Claude-powered). User can:
- Type free-text questions about any school psychology topic
- Click suggested follow-up chips generated from the last response
- Toggle between Chat mode (open discussion) and Quiz mode (interactive practice)
- Switch between saved sessions in the sidebar
- Create new sessions
- View inline artifact cards (tables, concept maps, practice scenarios generated by the AI)

**Notebook Tab**
Personal learning journal. User creates notes manually or they're auto-generated from practice sessions. Each note has a title, body, skill/domain tags, and timestamp. Search and filter by skill. Used for exam-day review.

### Full-Screen Modes (launched from dashboard)

**Practice Session**
Question-by-question practice. Flow: read question → select answer → set confidence (Low/Medium/High) → submit → see feedback panel with explanation + distractor analysis. Optional: request hint (opens SkillHelpDrawer, tags question for Redemption). Streak messages at 2+, 5+, 10+ consecutive correct. Domain warning banner after 3 consecutive wrongs on same skill.

**Redemption Round**
Timed quarantine quiz for questions the user has struggled with. 90-second countdown per question. No feedback shown. No hints available. Single answer only. Timeout = incorrect. Must answer each quarantined question correctly 3 times (across rounds) to clear it from quarantine. Requires credits (1 credit = 20 non-hint practice answers).

**Learning Path Module**
Structured micro-lesson for a single skill. 3 sections: Lesson (instructional content with key concepts, examples, and callouts) → Practice Quiz (3-5 questions with feedback) → (Coming Soon: application exercise). Ordered by prerequisite depth + student deficit.

**Vocabulary Quiz**
Quiz mode for glossary terms. Tests recall of definitions the student has written. Multiple-choice format generated from the glossary bank.

**Score Report / Screener Results**
Post-assessment results breakdown. Domain performance bars, skill-level accuracy, total questions, recommendations for next steps.

### Header Elements

**Logo + App Name** — Brand identity, click to return to Home tab.

**Users Online Pill** — Green pulsing dot + count (e.g., "5 online"). Social proof mechanic seeded from an hour-based lookup table, drifts ±1-2 every 90-150s. Client-side simulation, no real data. Goes grey at 2-3am.

**Leaderboard Trophy** — Click opens a popover with 3 leaderboard modes: Questions Answered, Engagement Time, Skills to Mastery. Real user data, anonymized to initials. Current user highlighted with "You" badge. Refreshes every 5 minutes.

**Streak Badge** — Current daily practice streak (consecutive days with at least 1 question answered).

**Profile Avatar** — Click opens dropdown: settings, help, exam countdown, logout.

### Admin Dashboard (admin-only)

**Overview** — User counts, active users, average question time (global), in-progress assessments, potential drops.

**Audit** — Consolidated feedback + question report audit with CSV download.

**Beta Feedback** — All user feedback entries with status management (new/reviewed/resolved).

**Question Reports** — Per-question issue reports with severity triage. Users can flag questions from practice.

**Users** — Full user table with avg question time, in-progress/dropped badges. Click any row to open the **Student Detail Drawer** showing: domain performance bars, skill breakdown table (sortable), session timeline, time distribution stats, top 10 most-missed skills.

**Item Analysis** — Psychometric quality metrics for the 1,150-question bank: p-value, discrimination index, distractor frequency analysis. Flag thresholds: Too Easy (p>0.90), Too Hard (p<0.20), Low Discrimination (≤0), Timing Outlier (>avg+2σ).

**AI Tutor Activity** — Chat session logs with user names, message counts, artifact counts. Drill into full conversations with intent badges and inline artifact cards. CSV export.

---

## 2. EVERY DATA POINT AVAILABLE TO RENDER

This section lists every piece of information the app knows about a user — organized by category. Each category starts with a plain-language description of **what it is**, **where the user encounters it**, and **what "field" means** in that context.

**What "field" means throughout this document:** A field is a single named piece of data stored about the user. Think of it like a cell in a spreadsheet — it has a name (column header) and a value (what's in the cell). For example, "Planned test date" is a field; its value might be "June 15, 2026." Some fields are stored directly in the database (the user typed it in or the system saved it). Others are "computed" — calculated on the fly from other fields (e.g., "Days until exam" is computed from today's date minus the test date field).

---

### A. Per-User Profile Data

**What this is:** The personal information each user provides during sign-up and the onboarding wizard. This is the "who are you and what are you preparing for" data.

**Where the user sees it:** Profile settings page (editable anytime), the sidebar profile card (name + role label), and behind the scenes in the AI study plan generator (which uses test date, weekly hours, and goals to build a personalized schedule).

**Why it matters for the UI:** Profile fields let you personalize greetings ("Welcome back, Veronica"), show countdowns ("23 days until your exam"), and tailor recommendations ("You said time management is your biggest challenge — here's how to structure your sessions").

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Full name / display name | The name shown in the UI and leaderboard | "Veronica Rivera" |
| Email | Login credential and admin identification | "veronica@university.edu" |
| University | Where the user is enrolled (from NASP program list) | "University of South Florida" |
| Program type | Degree program | "Ed.S." or "Ph.D." |
| Delivery mode | How they attend classes | "Hybrid" |
| Training stage | Where they are in their program | "Approaching Internship" |
| Certification state | State they're seeking certification in | "Florida" |
| Current role | What they do now | "Graduate Student" or "Teacher" |
| Primary exam | Which Praxis exam they're preparing for | "Praxis 5403" |
| Planned test date | When they plan to take the exam | "2026-06-15" |
| Retake status + prior attempts | Whether this is a retake and how many tries | true, 2 attempts |
| Target score | The score they're aiming for | 157 |
| Study goals | What they want to accomplish (multi-select) | ["Pass the exam", "Improve weak domains"] |
| Weekly study hours | How much time they can dedicate per week | "3–5 hours" |
| Biggest challenges | Self-reported obstacles (multi-select) | ["Content knowledge gaps", "Test anxiety"] |
| Prior resources used | Other prep tools they've tried | ["ETS study guide", "Quizlet"] |
| Onboarding complete flag | Whether they finished the wizard | true/false |

---

### B. Assessment State

**What this is:** The current status of the user's diagnostic assessment — have they started it, are they partway through, or have they finished? This determines what the user can access in the app.

**Where the user sees it:** The pre-assessment gateway page (shows "Start Diagnostic" or "Resume Diagnostic" with progress bar), and the dashboard unlock state (locked features show ghost previews until the diagnostic is complete).

**Why it matters for the UI:** Assessment state is the primary gate. Almost everything in the app — practice modes, study guide, AI tutor, learning path — unlocks only after the diagnostic is complete. The UI needs to know this state to show the right screen (gateway vs. dashboard) and the right buttons (locked vs. active).

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Screener complete | Whether the legacy 50-question screener was finished | true/false |
| Diagnostic complete | Whether the legacy full 125-question assessment was finished | true/false |
| Adaptive diagnostic complete | Whether the current adaptive diagnostic was finished | true/false |
| Assessment in progress | Which assessment type is currently paused mid-way | "adaptive" or null |
| Questions answered in current session | How far into the current assessment sitting | 34 |
| Total questions in current assessment | How many questions the adaptive engine has queued so far | 52 |
| Time elapsed in current assessment | How long the user has been in this assessment sitting | 1,245 seconds (~21 min) |

---

### C. Per-Skill Data (45 skills)

**What this is:** The deepest layer of tracking. For every one of the 45 testable skills, the app maintains a rich profile of how the user is performing. This is the data that drives practice recommendations, study guide content, SRS scheduling, and proficiency labels.

**Where the user sees it:** Everywhere. The Practice tab (skill list sorted by weakest), Progress tab (heatmap, radar chart, most-missed list), Study Guide (priority clusters are built from this), Learning Path (node colors and ordering), Home tab (Today's Focus picks come from this), and the AI Tutor (knows which skills are weak when generating quiz questions).

**Why it matters for the UI:** This is the intelligence layer. Every personalized element in the app — "practice this skill next," "you have a misconception about FERPA," "this skill is improving" — comes from per-skill data. If you're designing a dashboard widget, you're probably reading from this category.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Skill ID | Unique identifier for the skill | "CON-01" (Consultation Models) |
| Skill name | Human-readable name | "Consultation Models and Methods" |
| Domain ID | Which of the 4 domains this skill belongs to | 1 (Professional Practices) |
| Domain name | Human-readable domain name | "Professional Practices" |
| Accuracy score (0–1) | Proportion of correct answers for this skill | 0.72 (72% correct) |
| Weighted accuracy | Accuracy adjusted for confidence — high-confidence wrongs penalized more | 0.65 |
| Total attempts | How many questions the user has answered for this skill | 18 |
| Total correct | How many they got right | 13 |
| Proficiency tier | The user-facing label based on accuracy thresholds | "Approaching" (60–79%) |
| Attempt history | Every individual answer: when, right/wrong, confidence, time, which distractor chosen | [{timestamp, correct: false, confidence: "High", timeSpent: 42s, distractorId: "A"}] |
| SRS box position (1–5) | Leitner spaced repetition box — higher = more mastered, longer review intervals | 3 (review every 7 days) |
| SRS next review date | When this skill is next due for review practice | "2026-04-10" |
| SRS overdue flag | Whether the review date has passed without the user practicing it | true = overdue |
| Recent high-confidence wrongs | Count of "I was sure but wrong" answers in last 10 attempts — misconception signal | 3 |
| Fragility flag | Getting questions right but always with low confidence — knows it but doesn't trust it | true = fragile knowledge |
| Adaptive priority score | How urgently the system thinks this skill needs attention (lower accuracy + declining trend = higher priority) | 0.87 (high urgency) |
| Trend | Whether performance is getting better, worse, or flat (needs 6+ attempts to calculate) | "declining" |
| Baseline score | The accuracy recorded at the end of the diagnostic — the starting point | 0.50 (50% at diagnostic) |
| Growth since baseline | Current accuracy minus baseline accuracy | +0.22 (improved 22 percentage points) |
| Tier change since baseline | Whether the proficiency tier moved up, stayed the same, or dropped | "improved" (was Emerging, now Approaching) |

---

### D. Per-Domain Data (4 domains)

**What this is:** Aggregated performance across each of the 4 exam domains. Domains are the highest-level grouping — each contains 8–13 skills. Domain data gives a bird's-eye view: "How am I doing in Professional Practices overall?"

**Where the user sees it:** Dashboard domain cards (color-coded bars), Progress tab radar chart (4 spokes), Study Guide domain study maps, Score Report after the diagnostic, and the Home tab's "weakest domain" recommendation.

**Why it matters for the UI:** Domain data is the summary view. When you want a quick visual of overall readiness — like 4 colored bars or a radar chart — you're reading domain-level data. It answers "which area of the exam should I focus on?" without requiring the user to parse all 45 skills.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Domain name | The exam content area | "Professional Practices" |
| Total skills in domain | How many of the 45 skills belong here | 13 |
| Skills at Demonstrating | Count of skills with ≥80% accuracy | 5 |
| Skills at Approaching | Count of skills with 60–79% accuracy | 4 |
| Skills at Emerging | Count of skills with <60% accuracy | 3 |
| Skills not started | Count of skills with 0 attempts | 1 |
| Domain accuracy % | Average accuracy across all skills in the domain | 68.5% |
| Domain correct / total | Raw counts | 124 correct / 181 total |
| % Demonstrating proficiency | What fraction of the domain's skills are at Demonstrating | 38.5% (5 of 13) |
| Proficiency tier label | The domain's overall proficiency, same thresholds as skills | "Approaching" |
| Weakest skills in domain | The specific skills dragging this domain down | ["CLD Assessment", "Ecological Assessment"] |
| Baseline domain accuracy | Domain accuracy at the time of diagnostic completion | 52.3% |

---

### E. Aggregate / Global Metrics

**What this is:** The big-picture numbers that summarize the user's entire journey. These are the "headline stats" — total questions answered, overall accuracy, readiness level, streak.

**Where the user sees it:** Home tab summary cards, header streak badge, readiness banner, Progress tab summary row, and the study guide side rail.

**Why it matters for the UI:** These are the numbers that go in hero-sized text on dashboard cards. "You've answered 412 questions." "18 of 32 skills ready." "23 days until your exam." They're the motivational pulse of the app.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Overall accuracy % | Percentage correct across all questions ever answered | 71.3% |
| Total questions seen | Lifetime question count | 412 |
| Total questions correct | Lifetime correct count | 294 |
| Total study time | Cumulative time spent answering questions | 14,820 seconds (~4.1 hours) |
| Skills at Demonstrating count | How many skills have reached ≥80% | 18 |
| Skills at Approaching count | How many skills are at 60–79% | 15 |
| Skills at Emerging count | How many skills are below 60% | 9 |
| Skills not started count | How many skills have never been attempted | 3 |
| Readiness % | Progress toward the 32-skill target (skills at Demonstrating ÷ 32) | 56.3% (18/32) |
| Readiness label | Plain-language readiness level | "Developing" (16–23 skills at Demonstrating) |
| Skills remaining to readiness target | How many more skills need to reach Demonstrating | 14 |
| Days until exam | Countdown from today to planned test date | 73 days |
| Current correct-answer streak | Consecutive correct answers in the current or most recent session | 7 |
| Daily practice streak | Consecutive calendar days with at least 1 question answered | 12 days |

---

### F. Weekly / Time-Bounded Metrics

**What this is:** Performance data scoped to recent time windows — this week, today, and the last 30 days. These show momentum and consistency, not just lifetime totals.

**Where the user sees it:** Home tab "Quick Stats" section, 30-day activity calendar heatmap, daily goal progress indicator, and the study guide's weekly schedule (which accounts for actual usage patterns).

**Why it matters for the UI:** Lifetime stats can feel static once a user has answered hundreds of questions. Weekly/daily metrics show *recency* — "Am I actually studying consistently?" The heatmap and streak counter are motivational tools that reward daily engagement.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Questions this week | Questions answered since Monday | 34 |
| Accuracy this week | Percentage correct this week | 78.2% |
| Study time this week | Total time spent on questions this week | 2,400 seconds (~40 min) |
| Questions today | Questions answered today | 8 |
| Daily goal progress | How close to the daily question target (if set) | 80% (8 of 10) |
| Questions per day (last 30 days) | Array of daily counts for the heatmap calendar | [5, 0, 12, 8, 0, 0, 15, ...] |
| Active days this month | How many days this month the user practiced | 18 of 30 |

---

### G. Confidence Calibration

**What this is:** The relationship between how confident the user *feels* and how accurate they *actually are*. Before submitting every answer, the user rates their confidence (Low / Medium / High). The system compares this self-assessment against actual correctness to detect two important patterns:

1. **Overconfidence** — "I'm sure" + wrong answer = misconception (the user believes something incorrect with conviction)
2. **Underconfidence** — "I'm guessing" + correct answer = fragile knowledge (the user knows it but doesn't trust their knowledge)

**Where the user sees it:** Progress tab confidence calibration bars (raw accuracy vs. weighted accuracy with a delta indicator), and implicitly in the proficiency tiers (which use confidence-weighted accuracy, not raw accuracy, when confidence data exists).

**Why it matters for the UI:** A student with 75% raw accuracy but 62% confidence-weighted accuracy has a misconception problem — they're "sure" about wrong answers. The delta between raw and weighted accuracy is one of the most diagnostic signals in the app. Visualizing this gap helps the user understand *why* their proficiency tier might be lower than their raw percentage suggests.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Raw accuracy | Straight percentage correct (no confidence adjustment) | 75% |
| Confidence-weighted accuracy | Accuracy penalized for high-confidence wrongs, boosted slightly for low-confidence correct | 62% |
| Calibration delta | The gap between raw and weighted (positive = overconfident, negative = underconfident) | +13 points (overconfident) |
| High-confidence wrong count | Times the user said "High" confidence but was wrong | 8 |
| Low-confidence correct count | Times the user said "Low" confidence but was right | 11 |
| Confidence distribution | Breakdown of Low/Medium/High ratings per skill | {Low: 4, Medium: 8, High: 6} for CON-01 |

---

### H. Time Analytics

**What this is:** How long the user takes to answer questions. Time data reveals a different dimension than accuracy — a student might be accurate but extremely slow (needs to build fluency) or fast but inaccurate (rushing without reading carefully).

**Where the user sees it:** Admin dashboard (item analysis timing outliers, student detail drawer time distribution), and potentially on the Progress tab as response time trends. The AI study plan also receives average time data to calibrate session length recommendations.

**Why it matters for the UI:** Time is the hidden signal. Two students both at 70% accuracy can be very different: one answers in 25 seconds (confident, has the knowledge), the other takes 90 seconds (struggling, process of elimination). Time distributions (min/Q1/median/Q3/max) reveal this.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Average time per question (global) | Mean seconds across all answers | 38 seconds |
| Average time per question (per domain) | Mean seconds per domain | Domain 1: 42s, Domain 4: 31s |
| Average time per question (per skill) | Mean seconds per skill | CON-01: 35s, LEG-02: 55s |
| Min / Q1 / Median / Q3 / Max time | Distribution of response times | 8s / 22s / 35s / 52s / 142s |
| Timing outlier flag | Whether the user's avg time is abnormally high (>avg + 2× standard deviation) | true = consistently slow |
| Total session count | How many separate practice sessions the user has started | 24 |
| Average session length | Typical duration of a study session | 18 minutes |

---

### I. Distractor / Error Analytics

**What this is:** When a user picks a wrong answer, the system doesn't just record "wrong" — it records *which* wrong answer they picked. Every wrong-answer choice in the 1,150-question bank is pre-tagged with a specific misconception, error type, and knowledge gap. This data reveals *why* the user is getting things wrong, not just *that* they're getting things wrong.

**Where the user sees it:** The feedback panel after a wrong answer (shows the specific misconception for the distractor they chose), the AI Study Guide (which names dominant misconceptions per skill cluster), and the admin Item Analysis dashboard (distractor frequency analysis across all users).

**Why it matters for the UI:** This is the app's key differentiator. "You got CON-01 wrong" is generic. "You keep confusing consultee-centered consultation with client-centered consultation — the same misconception 3 times" is specific and actionable. Error analytics make this possible.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Global distractor error counts | How many times each wrong-answer choice has been selected (across all users) | {distractor_A: 47, distractor_C: 23} |
| Per-skill distractor errors | Which wrong answers the user keeps selecting for each skill | CON-01: {distractor_A: 3} = picked "client-centered" confusion 3 times |
| Most-selected wrong answer per question | The single most common wrong choice for a given question | "Choice A" (selected by 43% of wrong answerers) |
| Repeated error patterns | Cases where the user picks the same wrong answer 2+ times for a skill | ["CON-01: 'client-centered' confusion ×3"] |
| Misconception categories hit | The types of misconceptions the user has triggered across their history | ["scope-overgeneralization", "definition-confusion", "procedural-swap"] |

---

### J. Redemption System

**What this is:** The quarantine loop for questions the user has struggled with. When a question enters Redemption (after 3 wrong answers or a hint use), it's pulled out of normal practice entirely. The user must earn credits through regular practice (20 answers = 1 credit) and then clear quarantined questions by answering them correctly 3 times in dedicated Redemption Rounds.

**Where the user sees it:** Practice tab Redemption Rounds section (shows bank count, credits, progress to next credit), the quarantine notice when a question enters Redemption, and the Redemption Round session itself (timed, no feedback, no hints).

**Why it matters for the UI:** Redemption data drives several UI elements: the credit counter ("7 more answers until next credit"), the bank badge ("12 questions in quarantine"), the high score display, and the "start round" button state (disabled if no credits). It's a game-within-a-game that adds accountability.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Quarantined question count | How many questions are currently in the Redemption bank | 12 |
| Quarantined question IDs | Which specific questions are quarantined | ["PQ_CON-01_3", "PQ_LEG-02_7", ...] |
| Per-question wrong count | How many total wrong answers triggered quarantine for each question | 3 (entered at threshold) or 2 (entered via hint) |
| Per-question correct count in redemption | How many times the user has answered this question correctly inside Redemption Rounds | 1 of 3 needed to clear |
| Per-question entry reason | Why the question was quarantined | "miss_threshold" (3 wrongs) or "hint" (used a hint) |
| Redemption credits available | How many full Redemption Rounds the user can start | 2 credits |
| Practice answers since last credit | Counter toward the next credit (resets at 20) | 14 (6 more to next credit) |
| Answers needed for next credit | 20 minus the counter | 6 |
| Redemption high score % | Personal best score across all Redemption Round sessions | 83% |
| Total redeemed questions | Questions that have been cleared (3 correct in Redemption) and returned to normal practice | 7 |
| Redemption session history | Log of past Redemption Rounds with scores and dates | [{date, attempted: 12, correct: 10, score: 83%}] |

---

### K. SRS (Spaced Repetition System)

**What this is:** A Leitner box algorithm that schedules review for each of the 45 skills. Skills the user has practiced are placed in one of 5 boxes. Box 1 = review every day, Box 5 = review every 30 days. Getting a question right moves the skill up a box (longer interval); getting it wrong drops it back to Box 1.

**Where the user sees it:** Home tab SRS overdue row ("3 skills overdue for review — start now"), and potentially the Practice tab or Progress tab showing the box distribution visualization.

**Why it matters for the UI:** SRS data creates urgency — "You haven't reviewed FERPA in 12 days and it's overdue." It also shows progress: moving skills from Box 1 (fragile) to Box 5 (solidly retained) is a visible journey. The box distribution (how many skills in each box) is a powerful summary widget.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Skills overdue for review | Skills whose next review date has passed | ["LEG-01", "MBH-03", "SAF-01"] |
| Overdue count | How many skills need review right now | 3 |
| Next review dates per skill | When each skill is next scheduled for review | {CON-01: "2026-04-08", DBD-03: "2026-04-15"} |
| SRS box distribution | How many skills are in each of the 5 retention boxes | {Box1: 5, Box2: 12, Box3: 15, Box4: 8, Box5: 5} |

---

### L. Spicy Mode (Feeling Spicy)

**What this is:** State for the random question preview (pre-diagnostic) and the 45-skill recalibration cycle (post-diagnostic). Tracks where the user is in their randomized skill rotation.

**Where the user sees it:** Pre-assessment gateway (session stats: questions answered, accuracy, skills seen), and post-diagnostic on the Practice tab as the Feeling Spicy mode card.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Cycle skill order | The shuffled order of all 45 skills for the current cycle | ["DBD-07", "LEG-01", "ACA-04", ...] |
| Current position in cycle | Which skill in the shuffled order is next | 23 (of 45) |
| Cycles completed | How many full 45-skill rotations the user has finished | 2 |

---

### M. Leaderboard

**What this is:** A competitive ranking system showing how the current user compares to other users on the platform. Three ranking modes, each measuring a different dimension of engagement. Uses real user data, anonymized to initials.

**Where the user sees it:** Header trophy icon → click opens a popover with 3 leaderboard tabs. Current user is highlighted with indigo styling and a "You" badge. If outside the top 12, the user's actual rank is appended at the bottom.

**Why it matters for the UI:** Social motivation. Seeing "You're #7 in Questions Answered" or "3 more skills to pass V.R." creates competitive drive. The 3 modes reward different behaviors — volume (questions), consistency (time), and mastery (skills).

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Top 12 by questions answered | Users ranked by total lifetime questions | [{initials: "V.R.", count: 412}, ...] |
| Top 12 by engagement time | Users ranked by total time spent (minutes) | [{initials: "J.M.", minutes: 340}, ...] |
| Top 12 by skills to mastery | Users ranked by fewest skills remaining to reach 32/45 target | [{initials: "V.R.", remaining: 14}, ...] |
| Current user rank | Where the logged-in user places in each mode | #7 in Questions, #4 in Time, #12 in Skills |
| User initials | Anonymized identity (from display name or email) | "V.R." (Veronica Rivera) |

---

### N. Study Plan (AI-Generated)

**What this is:** The output of the AI study guide generator. A comprehensive, personalized study document with 9 sections, generated by Claude from the user's complete skill profile. Rate-limited to 1 generation per 7 days.

**Where the user sees it:** Study Guide tab — 6 visible tabs (Overview, Priorities, Domains, Concepts, Weekly Plan, Milestones) plus a permanent side rail. The plan is viewable anytime after generation and can be printed.

**Why it matters for the UI:** The study plan is the app's core differentiator — the reason users come back. Every field in this category is a piece of the generated plan that could be surfaced, quoted, or visualized elsewhere in the app (e.g., "Your study guide says FERPA is your #1 priority" on the Home tab).

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Readiness snapshot | Overall readiness level and skill distribution at time of generation | {level: "Developing", demonstrating: 18, approaching: 15, emerging: 9} |
| Data interpretation narrative | Plain-language summary of what the data reveals about the user | "Your strongest area is Assessment, but you have a persistent pattern of confusing..." |
| Priority clusters | Skills grouped by urgency (P1=urgent, P2=important, P3=reinforce) | P1: [CON-01, LEG-02, DBD-07], P2: [...] |
| Domain study maps | Per-domain tactical guidance based on the user's specific weaknesses | "In Domain 4, focus on distinguishing FERPA from IDEA jurisdiction..." |
| Key vocabulary | Terms the user needs to lock down based on error patterns | ["consultee-centered", "procedural safeguards", "manifestation determination"] |
| Case patterns | Scenario archetypes to practice based on common error clusters | ["Consultation model discrimination", "Eligibility boundary cases"] |
| Weekly study plan | Day-by-day schedule with session types and durations | [{day: "Monday", sessions: [{type: "Concept Review", duration: 25, skills: ["CON-01"]}]}] |
| Tactical instructions | Specific study moves (e.g., "Do wrong-answer review before new questions") | "Start each session with a 5-minute review of yesterday's missed questions..." |
| Checkpoint logic | When to re-assess and what to expect at each milestone | "After 2 weeks: expect 3-5 skills to move from Emerging to Approaching" |
| Plan generation date | When this plan was created | "2026-03-28" |
| Study constraints | User's available time that shaped the schedule | {daysPerWeek: 4, minutesPerSession: 30, intensity: "moderate"} |
| Rate limit status | Whether the user can generate a new plan | true = can generate (7+ days since last) |

---

### O. Glossary / Vocabulary

**What this is:** A personal vocabulary bank populated automatically when the user answers practice questions incorrectly. Each wrong answer adds the associated skill's vocabulary terms to the user's glossary. The student writes their own definition first, then can reveal the official definition to compare.

**Where the user sees it:** Glossary tab — two sub-tabs: "My Terms" (the vocabulary list with write/reveal interaction) and "Quiz Mode" (multiple-choice vocab quiz). Stats chips at the top show counts.

**Why it matters for the UI:** The glossary is a study tool that rewards engagement with wrong answers — getting questions wrong isn't just failure, it builds your vocabulary bank. The define-then-reveal mechanic forces active recall before passive review. Term counts and quiz scores are displayable as progress indicators.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Term name | The vocabulary word | "consultee-centered consultation" |
| User definition | What the student wrote in their own words | "When the consultant helps the teacher improve their own skills" |
| Official definition | The expert definition from the 396-term master glossary | "A consultation model where the primary goal is to improve the consultee's..." |
| Status | Where the term is in the study flow | "defined" (user wrote definition, hasn't revealed official yet) |
| Associated skill ID | Which skill this term belongs to | "CON-01" |
| Total terms | How many terms are in the user's glossary | 47 |
| Terms to define | Terms added but the user hasn't written a definition yet | 12 |
| Terms defined | Terms where the user has written their own definition | 23 |
| Terms revealed | Terms where the user has seen the official definition | 12 |
| Vocab quiz best score | Highest score across all vocabulary quiz sessions | 85% |

---

### P. AI Tutor

**What this is:** Conversation data from the AI Tutor (PraxisBot). Each user can have multiple sessions, each containing a thread of messages, generated artifacts, and quiz interactions.

**Where the user sees it:** AI Tutor tab — session sidebar (list of past conversations), chat area (message thread with PraxisBot), and inline artifact cards (vocabulary lists, concept summaries generated during conversation).

**Why it matters for the UI:** Tutor data shows engagement depth — how many sessions, how many messages, what topics were discussed. Intent badges (auto-tagged from message content) reveal what the user is asking about most. Session count and artifact count are displayable metrics.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Session list | All tutor conversations for this user | [{id, title: "FERPA Questions", created: "2026-04-01"}] |
| Session title | Auto-generated or user-named conversation title | "Understanding Consultation Models" |
| Message count | How many messages in a session (user + bot) | 14 |
| Session mode | Whether the session is in chat or quiz mode | "quiz" |
| Conversation messages | The full message thread | [{role: "user", text: "Explain the difference between..."}, {role: "bot", text: "..."}] |
| Artifacts generated | Content cards created during conversation (vocab lists, summaries) | [{type: "vocabulary_list", title: "Consultation Terms", content: "..."}] |
| Intent badges | Auto-detected topics from user messages | ["consultation", "ethics", "assessment"] |
| Suggested follow-up chips | AI-generated next-question suggestions shown after each bot response | ["What about behavioral consultation?", "Quiz me on this"] |

---

### Q. Notebook

**What this is:** A personal learning journal where users write notes during or after study sessions. Notes can be created manually or auto-generated from practice sessions. Each note is tagged to specific skills and domains for later retrieval.

**Where the user sees it:** Notebook tab — search bar, "New Note" button, and a list of note cards with skill tags, timestamps, and preview text.

**Why it matters for the UI:** The notebook is the user's exam-day review tool. Note count and tag distribution show which topics the user has been actively reflecting on. Could surface as "You have 3 notes on FERPA" on the Learning Path module page.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Note entries | All notes for this user | [{id, title, body, tags, timestamp}] |
| Note title | User-written title | "Key differences: 504 vs IDEA" |
| Note body | Note content (free text) | "Section 504 is broader — covers any disability that limits..." |
| Note tags | Skill and domain tags | ["LEG-02", "LEG-03", "Domain 4"] |
| Note timestamp | When the note was created or last edited | "2026-04-02T14:30:00Z" |
| Associated practice session | Which practice session triggered this note (if auto-created) | "session_abc123" |

---

### R. Social Proof (Header)

**What this is:** A simulated "users online" indicator in the app header. Not real data — it's a client-side animation that seeds from an hour-based lookup table and drifts ±1-2 every 90-150 seconds. Creates the feeling of a live community.

**Where the user sees it:** Header pill with green pulsing dot and count (e.g., "5 online"). Goes grey with no pulse at 2-3am when the simulated count is 0.

**Why it matters for the UI:** Social proof motivates continued use — "other people are studying right now too." It's a small but effective retention mechanic. Note: this is internal only, not real data, and should never be described as real user counts in public documentation.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| Users online count | Current simulated count based on hour + random drift | 5 |
| Online drift | How far the count has drifted from the hour-seeded baseline | +2 |

---

### S. Learning Path

**What this is:** The structured learning journey through all 45 skills, ordered from weakest to strongest. Each skill is a node on a visual winding road map. Clicking a node opens a full-screen micro-lesson with 3 sections (Lesson → Practice Quiz → Extend).

**Where the user sees it:** Learning Path tab in the Practice section — a visual S-curve node map with colored nodes (red=Emerging, amber=Approaching, green=Demonstrating, grey=Not Started). Each node shows skill name, accuracy %, and status badge.

**Why it matters for the UI:** The Learning Path is the guided experience — unlike Practice (which is user-directed), the Learning Path tells the user *what to study and in what order*. Node ordering, status, and completion data drive the visual state of the path.

| Field | What It Stores | Example Value |
|-------|---------------|---------------|
| All 45 skills as nodes | The complete skill list rendered as a node map | [{skillId: "CON-01", accuracy: 0.72, status: "approaching"}, ...] |
| Node status | Current proficiency for this skill (determines node color) | "emerging" (red node) |
| Node ordering | Position in the path — sorted by prerequisite depth + deficit (weakest first) | Position 3 of 45 |
| Current module | The next incomplete skill in the path | "DBD-07" (FBA) |
| Module visit sessions | Log of every time the user opened this skill's lesson | [{date: "2026-04-01", timeSpent: 420s}] |
| Section interactions | Per-section engagement data (lesson time, quiz scores, exercise completion) | {lesson: {viewed: true, time: 300s}, quiz: {score: 80%, questions: 5}} |
| Per-module elapsed time | Total time spent on this skill's lesson content | 720 seconds (12 min) |
| Section completion flags | Which of the 3 sections the user has finished | {lesson: true, quiz: true, extend: false} |
| Module visit sessions | module_visit_sessions | array |
| Section interactions (lesson/quiz) | section_interactions | array |
| Per-module elapsed time | learning_path_progress | seconds |
| Section completion flags | learning_path_progress | booleans |

### Per-Question Data (1,150 questions)
| Data Point | Source | Type |
|-----------|--------|------|
| Question ID | static | string |
| Question text + answer choices | questions.json | object |
| Skill ID | static | string |
| Domain IDs | static | string[] |
| Correct answer | static | string |
| Distractor metadata (misconception IDs) | static | object |
| Explanation text | static | string |
| Cognitive complexity (Recall/Application) | static | enum |
| Retirement status (2+ correct) | computed per user | boolean |
| p-value (proportion correct, global) | item analysis | float |
| Discrimination index (global) | item analysis | float |
| Distractor frequency (global) | item analysis | object |
| Timing outlier flag (global) | item analysis | boolean |
| Flag: Too Easy / Too Hard / Low Discrimination | item analysis | enum[] |

---

## 3. DOMAIN → SKILL → QUESTION HIERARCHY

### Overview
```
4 Domains → 45 Skills → 1,150 Scenario-Based Questions
     ↓           ↓              ↓
  ETS content  Testable      Backward-designed from
  categories   competencies  skill objectives, with
               mapped to     distractor analysis and
               NASP domains  misconception taxonomy
```

### Domain 1: Professional Practices (13 skills, ~335 questions)
*Assessment, consultation, and data-based decision making*

| Skill ID | Skill Name | Questions | Knowledge Type |
|----------|-----------|-----------|----------------|
| CON-01 | Consultation Models and Methods | 34 | Procedure |
| DBD-01 | RIOT Framework and Multi-Method Information Gathering | 32 | Procedure |
| DBD-03 | Cognitive and Intellectual Assessment | 33 | Application |
| DBD-05 | Diagnostic and Processing Measures | 23 | Application |
| DBD-06 | Emotional and Behavioral Assessment Instruments | 27 | Application |
| DBD-07 | Functional Behavioral Assessment | 26 | Procedure |
| DBD-08 | Curriculum-Based Measurement and Progress Monitoring | 24 | Application |
| DBD-09 | Ecological Assessment and Contextual Factors | 22 | Concept-Relationship |
| DBD-10 | Background Information and Records Review | 20 | Procedure |
| PSY-01 | Test Scores, Norms, and Interpretation | 22 | Concept-Relationship |
| PSY-02 | Reliability and Validity Principles | 24 | Concept-Relationship |
| PSY-03 | Problem-Solving Framework and MTSS in Assessment | 26 | Procedure |
| PSY-04 | Assessment of Culturally and Linguistically Diverse Students | 22 | Application |

**What this domain covers:** How school psychologists gather, interpret, and communicate assessment data. Includes selecting and administering cognitive, academic, behavioral, and processing instruments; interpreting standard scores, percentiles, and confidence intervals; conducting FBAs and progress monitoring; and adapting assessment practices for culturally and linguistically diverse students. Questions are scenario-based — e.g., "A student's FSIQ is 75. A team member asks about alternate assessment. As the school psychologist, how do you respond?"

### Domain 2: Student-Level Services (12 skills, ~289 questions)
*Academic, developmental, and mental health supports*

| Skill ID | Skill Name | Questions | Knowledge Type |
|----------|-----------|-----------|----------------|
| ACA-02 | Curricular Accommodations and Modifications | 23 | Application |
| ACA-03 | Self-Regulated Learning, Metacognition, and Study Skills | 23 | Concept-Relationship |
| ACA-04 | Instructional Strategies and Effective Pedagogy | 26 | Application |
| ACA-06 | Learning Theories and Cognitive Development | 28 | Concept-Relationship |
| ACA-07 | Language Development and Literacy | 24 | Concept-Relationship |
| ACA-08 | Cognitive Processes and Executive Functioning | 28 | Concept-Relationship |
| ACA-09 | Health Conditions and Educational Impact | 20 | Application |
| DEV-01 | Child and Adolescent Development (Erikson, Piaget, Milestones) | 23 | Definition |
| MBH-02 | Individual and Group Counseling Interventions | 24 | Application |
| MBH-03 | Theoretical Models of Intervention (CBT, ABA, Solution-Focused) | 38 | Concept-Relationship |
| MBH-04 | Child and Adolescent Psychopathology | 24 | Application |
| MBH-05 | Biological Bases of Behavior and Mental Health | 26 | Concept-Relationship |

**What this domain covers:** Direct services to individual students — academic interventions, counseling, mental health supports, and developmental knowledge. Includes understanding learning theories (Piaget, Vygotsky, Bronfenbrenner), evidence-based interventions (CBT, ABA, solution-focused therapy), developmental milestones, psychopathology recognition, and how health conditions impact learning. Questions test application in real school scenarios — e.g., "A teacher reports a 3rd grader can decode but can't comprehend grade-level text. What targeted intervention approach is most appropriate?"

### Domain 3: Systems-Level Services (8 skills, ~209 questions)
*Family, schoolwide, and systems practice*

| Skill ID | Skill Name | Questions | Knowledge Type |
|----------|-----------|-----------|----------------|
| FAM-02 | Family Involvement and Advocacy | 22 | Application |
| FAM-03 | Interagency Collaboration | 20 | Procedure |
| SAF-01 | Schoolwide Prevention Practices (PBIS, Bullying, School Climate) | 29 | Concept-Relationship |
| SAF-03 | Crisis and Threat Assessment | 32 | Procedure |
| SAF-04 | Crisis Prevention, Intervention, Response, and Recovery | 27 | Procedure |
| SWP-02 | Educational Policy and Practice (Retention, Promotion, Tracking) | 23 | Concept-Relationship |
| SWP-03 | Evidence-Based Schoolwide Practices | 24 | Application |
| SWP-04 | Multi-Tiered Systems of Support (MTSS) at Systems Level | 32 | Concept-Relationship |

**What this domain covers:** How school psychologists operate at the building and district level — MTSS/PBIS implementation, crisis response protocols, threat assessment, family-school collaboration, interagency coordination, and school policy. Questions test systemic thinking — e.g., "Your school's ODR data shows a 40% spike in lunch-period referrals. Using a PBIS framework, what is your recommended first step?"

### Domain 4: Foundations of School Psychology (12 skills, ~317 questions)
*Ethics, law, diversity, and research*

| Skill ID | Skill Name | Questions | Knowledge Type |
|----------|-----------|-----------|----------------|
| DIV-01 | Cultural and Individual Factors in Intervention Design | 20 | Application |
| DIV-03 | Implicit and Explicit Bias in Decision Making | 21 | Concept-Relationship |
| DIV-05 | Special Education Services and Diverse Needs | 20 | Application |
| ETH-01 | NASP Ethics and Ethical Problem-Solving | 33 | Procedure |
| ETH-02 | Professional Liability and Supervision | 25 | Application |
| ETH-03 | Advocacy, Lifelong Learning, and Professional Growth | 23 | Concept-Relationship |
| LEG-01 | FERPA and Educational Records Confidentiality | 27 | Definition |
| LEG-02 | IDEA and Special Education Law | 37 | Application |
| LEG-03 | Section 504 and ADA Protections | 22 | Concept-Relationship |
| LEG-04 | Case Law and Student Rights | 24 | Definition |
| RES-02 | Applying Research to Practice | 23 | Application |
| RES-03 | Research Designs and Basic Statistics | 24 | Concept-Relationship |

**What this domain covers:** The legal, ethical, and research foundations of practice. Includes NASP ethical standards, FERPA, IDEA, Section 504, ADA, landmark case law (Tarasoff, Larry P. v. Riles, Board of Ed. v. Rowley), implicit bias, cultural responsiveness, research design, and evidence-based practice. Questions test decision-making under legal and ethical constraints — e.g., "A parent requests their child's complete educational record including the school psychologist's personal case notes. Under FERPA, what is the correct response?"

### Knowledge Type Distribution
| Type | Count | Description |
|------|-------|-------------|
| Application | 21 skills | Practical problem-solving in realistic school scenarios |
| Concept-Relationship | 13 skills | Understanding connections between theories, models, and outcomes |
| Procedure | 7 skills | Step-by-step processes (FBA, consultation, crisis response) |
| Definition | 4 skills | Foundational terminology and legal definitions |

### Content Cluster Map (11 clusters)
```
psychometrics-and-assessment ──── DBD-03, DBD-05, PSY-01, PSY-02
data-based-decision-making ────── DBD-01, DBD-08, DBD-09, DBD-10, PSY-03
consultation-and-collaboration ── CON-01, FAM-03
academic-intervention ──────────── ACA-02, ACA-03, ACA-04, ACA-06, ACA-07, ACA-08, ACA-09
behavior-and-mental-health ────── DBD-06, DBD-07, MBH-02, MBH-03, MBH-04, MBH-05
school-systems ─────────────────── SAF-01, SWP-02, SWP-03, SWP-04
crisis-and-safety ──────────────── SAF-03, SAF-04
diversity-and-equity ───────────── DIV-01, DIV-03, DIV-05, PSY-04
family-systems ─────────────────── FAM-02
legal-and-ethics ───────────────── ETH-01, ETH-02, ETH-03, LEG-01, LEG-02, LEG-03, LEG-04
research-and-evaluation ────────── RES-02, RES-03, DEV-01
```

### Referenced Laws, Standards, and Frameworks
- **Federal law:** IDEA, Section 504, ADA, FERPA, ESSA, CAPTA
- **Case law:** Tarasoff v. Regents, Larry P. v. Riles, Board of Education v. Rowley, Diana v. State Board of Education
- **Standards:** NASP Practice Model, NASP Ethical Standards, DSM-5, What Works Clearinghouse
- **Frameworks:** MTSS, RTI, PBIS, Bronfenbrenner's ecological model, Caplan's consultation models

---

## 4. PROFICIENCY TIERS & THRESHOLDS

| Tier | Threshold | Internal Label | Color |
|------|-----------|----------------|-------|
| **Demonstrating** | >= 80% | mastered | Green |
| **Approaching** | 60-79% | near_mastery | Amber |
| **Emerging** | < 60% | misconception/developing/unstable | Red |
| **Not Started** | 0 attempts | unlearned | Gray |

### Readiness Levels
| Level | Rule |
|-------|------|
| **Ready** | >= 32 skills at Demonstrating |
| **Approaching** | 24-31 skills at Demonstrating |
| **Developing** | 16-23 skills at Demonstrating |
| **Early** | < 16 skills at Demonstrating |

---

## 5. FEATURE GATES (what unlocks when)

| Feature | Requires |
|---------|----------|
| Domain Practice | Screener or diagnostic complete |
| Skill Practice | Full assessment or adaptive diagnostic complete |
| Learning Path | Full assessment or adaptive diagnostic complete |
| Study Guide | Screener + full/adaptive diagnostic complete |
| AI Tutor | Adaptive diagnostic complete |
| Redemption Rounds | >= 1 credit (earned via 20 non-hint practice answers) |
| Glossary terms | Wrong answers in practice (auto-populated) |
| Leaderboard | Authenticated (any user) |
| Vocabulary Quiz | >= 1 glossary term exists |
| Fluency Drill | Not yet implemented |

---

## 6. INTERACTION PATTERNS

### During Practice
- Select answer (single or multi-select depending on question)
- Set confidence (Low / Medium / High) before submitting
- Submit answer -> see feedback panel (explanation + distractor notes)
- Request hint (opens SkillHelpDrawer) -> question tagged as "hint used"
- Skip / Next question
- View correct answer streak messages (2+, 5+, 10+ tiers)
- See domain warning banner (3 consecutive wrongs on same skill)
- Auto-logout after 15 min inactivity

### During Redemption
- 90-second countdown per question
- No feedback shown
- No hints available
- Single-answer only
- Timeout = incorrect
- Must answer each question correctly 3x to clear

### During Assessment
- No feedback shown (answers hidden)
- Can pause and resume
- Adaptive: wrong answers generate follow-up questions (max 3 per skill)
- Progress bar shows completion
- Pacing indicator (on track / ahead / behind)

### Glossary Interactions
- Write your own definition (textarea, auto-saves)
- Reveal official definition (permanent, can't un-reveal)
- Filter by status (All / To Define / Defined / Revealed)
- Search by term name
- Launch quiz mode from glossary

### AI Tutor Interactions
- Free text input
- Click suggested follow-up chips
- Toggle Chat / Quiz mode
- Switch between sessions in sidebar
- Create new session
- View inline artifact cards (generated content)

---

## 7. DESIGN SYSTEM (current mockup)

| Token | Value |
|-------|-------|
| Brand primary | Indigo #4f46e5 (brand-600) |
| Brand range | brand-50 (#eef2ff) through brand-900 (#312e81) |
| Card radius | rounded-2xl (16px) |
| Card border | 1px solid slate-200 |
| Section headers | Uppercase, tracking-wider, text-xs, text-slate-400 |
| Body font | System stack (-apple-system, etc.) |
| Sidebar width | 224px (w-56) |
| Main content max-width | 7xl (1280px) |
| Proficiency colors | Green (Demonstrating), Amber (Approaching), Red (Emerging), Gray (Not Started) |
| Urgency colors | Red (High), Amber (Medium), Orange (Moderate) |

---

## 8. VISUALIZATION IDEAS (from audit)

| Visualization | Data it would show | Where it could live |
|--------------|-------------------|-------------------|
| **Radar/spider chart** | 4 domains, current vs baseline | Progress tab |
| **Skill heatmap** (45 cells) | Per-skill accuracy, color-coded | Progress tab |
| **30-day activity calendar** | Questions per day, GitHub-style | Home tab |
| **Confidence calibration bars** | Raw vs weighted accuracy + delta | Progress tab |
| **Growth waterfall** | Tier changes since baseline | Progress tab |
| **SRS box distribution** | Skills in each Leitner box 1-5 | Progress or Practice tab |
| **Domain stacked bars** | Skills by tier per domain | Progress tab |
| **Time-per-question histogram** | Distribution of response times | Progress tab |
| **Streak calendar** | Practice days highlighted | Home tab |
| **Readiness progress ring** | Circular progress to 32-skill target | Home tab |

---

## 9. HERO PAGE — CONTENT & MARKETING REFERENCE

### The Story (for marketing copy)

Over 50 hours of deep analysis went into deconstructing the four content categories of the Praxis School Psychology (5403) examination. We studied ETS's published test framework — every domain, every subcategory, every sample question — and identified **45 discrete, testable skills** that span the full scope of what the exam measures.

Using backward design and psychometric principles, we then built **1,150 scenario-based practice questions** — each one mapped to a specific skill, tagged with distractor analysis, misconception taxonomy, and cognitive complexity ratings. This isn't a collection of flashcards or recalled test items. Every question was engineered from the skill objective backward: what does a school psychologist need to demonstrate? What does a wrong answer reveal about what they misunderstand?

The result is **the largest structured question bank for the Praxis 5403** — mathematically validated, adaptively delivered, and granular enough to tell you not just *what* you got wrong, but *why* you got it wrong and *which misconception* led you there.

### What Makes This Different (adaptive practice positioning)

Most test prep is static: a bank of questions, maybe sorted by topic, maybe with answer explanations. Praxis Makes Perfect is built differently:

1. **Adaptive engine** — The diagnostic adapts in real-time. Get a question right? The engine moves on. Get it wrong? It drills deeper with up to 3 follow-up questions on that skill, each targeting a different angle of the same competency. The system finds your exact boundaries.

2. **Skill-level precision** — Not "you're weak in Domain 2." Instead: "You're confusing consultee-centered consultation with client-centered consultation (CON-01), and your FBA trigger identification is inconsistent when the antecedent is social rather than academic (DBD-07)." That level of specificity.

3. **Distractor intelligence** — Every wrong answer choice is mapped to a specific misconception. When you pick distractor C, the system knows you confused behavioral consultation with consultee-centered consultation. It tracks these error patterns across your entire history and feeds them to the AI study plan generator.

4. **Spaced repetition + quarantine** — Questions you hint on or miss repeatedly get quarantined into a Redemption bank. They don't appear in normal practice — you have to earn credits and clear them in dedicated rounds. Skills you've mastered get spaced out via a 5-box Leitner SRS system. The practice adapts to what you need, when you need it.

5. **AI-powered synthesis** — After the diagnostic, Claude (the same AI powering this platform) analyzes your complete skill profile and generates a personalized study plan with priority clusters, weekly schedules, tactical instructions, and checkpoint logic. It knows which of the 11 content clusters to prioritize and why.

### Hero Page Visual: The Depth Breakdown

This visual should communicate the hierarchy from domains down to individual question types. Suggested format: an expandable tree or layered infographic.

```
PRAXIS 5403 — School Psychology
├── Domain 1: Professional Practices (13 skills, 335 questions)
│   ├── Assessment Methods
│   │   ├── Cognitive & Intellectual Assessment (DBD-03: 33 questions)
│   │   │   └── Example: IQ interpretation, FSIQ vs. index scores,
│   │   │       when to recommend alternate assessment, confidence
│   │   │       intervals, score classification systems
│   │   ├── Diagnostic & Processing Measures (DBD-05: 23 questions)
│   │   ├── Emotional & Behavioral Assessment (DBD-06: 27 questions)
│   │   └── CLD Assessment (PSY-04: 22 questions)
│   ├── Data-Based Decision Making
│   │   ├── RIOT Framework (DBD-01: 32 questions)
│   │   ├── Progress Monitoring / CBM (DBD-08: 24 questions)
│   │   ├── Ecological Assessment (DBD-09: 22 questions)
│   │   └── Records Review (DBD-10: 20 questions)
│   ├── Consultation
│   │   └── Consultation Models (CON-01: 34 questions)
│   │       └── Example: Caplan's 4 types — consultee-centered vs
│   │           client-centered vs behavioral vs program-centered.
│   │           Scenario: "A teacher lacks objectivity about a
│   │           student. The primary goal is..."
│   └── Psychometrics
│       ├── Score Interpretation (PSY-01: 22 questions)
│       ├── Reliability & Validity (PSY-02: 24 questions)
│       ├── MTSS in Assessment (PSY-03: 26 questions)
│       └── FBA (DBD-07: 26 questions)
│
├── Domain 2: Student-Level Services (12 skills, 289 questions)
│   ├── Academic Interventions
│   │   ├── Accommodations & Modifications (ACA-02: 23 questions)
│   │   ├── Instructional Strategies (ACA-04: 26 questions)
│   │   ├── Language & Literacy (ACA-07: 24 questions)
│   │   └── Study Skills & Metacognition (ACA-03: 23 questions)
│   ├── Developmental Foundations
│   │   ├── Learning Theories (ACA-06: 28 questions)
│   │   ├── Child Development (DEV-01: 23 questions)
│   │   ├── Executive Function (ACA-08: 28 questions)
│   │   └── Health Conditions (ACA-09: 20 questions)
│   └── Mental & Behavioral Health
│       ├── Counseling Interventions (MBH-02: 24 questions)
│       ├── Intervention Models — CBT, ABA, SFT (MBH-03: 38 questions)
│       ├── Psychopathology (MBH-04: 24 questions)
│       └── Biological Bases (MBH-05: 26 questions)
│
├── Domain 3: Systems-Level Services (8 skills, 209 questions)
│   ├── Schoolwide Systems
│   │   ├── PBIS & Prevention (SAF-01: 29 questions)
│   │   ├── MTSS at Systems Level (SWP-04: 32 questions)
│   │   ├── Evidence-Based Practices (SWP-03: 24 questions)
│   │   └── Educational Policy (SWP-02: 23 questions)
│   ├── Crisis & Safety
│   │   ├── Threat Assessment (SAF-03: 32 questions)
│   │   └── Crisis Response (SAF-04: 27 questions)
│   └── Family & Community
│       ├── Family Involvement (FAM-02: 22 questions)
│       └── Interagency Collaboration (FAM-03: 20 questions)
│
└── Domain 4: Foundations (12 skills, 317 questions)
    ├── Legal Framework
    │   ├── IDEA (LEG-02: 37 questions)
    │   ├── FERPA (LEG-01: 27 questions)
    │   ├── Section 504 & ADA (LEG-03: 22 questions)
    │   └── Case Law (LEG-04: 24 questions)
    │       └── Example: Tarasoff, Larry P., Rowley —
    │           "A parent requests the psychologist's personal
    │           case notes under FERPA. What is required?"
    ├── Ethics & Professional Practice
    │   ├── NASP Ethics (ETH-01: 33 questions)
    │   ├── Liability & Supervision (ETH-02: 25 questions)
    │   └── Advocacy & Growth (ETH-03: 23 questions)
    ├── Diversity & Equity
    │   ├── Cultural Factors (DIV-01: 20 questions)
    │   ├── Implicit Bias (DIV-03: 21 questions)
    │   └── Diverse Needs & Special Ed (DIV-05: 20 questions)
    └── Research
        ├── Research to Practice (RES-02: 23 questions)
        └── Research Design & Statistics (RES-03: 24 questions)
```

### Suggested Hero Stats Bar
| Stat | Value | Subtext |
|------|-------|---------|
| Questions | 1,150+ | Scenario-based, backward-designed |
| Skills Tracked | 45 | Mapped to ETS content specifications |
| Domains | 4 | Full exam coverage |
| Adaptive Engine | Yes | Finds your exact skill boundaries |
| AI Study Plans | Personalized | Generated from your diagnostic profile |
| Question Types | 4 | Definition, Procedure, Concept-Relationship, Application |

### Suggested Hero Proof Points
- "Built from 50+ hours of ETS test framework analysis"
- "1,150 questions mapped to 45 testable skills across all 4 exam domains"
- "Every wrong answer traced to a specific misconception"
- "Adaptive engine that finds your exact skill boundaries — not just 'weak in Domain 2'"
- "AI-generated study plans that know which of your 11 skill clusters to prioritize"
- "The only Praxis 5403 prep tool with distractor-level intelligence"
