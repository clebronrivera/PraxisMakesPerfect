# Question Bank Data Integrity Audit & Consolidation

## 🎯 OBJECTIVE
Fix data integrity issues in the PraxisMakesPerfect question bank by auditing all question sources, reconciling mappings, eliminating duplicates, and consolidating into a single source of truth.

## 📋 CURRENT STATE ANALYSIS

### File Inventory:
1. **`src/data/questions.json`** - PRIMARY SOURCE (267 questions) ✅ CONNECTED
2. **`src/data/question-skill-map.json`** - MAPPING FILE (160 question IDs mapped) ✅ CONNECTED
3. **`Questions.txt`** - ORPHANED (~125 questions) ❌ NOT CONNECTED
4. **`src/data/ets-sample-questions.json`** - UNUSED (30 questions) ❌ NOT CONNECTED
5. **`src/data/generated-from-distractors.json`** - UNUSED (10 questions) ❌ NOT CONNECTED
6. **`src/data/questions.json.backup.1768982876789`** - BACKUP FILE (backup) ⚠️ KEEP AS BACKUP

### Critical Issues Identified:
- **107 questions** in questions.json have NO skill mapping (40% unmapped)
- **129 questions** are mapped in question-skill-map.json but missing from visual hierarchy
- **~165 questions** across orphaned files not integrated into main system
- Potential duplicate questions across multiple files
- Visual hierarchy shows only 31 questions despite 267 existing

### Visual Hierarchy Shows:
- Domain 1 (DBDM): 6 questions
- Domain 2 (C&C): 0 questions
- Domain 4 (MBH): 6 questions
- Domain 5 (School-Wide): 6 questions
- Domain 8 (Diversity): 2 questions
- Domain 9 (Research): 2 questions
- Domain 10 (Legal/Ethics): 9 questions
**TOTAL VISIBLE: 31 questions**

But questions.json has **267 questions** and question-skill-map.json maps **160 questions**.

---

## ✅ TASK LIST

Work through these tasks **ONE AT A TIME**. After completing each task:
1. Mark it as COMPLETED in this document
2. Save any generated reports/files
3. Commit changes if appropriate
4. Move to the next task

---

### **TASK 1: Create Master Audit Script**
**Status:** [x] Completed

**Description:** Create a comprehensive audit script that analyzes all question sources and generates a detailed reconciliation report.

**Deliverables:**
- `scripts/audit-question-bank.ts` - Main audit script
- `reports/question-bank-audit-report.md` - Generated report

**Script Requirements:**
```typescript
// The script should:
// 1. Read all question files (questions.json, ets-sample-questions.json, etc.)
// 2. Read question-skill-map.json
// 3. Read skill-map.ts to understand the hierarchy
// 4. Generate report showing:
//    - Total questions per file
//    - Question IDs in each file
//    - Questions mapped vs unmapped
//    - Duplicate question IDs across files
//    - Questions in skill-map but not in questions.json
//    - Questions in questions.json but not in skill-map
//    - Coverage statistics per domain/cluster/skill
```

**Output Format:**
```markdown
# Question Bank Audit Report

## Summary Statistics
- Total unique questions: XXX
- Questions in questions.json: XXX
- Questions mapped to skills: XXX
- Unmapped questions: XXX
- Orphaned questions: XXX

## Detailed Findings
### File Analysis
[For each file: count, sample IDs, status]

### Mapping Analysis
[Mapped vs unmapped breakdown]

### Duplicate Analysis
[List any duplicate IDs found]

### Coverage Analysis
[Per domain/skill statistics]

## Recommendations
[Actionable next steps]
```

**Files to Analyze:**
- `src/data/questions.json`
- `src/data/question-skill-map.json`
- `src/brain/skill-map.ts`
- `Questions.txt`
- `src/data/ets-sample-questions.json`
- `src/data/generated-from-distractors.json`

**Validation:**
- [x] Script runs without errors
- [x] Report generated in reports/ directory
- [x] All files analyzed
- [x] Statistics are accurate

**Notes:**
✅ **Task 1 Completed Successfully!**

**Key Findings:**
- 267 questions in questions.json
- 190 questions mapped (71.2% coverage)
- 77 unmapped questions identified
- 155 duplicate IDs found (mostly Questions.txt duplicates)
- 165 orphaned questions across 3 files
- Domain coverage: 70-100% (good overall)
- 18 skills have zero questions

**Report Generated:** `reports/question-bank-audit-report.md`

**Next Steps:** Proceed to Task 2 to identify unmapped questions in detail.

---

### **TASK 2: Identify Unmapped Questions**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Create a script that identifies all questions in questions.json that have NO skill mapping in question-skill-map.json.

**Deliverables:**
- `scripts/find-unmapped-questions.ts`
- `reports/unmapped-questions.json` - List of unmapped question IDs
- `reports/unmapped-questions-detail.md` - Human-readable report with question text

**Script Requirements:**
```typescript
// 1. Load questions.json
// 2. Load question-skill-map.json
// 3. Find questions where ID is not in the mapping
// 4. Export list with question details
```

**Output Format:**
```json
[
  {
    "id": "QUESTION_ID",
    "text": "Question text preview",
    "domain": "if identifiable",
    "suggested_skill": "if can be inferred"
  }
]
```

**Validation:**
- [ ] Script identifies all unmapped questions
- [ ] Count matches: questions.json - mapped questions = unmapped count
- [ ] Report includes question text for manual review
- [ ] Suggestions for mapping provided where possible

**Notes:**
_[Add findings here]_

---

### **TASK 3: Reconcile Visual Hierarchy Disconnect**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Investigate why only 31 questions appear in the visual hierarchy when 160 are mapped in question-skill-map.json. Identify the 129 "missing" questions.

**Deliverables:**
- `scripts/reconcile-hierarchy.ts`
- `reports/hierarchy-reconciliation.md`

**Investigation Questions:**
1. Are the 129 questions mapped to skills that don't exist in skill-map.ts?
2. Are the 129 questions using old/deprecated skill IDs?
3. Does the visual hierarchy generation script have a filter?
4. Are the questions mapped but to skills with question count = 0?

**Script Requirements:**
```typescript
// 1. Load question-skill-map.json (160 mappings)
// 2. Load skill-map.ts (97 skills)
// 3. For each mapped question:
//    - Check if skill exists in skill-map.ts
//    - Check if question is in questions.json
//    - Identify why it's not appearing in hierarchy
// 4. Categorize the 129 missing questions:
//    - Mapped to non-existent skills
//    - Mapped to deprecated skills
//    - Other issues
```

**Validation:**
- [ ] All 160 mapped questions accounted for
- [ ] Explanation for why only 31 appear in hierarchy
- [ ] List of questions with invalid skill mappings
- [ ] Plan to fix mappings

**Notes:**
_[Record findings about the disconnect]_

---

### **TASK 4: Duplicate Detection Across All Files**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Check for duplicate questions across all question files using multiple detection methods.

**Deliverables:**
- `scripts/detect-duplicates.ts`
- `reports/duplicate-questions.md`

**Detection Methods:**
1. **Exact ID match** - Same question ID in multiple files
2. **Exact text match** - Same question text (different IDs)
3. **Fuzzy text match** - Similar question text (>90% similarity)
4. **Answer pattern match** - Same correct answer and distractor pattern

**Script Requirements:**
```typescript
// For each question file:
// 1. Load all questions
// 2. Compare question IDs
// 3. Compare question text (exact and fuzzy)
// 4. Compare answer patterns
// 5. Report duplicates with similarity scores
```

**Output Format:**
```markdown
## Duplicate Questions Found

### Exact ID Duplicates
- Question ID: XXX
  - Found in: questions.json, Questions.txt
  - Action: Keep version from questions.json

### Exact Text Duplicates
- Question text: "..."
  - IDs: XXX (questions.json), YYY (ets-sample-questions.json)
  - Similarity: 100%
  - Action: Merge or keep one

### Similar Text (>90%)
[List with similarity scores]
```

**Validation:**
- [ ] All files scanned
- [ ] Exact duplicates identified
- [ ] Similar questions flagged
- [ ] Recommendations for each duplicate pair

**Notes:**
_[Document duplicate patterns found]_

---

### **TASK 5: Evaluate Orphaned Files**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Analyze Questions.txt, ets-sample-questions.json, and generated-from-distractors.json to determine which questions are unique and valuable.

**Deliverables:**
- `scripts/evaluate-orphaned-files.ts`
- `reports/orphaned-files-evaluation.md`

**For Each Orphaned File:**
1. Count total questions
2. Identify questions already in questions.json (by ID or text)
3. Identify truly unique questions
4. Assess quality of unique questions
5. Recommend: integrate, archive, or delete

**Files to Evaluate:**
- **Questions.txt** (~125 questions)
  - Check if these are old versions of questions.json entries
  - Identify format (appears to be React component format)
  
- **ets-sample-questions.json** (30 questions)
  - Check if already in questions.json
  - Assess if ETS sample questions should be integrated
  
- **generated-from-distractors.json** (10 questions)
  - Validate if these are proper questions
  - Check if already integrated

**Output Format:**
```markdown
## Questions.txt Analysis
- Total questions: XXX
- Already in questions.json: XXX
- Unique questions: XXX
- Recommendation: [INTEGRATE/ARCHIVE/DELETE]

### Unique Questions from Questions.txt
[List with IDs and text preview]

## ets-sample-questions.json Analysis
[Similar structure]

## generated-from-distractors.json Analysis
[Similar structure]
```

**Validation:**
- [ ] All orphaned files analyzed
- [ ] Duplicates identified
- [ ] Unique questions counted
- [ ] Clear recommendations provided

**Notes:**
_[Document findings about orphaned files]_

---

### **TASK 6: Create Skill Mapping for Unmapped Questions**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Create or update skill mappings for the 107+ unmapped questions identified in Task 2.

**Deliverables:**
- `scripts/auto-map-questions.ts` - Automated mapping suggestions
- `reports/mapping-suggestions.json` - Suggested mappings
- `data/new-skill-mappings.json` - Approved new mappings

**Approach:**
1. **Automated Mapping** - Use question text analysis to suggest skills
2. **Pattern Matching** - Use question ID prefixes (ETS_Q, GEN-, NEW-) to infer domains
3. **Manual Review** - Flag questions that need human review
4. **Confidence Scoring** - Rate mapping suggestions (High/Medium/Low confidence)

**Script Requirements:**
```typescript
// 1. Load unmapped questions from Task 2
// 2. Analyze question text for keywords
// 3. Match keywords to skill descriptions from skill-map.ts
// 4. Generate mapping suggestions with confidence scores
// 5. Separate high-confidence vs needs-review
```

**Output Format:**
```json
{
  "high_confidence": [
    {
      "questionId": "XXX",
      "suggestedSkillId": "DBDM-S01",
      "confidence": 0.95,
      "reasoning": "Question mentions 'reliability' which maps to Reliability Type Selection"
    }
  ],
  "needs_review": [
    {
      "questionId": "YYY",
      "confidence": 0.45,
      "reasoning": "Could not determine appropriate skill"
    }
  ]
}
```

**Validation:**
- [ ] All unmapped questions processed
- [ ] Confidence scores assigned
- [ ] High-confidence mappings ready for integration
- [ ] Low-confidence questions flagged for review

**Notes:**
_[Document mapping patterns and challenges]_

---

### **TASK 7: Merge Unique Questions from Orphaned Files**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Based on Task 5 evaluation, merge valuable unique questions from orphaned files into questions.json.

**Deliverables:**
- `scripts/merge-questions.ts`
- `data/questions-pre-merge.backup.json` - Backup before merge
- Updated `src/data/questions.json`
- `reports/merge-report.md`

**Prerequisites:**
- Task 5 completed (know which questions to merge)
- Task 4 completed (duplicates identified)

**Script Requirements:**
```typescript
// 1. Backup current questions.json
// 2. Load questions to merge (from orphaned files)
// 3. Check for ID conflicts
// 4. Assign new IDs if needed
// 5. Validate question format
// 6. Merge into questions.json
// 7. Generate merge report
```

**Safety Checks:**
- [ ] Backup created before merge
- [ ] No duplicate IDs after merge
- [ ] All merged questions valid JSON
- [ ] Question format matches schema
- [ ] Merged questions have necessary fields

**Validation:**
- [ ] questions.json updated successfully
- [ ] New total question count is correct
- [ ] No data loss during merge
- [ ] Merge report generated

**Notes:**
_[Document merge decisions]_

---

### **TASK 8: Update question-skill-map.json**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Update the skill mapping file with new mappings from Task 6 and fix any invalid mappings from Task 3.

**Deliverables:**
- `scripts/update-skill-mappings.ts`
- `data/question-skill-map.backup.json` - Backup before update
- Updated `src/data/question-skill-map.json`
- `reports/mapping-update-report.md`

**Prerequisites:**
- Task 6 completed (new mappings created)
- Task 3 completed (invalid mappings identified)

**Updates Needed:**
1. Add new mappings from Task 6
2. Remove mappings to non-existent skills (from Task 3)
3. Update mappings to deprecated skills
4. Ensure all question IDs exist in questions.json

**Script Requirements:**
```typescript
// 1. Backup current question-skill-map.json
// 2. Load current mappings
// 3. Remove invalid mappings (skills that don't exist)
// 4. Add new mappings from Task 6
// 5. Validate all mappings
// 6. Write updated file
// 7. Generate report
```

**Validation:**
- [ ] Backup created
- [ ] All mapped questions exist in questions.json
- [ ] All mapped skills exist in skill-map.ts
- [ ] No orphaned mappings
- [ ] Coverage increased

**Notes:**
_[Document mapping changes]_

---

### **TASK 9: Regenerate Visual Hierarchy**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Regenerate the visual hierarchy tree using the updated questions.json and question-skill-map.json.

**Deliverables:**
- Updated `VISUAL_HIERARCHY_TREE.md`
- Updated `HIERARCHY_TREE.md`
- `reports/hierarchy-before-after.md` - Comparison report

**Prerequisites:**
- Task 8 completed (mappings updated)
- Task 7 completed (questions merged)

**Script to Run:**
```bash
npx tsx generate-visual-tree.ts
```

**Expected Changes:**
- Question count should increase from 31 to 160+ (mapped questions)
- More skills should show questions
- Domain coverage should improve significantly

**Validation:**
- [ ] New hierarchy generated successfully
- [ ] Question counts match updated mappings
- [ ] All mapped questions appear in hierarchy
- [ ] Coverage statistics are accurate
- [ ] Before/after comparison shows improvement

**Before (Current State):**
```
Total Questions: 31
Skills with Questions: 23 (23.7%)
Empty Skills: 74 (76.3%)
```

**After (Expected):**
```
Total Questions: ~260+
Skills with Questions: ~80+ (80%+)
Empty Skills: <20 (20%-)
```

**Notes:**
_[Document improvements in coverage]_

---

### **TASK 10: Clean Up Orphaned Files**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Based on decisions from Task 5, clean up orphaned files by archiving or deleting them.

**Deliverables:**
- `archive/` directory with archived files
- Updated `.gitignore` if needed
- `reports/cleanup-report.md`

**Actions:**

**Archive (Move to archive/ directory):**
- Questions.txt → `archive/Questions-old.txt`
- ets-sample-questions.json → `archive/ets-sample-questions-archived.json`
- generated-from-distractors.json → `archive/generated-from-distractors-archived.json`
- questions.json.backup.1768982876789 → Keep in src/data/ (recent backup)

**Update Documentation:**
- Add note to README about archived files
- Update any scripts that might reference old files

**Validation:**
- [ ] Files archived to archive/ directory
- [ ] Original files removed from working directories
- [ ] No broken imports in codebase
- [ ] Documentation updated
- [ ] Git status clean

**Notes:**
_[Document archival decisions]_

---

### **TASK 11: Validate Application Integration**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Test that the application correctly loads and uses the updated question bank.

**Deliverables:**
- `reports/integration-test-report.md`
- Screenshot or evidence of working application

**Test Cases:**
1. **App Loads Successfully**
   - Run `npm run dev`
   - Verify no console errors related to questions
   - Verify question count displayed correctly

2. **Questions Display Correctly**
   - Navigate through different domains
   - Verify questions appear for all mapped skills
   - Verify question format is correct

3. **Skill Mappings Work**
   - Verify adaptive learning uses skill mappings
   - Verify progress tracking works
   - Verify skill mastery calculations

4. **Data Integrity**
   - Verify no missing questions
   - Verify no duplicate questions displayed
   - Verify all question IDs unique

**Validation Checklist:**
- [ ] App starts without errors
- [ ] Questions load from questions.json
- [ ] Skill mappings load from question-skill-map.json
- [ ] Question count matches expected (~260+)
- [ ] All domains show questions
- [ ] No console errors
- [ ] Adaptive learning works
- [ ] Progress tracking works

**Notes:**
_[Document any issues found during testing]_

---

### **TASK 12: Generate Final Audit Report**
**Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Blocked

**Description:** Create a comprehensive final report documenting all changes, improvements, and current state.

**Deliverables:**
- `FINAL_AUDIT_REPORT.md`
- `reports/before-after-comparison.md`

**Report Sections:**

**1. Executive Summary**
- What was fixed
- Key improvements
- Current state

**2. Issues Addressed**
- List all issues from initial audit
- How each was resolved

**3. Before/After Metrics**
```markdown
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Questions | 267 (isolated) | XXX | +XX |
| Mapped Questions | 31 visible | XXX | +XXX |
| Skill Coverage | 23.7% | XX% | +XX% |
| Orphaned Files | 3 | 0 | -3 |
| Unmapped Questions | 107 | XX | -XX |
```

**4. File Inventory (Final State)**
- List all question files and their status
- Document what's in archive/

**5. Recommendations Going Forward**
- Maintenance procedures
- How to add new questions
- How to maintain mappings

**Validation:**
- [ ] All metrics collected
- [ ] Before/after comparison complete
- [ ] All tasks documented
- [ ] Recommendations provided

**Notes:**
_[Final observations and recommendations]_

---

## 🔧 WORKING NOTES SECTION

Use this section for ongoing notes, blockers, and decisions.

### Current Task Working On:
_[Task number and name]_

### Blockers/Issues:
_[Document any blockers here]_

### Decisions Made:
_[Document key decisions for future reference]_

### Questions for Review:
_[Questions that need human input]_

---

## 📁 GENERATED FILES INVENTORY

Track all files created during this audit process:

### Scripts Created:
- [ ] `scripts/audit-question-bank.ts`
- [ ] `scripts/find-unmapped-questions.ts`
- [ ] `scripts/reconcile-hierarchy.ts`
- [ ] `scripts/detect-duplicates.ts`
- [ ] `scripts/evaluate-orphaned-files.ts`
- [ ] `scripts/auto-map-questions.ts`
- [ ] `scripts/merge-questions.ts`
- [ ] `scripts/update-skill-mappings.ts`

### Reports Generated:
- [ ] `reports/question-bank-audit-report.md`
- [ ] `reports/unmapped-questions.json`
- [ ] `reports/unmapped-questions-detail.md`
- [ ] `reports/hierarchy-reconciliation.md`
- [ ] `reports/duplicate-questions.md`
- [ ] `reports/orphaned-files-evaluation.md`
- [ ] `reports/mapping-suggestions.json`
- [ ] `reports/merge-report.md`
- [ ] `reports/mapping-update-report.md`
- [ ] `reports/hierarchy-before-after.md`
- [ ] `reports/cleanup-report.md`
- [ ] `reports/integration-test-report.md`
- [ ] `FINAL_AUDIT_REPORT.md`

### Backups Created:
- [ ] `data/questions-pre-merge.backup.json`
- [ ] `data/question-skill-map.backup.json`

### Archives:
- [ ] `archive/Questions-old.txt`
- [ ] `archive/ets-sample-questions-archived.json`
- [ ] `archive/generated-from-distractors-archived.json`

---

## 🎯 SUCCESS CRITERIA

This audit is complete when:

- [ ] All questions in questions.json are mapped to skills (0 unmapped)
- [ ] Visual hierarchy shows all mapped questions (160+)
- [ ] No orphaned question files in working directories
- [ ] No duplicate questions in the system
- [ ] Application loads and uses questions correctly
- [ ] Coverage across all domains improved
- [ ] All reports generated and filed
- [ ] Final audit report completed
- [ ] Code committed with clear commit messages

---

## 💡 TIPS FOR CURSOR

**How to Use This Prompt:**
1. Read the entire prompt first to understand the full scope
2. Work on ONE task at a time
3. Mark each task's status as you progress
4. Generate all required deliverables for each task
5. Validate each task before moving to the next
6. Document findings in the Notes sections
7. Update the Working Notes section regularly

**If You Get Stuck:**
- Document the blocker in the Working Notes
- Try to provide partial completion
- Suggest what human input is needed
- Move to a non-blocked task if possible

**Best Practices:**
- Create backups before modifying data files
- Validate data integrity after each change
- Generate reports for human review
- Keep original files safe (backups)
- Document all decisions and reasoning

**Commit Strategy:**
- Commit after each major task completion
- Use descriptive commit messages
- Tag commits with task numbers
- Don't commit until task is validated

---

## 📞 NEED HELP?

If you need clarification on any task, ask these questions:
1. What is the expected output format?
2. What validation checks should I perform?
3. How should I handle edge cases?
4. Should I create a backup first?
5. What happens if this data is malformed?

---

**START WITH TASK 1 and work through sequentially. Good luck! 🚀**
