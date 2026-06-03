# Phase 1D — Keystone Sync Script

## Goal

A node script `scripts/sync-from-keystone.mjs <TEST_ID>` reads multiple Keystone folders for the named exam, transforms artifacts into the PMP `TestPackage` shape, writes to `src/tests/<TEST_ID>/`, and exits non-zero if validation fails.

**Important correction from earlier draft:** the script reads from **multiple folders**, not just `08_handoff/`. Keystone's handoff dir is mostly empty across exams; authored content lives across `00_blueprint/`, `02_question_bank/enriched/`, `03_competency_map/`, `05_chapters/`. See `DECISIONS.md` #4.

## Scope

### Allowed files
- `scripts/sync-from-keystone.mjs` (new)
- `src/tests/KEYSTONE_SCHEMA_VERSION` (new — pinned version string)
- `package.json` (add `sync:keystone` script)
- `CLAUDE.md` (document the script + workflow)

### Forbidden
- Adding FTCE 036 content (Phase 2A)
- Modifying `src/tests/PRAXIS_5403/*` content (the script must round-trip the existing package cleanly without diffs)

## Hard blockers

- **B3** (Keystone schema not pinned) — see `BLOCKERS.md`. Step 1D.1 IS the resolution; if Keystone's schemas are still mid-flight, pin to a HEAD SHA with explicit "best-effort current" annotation per B3 unblock criteria (b).
- **B2** (canonical multi-exam test_registry) — Phase 1D.2 must address this with one of the two paths in B2: (a) author `Keystone/shared/test_registry.json` first, or (b) record the per-exam-no-registry decision in `DECISIONS.md` and have the script accept a per-exam path argument.

## Steps

### 1D.1 Pin Keystone schema version
Allowed: `src/tests/KEYSTONE_SCHEMA_VERSION`
Acceptance: file contains a stable version string matching a Keystone-side tag/commit (or a HEAD SHA with "best-effort current" annotation per B3 (b)).
Note: if Keystone has not yet tagged a schema version, this step records the chosen pin policy.

### 1D.2 Build the transformer
Allowed: `scripts/sync-from-keystone.mjs`
Acceptance:
- Reads from multiple folders per exam:
  - `Keystone/exams/<system>/<exam>/00_blueprint/` (blueprint json/md/pdf)
  - `Keystone/exams/<system>/<exam>/02_question_bank/enriched/*.json` (item bank)
  - `Keystone/exams/<system>/<exam>/03_competency_map/competency_map.json` (taxonomy)
  - `Keystone/exams/<system>/<exam>/05_chapters/v0.3/**/*.md` (chapters)
  - `Keystone/exams/<system>/<exam>/_status.json` (per-phase status; bail with helpful error if any required phase is `missing`)
  - Optionally `Keystone/exams/<system>/<exam>/08_handoff/` if present
  - Optionally `Keystone/shared/test_registry.json` if path (a) of B2 was taken; else accepts a per-exam test definition
- Validates each artifact against pinned schemas in `Keystone/pipeline/schemas/`
- Outputs `src/tests/<TEST_ID>/` package
- Round-trip on PRAXIS_5403 produces a package byte-identical (modulo allowed normalization — sorted keys, normalized whitespace) to the manually-constructed Phase 1A output
- If a required Keystone artifact is missing, exits non-zero with a clear message naming the missing file and its expected path. Does NOT fabricate content.
Verification: `npm run sync:keystone PRAXIS_5403`; diff result against current `src/tests/PRAXIS_5403/`.

### 1D.3 Document the script
Allowed: `CLAUDE.md` (add "Keystone Sync" section)
Acceptance: section explains when to run, blocker handling, where Keystone lives, how to interpret missing-artifact errors, and the difference between dry-run and write modes.

## Phase Exit Criteria

- Round-trip on PRAXIS_5403 produces an identical package
- `npm run validate:tests` still passes
- `STATE.md` updated to Phase 1E step 1E.1

## Rollback

If the sync script's output diverges from the manually-constructed PRAXIS_5403 package, fix the script — do not edit the package by hand to match. The whole point of 1D is that the script is canonical.
