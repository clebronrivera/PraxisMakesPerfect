# Multi-Test Refactor — Operating System

This directory is the operating system for the multi-test refactor of PraxisMakesPerfect. Every Claude Code session reads from these files; every session updates `STATE.md` and appends to `HANDOFF_LOG.md`.

**Path commitment.** This plan refactors PMP in place, evolving it from single-exam (Praxis 5403) to multi-exam (Praxis 5403 + FTCE 036 + future). The PASS V1 greenfield path was considered and rejected (see `DECISIONS.md` #0). Do not start a separate greenfield project.

## Where to start each session

1. Read `CLAUDE.md` (project root)
2. Read `STATE.md` (this directory) to find the current phase and step
3. Read `SESSION_RULES.md`
4. Read `BLOCKERS.md` — if anything blocks the current phase, halt
5. Read `AUDIT_CHECKS.md` and run the pre-flight check for the current phase
6. Read the current phase file named in `STATE.md`
7. Execute one step. Update `STATE.md` and `HANDOFF_LOG.md`. Stop.

## File index

| File | Purpose | Mutability |
|---|---|---|
| `README.md` | Orientation (this file) | append-only |
| `SESSION_RULES.md` | What every session must do | append-only |
| `DECISIONS.md` | Architectural commitments. Do not re-argue | append-only |
| `BLOCKERS.md` | Hard blockers + proposals | mutable |
| `STATE.md` | The state machine, updated every session | mutable |
| `VERIFICATION_MATRIX.md` | Which checks run at which phase | append-only |
| `AUDIT_CHECKS.md` | Pre-flight + post-audit safeguards per phase | append-only |
| `HANDOFF_LOG.md` | Append-only session log | append-only |
| `PHASE_*.md` | One file per phase | append-only |

## Operator commands

| Command | Effect |
|---|---|
| `begin next step` | Execute the active step in the current phase |
| `begin next phase` | Only valid when current phase exit criteria are met |
| `continue` | Resume the active step if interrupted |
| `verify` | Run the verification matrix for the current phase |
| `audit` | Run pre-flight + post-audit checks for the current phase |
| `audit os` | Run OS integrity check (file presence, decisions hash) |
| `force advance` | Bypass a `human_gate: true` step after operator confirms |
| `stop and report` | Write current state to STATE.md and HANDOFF_LOG.md, then stop |

## Phase queue (serialized — see DECISIONS.md #13)

```
Phase -1  Bootstrap                       (complete on creation of this dir)
Phase 0   Instrumentation                 ~3 days
Phase 1A  Extract Praxis package          ~3 days
Phase 1B  Validate test packages          ~1 day
Phase 1C  Extract prompts                 ~2 days
Phase 1D  Keystone sync script            ~2 days  (depends on B2, B3)
Phase 1E  Design tokens                   ~3 days
Phase 2A  FTCE 036 internal package       ~1 week  (depends on B1, B2, B4)
Phase 2B  Mockups                         ~3 days
Phase 3   Database test scoping           ~1 week
Phase 4A  Internal switching (flagged)    ~3 days
Phase 4B  Public enablement               1 day + 7-day soak
```

Phases run serially. The earlier "1B–1E in parallel" claim is dropped — clarity beats marginal speed.
