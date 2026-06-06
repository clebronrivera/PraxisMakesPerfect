# Multi-Test Refactor State

Last updated: 2026-04-27 (initial scaffold from workspace; not yet executed in PMP repo)
Last session: none — initial scaffold

## Current Position

Current phase: -1 (Bootstrap)
Current step: -1.1
Status: not_started

## Phase progress

- [ ] Phase -1: Bootstrap
- [ ] Phase 0: Instrumentation
- [ ] Phase 1A: Extract Praxis package
- [ ] Phase 1B: Validate test packages
- [ ] Phase 1C: Extract prompts
- [ ] Phase 1D: Keystone sync script
- [ ] Phase 1E: Design tokens
- [ ] Phase 2A: Add FTCE 036 package (internal)
- [ ] Phase 2B: Test selector mockups
- [ ] Phase 3: Database test scoping
- [ ] Phase 4A: Internal test switching (flagged)
- [ ] Phase 4B: Public multi-test enablement

## Active Step

Step ID: -1.1
Step name: Move operating-system files into PMP repo
Goal: Copy the 20 files from this scaffold (currently in the workspace folder) into `docs/plans/multi-test-refactor/` in the PraxisMakesPerfect repo.

Allowed files:
- `docs/plans/multi-test-refactor/*.md` (create)

Forbidden files: anything outside `docs/plans/multi-test-refactor/`

Acceptance criteria:
- All 20 files in PHASE_-1_BOOTSTRAP.md's File Manifest exist at `docs/plans/multi-test-refactor/`
- File-count check returns exactly 20
- Per-file existence check passes (see Verification below)

## Active blockers

See `BLOCKERS.md`. None block Phase -1 or Phase 0.

## Verification Status (current phase)

| Check | Status | Notes |
|---|---|---|
| All 20 files exist (deterministic shell check) | not_run | |
| File-count check returns 20 | not_run | |
| `git status` shows new directory | not_run | |
| `BLOCKERS.md` B4 (mockup file presence) resolved or kept active | not_run | Phase -1.3 task |
| Baseline screenshots captured | not_run | Phase -1.2 task |

## Next Action

When the user says "begin next step":

1. Confirm the 20 files exist in `docs/plans/multi-test-refactor/` (copy from workspace if not).
2. Run the deterministic verification:
   ```bash
   for f in README.md SESSION_RULES.md COMMANDS.md DECISIONS.md BLOCKERS.md STATE.md \
            VERIFICATION_MATRIX.md HANDOFF_LOG.md \
            PHASE_-1_BOOTSTRAP.md PHASE_0_INSTRUMENTATION.md \
            PHASE_1A_EXTRACT_PRAXIS_PACKAGE.md PHASE_1B_VALIDATE_TEST_PACKAGES.md \
            PHASE_1C_EXTRACT_PROMPTS.md PHASE_1D_KEYSTONE_SYNC_SCRIPT.md \
            PHASE_1E_DESIGN_TOKENS.md \
            PHASE_2A_ADD_FTCE036_PACKAGE_INTERNAL.md PHASE_2B_TEST_SELECTOR_MOCKUPS.md \
            PHASE_3_DATABASE_TEST_SCOPING.md \
            PHASE_4A_INTERNAL_TEST_SWITCHING.md PHASE_4B_PUBLIC_MULTI_TEST_ENABLEMENT.md; do
     test -f "docs/plans/multi-test-refactor/$f" || { echo "MISSING: $f"; exit 1; }
   done
   echo "All 20 files present."
   ```
3. Set Phase -1 step -1.2 (capture baseline screenshots) as Active.
4. Update this `STATE.md`. Append to `HANDOFF_LOG.md`.
5. Report and stop. The user must explicitly say "begin next step" to start step -1.2.

## How to read this file

- "Current phase / step" = where the work is right now
- "Active Step" = full requirements for the work in flight
- "Verification Status" = checks for the current phase only; reset when phase advances
- Do not edit "Phase progress" by hand — it auto-updates as phases complete
