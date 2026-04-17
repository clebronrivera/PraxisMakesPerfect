# Documentation Consolidation Report

Reviewed on 2026-03-14.
Updated on 2026-03-18 after archiving stale Firebase operational docs left over from the Supabase migration.

This report is the authoritative summary of the root-level documentation cleanup. It replaces root-level documentation sprawl with one master report, one registry, and a small canonical set of active references.

## Canonical Rules

- Praxis content areas are the primary structure for assessment building, top-level scoring, and user-facing reporting.
- Domains and skills are taxonomy-derived. They are resolved from `skillId`, not inferred from question text, keywords, or ad hoc hard-coding.
- `skillId` is required for reliable question classification, analytics, adaptive practice, and reporting.
- Current code and the canonical docs listed in `README.md` override older plans, generated reports, and untimestamped completion claims.
- Historical documentation is preserved for provenance in `archive/docs-legacy-2026-03-14/`, but it is not active guidance.

## Consolidation Outcome

- Root-level docs reviewed: 46
- Canonical docs retained in root after the 2026-03-18 cleanup: 7
- Historical docs archived across the consolidation passes: 39
- Canonical root set:
  - `README.md`
  - `DOCUMENT_CONSOLIDATION_REPORT.md`
  - `DOCUMENT_REGISTRY.md`
  - `REWRITE_DEVELOPMENT_GUIDE.md`
  - `CODEBASE_OVERVIEW.md`
  - `ASSESSMENT_DATA_FLOW_ANALYSIS.md`
  - `CHANGELOG.md`

## Retained Findings

### Architecture And Source Of Truth

- `REWRITE_DEVELOPMENT_GUIDE.md` is the architectural authority. It explicitly establishes Praxis-first structure, taxonomy-driven classification, and `skillId`-based domain resolution.
- `CODEBASE_OVERVIEW.md` remains the best current implementation snapshot for app structure, dependencies, and known legacy/dead-code risks.
- `README.md` has been rewritten to match the current Supabase-backed app instead of the older local-only framing.

### Assessment And Data Flow

- `ASSESSMENT_DATA_FLOW_ANALYSIS.md` still captures a durable risk area: assessment and report persistence needs to be validated against current code whenever assessment flows change.
- The older root-level planning docs around implementation and completion had too many stale line references and status claims to remain active.

### Question Bank, Skill Map, And Content Audits

- Historical audit documents contain useful findings about coverage gaps, map sync, distractor quality, and ETS alignment.
- The durable lesson from those reports is process-oriented, not count-oriented:
  - coverage and mapping reports need regeneration before they are trusted,
  - skill recommendations are only valid if the referenced `skillId` exists in the current taxonomy,
  - proposed additions that already exist in `src/brain/skill-map.ts` must not remain written as pending work.
- The registry records which historical reports were merged conceptually and then archived physically.

### Cleanup And Legacy Behavior

- Prior cleanup documents correctly identified several legacy or duplicate systems, but many of them are now historical artifacts rather than current work plans.
- The current cleanup reference is this report plus the code-aware notes already captured in `CODEBASE_OVERVIEW.md` and `CHANGELOG.md`.

### Operational Setup

- The active operational reference is now `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` plus the current code and changelog.
- Firebase setup and Firestore rules docs were archived on 2026-03-18 because they no longer match the active runtime or root scripts.

## Contradictions Resolved

### `ARCHITECTURE.md` vs `REWRITE_DEVELOPMENT_GUIDE.md`

- Resolution: `REWRITE_DEVELOPMENT_GUIDE.md` wins.
- Reason: `ARCHITECTURE.md` reflects an older NASP-centric and local-first design shape that no longer matches the current repo direction or current code.

### `ets-skill-analysis.md` vs `ETS_SKILL_ANALYSIS_SUMMARY.md`

- Resolution: neither remains canonical; both are archived after merging durable findings here.
- Reason: they are useful historical analyses, but any recommendation to create or expand skills must now be validated against current `src/brain/skill-map.ts`.
- Example: `LEG-S07` is already present in the current taxonomy, so historical language treating it as pending work is stale.

### `CORRECTION_PLAN.md` / `EXECUTION_SUMMARY.md` / `CORRECTION_COMPLETE.md`

- Resolution: archive all three after merging the durable lesson.
- Durable lesson: correction documents are useful for historical provenance, but exact counts, “all issues resolved” claims, and generated totals age quickly and should not remain active root guidance.

### `IMPLEMENTATION_PLAN.md` / `TASK_TRACKER.md` / `CURSOR_PROJECT_BRIEFING.md`

- Resolution: archive all three.
- Reason: they are session-oriented coordination artifacts, not durable product documentation. Leaving them in root makes stale work look current.

### `DOMAIN_*` / `QUESTION_CATEGORIZATION_REPORT.md` / `CONTENT_TOPICS_CROSSWALK.md` / `HEALTH_CHECK_REPORT.md`

- Resolution: archive all after merging the durable findings.
- Durable lesson: these files contain useful taxonomy and content-audit reasoning, but their counts and statuses are time-sensitive and must be regenerated from source data before reuse.

## Open Cleanup Items

- Regenerate health, coverage, and categorization reports only when needed, and publish them under `archive/` or a clearly dated reports location instead of root.
- Keep `README.md` and the canonical docs aligned with current persistence behavior; local-only language must not return.
- If a future documentation pass introduces new operational guides, link them from `README.md` and add them to `DOCUMENT_REGISTRY.md`.
- Before reviving any archived analysis, validate its skill IDs, counts, and assumptions against current code and current data.

## Do Not Reintroduce

- NASP-first framing in architecture, assessment distribution, or top-level reporting docs.
- Runtime domain assignment by keyword scanning, heuristics, or other non-taxonomy shortcuts.
- Hard-coded counts, line references, “implementation complete” claims, or health metrics without a current date and clear scope.
- Prompt files, task trackers, session handoff notes, or AI workflow instructions in the root as if they were product documentation.
- Historical language that proposes creating or expanding skills without checking whether the referenced `skillId` already exists in `src/brain/skill-map.ts`.
- Multiple root-level quick-start or setup files that duplicate each other and compete for authority.

## Archive Policy Applied

- Default action for non-canonical root docs: move to a dated folder under `archive/`.
- Archive rather than delete when a file has historical reasoning, provenance value, or could explain a past migration or cleanup decision.
- Keep generated or prompt-oriented files out of root even when preserved for history.
- Use `DOCUMENT_REGISTRY.md` as the lookup table for why each file was kept or archived.
