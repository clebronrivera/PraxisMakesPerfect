# Praxis Makes Perfect — Developer Notes for Claude

This file captures hard-won context so Claude doesn't have to rediscover it.

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

It is **commented out** during testing. Search for:
```ts
// TODO: Re-enable before production. Disabled for testing.
```
Un-comment the block before going to production.

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

| Status | Rule |
|---|---|
| `unlearned` | < 3 attempts |
| `misconception` | ≥ 3 attempts, accuracy < 60%, AND at least 1 incorrect answer recorded |
| `mastered` | ≥ 80% accuracy |
| `near_mastery` | ≥ 60% accuracy |
| `developing` | ≥ 40% accuracy |
| `unstable` | everything else |

Trend requires ≥ 6 attempts. Improving/declining = ±15pp between first-half and last-half accuracy.

### Schema Version

Plans are stored with `schemaVersion: "2"` in `plan_document`. Old v1 plans (no `schemaVersion`) return `null` from `normalizeStudyPlanDocument()`, which triggers a re-generation prompt in the UI.

### Output Sections (9)

`readinessSnapshot` → `dataInterpretation` → `priorityClusters` → `domainStudyMaps` → `vocabulary` → `casePatterns` → `weeklyStudyPlan` → `tacticalInstructions` → `checkpointLogic`

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
