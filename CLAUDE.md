# Praxis Makes Perfect — Developer Notes for Claude

This file captures hard-won context so Claude doesn't have to rediscover it.

---

## UI Redesign Workflow — Mandatory Mockup-First Rule

**When redesigning any UI screen or section, you MUST follow this sequence. No exceptions.**

1. **Build a standalone HTML mockup** (Tailwind CDN, no build step) in `public/` so Vite serves it as a static file
2. **Get it rendering in the preview panel** — confirm you can see it at `http://localhost:5173/mockup-*.html`
3. **Walk through every screen** with the user — screenshot each state, get explicit approval
4. **Only after visual approval**, start modifying React components

**Why this rule exists:** In April 2026, Claude repeatedly jumped from mockup creation straight to React refactoring (migrations, new components, App.tsx surgery) before the user had verified the mockup rendered correctly. The user couldn't see any visual change because:
- The Netlify SPA redirect swallowed mockup URLs
- React changes required authentication to verify
- The loop repeated across multiple turns, wasting time and creating confusion

**Key constraints:**
- The mockup must be viewable WITHOUT authentication (static HTML, not behind Supabase auth)
- Each screen must be visually confirmed before its React counterpart is touched
- Do NOT modify `LoginScreen.tsx`, `App.tsx`, or other live components based on an unverified mockup
- When the user says "I want to use this setup" they mean "implement the visual I can see," not "start backend work"

---

## HOW_THE_APP_WORKS.md — Mandatory Update Rule

`docs/HOW_THE_APP_WORKS.md` is the canonical plain-language description of the product.

**Any time you make a code change that affects any of the following, you MUST update `docs/HOW_THE_APP_WORKS.md` in the same change:**

- Number of domains or skills
- Screener or full assessment question counts
- Skill status label names or thresholds (unlearned / misconception / unstable / developing / near_mastery / mastered)
- User-facing proficiency level names or thresholds (Emerging / Approaching / Demonstrating)
- Readiness level names or definitions (Early / Developing / Approaching / Ready)
- Readiness target percentage or skill count
- Study guide unlock conditions
- Study guide rate limit
- Study guide section names, tab layout, or side rail content
- Practice mode unlock conditions (Domain Review, Skill Review)
- Question retirement behavior
- Any stat or copy shown on the login/marketing page

Do not treat this as optional. The document exists to keep marketing, onboarding, and how-to materials accurate. Stale information in it creates user-facing confusion.

---

## Local Development

### Running the App Locally

**DO NOT use `npm run dev` / `vite` alone** if you need study guide generation to work.
The study plan API runs as a Netlify Background Function and is not available under raw Vite.

**Use instead:**
```bash
npm run dev:netlify
# or equivalently:
netlify dev
```

This starts both the Vite dev server (port 5173) and the Netlify function runtime, proxying everything through port **8888**.
Open **http://localhost:8888** — not 5173 — when using `netlify dev`.

The background function is at `api/study-plan-background.ts`. Netlify loads it in Lambda compatibility mode. The app calls it at `/api/study-plan-background` (rewritten by `netlify.toml`) or falls back to `/.netlify/functions/study-plan-background`.

### Admin Dashboard — API Endpoints

All admin API endpoints live in `api/`. They require a valid admin session JWT (`Authorization: Bearer <token>`) and verify the caller via `isAdminEmail` in `src/config/admin.ts`.

| Endpoint | Method | Requires Service Role | Purpose |
|---|---|---|---|
| `GET /api/admin-list-users` | GET | ✅ | All `user_progress` rows + per-user avg time from `responses` |
| `POST /api/admin-reset-assessment` | POST | ✅ | Archive + delete screener or diagnostic responses for a user |
| `POST /api/admin-delete-user` | POST | ✅ | Delete all app data for a user |
| `GET /api/admin-student-detail?userId=<uuid>` | GET | ✅ | All `responses` rows for one user (for Student Detail Drawer) |
| `GET /api/admin-item-analysis` | GET | ✅ | Psychometric stats across all questions (p-value, discrimination, distractor freqs) |
| `GET /api/admin-chat-activity` | GET | ✅ | Latest 200 AI Tutor sessions with user names and artifact counts |
| `GET /api/admin-chat-activity?sessionId=<uuid>` | GET | ✅ | Full conversation for one AI Tutor session (messages, artifacts, metadata) |

**All endpoints require `SUPABASE_SERVICE_ROLE_KEY`** (JWT `eyJ...` from Supabase → Settings → API → `service_role`). They gracefully degrade on raw Vite (port 5173) — the admin dashboard shows a clear error message. Run `netlify dev` (port 8888) for full functionality.

### Admin Dashboard — Tabs

| Tab | What It Shows |
|---|---|
| Overview | User counts, active users, avg Q time (global), in-progress assessments, potential drops |
| Audit | Consolidated feedback + question report audit with download |
| Beta Feedback | All user feedback with status management |
| Question Reports | Per-question issue reports with severity triage |
| Users | Full user table with avg Q time, in-progress/dropped badges; click any row for Student Detail Drawer |
| Item Analysis | Psychometric quality metrics for the 466-question bank (p-value, discrimination, distractor analysis) |
| AI Tutor | AI Tutor chat sessions — session list with user/type/message count/artifacts, drill into full conversation with intent badges and inline artifact cards, CSV export |

### Student Detail Drawer

Triggered by clicking any row in the **Users** tab. Fetches responses via `api/admin-student-detail`. Shows:
- Domain performance bars (4 domains)
- Skill breakdown table (sortable by accuracy / attempts / avg time)
- Session timeline (chronological by session)
- Time distribution (min / Q1 / median / Q3 / max)
- Top 10 most-missed skills

### Item Analysis — Flag Thresholds

| Flag | Rule |
|---|---|
| Too Easy | p-value > 0.90 (proportion correct > 90%) |
| Too Hard | p-value < 0.20 |
| Low Discrimination | discrimination index ≤ 0 (better students not outperforming weaker ones) |
| Timing Outlier | avg time > global avg + 2× global stddev |

Flags only applied when item has ≥ 5 attempts.

### Admin — reset screener / full diagnostic

The **Users** tab in the admin dashboard calls `POST /api/admin-reset-assessment` to archive deleted rows into `assessment_reset_archive`, remove matching `responses`, and rebuild aggregates.

- **Requires** Netlify env `SUPABASE_SERVICE_ROLE_KEY` (JWT `eyJ...` from Supabase → Settings → API → `service_role`).
- **Requires** migration `0004_assessment_reset_archive.sql` applied in Supabase.
- **Requires** migration `0005_module_interactions.sql` applied in Supabase (module visit tracking, section interactions, learning_path_progress table).
- Admin allowlist is **`src/config/admin.ts`** (`isAdminEmail`), not only the SQL `is_admin_email` helper used for RLS elsewhere.

---

## Supabase Credentials

### Key Format — Critical Gotcha

The project uses Supabase's **new "publishable key" format** (`sb_publishable_*` / `sb_secret_*`).
These are **NOT** the classic JWT tokens (which start with `eyJ...` and have 3 dot-separated parts).

| Key in `.env.local` | Variable | Works for |
|---|---|---|
| `sb_publishable_...` | `VITE_SUPABASE_ANON_KEY` | Client-side browser calls via `createClient`. RLS applies. ✅ |
| `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` | **Broken — fails for auth/admin API calls.** ❌ |

**What we confirmed via probing:**
- `apikey: ANON + Authorization: Bearer ANON` → 200 ✅ (subject to RLS)
- `apikey: ANON + Authorization: Bearer sb_secret_*` → 401 "Expected 3 parts in JWT; got 1"
- `apikey: sb_secret_* + Authorization: Bearer sb_secret_*` → 401 "Unregistered API key"
- Supabase admin API with `sb_secret_*` → 401 "Unregistered API key"

### Fix Applied — No Service Role Key Required

`api/study-plan-background.ts` was updated to **eliminate the service role dependency**:
- `auth.getUser(idToken)` — uses the anon key (passes user's JWT to `/auth/v1/user`, no admin privileges needed)
- DB insert — uses a user-scoped client (anon key + user's JWT as Bearer), so RLS `auth.uid() = user_id` is satisfied

The `SUPABASE_SERVICE_ROLE_KEY` env var is **no longer needed** by the background function.

### Admin Script Still Needs JWT Service Role Key

The `scripts/admin-delete-study-plan.mjs` script (for one-off admin tasks) still needs the real
JWT service role key. Get it from:
1. [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Settings → API → Project API keys → `service_role`** (starts with `eyJ...`)

```bash
SERVICE_ROLE_KEY="eyJ..." node scripts/admin-delete-study-plan.mjs puppyheavenllc@gmail.com
```

---

## Study Plan — Rate Limit

The 1-generation-per-7-days rate limit lives in:
```
src/services/studyPlanService.ts  ~line 728
```

The rate limit is **active** as of 2026-03-23. It was previously commented out for testing but has been re-enabled.

---

## Admin Tasks

### Delete a User's Study Plans

Script: `scripts/admin-delete-study-plan.mjs`

**Requires the real JWT service_role key** (see above).

```bash
SERVICE_ROLE_KEY="eyJ..." node scripts/admin-delete-study-plan.mjs puppyheavenllc@gmail.com
```

Alternatively, delete manually from the **Supabase Table Editor**:
- Open `study_plans` table
- Filter by `user_id` = (look up user in `auth.users` table)
- Select all rows → Delete

---

## Study Plan Architecture (v2)

The study plan system is a 3-layer pipeline:

1. **Deterministic preprocessing** (`src/utils/studyPlanPreprocessor.ts`)
   — Computes `StudentSkillState`, status labels (hard thresholds), trend, urgency scores, clusters, time budget, and weekly schedule frame. **No AI calls.**

2. **Content retrieval** (`src/data/skill-metadata-v1.ts`)
   — Fetches vocabulary, misconceptions, case archetypes, and laws/frameworks for each skill from static metadata. **No AI calls.**

3. **Model synthesis** (`api/study-plan-background.ts` + `buildPromptV2` in service)
   — Claude receives the pre-computed data and writes narrative, interpretation, and instructional reasoning only. It cannot change session types/durations (pre-set by code).

### Status Labels (Hard Thresholds)

These are **internal AI/preprocessor labels** used by `studyPlanPreprocessor.ts` and the study plan prompt. Do not rename them — they are not user-facing.

| Status | Rule |
|---|---|
| `unlearned` | < 3 attempts |
| `misconception` | ≥ 3 attempts, accuracy < 60%, AND at least 1 incorrect answer recorded |
| `mastered` | ≥ 80% accuracy |
| `near_mastery` | ≥ 60% accuracy |
| `developing` | ≥ 40% accuracy |
| `unstable` | everything else |

Trend requires ≥ 6 attempts. Improving/declining = ±15pp between first-half and last-half accuracy.

---

## Skill Proficiency Levels (UI-Facing Labels)

These are the **user-facing** proficiency labels shown throughout the practice tab, skill panels, and domain cards. Skills and domains must use the same labels and the same explanatory language. Defined in `src/utils/skillProficiency.ts`.

| Level | Threshold | Meaning | Helper text |
|---|---|---|---|
| **Demonstrating** | score ≥ 0.80 (≥ 80%) | Meeting the threshold and applying foundational knowledge consistently in practice | "Meeting the threshold and applying foundational knowledge consistently in practice." |
| **Approaching** | 0.60 ≤ score < 0.80 (60–79%) | Near the threshold, with opportunities to strengthen foundational knowledge and apply it more consistently | "Near the threshold, with opportunities to strengthen foundational knowledge and apply it more consistently." |
| **Emerging** | score < 0.60 (< 60%) | Foundational gaps are still getting in the way, so targeted remediation is needed before performance is consistent | "Foundational gaps are still getting in the way, so targeted remediation is needed before performance is consistent." |
| **Not started** | 0 attempts | No data yet | — |

These thresholds align with the internal AI labels: `Demonstrating` = `mastered`, `Approaching` = `near_mastery`, `Emerging` = `misconception`/`developing`/`unstable`.

**All UI-facing labels and thresholds are aligned to this single source of truth:**
- `src/utils/skillProficiency.ts` — canonical definition
- `src/utils/assessmentReport.ts` — DOMAIN_READY/BUILDING use 0.8/0.6
- `src/utils/progressSummaries.ts` — `getStatusLabel()` returns Emerging/Approaching/Demonstrating
- `src/components/ResultsDashboard.tsx` — domain badges use Emerging/Approaching/Demonstrating
- `src/components/ScreenerResults.tsx` — `domainStatusLabel()` returns Emerging/Approaching/Demonstrating
- `src/components/StudyModesSection.tsx` — domain tier badges use Emerging/Approaching/Demonstrating

**Readiness threshold (separate dimension):** 70% of all 45 skills must reach Demonstrating (≥80%). Defined in `App.tsx` as `readinessTarget = Math.ceil(totalSkills * 0.7)`. This is a **count** threshold (how many skills), not an accuracy threshold (how well a skill was answered).

**Key file:** `src/utils/skillProficiency.ts` — exports `getSkillProficiency()` and `PROFICIENCY_META`.

---

## Feeling Spicy — Cycle Recalibration

Spicy mode cycles through all 45 skills in a shuffled order, one question per skill. After completing a full cycle of all 45 skills, the cycle **reshuffles** automatically into a new random order and starts again from skill 1. This means every subsequent round of 45 creates new signal for skill recalibration.

State is persisted in `localStorage` under key `pmp-spicy-cycle-${userId}` as `{ ids: string[]; index: number }`.

Logic in `src/components/PracticeSession.tsx` — `advanceSpicyCycle()`.

---

## Redemption Rounds (v2 — Quarantine System)

Quarantine loop for hinted and repeatedly-missed practice questions. Lives in `src/hooks/useRedemptionRounds.ts` (hook) and `src/components/RedemptionRoundSession.tsx` (UI). Wired in `App.tsx`.

### Entry Rules
- **3rd wrong answer total** on a question across all sessions → quarantined (tracked via `wrong_count` column + `increment_wrong_count` RPC)
- **Hint used** on a practice question → quarantined immediately on transition to next question
- **Scope:** Practice by skill, practice by domain, learning path mini-quiz. Does NOT apply to AI tutor quiz or vocabulary quiz (generated questions, no stable IDs).

### Quarantine Behavior
- `in_redemption = true` is the **single source of truth** for quarantine status
- Quarantined questions are excluded from ALL normal practice pools via ID-based blacklist in `useAdaptiveLearning.ts` (`redemptionBlacklistIds` param) and `PracticeSession.tsx` (`activePool` filter)
- Quarantined questions only appear inside Redemption Rounds until cleared

### Clearance Rule
- 3 correct answers inside Redemption Rounds → cleared (`redeemed = true`, `in_redemption = false`)
- No confidence shortcuts. No instant redemption. Always 3 correct.

### Key Constants
- **Credit threshold:** 20 non-hint practice answers = 1 credit
- **Timer per question:** 90 seconds
- **Miss threshold:** 3 wrong answers total to enter quarantine
- **Clearance threshold:** 3 correct answers in Redemption to clear

### Credit System
- 1 credit = 1 full pass through the entire Redemption bank (all quarantined questions)
- Not one question, not one attempt — one full cycle

### Database Tables
- `practice_missed_questions` — one row per `(user_id, question_id)`. Columns: `user_id`, `question_id`, `skill_id`, `wrong_count`, `entry_reason` (`'hint'` | `'miss_threshold'`), `in_redemption`, `correct_count`, `redeemed`, `redeemed_at`. Uses atomic `increment_wrong_count` RPC for miss tracking.
- `redemption_sessions` — one row per completed round. Columns: `user_id`, `questions_attempted`, `questions_correct`, `score_pct`.
- Migration: `0013_redemption_v2.sql` adds `wrong_count`, `entry_reason`, `in_redemption` columns + RPC function.

### Profile Fields (stored via `useProgressTracking`)
- `practiceQuestionsSinceCredit` — counter toward next credit; resets to remainder after credit awarded
- `redemptionCredits` — available credits
- `redemptionHighScore` — personal best score percentage

### Hook Integration
- `useRedemptionRounds` initialized in `App.tsx` with `user?.id`, `profile`, `updateProfile`
- Returns: `bankCount`, `redemptionBlacklistIds`, `credits`, `questionsToNextCredit`, `highScore`, `addToMissedBankForMiss`, `addToMissedBankForHint`, `handleAnswerSubmitted`, `startRound`, `recordRoundResult`
- On non-hint wrong answer in `PracticeSession` → `redemption.addToMissedBankForMiss(questionId, skillId)` (RPC increments `wrong_count`; quarantines at 3)
- On hint-used question transition to next → `redemption.addToMissedBankForHint(questionId, skillId)` (immediate quarantine)
- On every non-hint answer in `PracticeSession` → `redemption.handleAnswerSubmitted()` (credit counter)
- `LearningPathModulePage` quiz wrong answers also call `addToMissedBankForMiss`
- **Hint answers are excluded** from the credit counter and wrong-answer tracking

### Mixed Path Edge Case
When a question has prior misses and then a hint is used:
- `wrong_count` is preserved (not reset)
- `entry_reason` is updated to `'hint'`
- `in_redemption` is set to `true` immediately
- Example: wrong twice (wrong_count=2) → hint → result: `wrong_count=2, entry_reason='hint', in_redemption=true`

### Schema Version

Plans are stored with `schemaVersion: "2"` in `plan_document`. Old v1 plans (no `schemaVersion`) return `null` from `normalizeStudyPlanDocument()`, which triggers a re-generation prompt in the UI.

### Output Sections (9)

`readinessSnapshot` → `dataInterpretation` → `priorityClusters` → `domainStudyMaps` → `vocabulary` → `casePatterns` → `weeklyStudyPlan` → `tacticalInstructions` → `checkpointLogic`

---

## Supabase Migrations

All migrations live in `supabase/migrations/`. Applied via `supabase db push`.

| Migration | Purpose |
|---|---|
| `0000` – `0003` | Core tables (users, responses, assessments, study plans) |
| `0004_assessment_reset_archive.sql` | Archive table for admin assessment resets |
| `0005_module_interactions.sql` | `module_visit_sessions`, `section_interactions`, `learning_path_progress` — module engagement tracking with RLS |
| `0006_module_notes_and_focus_items.sql` | `module_notes`, `focus_items` — per-module student notes and AI-generated focus items |
| `0007_admin_read_policies.sql` | RLS read policies for admin dashboard queries |
| `0008_glossary_entries.sql` | `glossary_entries` — skill vocabulary/glossary storage |
| `0009_redemption_rounds.sql` | `practice_missed_questions`, `redemption_sessions`, user_progress credit columns |
| `0010_tutor_chat.sql` | `tutor_sessions`, `tutor_messages`, `tutor_artifacts` — AI Tutor conversation storage |
| `0011_add_global_scores.sql` | `global_scores` columns on `user_progress` for cross-skill aggregate tracking |
| `0012_adaptive_diagnostic_columns.sql` | Adaptive diagnostic metadata columns on `responses` (confidence, timing, key concepts) |
| `0013_redemption_v2.sql` | Adds `wrong_count`, `entry_reason`, `in_redemption` columns + `increment_wrong_count` RPC to `practice_missed_questions` |
| `0014_user_subscriptions.sql` | `user_subscriptions` — Stripe subscription tracking for paywall |
| `0015_adaptive_audit_columns.sql` | `is_followup`, `cognitive_complexity`, `skill_question_index` on `responses` — diagnostic audit trail |
| `0016_baseline_snapshot.sql` | `baseline_snapshot` JSONB column on `user_progress` — pre/post comparison |

**UUID function:** Use `gen_random_uuid()` (built into Postgres 13+), NOT `uuid_generate_v4()` (requires pgcrypto extension, not enabled by default in Supabase).

---

## Assessment Pathways

The app supports two assessment paths. New users always get the **adaptive diagnostic**; the legacy path exists for backward compatibility.

| Path | Components | Unlocks |
|---|---|---|
| **Adaptive diagnostic** (current) | 45–90 questions, 1 per skill + follow-ups | All practice modes + study guide |
| **Legacy** (backward compat) | 50-question screener + 125-question full assessment | Same, but requires both steps |

Unlock logic is in `App.tsx` (~lines 315–322). Both paths feed into the same `user_progress` and study plan pipeline.

---

## Netlify Background Functions

- Entry: `api/study-plan-background.ts`
- Timeout: up to 15 minutes (Netlify Background)
- Returns 202 immediately; client polls Supabase every 4 seconds (4 min timeout)
- `max_tokens` for Claude: 12000
- Model: `claude-sonnet-4-5` (or similar current Sonnet)

---

## Social Proof Header Widgets

Two engagement indicators live in the authenticated header (`App.tsx`).

### Users Online Pill

- **Location:** `App.tsx` — `getHourRange()` + `usersOnline` state (~line 141)
- **Behavior:** Seeds from a 24-hour lookup table on mount; drifts ±1–2 every 90–150s via `setInterval`
- **When count = 0:** pill turns grey, dot stops pinging (dead-quiet look for 2–3am)
- **Range map highlights:** 2–3am = `[0,0]`; 7–8pm = `[5,10]`; 9am–11am = `[3,7]`
- **Do not remove the `getHourRange` function or the drift `useEffect`** — they are the entire mechanism
- **Data:** Client-side only, no backend calls, no real data

### Leaderboard Widget

- **Location:** `src/hooks/useLeaderboard.ts` (hook) + `App.tsx` (UI) + `api/leaderboard.ts` (Netlify function)
- **Trigger:** Trophy icon button in header → absolute-positioned popover
- **3 modes:** Questions Answered (default) · Engagement Time · Skills to Mastery
- **Data:** **Real user data** from the database. The Netlify function queries `user_progress` and `responses` via service role key, computes all-time stats per user, and returns anonymized initials.
- **Metrics:** Questions = `total_questions_seen`; Time = SUM of `time_on_item_seconds` (converted to minutes); Mastery = 45 minus count of skills ≥ 80% accuracy
- **Initials:** Derived from `display_name` → `email` fallback (e.g., "Veronica Rivera" → "V.R.")
- **Auth:** Any authenticated user can call `GET /api/leaderboard` (not admin-only). Requires `SUPABASE_SERVICE_ROLE_KEY` on the server to bypass RLS for cross-user reads.
- **Refresh:** Fetches on mount, then every 5 minutes via `setInterval`
- **Current user:** Highlighted with indigo styling and "You" badge. If outside top 12, appended at the bottom with their actual rank.
- **Fallback:** Shows "Leaderboard unavailable" on error, "Loading…" while fetching, "No activity yet" if no users have data.

**The Users Online pill is an internal social-proof mechanic (fake data). The leaderboard uses real data. Keep implementation details out of any user-facing or public documentation.**

---

## Pending Design Decisions

### OPEN: Spicy Mode + Diagnostic Question Pool Overlap

**Status:** Awaiting decision from product owner.

**Context:** Spicy Mode (random question preview) and the Adaptive Diagnostic both pull from the same 466-question bank. If a user answers questions in Spicy Mode first, then starts the diagnostic, should the diagnostic:

- **Option A:** Avoid questions the user already saw in Spicy Mode (shrinks the available pool, may limit adaptive follow-ups for some skills)
- **Option B:** Re-ask them (the diagnostic measures skill, not novelty — but the user may remember answers)

**Why it matters:** The diagnostic is adaptive — wrong answers trigger follow-up questions for that skill (max 3 per skill). If Spicy Mode has already used up questions for a skill, the diagnostic may not have enough follow-ups available.

**Blocked items:** Final implementation of Spicy Mode question selection logic and diagnostic queue builder.

---

## Pending Redesign — Pre-Assessment Flow + Tutorials (April 2026)

### Spicy Mode Repositioned

Spicy Mode moves from the Practice tab to the **pre-assessment page**, displayed alongside the Adaptive Diagnostic as an alternative path:

- **Purpose:** Let users preview question format, feedback, and hints before committing to the diagnostic
- **Behavior:** Continuous random question loop, no end point, full feedback/hints
- **Persistence:** Remembers progress across sessions (does NOT reset on each login)
- **Tracking:** All responses are stored with the same logic as regular practice (wrong-answer tracking, time, confidence). Data renders in dashboard once diagnostic is complete.
- **Feature gates:** Spicy Mode does NOT unlock any features (no practice modes, no study guide, no tutor, nothing)

### Pre-Assessment Page Flow

Every time the user logs in (until diagnostic is complete), they land on the pre-assessment page showing:
1. **Adaptive Diagnostic** — full 45-skill assessment, unlocks everything
2. **Spicy Mode** — random question preview, no unlocks

If user starts the diagnostic and pauses midway, they return to this page. The diagnostic pauses cleanly and Spicy Mode is accessible without interruption.

### Tutorial System (Two Tutorials)

**Tutorial 1: Pre-Assessment Tutorial**
- Triggers on first visit to pre-assessment page
- Explains the adaptive diagnostic and Spicy Mode
- Shows what each path does and what gets unlocked

**Tutorial 2: Dashboard Tutorial**
- Triggers after diagnostic completion (first dashboard visit)
- Numbered indicators on each UI feature (1, 2, 3, 4...)
- Each number opens an info panel explaining:
  - What the feature is
  - How to get started
  - Optional hint/tip
- Feature stays visible while info panel is open (user sees both the tool and the explanation)
- Sequential progression through all features
- **Depends on finalized dashboard layout** — implement after mockup approval

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind |
| Auth | Supabase Auth |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude (via Netlify Background Function) |
| Hosting | Netlify |
| Functions | Netlify Background Functions (Lambda compat mode) |
