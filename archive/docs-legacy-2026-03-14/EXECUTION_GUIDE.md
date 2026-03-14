# Question Quality Fix - Execution Guide

This guide explains how to use the scripts to identify and fix quality issues in your question bank.

---

## Quick Start

```bash
# 1. Analyze questions and generate reports
npx tsx question-quality-analyzer.ts

# 2. Apply automatic fixes and generate fix report
npx tsx question-quality-fixer.ts

# 3. Regenerate better distractors for GEN-* questions
npx tsx regenerate-distractors.ts

# 4. Run health check to verify fixes (if available)
npx tsx health-check.ts
```

---

## Scripts Overview

| Script | Purpose | Output |
|--------|---------|--------|
| `question-quality-analyzer.ts` | Identifies all quality issues | Reports in `quality-reports/` |
| `question-quality-fixer.ts` | Applies skill reassignments, flags manual fixes | `quality-reports/questions-fixed.json` |
| `regenerate-distractors.ts` | Replaces nonsensical distractors | `quality-reports/questions-with-new-distractors.json` |

---

## Step-by-Step Workflow

### Step 1: Configure Scripts

The scripts are already configured for this project:
- Questions file: `./src/data/questions.json`
- Skill map: `./src/brain/skill-map.ts`
- Output directory: `./quality-reports`

### Step 2: Run Analysis

```bash
npx tsx question-quality-analyzer.ts
```

This generates:
- `quality-report-[timestamp].md` - Human-readable detailed report
- `quality-report-[timestamp].csv` - Spreadsheet for tracking
- `quality-report-[timestamp].json` - Raw data for programmatic use
- `suggested-fixes-[timestamp].ts` - Fix script template

### Step 3: Review Analysis Report

Check `quality-reports/quality-report-[timestamp].md` for:

1. **Critical Issues** - Must fix before production use
   - Skill mismatches (questions in wrong skill category)
   - Nonsensical distractors (unrelated answer choices)

2. **High Issues** - Should fix soon
   - Truncated text
   - Missing required fields

3. **Medium Issues** - Fix when possible
   - Repetitive templates
   - Partial answer overlaps

### Step 4: Apply Automatic Fixes

```bash
npx tsx question-quality-fixer.ts
```

This automatically:
- ✅ Reassigns mismatched questions to correct skills
- 📝 Generates list of items needing manual review

Check `quality-reports/fix-report.md` for details.

**Note:** The script converts questions from the project format (object-based choices) to the script format, applies fixes, then converts back. The output maintains the original format.

### Step 5: Regenerate Distractors

```bash
npx tsx regenerate-distractors.ts
```

This:
- Identifies GEN-* questions with nonsensical distractors
- Replaces them with contextually appropriate options from skill-specific pools
- Logs all changes for review

**Note:** This script also handles format conversion automatically.

### Step 6: Manual Review

Some issues require human judgment:

1. **Verify skill reassignments** - Confirm the suggested skill is correct
2. **Review new distractors** - Ensure they make sense in context
3. **Fix truncated text** - Complete any incomplete text
4. **Reduce repetition** - Consider varying highly similar questions

### Step 7: Merge and Verify

```bash
# Backup original
cp src/data/questions.json src/data/questions.json.backup

# Apply fixes (choose one based on your workflow)
cp quality-reports/questions-with-new-distractors.json src/data/questions.json

# Or use the fixed questions from the fixer
cp quality-reports/questions-fixed.json src/data/questions.json

# Verify with health check (if available)
npx tsx health-check.ts
```

---

## Issue Categories

### 🚨 Critical: Skill Mismatches

**What it means:** Question tests a different skill than it's assigned to.

**Example:**
- Question: "What court case established duty to warn?"
- Assigned Skill: Behavior Function Identification
- Should Be: Legal/Ethics

**Fix:** Reassign to correct skill (automatic with `question-quality-fixer.ts`)

### 🚨 Critical: Nonsensical Distractors

**What it means:** Answer choices are completely unrelated to the question.

**Example:**
- Question: "What is an example of an accommodation?"
- Bad Distractor: "Tarasoff" (legal case, irrelevant)

**Fix:** Replace with contextually appropriate options (automatic with `regenerate-distractors.ts`)

### ⚠️ High: Truncated Text

**What it means:** Text is cut off mid-sentence.

**Example:** "Include students with severe conduct disorders in group..."

**Fix:** Manual - complete the text

### 📝 Medium: Repetitive Templates

**What it means:** Multiple questions follow identical patterns.

**Example:** 10 questions all asking "A student with [X] needs [Y]. This is an example of:"

**Fix:** Manual - vary question structure or reduce similar questions

---

## Data Format Notes

The scripts automatically handle conversion between formats:

- **Project format** (questions.json): Choices as object `{ A: "text", B: "text" }`, `correct_answer` as array
- **Script format** (internal): Choices as array `[{ letter: "A", text: "text" }]`, `correctAnswer` as single string

All scripts convert on load and convert back on save, so you don't need to worry about format differences.

---

## Customization

### Adding New Skill Keywords

In `question-quality-analyzer.ts`, add keywords for new skills:

```typescript
const SKILL_KEYWORDS: Record<string, string[]> = {
  'YOUR-NEW-SKILL': ['keyword1', 'keyword2', 'specific term'],
  // ...
};
```

### Adding New Distractor Pools

In `regenerate-distractors.ts`, add distractors for new skills:

```typescript
const DISTRACTOR_POOLS: Record<string, string[]> = {
  'YOUR-NEW-SKILL': [
    'Plausible but incorrect option 1',
    'Plausible but incorrect option 2',
    // Add 5-10 options per skill
  ],
  // ...
};
```

### Adding Known Mismatches

In `question-quality-fixer.ts`, add confirmed mismatches:

```typescript
const SKILL_REASSIGNMENTS: Record<string, {...}> = {
  'QUESTION-ID-HERE': {
    newSkillId: 'CORRECT-SKILL-ID',
    newSkillName: 'Correct Skill Name',
    reason: 'Explanation of why this is correct'
  },
  // ...
};
```

---

## Troubleshooting

### "Questions file not found"

The scripts are configured to use `./src/data/questions.json`. If your file is elsewhere, update `CONFIG.questionsPath` in each script.

### "No distractor pool for skill"

Add a distractor pool for that skill in `regenerate-distractors.ts`.

### Changes not appearing

Make sure you're copying the output file to replace the original:
```bash
cp quality-reports/questions-with-new-distractors.json src/data/questions.json
```

### Format conversion issues

If you encounter issues with format conversion, check that:
1. Questions have a `choices` object with letter keys (A, B, C, etc.)
2. Questions have a `correct_answer` array
3. Questions have a `skillId` field

---

## Summary Checklist

- [ ] Run `question-quality-analyzer.ts`
- [ ] Review analysis report
- [ ] Run `question-quality-fixer.ts`
- [ ] Run `regenerate-distractors.ts`
- [ ] Review fix report and regeneration log
- [ ] Make manual fixes for remaining issues
- [ ] Merge fixed questions into main file
- [ ] Run `health-check.ts` to verify (if available)
- [ ] Commit changes
