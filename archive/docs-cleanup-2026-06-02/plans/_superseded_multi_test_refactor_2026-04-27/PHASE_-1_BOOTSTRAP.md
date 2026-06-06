# Phase -1 — Bootstrap

## Goal

Establish the operating system inside the PMP repo (the 20 files that govern this refactor live at `docs/plans/multi-test-refactor/`), capture pre-refactor baseline screenshots, and verify that the visual reference mockups exist.

## Scope

### Allowed files (create / modify)

- `docs/plans/multi-test-refactor/*.md` (create)
- `docs/plans/multi-test-refactor/baselines/*.png` (create — Phase -1.2)
- `BLOCKERS.md` (modify — Phase -1.3, to resolve or escalate B4)

### Forbidden files (no modification)

- Anything outside `docs/plans/multi-test-refactor/` and its `baselines/` subdirectory.

Reads (`CLAUDE.md`, `package.json`, repo source) are unrestricted per `SESSION_RULES.md`.

## Hard blockers preventing this phase

None.

## Steps

### -1.1 — Move operating-system files into the repo

Goal: Place the 20 operating-system files at `docs/plans/multi-test-refactor/`.

Allowed files (subset of phase Allowed):
- `docs/plans/multi-test-refactor/*.md` (create)

Acceptance criteria:
- `docs/plans/multi-test-refactor/` exists as a tracked directory in git
- All 20 expected files exist (deterministic per-file check below)
- File contents match the workspace scaffold byte-for-byte

Verification:
- `find docs/plans/multi-test-refactor -maxdepth 1 -type f -name "*.md" | wc -l` returns exactly 20
- Per-file existence check:
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
- Spot-check one file's content matches workspace scaffold (e.g. `head SESSION_RULES.md`)

### -1.2 — Capture baseline screenshots

Goal: Capture pre-refactor screenshots for every surface affected by Phase 0 / 1A / 1E. Used as the visual reference for "screenshots match" in `VERIFICATION_MATRIX.md`.

Allowed files:
- `docs/plans/multi-test-refactor/baselines/*.png` (create)

Acceptance criteria:
- All surfaces listed in `COMMANDS.md` § "Baseline screenshot capture" have a PNG in `baselines/`
- Each filename matches `<surface>-pre-refactor.png` (e.g. `dashboard-pre-refactor.png`)
- Screenshots taken on a clean checkout of `main` with `npm run dev:netlify` running
- One PNG per surface; full-page where applicable

Verification:
- `ls docs/plans/multi-test-refactor/baselines/*-pre-refactor.png | wc -l` ≥ 7
- Visual spot-check: each PNG opens, is not blank, shows the labeled surface

### -1.3 — Verify Atelier mockup files (resolve or escalate B4)

Goal: Confirm that `public/mockup-dashboard-atelier.html` and `public/mockup-results-atelier.html` exist in the PMP repo. Phase 1E acceptance depends on them.

Allowed files:
- `BLOCKERS.md` (modify B4 entry — resolve or harden)

Acceptance criteria:
- If both files exist: mark B4 resolved in `BLOCKERS.md` with the file paths recorded
- If either file is missing: keep B4 active, document Phase 1E fallback ("before/after screenshots vs Phase -1.2 baselines, no external mockup reference"), and log the missing file in `HANDOFF_LOG.md`

Verification:
- `test -f public/mockup-dashboard-atelier.html && test -f public/mockup-results-atelier.html && echo "B4 RESOLVED" || echo "B4 STILL ACTIVE"`

## Phase Exit Criteria

- All 20 files created in `docs/plans/multi-test-refactor/`
- File-presence verification passes
- Baseline screenshots captured for all surfaces
- B4 resolved or hardened, with Phase 1E fallback documented if hardened
- `STATE.md` updated to Phase 0 step 0.1
- `HANDOFF_LOG.md` appended with the bootstrap session entry

## Rollback procedure

This phase only adds files; it does not modify existing code or database state. Rollback is `rm -rf docs/plans/multi-test-refactor/` followed by `git checkout BLOCKERS.md` (if B4 was edited).
