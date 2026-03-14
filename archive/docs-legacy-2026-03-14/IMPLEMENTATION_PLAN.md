# IMPLEMENTATION PLAN
# Project: Praxis Makes Perfect
# Last Updated: 2026-03-14 00:34
# Status: Phase 1: Initialization

---

## 🗺 HOW TO USE THIS HUB

This document is the **primary cognitive entry point** for any AI agent or human
developer joining the project. It is a fully self-contained ecosystem of state
and navigation.

**🚀 TRIGGER (FIRST RUN):** If this plan is deployed into a new, uninitialized,
or empty folder, immediately execute **TASK-00**. This bootstrap process builds
the physical and logical infrastructure required to prevent context drift.

**Hub & Spoke Architecture:** This file is the Hub. Static, long-term rules live
in specialized Spoke files to prevent Context Bloat in the main plan:

| Spoke File | Purpose |
|-----------|---------|
| `.cursor/rules/domain_rules.mdc` | Canonical data standards and domain constraints |
| `.cursor/rules/mistake_registry.mdc` | Anti-patterns and previous failures |
| `.cursor/rules/agent_protocols.mdc` | Operational guardrails for interaction |

**Single Source of Truth:** Every active task, decision, and metric lives here.
Never track progress in local memory or external chat history.

**Cleanup Gate:** The CLEANUP CHECKLIST in Section 7 is mandatory before any
task is archived. Skipping it causes **Session Decay** — temp files accumulate
and mislead subsequent agents.

---

## 1. 🔐 MULTI-AGENT CONCURRENCY PROTOCOL

These rules prevent race conditions and logic collisions when multiple agents
operate within the same repository simultaneously.

1. **Read-Before-Write Synchrony:** Always verify the `Last Updated` timestamp
   in the header. If it is older than your session's initialization time, reload
   the file before proceeding.

2. **Task Claiming & Ownership:** Before writing a single line of code, append
   `[CLAIMED BY: AGENT_ID | START_TIME]` to the relevant Task Header. This acts
   as a file lock signaling to parallel agents that this task is active.

3. **Atomic State Synchronization:** Updates to this plan, the Metrics Snapshot,
   and the File Directory must be committed in a single turn. Project metadata
   must never drift out of phase with the actual file structure on disk.

---

## 2. 📂 PROJECT STRUCTURE & FOLDER RULES

_This file is fully self-contained. Uploading IMPLEMENTATION_PLAN.md alone is
enough to orient a new session completely._

```
[project root]/
├── IMPLEMENTATION_PLAN.md         ← YOU ARE HERE
├── CURSOR_PROJECT_BRIEFING.md     ← Full context, history, architecture
├── PROJECT_METRICS.md             ← Full metrics detail
├── .cursor/rules/
│   ├── domain_rules.mdc           ← Domain knowledge constraints (Spoke)
│   ├── mistake_registry.mdc       ← Anti-pattern registry (Spoke)
│   └── agent_protocols.mdc        ← Operational guardrails (Spoke)
├── ARCHIVE/                       ← Completed tasks. Append-only.
├── TEMP/                          ← Temporary files. Cleared per phase.
└── [project-specific folders]     ← Document in FILE DIRECTORY section
```

### Folder Rules

| Folder | Operational Rule | Implication of Violation |
|--------|-----------------|--------------------------|
| `ARCHIVE/` | Append-only. Never edit archived files. | Destroys the historical audit trail. |
| `TEMP/` | Holding area for one-off scripts and logs. | Temp files in root cause context confusion for LLMs. |
| `output/` | Edit in place. Never delete or regenerate. | Risks losing manual audits or incremental enrichments. |
| `tests/` | All tests here. No inline tests in scripts. | Inline tests bloat production code. |
| `.cursor/rules/` | Static project Spokes for domain logic. | Losing these files breaches domain constraints. |

### ⚠️ Files You Must Never Touch

| File | Why |
|------|-----|
| `data/export_questions.csv` | Source of truth for question bank |

---

## 3. 📈 METRICS SNAPSHOT

| Metric | Value | Status | Description |
|--------|-------|--------|-------------|
| Total Entities | 144+ | ✅ | Total count of canonical items |
| Test Coverage | ~30% | 🟡 | % of codebase verified by active tests |
| Critical Queue | 3 | 🔴 | Tasks marked CRITICAL or BLOCKING |
| System Integrity | 85% | 🟢 | Overall confidence score from pipeline audits |

---

## 4. 📍 CURRENT STATE

- Project initialization completed.
- Core documentation (Briefing, Metrics) generated.
- Agent protocols and domain rules established.
- Next action: Conduct a final tree audit and cleanup.

---

## 5. ⚡ ACTIVE TASKS

---

### TASK-00 — PROJECT INITIALIZATION & BOOTSTRAP
**Status:** ✅ DONE
**Priority:** CRITICAL
**File(s):** `/`, `.cursor/rules/`, `CURSOR_PROJECT_BRIEFING.md`

**What:** Initialize the project environment from a cold start. Builds the
physical directory structure and logical rule set required for safe agent operation.

**Steps:**
1. **Directory Creation:** Create root-level directories:
   `ARCHIVE/`, `TEMP/`, `output/`, `tests/`, `scripts/`
2. **Rule Initialization:** Create `.cursor/rules/` and populate with three
   template Spoke files: `domain_rules.mdc`, `mistake_registry.mdc`,
   `agent_protocols.mdc`
3. **Documentation Setup:** Generate `CURSOR_PROJECT_BRIEFING.md` and
   `PROJECT_METRICS.md` if they do not exist
4. **Tree Audit:** Run the `find` command in Section 8 and paste the output
   into FILE DIRECTORY to verify disk state matches architecture

**Verification:**
- [x] All five root directories confirmed present on disk
- [x] `.cursor/rules/` Spoke files initialized with core protocols
- [x] Section 8 FILE DIRECTORY updated with first successful tree output

---

## 6. ⚖️ CONSEQUENTIAL DECISION FRAMEWORK

### Step 1 — Classify the Action

| Trigger | Classification |
|---------|---------------|
| Deleting or overwriting primary data files or pre-audited outputs | 🔴 IRREVERSIBLE |
| Executing end-to-end pipelines or modifying core architecture | 🟠 HIGH IMPACT |
| Editing individual scripts, adding tests, refactoring local logic | 🟡 MODERATE |
| Moving files to `TEMP/`, archiving tasks, minor documentation edits | 🟢 LOW |

### Step 2 — Apply the Protocol

**🔴 IRREVERSIBLE — Full Stop**
1. Do not write a single line of code
2. State explicitly the Before vs. After state of the data
3. Provide a specific Revert Plan (e.g., `cp data.csv data.csv.bak`)
4. Wait for explicit user confirmation before proceeding
5. After completing, log the change in FILE DIRECTORY

**🟠 HIGH IMPACT — Pause and Surface**
1. State your assumptions clearly before executing
2. Outline the likely consequences of the action
3. Ask for clarification if any part of the request is ambiguous
4. After completing, update METRICS SNAPSHOT

**🟡 MODERATE — Proceed with Confirmation**
1. Execute the task
2. Summarize exactly what was changed in the chat
3. Run relevant tests immediately after

**🟢 LOW — Proceed Normally**
1. Execute and update FILE DIRECTORY if files were added or moved

---

## 7. 🧹 CLEANUP CHECKLIST (MANDATORY)

```
[ ] 1. File Audit: Review all files created or modified. Ask: "Is this file
        required for the long-term success of the project?"
[ ] 2. Temporary Purge: Identify all one-off fix scripts, .bak, .tmp, .old files
[ ] 3. Relocation: Move temp files → TEMP/ using: mv [filename] TEMP/
[ ] 4. Scan for strays:
        find . -name "*.bak" -o -name "*.tmp" -o -name "*.old" | grep -v .git
[ ] 5. Tree Update: Regenerate FILE DIRECTORY in Section 8
[ ] 6. Timestamp Sync: Update Last Updated in header
[ ] 7. Metric Update: If task impacted data, update METRICS SNAPSHOT
[ ] 8. Only then: cut task block to ARCHIVE/COMPLETED_[TASK]_[YYYY-MM-DD_HHMM].md
```

---

## 8. 🌳 FILE DIRECTORY

```bash
find . -not -path './.git/*' -not -path './node_modules/*' \
       -not -path './dist/*' -not -name '*.pyc' | sort
```

### Current Tree

```bash
.
./.DS_Store
./.claude
./.cursor
./.cursor/rules
./.cursor/rules/agent_protocols.mdc
./.cursor/rules/domain_rules.mdc
./.cursor/rules/mistake_registry.mdc
./.firebase
./.firebaserc
./.git
./.gitignore
./ARCHITECTURE.md
./ASSESSMENT_DATA_FLOW_ANALYSIS.md
./AUTHENTICATION_ENHANCEMENTS.md
./AUTHENTICATION_STATUS.md
./App.tsx
./BLUE_QUESTIONS_INTEGRATION.md
./BRAIN_AUDIT_REPORT.md
./CHANGELOG.md
./CODEBASE_OVERVIEW.md
./CONTENT_TOPICS_CROSSWALK.md
./CORRECTION_COMPLETE.md
./CORRECTION_PLAN.md
./CURSOR_PROJECT_BRIEFING.md
./CURSOR_PROMPT_QUESTION_BANK_AUDIT.md
./DEAD_CODE_AND_CONSOLIDATION_PLAN.md
./DEPLOYMENT_GUIDE.md
./DEPLOY_FIREBASE_RULES.md
./DISTRACTOR_AUDIT_REPORT.md
./DOMAIN_1_COVERAGE_ANALYSIS.md
./DOMAIN_COVERAGE_GAP_ANALYSIS.md
./ETS_SKILL_ANALYSIS_SUMMARY.md
./EXECUTION_GUIDE.md
./EXECUTION_SUMMARY.md
./FIREBASE_AUTH_SETUP.md
./FIREBASE_INTEGRATION_PLAN.md
./FIREBASE_SECURITY_TESTING.md
./FIREBASE_SETUP_COMPLETE.md
./FIX_UNAUTHORIZED_DOMAIN.md
./HEALTH_CHECK_REPORT.md
./HEALTH_CHECK_REPORT.txt
./HIERARCHY_TREE.md
./IMPLEMENTATION_PLAN.md
./PHASE2_CODE_EDITS.md
./PHASE_D_SUMMARY.md
./PROJECT_METRICS.md
./QUESTION_CATEGORIZATION_REPORT.md
./QUICK-START.md
./QUICK_AUTH_SETUP.md
./QUICK_START_GUIDE.md
./Questions.txt
./README.md
./REWRITE_DEVELOPMENT_GUIDE.md
./TAGGING_REVIEW.md
./TASK_TRACKER.md
./TEMP
./TEST_RESULTS.md
./VISUAL_HIERARCHY_TREE.md
./api
./api/study-plan.ts
./archive
./archive/generated-from-distractors.json
./content-topic-questions-output.txt
./data
./data/export_questions.csv
./data/export_skills.csv
./dist
./electron
./ets-skill-analysis.md
./ets-skill-gap-summary.json
./firebase-debug.log
./firebase.json
./firestore.rules
./fix_ts.cjs
./index.html
./knowledge-base.ts
./netlify.toml
./node_modules
./output
./package-lock.json
./package.json
./postcss.config.js
./quality-reports
./quality-reports/DISTRIBUTION_REPORT.md
./quality-reports/README.md
./quality-reports/blue-questions.json
./quality-reports/distractor-regeneration.log
./quality-reports/distribution-report.json
./quality-reports/domain-distribution.csv
./quality-reports/flagged-questions-audit.csv
./quality-reports/generation-manifest.json
./quality-reports/length-fix-plan.json
./quality-reports/length-issues-summary.csv
./quality-reports/new-blue-questions.json
./quality-reports/questions-with-new-distractors.json
./quality-reports/regen-CC-T09.json
./quality-reports/regen-CC-T10.json
./quality-reports/regen-DBDM-T22.json
./quality-reports/regen-FSC-T05.json
./quality-reports/regen-RES-T11.json
./quality-reports/regenerate-ids.json
./quality-reports/skill-distribution.csv
./quality-reports/wave1-generated.json
./reports
./reports/question-bank-audit-report.md
./reports/questions-export.csv
./scripts
./scripts/analyze-distribution.cjs
./scripts/apply-approved-tags.ts
./scripts/apply-distractor-updates.cjs
./scripts/apply-manual-fixes.cjs
./scripts/apply-tagging-patch.ts
./scripts/audit-answer-distribution.ts
./scripts/audit-distractor-quality.ts
./scripts/audit-question-bank.ts
./scripts/banned-terms-check.ts
./scripts/batch-fix-strategy.cjs
./scripts/deduplicate-questions.ts
./scripts/export-flagged-questions.ts
./scripts/export-question-csv.cjs
./scripts/fix-tagging-steps.ts
./scripts/generate-from-manifest.ts
./scripts/generate-gap-questions.ts
./scripts/generate-hierarchy-tree.ts
./scripts/generate-review-report.ts
./scripts/generate-tagging-suggestions.ts
./scripts/generate-visual-tree.ts
./scripts/health-check.ts
./scripts/ingest-csv.ts
./scripts/integrate-blue-questions.ts
./scripts/output-content-topic-questions.ts
./scripts/question-format-converter.ts
./scripts/question-quality-analyzer.ts
./scripts/question-quality-fixer.ts
./scripts/regenerate-distractors.ts
./scripts/regenerate-flagged-questions.ts
./scripts/setup-firebase-auth.sh
./scripts/sync-question-ids.ts
./scripts/test-firebase-security.ts
./scripts/test-question-generation.ts
./scripts/validate-tags.ts
./src
./src/.DS_Store
./src/brain
./src/brain/answer-generator.ts
./src/brain/assessment-builder.ts
./src/brain/diagnostic-feedback.ts
./src/brain/distractor-matcher.ts
./src/brain/distractor-patterns.ts
./src/brain/error-library.ts
./src/brain/framework-definitions.ts
./src/brain/learning-state.ts
./src/brain/question-analyzer.ts
./src/brain/question-generator.ts
./src/brain/question-validator.ts
./src/brain/rationale-builder.ts
./src/brain/skill-map.ts
./src/brain/slot-libraries.ts
./src/brain/template-schema.ts
./src/brain/templates
./src/brain/templates/domain-1-templates.ts
./src/brain/templates/domain-10-templates.ts
./src/brain/templates/domain-2-templates.ts
./src/brain/templates/domain-3-templates.ts
./src/brain/templates/domain-4-templates.ts
./src/brain/templates/domain-5-templates.ts
./src/brain/templates/domain-6-templates.ts
./src/brain/templates/domain-7-templates.ts
./src/brain/templates/domain-8-templates.ts
./src/brain/templates/domain-9-templates.ts
./src/brain/weakness-detector.ts
./src/components
./src/components/AdminDashboard.tsx
./src/components/Dashboard.tsx
./src/components/DiagnosticFeedback.tsx
./src/components/DiagnosticResults.tsx
./src/components/DomainTiles.tsx
./src/components/ErrorBoundary.tsx
./src/components/ExplanationPanel.tsx
./src/components/FeedbackModal.tsx
./src/components/FullAssessment.tsx
./src/components/LoginScreen.tsx
./src/components/PracticeSession.tsx
./src/components/PraxisPerformanceView.tsx
./src/components/PreAssessment.tsx
./src/components/QuestionCard.tsx
./src/components/ReportQuestionModal.tsx
./src/components/ResultsDashboard.tsx
./src/components/ScoreReport.tsx
./src/components/ScreenerResults.tsx
./src/components/StudyPlanCard.tsx
./src/components/StudyPlanViewer.tsx
./src/components/TeachMode.tsx
./src/config
./src/config/admin.ts
./src/config/firebase.ts
./src/context
./src/context/ContentContext.tsx
./src/contexts
./src/contexts/AuthContext.tsx
./src/data
./src/data/discard-distractors.json
./src/data/distractor-map.json
./src/data/ets-content-topics.json
./src/data/ets-sample-questions.json
./src/data/flippable-distractors.json
./src/data/mappings
./src/data/mappings/domain-1-mapping.json
./src/data/mappings/domain-10-mapping.json
./src/data/mappings/domain-2-mapping.json
./src/data/mappings/domain-3-mapping.json
./src/data/mappings/domain-4-mapping.json
./src/data/mappings/domain-5-mapping.json
./src/data/mappings/domain-6-mapping.json
./src/data/mappings/domain-7-mapping.json
./src/data/mappings/domain-8-mapping.json
./src/data/mappings/domain-9-mapping.json
./src/data/question-skill-map.json
./src/data/questions.backup.json
./src/data/questions.json
./src/data/questions.json.backup.1768982876789
./src/data/questions.json.backup.1769431291068
./src/data/questions.json.backup.1769432774780
./src/data/questions.pre-regen-backup.json
./src/data/tagging-suggestions.json
./src/data/tagging-validation-report.md
./src/hooks
./src/hooks/useAdaptiveLearning.ts
./src/hooks/useBetaFeedback.ts
./src/hooks/useElapsedTimer.ts
./src/hooks/useEngine.ts
./src/hooks/useFirebaseProgress.ts
./src/hooks/useQuestionReports.ts
./src/index.css
./src/main.tsx
./src/scripts
./src/scripts/analyze-coverage-gaps.ts
./src/scripts/blueprint-alignment.ts
./src/scripts/bottleneck-finder.ts
./src/scripts/capacity-test.ts
./src/scripts/coverage-audit.ts
./src/scripts/diagnostic-utils.ts
./src/scripts/distractor-audit.ts
./src/scripts/extract-distractors.ts
./src/scripts/feedback-quality-test.ts
./src/scripts/full-simulation.ts
./src/scripts/generate-categorization-report.ts
./src/scripts/generate-coverage-report.ts
./src/scripts/generate-crosswalk.ts
./src/scripts/learning-progression-test.ts
./src/scripts/question-counts.ts
./src/scripts/run-all-diagnostics.ts
./src/scripts/uniqueness-test.ts
./src/services
./src/services/studyPlanService.ts
./src/types
./src/types/content.ts
./src/types/engine.ts
./src/utils
./src/utils/assessment-builder.ts
./src/utils/domainColors.ts
./src/utils/globalScoreCalculator.ts
./src/utils/practiceSelector.ts
./src/utils/sessionStorage.ts
./src/utils/sessionTypes.ts
./src/utils/userSessionStorage.ts
./tailwind.config.js
./test-results.txt
./tests
./tests/adaptive-coaching.test.ts
./tsconfig.json
./tsconfig.node.json
./vercel.json
./verify-screener.ts
./vite.config.ts
```

---

## 9. 📚 DECISION LOG

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Initialized Hub & Spoke system | To establish a single source of truth and scale agent operations safely. |

---

## 10. ⚠️ MISTAKE REGISTRY

_No entries yet._

---

## 11. 🏷 NAMING CONVENTION STANDARD

| File Type | Convention | Example |
|-----------|-----------|---------|
| Active plan | `IMPLEMENTATION_PLAN.md` | — |
| Project briefing | `CURSOR_PROJECT_BRIEFING.md` | — |
| Metrics detail | `PROJECT_METRICS.md` | — |
| Domain rules spoke | `.cursor/rules/domain_rules.mdc` | — |
| Mistake registry spoke | `.cursor/rules/mistake_registry.mdc` | — |
| Agent protocols spoke | `.cursor/rules/agent_protocols.mdc` | — |
| Archived task | `COMPLETED_[TASK-NAME]_[YYYY-MM-DD_HHMM].md` | `COMPLETED_BULK-FIX_2026-03-10_2145.md` |

---

## 12. 🏷 TASK STATUS KEY

| Symbol | Meaning |
|--------|---------|
| ⏳ PENDING | Defined but not yet started |
| 🔄 IN PROGRESS | Claimed — active work underway |
| ✅ DONE | Complete — move to ARCHIVE |
| 🚫 BLOCKED | Waiting on another task or decision |

---

*This file is the single source of truth for active work.
If it's not in here, it's not being tracked.*
