# Supabase Schema, Auth/Onboarding, and Deployment Audit

**Date:** 2026-03-16  
**Scope:** Current Supabase usage, data flow, onboarding/user details, cleanup, Netlify alignment. No deployment or implementation changes.

---

## 1. Current Supabase Usage Map

### Tables defined in repo (`supabase/migrations/0000_initial_schema.sql`)

| Table | In migration | Actively used | Read locations | Write locations | Role / notes |
|-------|--------------|---------------|-----------------|-----------------|--------------|
| **user_progress** | Yes | Yes | `useFirebaseProgress` (loadProfile), `AuthContext` (track), `studyPlanService` (screener_complete, screener_results), `globalScoreCalculator` (update commented out), `AdminDashboard` (select *) | `AuthContext` (upsert on login), `useFirebaseProgress` (saveProfile, updateLastSession, updateProfile, saveScreenerResponse) | **Source of truth** for per-user progress and auth tracking. |
| **responses** | Yes | Yes | `useFirebaseProgress` (getAssessmentResponses, getLatestAssessmentResponses), `studyPlanService` via `fetchGlobalScoreInputs`, `globalScoreCalculator` (fetchGlobalScoreInputs) | `useFirebaseProgress` (logResponse, saveScreenerResponse) | **Source of truth** for all answer events (screener, full, practice). |
| **practice_responses** | Yes | Write-only from app | None in app | `useFirebaseProgress.savePracticeResponse` only | **Write-only.** No reads in codebase. Data is stored but never used for reporting or study plan. |
| **question_reports** | Yes | Yes | `useQuestionReports` (getReportsByQuestion, getAllReports) | `useQuestionReports` (submitReport, updateReportStatus) | **Source of truth** for user-reported question issues. Admin reads/updates. |
| **beta_feedback** | Yes | Yes | `useBetaFeedback` (getAllFeedback) | `useBetaFeedback` (submitFeedback, updateFeedbackStatus) | **Source of truth** for beta feedback. Admin reads/updates. |

### Tables used in code but **not** in `0000_initial_schema.sql`

| Table | Used in | Role |
|-------|---------|------|
| **study_plans** | `src/services/studyPlanService.ts` (getLatestStudyPlan, generateStudyPlan insert) | Read: latest plan per user. Write: insert new plan doc. **No migration in repo** — table must exist in Supabase (manual or other migration). |
| **questions** | `src/context/ContentContext.tsx` (select * on load) | Content: question bank from Supabase. App also loads canonical bank from `src/data/questions.json` and prefers it for content; Supabase questions used for sync/fallback. |
| **skills** | `src/context/ContentContext.tsx` (select * on load) | Content: skills list. |

### Per-table detail

#### user_progress

- **Read:**  
  - `src/hooks/useFirebaseProgress.ts`: `loadProfile()` — full row by `user_id`.  
  - `src/contexts/AuthContext.tsx`: `trackAuthenticatedSession()` — select * by user_id to get existing login_count.  
  - `src/services/studyPlanService.ts`: select `screener_complete`, `screener_results` for study plan generation.  
  - `src/utils/globalScoreCalculator.ts`: `calculateAndSaveGlobalScores` → `saveGlobalScores` has **commented-out** update to `user_progress` (and schema has no `global_scores` column). So global scores are computed and logged but **not persisted**.  
  - `src/components/AdminDashboard.tsx`: select * for admin user list and stats.
- **Write:**  
  - AuthContext: upsert on login (user_id, email, display_name, login_count, last_login_at, last_active_at).  
  - useFirebaseProgress: saveProfile (full profile upsert), updateLastSession (last_session + updated_at), saveScreenerResponse (screener_complete, screener_results, etc.).
- **Verdict:** Source of truth; also used as a **cache** for scores, question IDs, last session. Some legacy naming (e.g. diagnostic_complete vs preAssessment in TS).

#### responses

- **Read:**  
  - useFirebaseProgress: `getAssessmentResponses(sessionId, types, questions)`, `getLatestAssessmentResponses(types, questions)` — used by `App.tsx` `handleViewReport` for score report.  
  - globalScoreCalculator: `fetchGlobalScoreInputs(userId)` — all rows for user; feeds study plan and global score calculation.  
  - studyPlanService: uses `fetchGlobalScoreInputs` (so reads via responses, not practice_responses).
- **Write:**  
  - useFirebaseProgress: `logResponse()` (screener, full, practice), `saveScreenerResponse()` (inserts rows with assessment_type `'screener'`).
- **Verdict:** Single source of truth for all assessment and practice **answer events**. Actively used for reports and study plan.

#### practice_responses

- **Read:** **None** in the codebase.  
- **Write:** useFirebaseProgress `savePracticeResponse()` only (called from `PracticeSession.tsx`).  
- **Verdict:** **Underused.** Data is written but never read. Study plan and global scores use `responses` only. Either start reading from this table for practice-specific analytics or consider consolidating into `responses` and deprecating this table (decision required).

#### question_reports / beta_feedback

- Actively used for submit/list/update; admin-only list/status. No duplication or staleness observed.

### Are practice_responses and responses both needed?

- **responses:** Yes. Holds screener, full, and practice answer events; read for reports and study plan.  
- **practice_responses:** Currently **redundant for app behavior.** Practice is also logged to `responses` via `logResponse` with assessment_type `'practice'` from `PracticeSession`. So practice is stored in **both** tables; only `responses` is used downstream. Unifying on one store (or making practice_responses the single practice store and reading it) is a design choice.

### user_progress: clean aggregate vs junk drawer

- **Used as:**  
  - Auth/session tracking (login_count, last_login_at, last_active_at, email, display_name).  
  - Progress flags (screener_complete, diagnostic_complete, full_assessment_complete).  
  - Cached aggregates: domain_scores, skill_scores, weakest_domains, factual_gaps, error_patterns, flagged_questions, distractor_errors, skill_distractor_errors.  
  - Lists of question IDs: pre_assessment_question_ids, full_assessment_question_ids, recent_practice_question_ids, screener_item_ids.  
  - Counts: total_questions_seen, practice_response_count, streak.  
  - last_session (resume pointer), screener_results.  
- **Verdict:** Mix of **legitimate cache** (scores, IDs, flags) and **session/resume state**. Not a junk drawer, but `last_session` overlaps conceptually with localStorage/sessionStorage resume state. Some fields (e.g. pre_assessment_question_ids vs diagnostic_complete) align with legacy “pre/diagnostic” naming.

### Naming drift (screener / diagnostic / full assessment)

- **Schema:** `screener_complete`, `diagnostic_complete`, `full_assessment_complete`; `pre_assessment_question_ids`, `full_assessment_question_ids`, `screener_item_ids`.  
- **App/TS:** `UserProfile` has `preAssessmentComplete` (never loaded or written to DB; always false) and `diagnosticComplete` (mapped from `diagnostic_complete`). Product terminology: “screener” and “full assessment” are the two active flows; “diagnostic” / “pre assessment” are legacy/archived.  
- **responses.assessment_type:** `'screener' | 'diagnostic' | 'full' | 'practice'` — `diagnostic` kept for compatibility with older data.  
- **Docs:** `docs/WORKFLOW_GROUNDING.md` and `src/utils/productTerminology.ts` describe screener vs full assessment; diagnostic is archived.

### Unused or legacy fields (user_progress)

- **preAssessmentComplete** in TS: Not in schema; never persisted; always false. Redundant with diagnosticComplete for “archived short assessment” meaning.  
- **global_scores:** Referenced in globalScoreCalculator only in commented-out save; column does not exist in migration. Either add column + persist or remove dead code.

---

## 2. Real Data Flow Map

### New user enters app

1. **Unauthenticated:** App shows `LoginScreen` (`App.tsx`: `if (!user) return <LoginScreen />`).  
2. **Sign up:** Email, password, optional display name → `AuthContext.signUpWithEmail` → Supabase Auth `signUp` with `user_metadata: { displayName, full_name }`. No custom profile table at sign-up; no dedicated onboarding step.  
3. **First session after sign-up:** On auth state change, `trackAuthenticatedSession` runs: select then upsert `user_progress` (user_id, email, display_name, login_count, last_login_at, last_active_at). Row created or updated; no other “onboarding” flow.

### Auth / user creation

- **Provider:** Supabase Auth only (email/password). No OAuth in current code.  
- **Stored in Supabase:** Auth users in `auth.users`. Profile-like data in `user_progress` (email, display_name, login_count, last_login_at, last_active_at).  
- **Local:** Session key `pmp-auth-session:${userId}` in sessionStorage to avoid duplicate tracking in same tab.

### First-time vs returning user

- **Distinction:** Implicit. “First-time” = no or empty progress (e.g. no screener_complete, no responses). No explicit “onboarding completed” flag or multi-step onboarding.  
- **UI:** Home shows “Ready to Study?” vs “Welcome Back!” based on `hasReadinessData` (screener or diagnostic or full assessment completed). No separate onboarding route or steps.

### Screener completion

1. User starts screener → `createUserSession` (localStorage) + `updateProfile({ screenerItemIds })`.  
2. Per question: `ScreenerAssessment` calls `saveScreenerResponse` (insert into `responses` with assessment_type `'screener'`) and `logResponse` (same).  
3. On complete: `handleScreenerComplete` → `updateProfile` (screener_complete, screener_results, lastScreenerSessionId, lastScreenerCompletedAt, screenerItemIds, lastSession: null, weakness analysis).  
4. Local: `deleteUserSession`, `clearSession`.  
5. **Persisted:** responses rows (screener); user_progress (flags, screener_results, question IDs, analysis cache).

### Full assessment completion

1. Start: `createUserSession` (full-assessment), no DB write for question set.  
2. Per question: `FullAssessment` calls `logResponse` (assessment_type `'full'`) and `updateLastSession`.  
3. On complete: `handleFullAssessmentComplete` → `updateProfile` (full_assessment_complete, full_assessment_question_ids, last_full_assessment_session_id, last_full_assessment_completed_at, lastSession: null, analysis).  
4. **Persisted:** responses (full); user_progress (flags, question IDs, analysis cache).

### Practice sessions

1. Per question: `PracticeSession` calls `savePracticeResponse` (insert `practice_responses`) and `logResponse` (insert `responses` with assessment_type `'practice'`).  
2. `updateLastSession` for resume.  
3. **Persisted:** both `responses` and `practice_responses`; only `responses` is read later. user_progress updated via updateProfile/updateSkillProgress (e.g. skill_scores, recent_practice_question_ids, practice_response_count).

### Progress updates

- **Derived/cached in user_progress:** domain_scores, skill_scores, weakest_domains, factual_gaps, error_patterns, flagged_questions, distractor_errors, skill_distractor_errors, screener_results, question ID arrays, counts, last_session.  
- **Recomputed:** Global scores in `globalScoreCalculator.calculateAndSaveGlobalScores` are computed from `responses` but **not** written to DB (save commented out; no column).  
- **Local only:** sessionStorage (`praxis-assessment-session`), localStorage (user sessions list and per-session payloads in `userSessionStorage`). Resume uses both local session and user_progress.last_session.

### Reports

- **Score report:** User clicks “View Report” → `handleViewReport` → `getAssessmentResponses(sessionId, types, questions)` or fallback `getLatestAssessmentResponses` (reads `responses`), then sets local state and navigates to score-report mode. No separate “reports” table; report is derived from responses + question bank.  
- **Study guide:** Fetches `user_progress` (screener_complete, screener_results) and `responses` via `fetchGlobalScoreInputs`, builds prompt, calls `/api/study-plan`, then inserts into `study_plans`.

### Study guide generation

- **Inputs:** user_progress (screener_complete, screener_results), responses (all for user) via fetchGlobalScoreInputs.  
- **API:** POST `/api/study-plan` (Netlify function); server uses service role Supabase and Anthropic.  
- **Output:** Insert into `study_plans` (user_id, plan_document). Client loads via `getLatestStudyPlan(userId)`.

### Feedback / reporting tools

- **Beta feedback:** useBetaFeedback → insert/select/update `beta_feedback`.  
- **Question reports:** useQuestionReports → insert/select/update `question_reports`.  
- Both: user-scoped; admin can list and update status.

---

## 3. Onboarding / User Details Collection Audit

### What is collected at sign-up / first use

- **At sign-up (form):**  
  - Email (required)  
  - Password (required)  
  - Display name (optional) — only in signup mode; stored in Supabase Auth `user_metadata` as `displayName` and `full_name`.  
- **From auth provider only:**  
  - Supabase Auth: id, email, user_metadata (full_name, displayName). No other providers in code.  
- **On first authenticated load:**  
  - AuthContext `trackAuthenticatedSession`: reads then upserts `user_progress` with email, display_name (from user_metadata), login_count, last_login_at, last_active_at. So the only “profile” fields persisted are those.

### Custom profile fields (user_progress)

- email, display_name (from auth / metadata)  
- login_count, last_login_at, last_active_at  
- Progress flags and cached analysis (see section 1).  
- No separate “onboarding” or “preferences” table.

### Onboarding steps/forms

- **None.** No multi-step onboarding, no post-sign-up wizard, no “complete your profile” flow. Sign-up form is the only collection point; optional display name is the only extra field.

### First-time vs returning

- **Not explicitly.** No “onboarding completed” or “first_run” flag. First-time is inferred from empty progress (e.g. no screener_complete).  
- **Where it could be extended:** Right after sign-up or first `trackAuthenticatedSession`, before or after first navigation to home. Currently home immediately shows “Ready to Study?” and tiles.

### Where onboarding / first-run is handled

- **Auth:** `src/contexts/AuthContext.tsx` (sign-up, sign-in, trackAuthenticatedSession).  
- **Login UI:** `src/components/LoginScreen.tsx` (mode login/signup/reset; signup collects email, password, displayName).  
- **Post-auth:** No dedicated component or route; user lands on home and uses progress flags for messaging.

### Cleanest place to collect additional user details

- **Easy (minimal disruption):**  
  - Add optional fields to the **sign-up form** in `LoginScreen.tsx` (e.g. one or two dropdowns or text inputs).  
  - Pass them into `signUpWithEmail` and store in Supabase Auth `user_metadata` and/or mirror in `user_progress` in `trackAuthenticatedSession`. No new tables; schema change only if new columns in user_progress (e.g. role, exam_date).  
- **Moderate:**  
  - Single “Complete your profile” step or modal on first load after sign-up (e.g. when `user_progress` row is new or a new flag like `onboarding_complete` is false). Still using user_progress or user_metadata.  
- **Larger (net-new):**  
  - New profile/onboarding table, multi-step wizard, or separate onboarding route. Requires schema and flow design.

### Separation of fields

- **Already collected:** Email, password, display name (optional).  
- **Easy to add with minimal disruption:** Any 1–2 fields that can live in Auth `user_metadata` and/or 1–2 new columns in `user_progress` (e.g. exam_date, goal). Extend LoginScreen signup form and `signUpWithEmail`/`trackAuthenticatedSession`.  
- **Require schema and flow changes:** Multiple new fields, conditional steps, or dedicated onboarding table/flow — treat as net-new and scope first.

---

## 4. Cleanup Opportunities

### Low-risk cleanup now

- **preAssessmentComplete in TypeScript:** Never persisted; always false. Remove from `UserProfile` and any UI that uses it, or derive it as an alias for `diagnosticComplete` so naming is consistent and no duplicate concept.  
- **Comment and dead code in globalScoreCalculator:** `saveGlobalScores` is commented out and schema has no `global_scores` column. Either remove the dead save and document “compute-only”, or add column and implement save; avoid leaving commented persistence.  
- **Study plan auth placeholder:** `App.tsx` passes `idToken: 'skipped-for-supabase'` to `generateStudyPlan`. For production, pass real Supabase session token (e.g. `(await supabase.auth.getSession()).data.session?.access_token`) so `/api/study-plan` can authenticate. Fix is small; behavior is critical for deployed API.  
- **Vercel references:** Only in `archive/`, including `archive/docs-legacy-2026-03-18/FIX_UNAUTHORIZED_DOMAIN.md`. No active code or config. Optional: add a short note in deployment docs that the app is Netlify, not Vercel, and that archived Vercel docs are historical.

### Medium-risk refactor

- **practice_responses vs responses:** Practice is written to both; only `responses` is read. Options: (a) Use only `responses` for practice and stop writing to `practice_responses` (then deprecate table or keep for future analytics), or (b) Use only `practice_responses` for practice and update study plan/global score to read from it where appropriate. Either way, one source of truth for practice and a small migration/backfill if needed.  
- **Resume/session duality:** Resume state lives in both localStorage (`userSessionStorage`, `sessionStorage`) and `user_progress.last_session`. Consolidating on one source (e.g. always restore from last_session when available) would simplify behavior; needs testing for existing in-progress sessions.  
- **Naming alignment:** Align schema and TS on “diagnostic” vs “pre assessment” (e.g. use diagnostic everywhere and drop preAssessmentComplete, or add pre_assessment_complete and map clearly).  
- **study_plans (and questions/skills) migration:** Add migration file(s) to repo for `study_plans` (and optionally questions/skills) so schema is versioned and reproducible.

### Net-new decision (guidance before implementation)

- **New onboarding flow:** Multi-step wizard, “complete profile” route, or new onboarding table.  
- **New profile model:** Separate profiles table or significant new profile fields with new UX.  
- **Persistent session architecture:** Redesign of how in-progress assessments are stored (e.g. server-side sessions vs current local + last_session).  
- **Major schema redesign:** Merging or splitting response tables, new reporting tables, or large-scale migration.  
- **Global scores persistence:** Adding `global_scores` (or similar) to user_progress and wiring `saveGlobalScores` — product decision on whether to store and surface.

---

## 5. Netlify Deployment Alignment Check

### Build and publish

- **netlify.toml:** `[build] command = "npm run build"`, `publish = "dist"`. Standard for Vite SPA.  
- **Functions:** `[functions] directory = "api"`. Netlify will treat `api/*.ts` as serverless functions.

### Vercel-specific assumptions

- **In repo:** References only in `archive/docs-legacy-2026-03-14/` (DEPLOYMENT_GUIDE.md, IMPLEMENTATION_PLAN.md) and `archive/docs-legacy-2026-03-18/FIX_UNAUTHORIZED_DOMAIN.md` (example domains, dashboard URLs).  
- **Active code/config:** No `vercel.json`, no Vercel env or deploy logic. No Vercel-specific code paths.

### Supabase usage with Netlify

- **Client:** Uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite). Netlify can set these as build env vars; no Vercel assumption.  
- **Auth/session:** Supabase Auth is provider-agnostic (cookie/localStorage). No Vercel-only auth.  
- **API (study-plan):** Uses `req`/`res` and `export default async function handler` — compatible with Netlify Functions (Node). Env: `VITE_SUPABASE_URL` or `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. Netlify supports these as function env vars.  
- **Redirects:** `/*` → `/index.html` (200) for SPA; no Vercel-specific redirects.

### Gaps / cleanup

- **Study plan API auth:** Client must send real JWT for production (see section 4).  
- **Env naming:** API uses `process.env.VITE_SUPABASE_URL`; at build time Vite inlines `VITE_*` for client. For serverless functions, Netlify injects env at runtime — ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Netlify (and optionally `VITE_SUPABASE_URL` for client build). No code change if both are set; document which vars are needed for build vs functions.  
- **No cleanup required** for “remove Vercel” — there is no active Vercel config. Optional: add a single “Deployment” or “Operations” doc stating Netlify as the deployment target and listing required env vars for build and functions.

---

## 6. Recommended Next Decisions

### A. Low-risk decisions we can make now

1. **Remove or alias preAssessmentComplete** in profile type and UI; rely on diagnosticComplete for “archived short assessment” where needed.  
2. **Resolve study plan token:** Pass real Supabase session token from client to `generateStudyPlan` so `/api/study-plan` works in production.  
3. **globalScoreCalculator:** Either remove the commented save and document compute-only, or add `global_scores` (or equivalent) to user_progress and implement save.  
4. **Document Netlify** as deployment target and list env vars (client: VITE_SUPABASE_*, functions: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY).

### B. Medium-risk changes (planned refactor)

1. **practice_responses:** Decide single source of truth for practice (responses only vs practice_responses only) and either stop double-write or add reads from practice_responses; consider deprecating the unused table.  
2. **Resume state:** Unify on one source (e.g. user_progress.last_session) and reduce duplication with localStorage where safe.  
3. **Schema in repo:** Add migration(s) for `study_plans` (and optionally questions/skills) so Supabase schema is fully versioned.  
4. **Naming:** Align “diagnostic” vs “pre assessment” in schema and TS and remove redundant flags.

### C. Net-new feature/build decisions (guidance before coding)

1. **Additional user details:** If beyond 1–2 simple fields, design where they live (user_metadata vs user_progress vs new table) and whether to add an explicit onboarding step.  
2. **New onboarding flow:** Any multi-step or post-sign-up onboarding needs product and schema design.  
3. **Global scores persistence:** Whether to store and display global scores in user_progress (or elsewhere).  
4. **Major schema or session redesign:** Any consolidation of response tables, new reporting stores, or new session architecture.

---

## Summary

- **Supabase:** `user_progress` and `responses` are the core sources of truth; `practice_responses` is write-only and redundant with `responses` for current behavior; `question_reports` and `beta_feedback` are in use; `study_plans` (and content tables questions/skills) are used but not in repo migrations.  
- **Data flow:** Auth and progress tracking at login; screener/full/practice all write to `responses`; practice also writes to `practice_responses`; reports and study plan read from `responses` and user_progress.  
- **Onboarding:** Only sign-up form (email, password, optional display name); no first-time wizard. Extra fields can be added with minimal disruption via sign-up form and user_progress (or user_metadata).  
- **Cleanup:** Low-risk items (preAssessmentComplete, study plan token, global score dead code, Netlify docs); medium-risk (practice_responses vs responses, resume state, migrations, naming); net-new (onboarding flows, new profile model, schema redesign).  
- **Netlify:** No Vercel in active code; Netlify-compatible. Fix study plan auth and document env vars for build and functions.
