# Multi-Test Refactor

This directory is the operating system for the PraxisMakesPerfect (PMP) multi-test refactor. Every Claude Code session reads from these files; every session updates `STATE.md` and appends to `HANDOFF_LOG.md`.

This directory is fully self-contained. Phase files contain everything Claude Code needs to execute a step — no external master-plan reference, no implicit context.

## Where to start each session

1. Read `CLAUDE.md` (project root)
2. Read `STATE.md` (this directory) to find the current phase and step
3. Read `SESSION_RULES.md` (this directory)
4. Read the current phase file named in `STATE.md`
5. Execute one step. Update `STATE.md` and `HANDOFF_LOG.md`. Stop.

## File index

- `SESSION_RULES.md` — what every session must do, in order
- `COMMANDS.md` — centralized command reference (typecheck, build, dev, search, guards)
- `DECISIONS.md` — architectural commitments. Do not re-argue these.
- `BLOCKERS.md` — hard blockers. If a blocker is active, stop and report.
- `STATE.md` — the state machine. Updated every session.
- `VERIFICATION_MATRIX.md` — which checks run at which phase
- `HANDOFF_LOG.md` — append-only session log
- `PHASE_*.md` — one file per phase, with allowed files + acceptance criteria

## Operator commands

The user will say only:

- `begin next step` — execute the active step in the current phase
- `begin next phase` — only valid when the current phase's exit criteria are met
- `continue` — resume the active step if interrupted
- `verify` — run the verification matrix for the current phase
- `stop and report` — write current state to STATE.md and HANDOFF_LOG.md, then stop

## Phase queue (high-level)

| # | Phase | Depends on |
|---|---|---|
| -1 | Bootstrap | — |
| 0 | Instrumentation | -1 |
| 1A | Extract Praxis package | 0 |
| 1B | Validate test packages | 1A |
| 1C | Extract prompts | 1A |
| 1D | Keystone sync script | 1A, B3 unblocked |
| 1E | Design tokens | 1A |
| 2A | FTCE 036 package (internal) | 1B, 1C, 1D, B1+B2 unblocked |
| 2B | Test selector mockups | 1E (placeholders OK if 2A unfinished) |
| 3 | Database test scoping | 1A + stable activeTestId |
| 4A | Internal switching (flagged) | 2A, 2B, 3 |
| 4B | Public enablement | 4A + operator-confirmed 7-day soak |

Phases 1B, 1C, 1D, 1E run in parallel after 1A. Phase 3 runs in parallel with 1B–1E and 2A.

## What this directory does NOT do

- It does not contain code. Code lives in the PMP repo.
- It does not contain Keystone artifacts. Those live in the sibling Keystone repo.
- It does not replace `CLAUDE.md` at the repo root. That remains the project-wide source of truth.
