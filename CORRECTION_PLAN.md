# Health Check Issues - Correction Plan

## Issue Summary

### Critical Issues
1. **61 Duplicate Question IDs** - Same question IDs appear multiple times in questions.json
2. **1 Skill with 0 Questions** - MBH-S03 has no questions mapped

### Minor Issues
3. **Health Check Display** - Correct answer field not displayed correctly (shows "N/A" when answers exist)

---

## Root Cause Analysis

### Issue 1: Duplicate Question IDs
**Root Cause:**
- The `generate-gap-questions.ts` script was run multiple times
- Each run appends questions to `questions.json` without checking for existing IDs
- Question ID generation uses hash of `templateId + slotValues`
- Same template + slot values = same ID, even if generated at different times
- Different runs with same seed values or random chance can produce identical IDs

**Evidence:**
- Example: `GEN-CC-T10-dbtzi6` appears 3 times (lines 3482, 3797, 4457)
- Each duplicate has different distractors but same stem and skillId
- Total of 61 unique IDs that appear multiple times

**Impact:**
- Data integrity compromised
- Potential confusion in question selection
- Inflated question count

### Issue 2: MBH-S03 Has 0 Questions
**Root Cause:**
- Skill `MBH-S03` (Replacement Behavior Selection) exists in skill-map.ts
- Templates exist: `MBH-T03` and `MBH-T03B` in domain-4-templates.ts
- This skill was not included in any generation phase in `generate-gap-questions.ts`

**Evidence:**
- Skill defined at line 702 in skill-map.ts
- Templates at lines 119 and 135 in domain-4-templates.ts
- Not listed in phase1Skills, phase2Skills, or phase3Skills arrays

**Impact:**
- Skill coverage gap
- No practice questions available for this skill

### Issue 3: Health Check Display Issue
**Root Cause:**
- Health check script looks for `correctAnswer` or `answer` fields
- Actual field name is `correct_answer` (array format)
- Questions DO have correct answers, just wrong field name checked

**Impact:**
- Misleading health check output
- Makes it appear questions are incomplete when they're not

---

## Correction Plan

### Phase 1: Fix Duplicate Question IDs (CRITICAL)

#### Step 1.1: Create Deduplication Script
- Script to read questions.json
- Group questions by ID
- For each duplicate ID:
  - Keep the first occurrence (or most complete version)
  - Remove subsequent duplicates
- Log which duplicates were removed
- Create backup before modification

#### Step 1.2: Update Generation Script
- Modify `generate-gap-questions.ts` to:
  - Check for existing question IDs before adding
  - Skip questions that already exist
  - Add option to force regeneration if needed
  - Log when duplicates are detected

#### Step 1.3: Validation
- Run health check after deduplication
- Verify duplicate count is 0
- Verify total question count is correct (321 - duplicates removed)

**Expected Outcome:**
- No duplicate IDs
- Clean questions.json file
- Accurate question count

---

### Phase 2: Generate Questions for MBH-S03

#### Step 2.1: Add MBH-S03 to Generation
- Add MBH-S03 to appropriate phase in `generate-gap-questions.ts`
- Generate 3-5 questions for this skill
- Use existing templates: MBH-T03 and MBH-T03B

#### Step 2.2: Validate Generation
- Verify questions are generated correctly
- Verify skillId mapping is correct
- Run health check to confirm MBH-S03 has questions

**Expected Outcome:**
- MBH-S03 has 3-5 questions
- All 97 skills have at least 1 question
- Skill coverage complete

---

### Phase 3: Fix Health Check Script

#### Step 3.1: Update Field Name Check
- Change health check to look for `correct_answer` field
- Handle array format correctly
- Display correct answer letter(s) instead of "N/A"

#### Step 3.2: Enhanced Reporting
- Show correct answer for generated questions
- Better formatting for readability
- Include question completeness indicators

**Expected Outcome:**
- Accurate health check output
- Correct answers displayed properly
- Better visibility into question quality

---

## Implementation Steps

### Step 1: Create Deduplication Script
```typescript
// deduplicate-questions.ts
// - Read questions.json
// - Group by ID
// - Keep first occurrence, remove duplicates
// - Create backup
// - Write cleaned file
```

### Step 2: Update generate-gap-questions.ts
```typescript
// Add duplicate checking:
// - Load existing questions
// - Check IDs before adding
// - Skip duplicates
// - Log skipped questions
```

### Step 3: Add MBH-S03 Generation
```typescript
// Add to phase1Skills or create new phase:
{ skillId: 'MBH-S03', count: 3 }
```

### Step 4: Fix Health Check Script
```typescript
// Update correct answer display:
// - Check for correct_answer field
// - Display answer letter(s)
// - Show full question details
```

### Step 5: Run Validation
```bash
# Run health check after fixes
npx tsx health-check.ts
# Verify all issues resolved
```

---

## Risk Assessment

### Low Risk
- Health check script fix (read-only, display only)
- Adding MBH-S03 questions (additive only)

### Medium Risk
- Deduplication (modifies data file)
  - Mitigation: Create backup first
  - Test on copy first
  - Verify results before finalizing

### High Risk
- None identified

---

## Success Criteria

1. ✅ Zero duplicate question IDs
2. ✅ All 97 skills have at least 1 question
3. ✅ Health check shows correct answers for all questions
4. ✅ Total question count is accurate
5. ✅ All generated questions have valid skillIds

---

## Timeline Estimate

- Phase 1 (Deduplication): 30 minutes
- Phase 2 (MBH-S03): 15 minutes
- Phase 3 (Health Check Fix): 15 minutes
- Testing & Validation: 15 minutes

**Total: ~75 minutes**

---

## Files to Modify

1. `src/data/questions.json` - Remove duplicates
2. `generate-gap-questions.ts` - Add duplicate checking, add MBH-S03
3. `health-check.ts` - Fix correct answer display
4. `CORRECTION_PLAN.md` - This file (track progress)

---

## Notes

- Always create backups before modifying questions.json
- Test deduplication logic on a small subset first
- Verify question quality after MBH-S03 generation
- Consider adding ID uniqueness check to CI/CD if applicable
