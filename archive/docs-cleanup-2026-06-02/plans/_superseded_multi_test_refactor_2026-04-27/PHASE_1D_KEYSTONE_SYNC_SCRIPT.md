# Phase 1D — Keystone Sync Script

## Goal

A node script `scripts/sync-from-keystone.mjs <TEST_ID>` reads `Keystone/exams/<system>/<exam>/08_handoff/`, transforms artifacts into the PMP `TestPackage` shape, writes to `src/tests/<TEST_ID>/`, and exits non-zero if validation fails.

## Scope

### Allowed files (create / modify)

- `scripts/sync-from-keystone.mjs` (new)
- `src/tests/KEYSTONE_SCHEMA_VERSION` (new — pinned version string or commit SHA)
- `package.json` (add `sync:keystone` script)
- `CLAUDE.md` (document the script + workflow)
- Optionally update Keystone's pipeline README (cross-repo — ask the operator before editing the Keystone repo)

### Forbidden files (no modification)

- Adding FTCE 036 content (Phase 2A scope)
- Modifying any `src/tests/PRAXIS_5403/*` content (the script must round-trip the existing package cleanly without divergence)

## Hard blockers preventing this phase

- B3 (Keystone schema not pinned) — see `BLOCKERS.md`. Step 1D.1 is the resolution mechanism for B3.

## Steps

### 1D.1 — Pin Keystone schema version

Allowed: `src/tests/KEYSTONE_SCHEMA_VERSION`

Acceptance:
- File contains a stable version string OR a Keystone commit SHA
- Matches a Keystone-side tag/commit that the operator can identify

Verification:
- `cat src/tests/KEYSTONE_SCHEMA_VERSION` returns a non-empty value
- Operator confirms the value identifies a real Keystone state

Note: If Keystone has not yet tagged a schema version, pin a commit SHA instead. Either is acceptable per `BLOCKERS.md` B3.

### 1D.2 — Build the transformer

Allowed: `scripts/sync-from-keystone.mjs`

Acceptance:
- Reads `Keystone/exams/<system>/<exam>/08_handoff/`
- Validates Keystone artifacts against pinned schemas
- Outputs `src/tests/<TEST_ID>/` package
- Round-trip on PRAXIS_5403 produces a package byte-identical (modulo allowed normalization — e.g., key ordering, trailing newlines) to the manually-constructed Phase 1A output

Verification:
- `npm run sync:keystone PRAXIS_5403` exits 0
- `git diff src/tests/PRAXIS_5403/` shows zero substantive changes after the round-trip
- `npm run validate:tests` still passes

### 1D.3 — Document the script

Allowed: `CLAUDE.md` (add "Keystone Sync" section)

Acceptance:
- Section explains when to run, blocker handling (B1/B2), where Keystone lives, and what the script *does not* do (e.g., does not author Keystone artifacts)
- Cross-references this directory's `BLOCKERS.md` and `DECISIONS.md` items 4 and 5

Verification:
- `CLAUDE.md` renders cleanly
- A peer-read confirms a Claude Code session can run `npm run sync:keystone <TEST_ID>` based solely on the new section

## Phase Exit Criteria

- Round-trip on PRAXIS_5403 produces an identical package
- `npm run validate:tests` still passes
- B3 marked resolved in `BLOCKERS.md` with the pinned version recorded
- `STATE.md` updated to next phase
- Phase branch `refactor/multi-test/phase-1d` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>`. The script is additive; reverting removes it without affecting existing builds. If the round-trip step modified `src/tests/PRAXIS_5403/` content, revert that commit specifically.
