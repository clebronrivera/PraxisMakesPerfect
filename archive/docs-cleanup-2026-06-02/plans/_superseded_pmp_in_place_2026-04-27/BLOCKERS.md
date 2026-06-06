# Hard Blockers

Active blockers prevent specific phases from starting. If a blocker is active for the current phase, STOP and report — do not work around it.

## Active blockers

### B1. Keystone competency map for FTCE 036 not authored
- **Affects:** Phase 2A onward
- **Status:** Active as of 2026-04-27
- **Evidence:** `Keystone/exams/ftce/sp_036_school_psychologist_pk12/03_competency_map/` is empty. `_status.json` reports `"03_competency_map": {"status": "missing"}`.
- **Owner:** Keystone authoring (out of PMP scope)
- **Unblocked when:** A `competency_map.json` conforming to `Keystone/pipeline/schemas/competency_map.schema.json` exists in that directory and `_status.json` shows `03_competency_map: complete`.
- **Workaround:** None. Phase 0 through 1E proceed normally (touch only Praxis 5403). Phase 2A blocks.

### B2. Canonical multi-exam test_registry not authored at Keystone/shared/
- **Affects:** Phase 1D, Phase 2A
- **Status:** Active
- **Evidence:** A per-exam `test_registry.json` exists at `Keystone/exams/pcmas/prek12_spanish/07_audits/pcmas_pipeline_docs/test_registry.json`, but no canonical Keystone-wide registry listing all 11 exams exists at `Keystone/shared/`.
- **Decision needed:** Either (a) author a canonical `Keystone/shared/test_registry.json` listing every test, or (b) update `sync-from-keystone.mjs` to operate per-exam without a central registry.
- **Unblocked when:** Either (a) is done, or (b) is decided in `DECISIONS.md` and the script accepts a per-exam path argument.
- **Workaround:** None for Phase 1D round-trip. Phase 1D step 1D.2 must address this.

### B3. Keystone schema version not pinned
- **Affects:** Phase 1D
- **Status:** Active
- **Note:** This blocker is partially self-resolving — Phase 1D step 1D.1 IS to pin the version. But the version pin requires Keystone to have a stable, tagged set of schemas. If Keystone is still mutating `pipeline/schemas/` in flight, the pin is unstable.
- **Unblocked when:** Either (a) Keystone confirms `pipeline/schemas/` is stable enough to pin (a git tag or commit SHA on the Keystone repo), or (b) Phase 1D pins to a moving HEAD with explicit acknowledgment in `KEYSTONE_SCHEMA_VERSION` that the pin is "best-effort current" and may need re-pinning.

### B4. FTCE 036 blueprint not authored
- **Affects:** Phase 2A
- **Status:** Active
- **Evidence:** `Keystone/exams/ftce/sp_036_school_psychologist_pk12/00_blueprint/` is empty per `_status.json` (2026-04-20). The sync script needs at minimum either a blueprint or an inferred blueprint from competency map + chapter outline.
- **Owner:** Keystone authoring
- **Unblocked when:** `00_blueprint/` contains an authored blueprint document. Format TBD by Keystone (`.md`, `.pdf`, or `.json`).
- **Workaround:** None for Phase 2A.

## Resolved blockers

(none yet)

## Proposals (out-of-scope discoveries)

When a session discovers something out-of-scope worth doing, log it here. Do NOT fix it during the active step. Triaged at each phase boundary per `SESSION_RULES.md`.

(none yet)
