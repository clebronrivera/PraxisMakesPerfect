# Verification Matrix

Which checks must pass at the end of each phase. Steps inside a phase may run a subset; phase-exit requires all.

| Phase | typecheck | unit tests | validate:tests | build | dev:netlify smoke | screenshots match |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| -1 Bootstrap | — | — | — | — | — | baseline captured |
| 0 Instrumentation | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 1A Extract package | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 1B Validate | ✓ | ✓ | ✓ | ✓ | — | — |
| 1C Prompts | ✓ | ✓ | ✓ | ✓ | ✓ tutor + study plan | — |
| 1D Sync script | ✓ | — | ✓ | — | — | — |
| 1E Tokens | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ all surfaces |
| 2A FTCE pkg | ✓ | ✓ | ✓ both pkgs | ✓ 2 chunks | — | — |
| 2B Mockups | — | — | — | — | mockups load | — |
| 3 DB scoping | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| 4A Internal switch | ✓ | ✓ | ✓ | ✓ | ✓ flag on | ✓ |
| 4B Public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## "Screenshots match" — the standard

Compare current dev:netlify screenshots against the Phase -1.2 baselines stored in `docs/plans/multi-test-refactor/baselines/`. Acceptance criterion: no layout regressions, no missing content, no obvious color/spacing changes. Pixel-level diff is NOT required (font rendering and scrollbar widths produce noise). Visual equivalence is human-eyeballed unless a phase explicitly states otherwise.

## Smoke walk (dev:netlify)

Per `CLAUDE.md`, always use `npm run dev:netlify` (port 8888), not raw `vite`.

1. Sign up new user → onboarding completes
2. Take screener → results render
3. Take adaptive diagnostic → results render
4. Generate study plan → 9 sections present, no broken interpolation
5. AI Tutor: quiz mode + vocabulary artifact download
6. Admin dashboard (admin email): all 7 tabs load
7. (Phase 2A+) Multi-test smoke: switch active test, verify progress freezes/resumes per `(user_id, test_id)`

## Phase exit gate

A phase is complete when all of these are true:

1. Every step in the phase file is marked complete in `STATE.md`
2. Every check in this matrix's row for that phase passes
3. Pre-existing failures (from before this refactor) are explicitly listed in `HANDOFF_LOG.md` and acknowledged
4. `STATE.md` Active Step has been advanced to the next phase's first step
5. The phase's git branch has been squash-merged to main (per `DECISIONS.md` item 10)

If any one of these is false, the phase is not complete. Do not advance.
