# Hard Blockers

Active blockers prevent specific phases from starting. If a blocker is active, stop and report — do not work around it.

## Active blockers

### B1. Keystone competency map for FTCE 036 not authored

- **Affects:** Phase 2A onward
- **Status:** Active as of 2026-04-27
- **Evidence:** `Keystone/exams/ftce/sp_036_school_psychologist_pk12/03_competency_map/` is empty
- **Owner:** Keystone authoring (out of PMP scope)
- **Unblocked when:** A `competency_map.json` file conforming to `Keystone/pipeline/schemas/competency_map.schema.json` is committed to that directory and `_status.json` shows `03_competency_map: complete`.
- **Workaround:** None for Phase 2A. Phase -1, 0, 1A–1E, 2B, and 3 can proceed without it.

### B2. Keystone test_registry entry for FTCE 036 not present

- **Affects:** Phase 2A onward
- **Status:** Active
- **Evidence:** No `test_registry.json` found at `Keystone/shared/` or per-exam.
- **Unblocked when:** A `test_registry.json` containing an FTCE_036 entry conforming to `Keystone/pipeline/schemas/test_registry.schema.json` exists and is referenced by `sync-from-keystone.mjs`.
- **Workaround:** None for Phase 2A.

### B3. Keystone schema version not pinned

- **Affects:** Phase 1D
- **Status:** Active
- **Unblocked when:** `src/tests/KEYSTONE_SCHEMA_VERSION` contains either (a) a stable schema version tag from `Keystone/pipeline/schemas/`, or (b) a Keystone commit SHA that identifies the schema snapshot. Either is acceptable — do not block Phase 1D solely because Keystone has not yet cut a formal version tag.
- **Workaround:** If no tag exists, pin to a Keystone commit SHA. Phase 1D step 1D.1 creates the file.

### B4. Atelier mockup files presence unverified

- **Affects:** Phase 1E (acceptance check), Phase 2B (visual reference)
- **Status:** Pending verification at Phase -1.3
- **Evidence:** Plan references `public/mockup-dashboard-atelier.html` and `public/mockup-results-atelier.html`. Existence in PMP repo unconfirmed at plan-write time.
- **Unblocked when:** Phase -1.3 confirms the files exist; if missing, the blocker becomes hard and Phase 1E acceptance must be loosened to "before/after screenshots show no regression" with no external mockup reference.
- **Workaround:** Phase 1E can fall back to before/after comparison; document the change in HANDOFF_LOG.md.

## Resolved blockers

(none yet)

## Proposals (out-of-scope discoveries)

When a session discovers something out-of-scope worth doing, log it here. Do NOT fix it during the active step.

(none yet)

## Format for new blockers

```
### B<N>. <one-line title>

- **Affects:** <phase IDs>
- **Status:** Active | Resolved <YYYY-MM-DD>
- **Evidence:** <file path / log line / commit / observation>
- **Owner:** <who unblocks it>
- **Unblocked when:** <verifiable condition>
- **Workaround:** <or "None">
```
