# Commands

Single source of truth for every command referenced in phase files. If a phase says "run typecheck", that means `npm run typecheck` from this list. Add new commands here before referencing them in a phase.

## Standard checks

| Purpose | Command | Notes |
|---|---|---|
| Type check | `npm run typecheck` | Must pass at end of every code phase. |
| Unit tests | `npm test` | Pre-existing failures must be documented in HANDOFF_LOG. |
| Validate test packages | `npm run validate:tests` | Available after Phase 1B. |
| Production build | `npm run build` | Vite emits per-test chunks after Phase 1A. |
| Dev server | `npm run dev:netlify` | **Always port 8888**, not raw `vite` (5173) — per `CLAUDE.md`. |
| Build report | `npm run build -- --report` | Inspect bundle for per-test chunk split. |

## Search / verification checks

| Purpose | Command |
|---|---|
| Find leftover readiness constants | `grep -r "TOTAL_SKILLS\|READINESS_TARGET\|READINESS_GOAL_PCT" src/` |
| Find leftover Praxis-only domain id | `grep -rn "PraxisDomainId" src/` |
| Find leftover skill content imports | `grep -rn "from ['\"][^'\"]*src/data/\(questions\|learningModules\|master-glossary\|skill-metadata-v1\|skillIdMap\)" src/` |
| List operating-system files | `ls docs/plans/multi-test-refactor/` |
| Count operating-system files | `find docs/plans/multi-test-refactor -maxdepth 1 -type f -name "*.md" \| wc -l` |

## Phase-specific guards

| Phase | Command | Purpose |
|---|---|---|
| 1D | `npm run sync:keystone PRAXIS_5403` | Round-trip sync (must produce identical package). |
| 1D | `npm run sync:keystone FTCE_036` | First-time FTCE sync (Phase 2A). |
| 3 | `npm run check:test-scoped-supabase` | Lightweight guard script — rejects raw `supabase.from('<affected_table>')` outside approved wrappers. |
| 3 | `supabase db push` | Apply migrations to local Supabase. |
| 3 | `supabase db reset` | Reset and re-apply for clean verification. |
| 3 | `supabase branches create <name>` | Create a Supabase preview branch for Phase 3 dry-runs. |
| 3 | `supabase db dump --data-only -f backup-<date>.sql` | Pre-migration backup. |

## Smoke walk (manual, after dev:netlify)

In order:

1. Sign up new user → onboarding completes
2. Take screener → results render
3. Take adaptive diagnostic → results render
4. Generate study plan → 9 sections present, no broken interpolation
5. AI Tutor → quiz mode + vocabulary artifact download
6. Admin dashboard (admin email) → all 7 tabs load
7. (Phase 2A+) Multi-test smoke: switch active test, verify progress freezes/resumes per `(user_id, test_id)`

## Baseline screenshot capture (Phase -1.2)

Used as the visual reference for "screenshots match" in the verification matrix. Run on the pre-refactor branch before any code changes:

| Surface | URL after sign-in | Notes |
|---|---|---|
| Login | `/` (signed out) | Capture boot animation final frame |
| Dashboard | `/` (signed in) | Capture initial state |
| Screener | `/screener` | Capture mid-session and results |
| Results | `/results` | Capture after diagnostic |
| Study plan | `/study-plan` | Capture all 9 sections |
| Tutor | `/tutor` | Capture quiz mode |
| Admin (admin email) | `/admin` | Capture all 7 tabs |

Capture method: full-page PNG via Chrome devtools or Playwright `page.screenshot({fullPage: true})`. Store in `docs/plans/multi-test-refactor/baselines/<surface>-pre-refactor.png` (this directory is committed; baselines are deleted after Phase 1E completes).

## Adding a new command

When a phase needs a command not listed here:

1. Add the row to the appropriate section above.
2. Reference the command by name (`npm run X`) in the phase file.
3. Never inline a command in a phase file without adding it here first.
