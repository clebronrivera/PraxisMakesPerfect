# Multi-Test Refactor State

Last updated: 2026-04-27
Last session: bootstrap (created OS files)

## Current Position

Current phase: 0 (Instrumentation)
Current step: 0.1
Status: not_started

## Phase progress

- [x] Phase -1: Bootstrap (completed 2026-04-27 during OS file creation)
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

**Step ID:** 0.1
**Step name:** Create TestPackage types
**Goal:** Define `TestPackage`, `TestDomain`, `TestSkill`, `TestSubskill`, `TestMicroskill`, `ContentArea`, `TestCopy` interfaces.

**Allowed files:**
- `src/tests/types.ts` (create)

**Forbidden files:** anything outside `src/tests/types.ts`

**Acceptance criteria:**
- File compiles
- Interfaces mirror Keystone's `competency_map.schema.json` `$defs`
- No runtime usage yet

**Verification:**
- `npm run typecheck` passes
- Pre-flight check from `AUDIT_CHECKS.md` Phase 0 row passes
- Post-audit check from `AUDIT_CHECKS.md` Phase 0 step 0.1 row passes

## Active blockers

See `BLOCKERS.md`. None block Phase 0.

## Verification Status (current phase)

| Check | Status | Notes |
|---|---|---|
| typecheck | not_run | |
| unit tests | not_run | |
| build | not_run | |
| dev:netlify smoke | not_run | |
| screenshots match | not_run | Pixel-identical to pre-Phase-0 baseline |

## Next Action

When the user says "begin next step":

1. Read `CLAUDE.md`, `SESSION_RULES.md`, `BLOCKERS.md`, `AUDIT_CHECKS.md`, `PHASE_0_INSTRUMENTATION.md` (in that order).
2. Run `audit os` (OS integrity).
3. Run pre-flight check for Phase 0 from `AUDIT_CHECKS.md`.
4. Create `src/tests/types.ts` with the interfaces specified in `PHASE_0_INSTRUMENTATION.md` step 0.1.
5. Run post-audit check for step 0.1.
6. Update this `STATE.md`: mark step 0.1 complete, set step 0.2 as Active.
7. Append to `HANDOFF_LOG.md`.
8. Report and stop.
