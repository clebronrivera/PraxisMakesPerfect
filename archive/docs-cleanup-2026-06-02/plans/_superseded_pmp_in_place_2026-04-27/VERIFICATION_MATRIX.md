# Verification Matrix

Which checks must pass at the end of each phase. Steps inside a phase may run a subset; phase-exit requires all marked ✓.

| Phase | typecheck | unit tests | validate:tests | build | dev:netlify smoke | screenshots match |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| -1 Bootstrap | — | — | — | — | — | — |
| 0 Instrumentation | ✓ | ✓ | — | ✓ | ✓ | ✓ pixel-identical to pre-Phase-0 baseline |
| 1A Extract package | ✓ | ✓ | — | ✓ | ✓ | ✓ identical to post-Phase-0 |
| 1B Validate | ✓ | ✓ | ✓ | ✓ | — | — |
| 1C Prompts | ✓ | ✓ | ✓ | ✓ | ✓ tutor + study plan | — |
| 1D Sync script | ✓ | — | ✓ | — | — | — |
| 1E Tokens | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ all surfaces |
| 2A FTCE pkg | ✓ | ✓ | ✓ both packages | ✓ 2 chunks | — | — |
| 2B Mockups | — | — | — | — | mockups load (port 8888) | — |
| 3 DB scoping | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| 4A Internal switch | ✓ | ✓ | ✓ | ✓ | ✓ flag on | ✓ |
| 4B Public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Smoke walk (`npm run dev:netlify`, port 8888)

Per `CLAUDE.md`, always use `npm run dev:netlify` (port 8888), never raw `vite` (port 5173 — study plan API is unavailable there).

1. Sign up new user → onboarding completes
2. Take screener → results render
3. Take adaptive diagnostic → results render
4. Generate study plan → 9 sections present, no broken interpolation
5. AI Tutor: quiz mode + vocabulary artifact download
6. Admin dashboard (admin email): all 7 tabs load
7. **(Phase 2A+)** Multi-test smoke: switch active test, verify progress freezes/resumes per `(user_id, test_id)`
8. **(Phase 3+)** RPC scoping smoke: trigger redemption-quarantine flow on Test A, verify it does not affect Test B

## Screenshot baselines

| Phase | Baseline source | Surfaces |
|---|---|---|
| 0 | Pre-Phase-0 git tag | dashboard, results, screener, login |
| 1A | Post-Phase-0 baseline | dashboard, results, screener, login |
| 1E | Post-Phase-1A baseline | all surfaces with color tokens |
| 4A | Post-Phase-3 baseline | onboarding new step, profile switcher |
| 4B | Post-Phase-4A baseline | landing copy, marketing surfaces |

Capture baselines at each phase boundary. Store in `docs/screenshots/baselines/<phase-id>/`.
