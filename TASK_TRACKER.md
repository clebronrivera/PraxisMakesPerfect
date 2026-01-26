# Question Bank Audit - Task Tracker

**Last Updated:** 2026-01-26T09:37:59.436Z

---

## 🎯 QUICK REFERENCE

**Total Tasks:** 12  
**Completed:** 1  
**In Progress:** 0  
**Blocked:** 0  
**Not Started:** 11  

---

## ✅ TASK CHECKLIST

### Phase 1: Discovery & Analysis (Tasks 1-5)
- [x] Task 1: Create Master Audit Script
- [ ] Task 2: Identify Unmapped Questions
- [ ] Task 3: Reconcile Visual Hierarchy Disconnect
- [ ] Task 4: Duplicate Detection Across All Files
- [ ] Task 5: Evaluate Orphaned Files

### Phase 2: Integration & Mapping (Tasks 6-8)
- [ ] Task 6: Create Skill Mapping for Unmapped Questions
- [ ] Task 7: Merge Unique Questions from Orphaned Files
- [ ] Task 8: Update question-skill-map.json

### Phase 3: Regeneration & Cleanup (Tasks 9-12)
- [ ] Task 9: Regenerate Visual Hierarchy
- [ ] Task 10: Clean Up Orphaned Files
- [ ] Task 11: Validate Application Integration
- [ ] Task 12: Generate Final Audit Report

---

## 📊 CURRENT STATUS

### Task Currently Working On:
```
Task #: 1
Task Name: Create Master Audit Script
Status: Completed
Started: 2026-01-26T09:37:59.436Z
Completed: 2026-01-26T09:37:59.436Z
```

### Latest Findings:
```
✅ Task 1 Complete: Master audit script created and executed successfully.

Key Findings:
- 267 questions in questions.json
- 190 questions mapped to skills (71.2% mapped)
- 77 unmapped questions (28.8% unmapped)
- 155 duplicate IDs found (mostly Questions.txt duplicates with questions.json)
- 165 orphaned questions across 3 files
- Domain coverage ranges from 70-100% (good overall coverage)
- 18 skills have zero questions (mostly NEW-* skills)

The audit report has been generated at reports/question-bank-audit-report.md
```

### Blockers:
```
[CURSOR: List any blockers here]
```

---

## 📈 METRICS TRACKING

| Metric | Initial | Current | Target | Status |
|--------|---------|---------|--------|--------|
| Total Questions in questions.json | 267 | 267 | 270+ | 🟡 |
| Questions Mapped to Skills | 31 visible | 190 | 260+ | 🟡 |
| Unmapped Questions | 107 | 77 | 0 | 🟡 |
| Orphaned Question Files | 3 | 3 | 0 | 🔴 |
| Skill Coverage % | 23.7% | 71.2% | 80%+ | 🟡 |
| Domains with 0 Questions | 4 | 0 | 0 | 🟢 |

**Status Legend:** 🟢 Good | 🟡 Moderate | 🔴 Needs Work

---

## 📝 DETAILED TASK STATUS

### ✅ TASK 1: Create Master Audit Script
**Status:** [x] Completed

**Quick Summary:**
- Create: `scripts/audit-question-bank.ts` ✅
- Generate: `reports/question-bank-audit-report.md` ✅

**Checklist:**
- [x] Script created
- [x] Script runs without errors
- [x] Report generated
- [x] All files analyzed
- [x] Statistics validated

**Notes:**
```
✅ Task 1 completed successfully!

Key findings from audit:
- Total questions: 267 in questions.json
- Mapped: 190 (71.2% coverage)
- Unmapped: 77 questions need mapping
- Duplicates: 155 duplicate IDs found (125 from Questions.txt, 30 from ets-sample-questions.json)
- Orphaned: 165 questions across 3 files
- Domain coverage: 70-100% (good overall)
- Empty skills: 18 skills have zero questions (mostly NEW-* prefixed skills)

The audit script successfully:
1. Analyzed all 6 question source files
2. Identified mapping gaps
3. Found duplicate IDs across files
4. Generated comprehensive coverage statistics
5. Created detailed markdown report

Report location: reports/question-bank-audit-report.md
```

**Completion Date:** 2026-01-26
**Time Spent:** ~15 minutes

---

### ✅ TASK 2: Identify Unmapped Questions
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/find-unmapped-questions.ts`
- Generate: `reports/unmapped-questions.json`, `reports/unmapped-questions-detail.md`

**Checklist:**
- [ ] Script created
- [ ] All unmapped questions identified
- [ ] Count matches expected (107+)
- [ ] Report includes question text
- [ ] Suggestions provided

**Notes:**
```
[CURSOR: Add notes here]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 3: Reconcile Visual Hierarchy Disconnect
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/reconcile-hierarchy.ts`
- Generate: `reports/hierarchy-reconciliation.md`
- Find the 129 missing questions (mapped but not visible)

**Checklist:**
- [ ] Script created
- [ ] 129 missing questions accounted for
- [ ] Root cause identified
- [ ] Invalid mappings found
- [ ] Fix plan documented

**Notes:**
```
[CURSOR: Document why only 31 of 160 mapped questions appear]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 4: Duplicate Detection Across All Files
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/detect-duplicates.ts`
- Generate: `reports/duplicate-questions.md`

**Checklist:**
- [ ] Script created
- [ ] Exact ID duplicates found
- [ ] Exact text duplicates found
- [ ] Similar questions identified
- [ ] Recommendations provided

**Notes:**
```
[CURSOR: Document duplicate patterns]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 5: Evaluate Orphaned Files
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/evaluate-orphaned-files.ts`
- Generate: `reports/orphaned-files-evaluation.md`
- Evaluate: Questions.txt, ets-sample-questions.json, generated-from-distractors.json

**Checklist:**
- [ ] Script created
- [ ] Questions.txt analyzed
- [ ] ets-sample-questions.json analyzed
- [ ] generated-from-distractors.json analyzed
- [ ] Unique questions identified
- [ ] Integration recommendations made

**Notes:**
```
[CURSOR: Document findings about each orphaned file]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 6: Create Skill Mapping for Unmapped Questions
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/auto-map-questions.ts`
- Generate: `reports/mapping-suggestions.json`, `data/new-skill-mappings.json`

**Checklist:**
- [ ] Script created
- [ ] All unmapped questions processed
- [ ] Confidence scores assigned
- [ ] High-confidence mappings ready
- [ ] Low-confidence flagged for review

**Notes:**
```
[CURSOR: Document mapping patterns and confidence levels]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 7: Merge Unique Questions from Orphaned Files
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/merge-questions.ts`
- Backup: `data/questions-pre-merge.backup.json`
- Update: `src/data/questions.json`
- Generate: `reports/merge-report.md`

**Checklist:**
- [ ] Backup created
- [ ] Script created
- [ ] ID conflicts checked
- [ ] Questions merged
- [ ] Validation passed
- [ ] Report generated

**Notes:**
```
[CURSOR: Document merge decisions and any ID changes]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 8: Update question-skill-map.json
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `scripts/update-skill-mappings.ts`
- Backup: `data/question-skill-map.backup.json`
- Update: `src/data/question-skill-map.json`
- Generate: `reports/mapping-update-report.md`

**Checklist:**
- [ ] Backup created
- [ ] Script created
- [ ] Invalid mappings removed
- [ ] New mappings added
- [ ] Validation passed
- [ ] Report generated

**Notes:**
```
[CURSOR: Document mapping changes and coverage improvements]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 9: Regenerate Visual Hierarchy
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Run: `npx tsx generate-visual-tree.ts`
- Update: `VISUAL_HIERARCHY_TREE.md`, `HIERARCHY_TREE.md`
- Generate: `reports/hierarchy-before-after.md`

**Checklist:**
- [ ] Hierarchy regenerated
- [ ] Question counts increased (31 → 160+)
- [ ] Coverage improved
- [ ] Before/after comparison created
- [ ] Statistics validated

**Notes:**
```
[CURSOR: Document improvements in coverage]
```

**Expected Results:**
- Questions visible: 31 → 260+
- Skills with questions: 23 → 80+
- Coverage: 23.7% → 80%+

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 10: Clean Up Orphaned Files
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Create: `archive/` directory
- Move orphaned files to archive
- Generate: `reports/cleanup-report.md`

**Checklist:**
- [ ] Archive directory created
- [ ] Questions.txt archived
- [ ] ets-sample-questions.json archived
- [ ] generated-from-distractors.json archived
- [ ] Documentation updated
- [ ] No broken imports

**Notes:**
```
[CURSOR: Document what was archived and why]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 11: Validate Application Integration
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Test: Application loads correctly
- Test: Questions display properly
- Generate: `reports/integration-test-report.md`

**Checklist:**
- [ ] App starts without errors
- [ ] Questions load correctly
- [ ] Skill mappings work
- [ ] Question count correct (~260+)
- [ ] All domains show questions
- [ ] Adaptive learning works
- [ ] Progress tracking works

**Notes:**
```
[CURSOR: Document any integration issues]
```

**Completion Date:** _______
**Time Spent:** _______

---

### ✅ TASK 12: Generate Final Audit Report
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Quick Summary:**
- Generate: `FINAL_AUDIT_REPORT.md`
- Generate: `reports/before-after-comparison.md`

**Checklist:**
- [ ] Executive summary written
- [ ] All issues documented
- [ ] Before/after metrics compiled
- [ ] File inventory updated
- [ ] Recommendations provided

**Notes:**
```
[CURSOR: Final observations and recommendations]
```

**Completion Date:** _______
**Time Spent:** _______

---

## 🎯 COMPLETION STATUS

### Phase 1 (Tasks 1-5): Discovery & Analysis
**Status:** [ ] Complete | **Progress:** 1/5

### Phase 2 (Tasks 6-8): Integration & Mapping
**Status:** [ ] Complete | **Progress:** 0/3

### Phase 3 (Tasks 9-12): Regeneration & Cleanup
**Status:** [ ] Complete | **Progress:** 0/4

---

## 📊 FINAL METRICS (To Be Updated)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Questions | 267 | ___ | +___ |
| Mapped Questions | 31 | ___ | +___ |
| Unmapped Questions | 107 | ___ | -___ |
| Skill Coverage | 23.7% | ___% | +___% |
| Orphaned Files | 3 | ___ | -___ |
| Domains with 0 Questions | 4 | ___ | -___ |

---

## 📋 PHASE D BACKLOG

### Backlog Item: Review Skipped Questions and Reconcile Missing Suggestions
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:**
Review the 41 skipped questions and reconcile the "no matching suggestions" count. These may be FLIP questions, duplicates, or questions added after Phase A ran.

**Context:**
- **41 questions skipped** (needsReview: true) - These were intentionally skipped during Phase D tag application
- **118 questions without matching suggestions** - These questions exist in questions.json but have no corresponding entry in tagging-suggestions.json

**Investigation Needed:**
- [ ] Identify which of the 41 skipped questions are FLIP questions
- [ ] Identify which of the 41 skipped questions are duplicates
- [ ] Identify which questions were added after Phase A ran
- [ ] Reconcile why 118 questions have no matching suggestions
- [ ] Determine if tagging suggestions need to be generated for missing questions
- [ ] Document findings and create action plan

**Files to Review:**
- `src/data/questions.json` (267 total questions)
- `src/data/tagging-suggestions.json` (190 suggestions, 41 with needsReview: true)
- `src/data/questions.backup.json` (backup from Phase D)

**Expected Outcomes:**
- Clear understanding of why 41 questions were skipped
- Clear understanding of why 118 questions have no suggestions
- Action plan for handling each category (FLIP, duplicates, new questions)
- Updated tagging suggestions if needed

**Notes:**
```
[CURSOR: Document findings as investigation progresses]
```

**Created:** 2026-01-26
**Priority:** Medium

---

## 📋 BACKLOG

### Phase D: Apply Approved Tags (DOK/Framework Tagging)
**Status:** Not Started
**Created:** 2026-01-26

**Description:**
Apply verified tagging suggestions from `tagging-suggestions.json` to `questions.json`. This is the final phase of the DOK/Framework Tagging Initiative.

**Context:**
- ✅ Phase A: Generate Tagging Suggestions - COMPLETED (190 suggestions generated)
- ✅ Phase B: Rule-Based Validation - COMPLETED (0 violations remaining)
- ✅ Phase C: Generate Review Report - COMPLETED (review report generated)
- ⏳ Phase D: Apply Approved Tags - NOT STARTED

**Requirements:**
- Create script: `scripts/apply-tags.ts`
- Load `src/data/tagging-suggestions.json`
- Load `src/data/questions.json`
- Skip items with `needsReview: true`
- Update questions with `dok`, `frameworkType`, and `frameworkStep` fields
- Create backup of `questions.json` before overwriting
- Apply tags to all questions with `needsReview: false`

**Files to Create/Modify:**
- `scripts/apply-tags.ts` (new)
- `src/data/questions.json` (update with tags)
- `src/data/questions.json.backup` (backup before changes)

**Dependencies:**
- Requires completion of Phase A, B, and C
- Requires human review of `TAGGING_REVIEW.md`
- All violations must be resolved (currently 0 violations)

**Notes:**
- 190 tagging suggestions exist in `tagging-suggestions.json`
- 0 rule violations remain after fixes
- All corrected items have `needsReview: false`
- Framework definitions updated with `evaluation` step

---

## 🚀 QUICK START FOR CURSOR

1. **Read** the full CURSOR_PROMPT_QUESTION_BANK_AUDIT.md
2. **Start** with Task 1
3. **Update** this tracker as you progress
4. **Mark** tasks as complete
5. **Document** findings in Notes sections
6. **Move** to next task only after validation

---

**Remember:** Work on ONE task at a time. Validate before moving forward. Document everything!
