# docs/ cleanup — 2026-06-02

Sheriff pass over `docs/`. These files were **moved out of `docs/`** (via `git mv`, history preserved) because they were superseded, shipped, point-in-time, or misplaced. Nothing was deleted. Restore any file with `git mv` back to `docs/` if it becomes relevant again.

The goal was to leave `docs/` at just the **canonical/active** set defined by `docs/DOCS_SYSTEM.md` (plus current backlog/roadmap/brand/decisions/specs and the two newest handoffs).

## What moved and why

### Superseded / shipped handoffs & briefs
| File | Reason |
|---|---|
| `RENAME_MIGRATION_PLAN.md` | "→ Adaptive Prep" rename; superseded by the **PASS** brand |
| `HANDOFF_indigo_violet_retheme.md` | Re-theme shipped 2026-06-02 |
| `HANDOFF_2026-05-31_landing_brand_honesty.md` | Honesty fix shipped |
| `HANDOFF_dashboard_hybrid_redesign.md` | Dashboard redesign exploration, redirected |
| `BRIEF_dashboard_greenfield_reimagining.md` | Green-field dashboard brief, redirected |
| `BUILD_BUNDLE_SIZE_WARNINGS.md` | Resolved by the launch hotfix (bundle −91%) |
| `UI_STRUCTURE_AUDIT.md` | Point-in-time audit (2026-04-17) |

### Older content / diagnostic planning (2026-03/04, work landed)
`COWORKER_HANDOFF.md`, `DEV_HANDOFF_PRACTICE_AND_MODULES.md`, `diagnostic-content-priority.md`, `diagnostic-output-contract-plan.md`, `diagnostic-synthesis-2026-03-29.md`, `misconception-taxonomy-design.md`, `misconception-taxonomy-stage1-handoff.md`

### plans/
- `_superseded_multi_test_refactor_2026-04-27/` and `_superseded_pmp_in_place_2026-04-27/` — two near-mirror superseded plan trees (~20 files each)
- `gap-closer-execution-plan.md`, `gap-closer-integration-plan.md` — no longer referenced by the active backlog

### audits/ (point-in-time snapshots)
`adaptive-diagnostic-audit.md`, `audit-confidence-timing.md`, `diagnostic-reliability-2026-04-17-gmail.md`, `distractor-audit.md`, `ets-5403-competency-audit.md`, `misconception-audit.md`, `vocab-tag-audit.md`

### Misplaced binary
`PraxisMakesPerfect_Alignment_Report_2026-03-23.docx` — binary report; `docs/` is for markdown. Its findings live on in `docs/ISSUE_LEDGER.md` (which now points here).

## References updated when these moved
- `docs/ISSUE_LEDGER.md` → the `.docx` path (2 spots)
- `docs/LAUNCH_READINESS.md` → `BUILD_BUNDLE_SIZE_WARNINGS.md` and `RENAME_MIGRATION_PLAN.md`

## Also removed (not archived — pure junk)
`docs/.DS_Store`, `docs/plans/.DS_Store` (untracked, gitignored).
