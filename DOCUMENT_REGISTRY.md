# Document Registry

Reviewed on 2026-03-14.

This registry records the classification and final disposition of every reviewed root-level markdown file. Each file is represented exactly once.

| File | Bucket | Status | Disposition | Replacement / Active Reference | Stale Assumptions | Notes |
|---|---|---|---|---|---|---|
| `AGENTS.md` | Canonical source | Active | Keep in root | Self, `docs/WORKFLOW_GROUNDING.md`, `docs/ISSUE_LEDGER.md` | No | Repo-local grounding entrypoint for IDE/agent workflow and where durable rules vs issue notes belong. |
| `ARCHITECTURE.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `REWRITE_DEVELOPMENT_GUIDE.md`, `CODEBASE_OVERVIEW.md` | Yes | Older NASP-centric architecture and local-first assumptions no longer match current direction. |
| `ASSESSMENT_DATA_FLOW_ANALYSIS.md` | Canonical source | Active | Keep in root | Self | Partial | Valid as a risk analysis; line references may drift, so code still wins. |
| `AUTHENTICATION_ENHANCEMENTS.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, `CHANGELOG.md` | Yes | Describes completed Firebase-era auth changes but is no longer active setup guidance. |
| `AUTHENTICATION_STATUS.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, `CHANGELOG.md` | Yes | Status snapshot from the Firebase era, not durable documentation. |
| `BLUE_QUESTIONS_INTEGRATION.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Historical integration notes with time-sensitive counts and skills. |
| `BRAIN_AUDIT_REPORT.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `CODEBASE_OVERVIEW.md`, `CHANGELOG.md` | Partial | Useful findings, but not a current implementation authority. |
| `CHANGELOG.md` | Canonical source | Active | Keep in root | Self | No | Active historical log of repo changes. |
| `CODEBASE_OVERVIEW.md` | Canonical source | Active | Keep in root | Self | Partial | Best current implementation snapshot, but code still wins on drift. |
| `CONTENT_TOPICS_CROSSWALK.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Useful mapping logic, but generated counts and skill coverage age quickly. |
| `CORRECTION_COMPLETE.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Completion claims and counts are historical only. |
| `CORRECTION_PLAN.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Historical issue plan; no longer active guidance. |
| `CURSOR_PROJECT_BRIEFING.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, `CODEBASE_OVERVIEW.md` | Yes | Session handoff document, not canonical product docs. |
| `CURSOR_PROMPT_QUESTION_BANK_AUDIT.md` | Delete or ignore as generated noise | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Prompt artifact; should not remain in root. |
| `DEAD_CODE_AND_CONSOLIDATION_PLAN.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `CODEBASE_OVERVIEW.md`, `CHANGELOG.md`, `DOCUMENT_CONSOLIDATION_REPORT.md` | Partial | Contains useful cleanup findings but is no longer the live plan. |
| `DEPLOYMENT_GUIDE.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, platform config files | Yes | Generic deployment advice and repository-specific text make it non-authoritative. |
| `DEPLOY_FIREBASE_RULES.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-18/` | `README.md`, `CHANGELOG.md`, `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` | Yes | Firestore rules guide for the retired Firebase backend. |
| `DISTRACTOR_AUDIT_REPORT.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Durable lesson retained; exact audit output is historical. |
| `DOCUMENT_CONSOLIDATION_REPORT.md` | Canonical source | Active | Keep in root | Self | No | Master report for documentation cleanup and source-of-truth rules. |
| `DOCUMENT_REGISTRY.md` | Canonical source | Active | Keep in root | Self | No | Canonical per-file documentation registry. |
| `DOMAIN_1_COVERAGE_ANALYSIS.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Coverage findings are historical and need regeneration before reuse. |
| `DOMAIN_COVERAGE_GAP_ANALYSIS.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Gap analysis is useful historically, but counts and discrepancies are time-sensitive. |
| `ETS_SKILL_ANALYSIS_SUMMARY.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Useful ETS reasoning, but pending-skill language is stale unless checked against current taxonomy. |
| `EXECUTION_GUIDE.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `scripts/`, `README.md` | Yes | Historical script workflow guide for a prior cleanup phase. |
| `EXECUTION_SUMMARY.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Historical execution snapshot with stale expected counts. |
| `FIREBASE_AUTH_SETUP.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-18/` | `README.md`, `CHANGELOG.md`, `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` | Yes | Firebase console setup guide for a backend the app no longer uses. |
| `FIREBASE_INTEGRATION_PLAN.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, current code | Yes | Planning document for already-implemented integration work. |
| `FIREBASE_SECURITY_TESTING.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-18/` | `README.md`, `CHANGELOG.md`, `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` | Yes | Firestore security testing guide retained only for migration history. |
| `FIREBASE_SETUP_COMPLETE.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, current code | Yes | Completion-status document, not active documentation. |
| `FIX_UNAUTHORIZED_DOMAIN.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-18/` | `README.md`, `CHANGELOG.md`, `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` | Yes | Firebase auth-domain troubleshooting retained for provenance after the Supabase migration. |
| `HEALTH_CHECK_REPORT.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md`, regenerated reports as needed | Yes | Contains useful structural checks but stale counts and coverage numbers. |
| `HIERARCHY_TREE.md` | Delete or ignore as generated noise | Historical | Archive to `archive/docs-legacy-2026-03-14/` | None | Yes | Generated structure artifact; not active documentation. |
| `IMPLEMENTATION_PLAN.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md`, `CHANGELOG.md` | Yes | Session-oriented work plan that should not remain active in root. |
| `PHASE2_CODE_EDITS.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, current code | Yes | Historical notes on a prior code-edit phase. |
| `PHASE_D_SUMMARY.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Historical tagging summary; counts and next steps are stale. |
| `PROJECT_METRICS.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, regenerated metrics if needed | Yes | Untethered snapshot metrics are not reliable source-of-truth docs. |
| `QUESTION_CATEGORIZATION_REPORT.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Categorization logic is useful, but question counts and mapping results age quickly. |
| `QUICK-START.md` | Delete or ignore as generated noise | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `README.md` | Yes | Early bootstrap instructions for a different project stage. |
| `QUICK_AUTH_SETUP.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, `CHANGELOG.md` | Yes | Short duplicate of a now-archived Firebase setup guide. |
| `QUICK_START_GUIDE.md` | Delete or ignore as generated noise | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `README.md`, `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Cursor workflow artifact, not product documentation. |
| `README.md` | Canonical source | Active | Keep in root | Self | No | Root entrypoint for the current canonical documentation set. |
| `REWRITE_DEVELOPMENT_GUIDE.md` | Canonical source | Active | Keep in root | Self | No | Architectural authority for Praxis-first, taxonomy-driven behavior. |
| `TAGGING_REVIEW.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Historical tagging audit with time-sensitive counts. |
| `TASK_TRACKER.md` | Archive as historical | Superseded | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md`, `CHANGELOG.md` | Yes | Task tracker should not remain in root after work phases end. |
| `TEST_RESULTS.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `CHANGELOG.md`, current tests | Partial | Historical test report; current test suite should be run rather than inferred from this file. |
| `VISUAL_HIERARCHY_TREE.md` | Delete or ignore as generated noise | Historical | Archive to `archive/docs-legacy-2026-03-14/` | None | Yes | Generated visualization artifact; not active guidance. |
| `ets-skill-analysis.md` | Merge into master report | Historical | Archive to `archive/docs-legacy-2026-03-14/` | `DOCUMENT_CONSOLIDATION_REPORT.md` | Yes | Detailed historical ETS analysis; no longer canonical after taxonomy evolved. |
