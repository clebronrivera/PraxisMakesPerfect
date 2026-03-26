# Praxis Makes Perfect — Developer Notes for Claude

This file captures hard-won context so Claude doesn't have to rediscover it.

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

## Redemption Rounds

Focused review mode for missed practice questions. Lives in `src/hooks/useRedemptionRounds.ts` (hook) and `src/components/RedemptionRoundSession.tsx` (UI). Wired in `App.tsx`.

### Key Constants
- **Credit threshold:** 20 non-hint practice answers = 1 credit — `src/hooks/useRedemptionRounds.ts` ~line 104 (`Math.floor(newCount / 20)`)
- **Timer per question:** 90 seconds — `src/components/RedemptionRoundSession.tsx` ~line 21 (`const SECONDS_PER_QUESTION = 90`)

### Redemption Criteria (in `recordRoundResult`)
- `Sure` + correct → redeemed immediately (1 correct is enough)
- `Unsure` / `Guess` + correct → redeemed when `correct_count` reaches 3 across multiple rounds
- Incorrect answers: no effect on `correct_count`; question stays in bank

### Database Tables
- `practice_missed_questions` — one row per `(user_id, question_id)`. Columns: `user_id`, `question_id`, `skill_id`, `correct_count`, `redeemed`, `redeemed_at`. Upsert with `onConflict: 'ignore'` so re-missing the same question is a no-op.
- `redemption_sessions` — one row per completed round. Columns: `user_id`, `questions_attempted`, `questions_correct`, `score_pct`.

### Profile Fields (stored via `useFirebaseProgress`)
- `practiceQuestionsSinceCredit` — counter toward next credit; resets to remainder after credit awarded
- `redemptionCredits` — available credits
- `redemptionHighScore` — personal best score percentage

### Hook Integration
- `useRedemptionRounds` initialized in `App.tsx` with `user?.id`, `profile`, `updateProfile`
- Returns: `bankCount`, `credits`, `questionsToNextCredit`, `highScore`, `addToMissedBank`, `handleAnswerSubmitted`, `startRound`, `recordRoundResult`
- On wrong answer in `PracticeSession` → `redemption.addToMissedBank(questionId, skillId)`
- On every non-hint answer in `PracticeSession` → `redemption.handleAnswerSubmitted()`
- **Hint answers are excluded** from the credit counter

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

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind |
| Auth | Supabase Auth |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude (via Netlify Background Function) |
| Hosting | Netlify |
| Functions | Netlify Background Functions (Lambda compat mode) |
