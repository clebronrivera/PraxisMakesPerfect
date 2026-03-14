# Correction Plan - Execution Summary

## ✅ Scripts Created/Updated

### 1. ✅ Deduplication Script Created
**File:** `deduplicate-questions.ts`
- Removes duplicate question IDs from questions.json
- Creates backup before modification
- Logs all duplicates found and removed
- Keeps first occurrence of each ID

### 2. ✅ Generation Script Updated
**File:** `generate-gap-questions.ts`
- Added duplicate ID checking before adding questions
- Added MBH-S03 to Phase 1 skills (3 questions)
- Skips questions with existing IDs
- Logs skipped duplicates

### 3. ✅ Health Check Script Fixed
**File:** `health-check.ts`
- Fixed correct answer display (now shows answer letters and text)
- Properly handles `correct_answer` array field
- Better formatting for generated questions

---

## 📋 Execution Steps

### Step 1: Remove Duplicates (CRITICAL)
```bash
# Run deduplication script
npx tsx deduplicate-questions.ts
```

**Expected Result:**
- Backup created automatically
- 61 duplicate questions removed
- ~260 unique questions remain

**Verify:**
```bash
# Run health check to confirm no duplicates
npx tsx health-check.ts
# Should show: "No duplicate question IDs found ✓"
```

---

### Step 2: Generate Questions for MBH-S03
```bash
# Run generation script (will skip duplicates automatically)
npx tsx generate-gap-questions.ts
```

**Expected Result:**
- 3 new questions generated for MBH-S03
- All questions have unique IDs
- Total questions: ~263 (after deduplication + 3 new)

**Verify:**
```bash
# Run health check
npx tsx health-check.ts
# Should show: MBH-S03 has 3 questions
# Should show: All 97 skills have at least 1 question
```

---

### Step 3: Verify All Fixes
```bash
# Run full health check
npx tsx health-check.ts
```

**Expected Results:**
- ✅ Zero duplicate question IDs
- ✅ All 97 skills have at least 1 question
- ✅ Correct answers displayed properly for all generated questions
- ✅ Total question count accurate

---

## 🔍 Verification Checklist

After running all scripts, verify:

- [ ] No duplicate IDs in health check output
- [ ] MBH-S03 appears in skill coverage with 3 questions
- [ ] All 97 skills have at least 1 question
- [ ] Generated questions show correct answers (not "N/A")
- [ ] Total question count is reasonable (~260-270)
- [ ] Backup file exists for safety

---

## 📊 Expected Final State

### Question-Skill Mapping
- Total questions: ~260-270 (after deduplication + MBH-S03)
- Questions with valid skillId: 100%
- Duplicate IDs: 0

### Skill Coverage
- Total skills: 97
- Skills with 0 questions: 0
- MBH-S03: 3 questions

### Generated Questions
- All show correct answer letters and text
- All have valid skillIds
- No duplicates

---

## ⚠️ Important Notes

1. **Backup Created:** The deduplication script creates a timestamped backup automatically
2. **Safe to Re-run:** Generation script now checks for duplicates, safe to run multiple times
3. **MBH-S03 Added:** Now included in Phase 1 generation (3 questions)
4. **Health Check Fixed:** Now properly displays correct answers

---

## 🚨 If Issues Occur

### If deduplication removes too many questions:
- Check backup file: `src/data/questions.json.backup.*`
- Restore if needed: `cp src/data/questions.json.backup.* src/data/questions.json`

### If MBH-S03 questions don't generate:
- Check templates exist: `grep -r "MBH-S03" src/brain/templates/`
- Verify skill exists: `grep "MBH-S03" src/brain/skill-map.ts`
- Check generation logs for errors

### If health check still shows issues:
- Verify questions.json format is correct
- Check that correct_answer field exists and is an array
- Review health-check.ts output for specific errors

---

## 📝 Files Modified

1. ✅ `deduplicate-questions.ts` - NEW
2. ✅ `generate-gap-questions.ts` - UPDATED
3. ✅ `health-check.ts` - UPDATED
4. ⏳ `src/data/questions.json` - Will be modified by scripts

---

## Next Steps After Execution

1. Review the health check report
2. Test question generation for a few skills
3. Verify question quality
4. Consider adding ID uniqueness check to CI/CD
5. Document the deduplication process for future reference
