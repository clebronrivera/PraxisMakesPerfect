# Quick Start Guide: Using Cursor for Question Bank Audit

## 🚀 How to Use These Files

### **Files Created:**
1. **CURSOR_PROMPT_QUESTION_BANK_AUDIT.md** - Comprehensive prompt with detailed instructions
2. **TASK_TRACKER.md** - Simplified tracker that Cursor can update
3. **This guide** - How to get started

---

## 📝 Step-by-Step Setup

### **1. Copy Files to Your Project**
```bash
# From wherever you downloaded these files:
cp CURSOR_PROMPT_QUESTION_BANK_AUDIT.md /Users/lebron/Documents/PraxisMakesPerfect/
cp TASK_TRACKER.md /Users/lebron/Documents/PraxisMakesPerfect/
```

### **2. Create Required Directories**
```bash
cd /Users/lebron/Documents/PraxisMakesPerfect
mkdir -p scripts reports data archive
```

### **3. Open in Cursor**
```bash
# Open your project in Cursor
cursor /Users/lebron/Documents/PraxisMakesPerfect
```

---

## 💬 How to Prompt Cursor

### **Initial Prompt (Copy/Paste This):**

```
I have a question bank data integrity issue that needs to be fixed. 

Please read these files to understand the situation:
1. CURSOR_PROMPT_QUESTION_BANK_AUDIT.md - Contains full context and task list
2. TASK_TRACKER.md - Simplified task tracker

After reading both files:
1. Confirm you understand the issue
2. Start with Task 1: Create Master Audit Script
3. Update TASK_TRACKER.md as you progress
4. Ask me for clarification if needed

Let's begin with Task 1. Please create the audit script as described.
```

---

## 🎯 Working Through Tasks

### **For Each Task, Tell Cursor:**

```
Please work on Task [NUMBER]: [TASK NAME]

Requirements:
1. Read the task details from CURSOR_PROMPT_QUESTION_BANK_AUDIT.md
2. Create all required files/scripts
3. Generate all required reports
4. Update TASK_TRACKER.md with:
   - Status change
   - Notes about findings
   - Completion date
   - Any blockers
5. Validate the task completion
6. Show me the results

Once validated, I'll tell you to move to the next task.
```

---

## 📋 Task Flow Example

### **Example Conversation:**

**You:**
```
Please work on Task 1: Create Master Audit Script

Follow the requirements in CURSOR_PROMPT_QUESTION_BANK_AUDIT.md and 
update TASK_TRACKER.md when done.
```

**Cursor Will:**
1. Create `scripts/audit-question-bank.ts`
2. Run the script
3. Generate `reports/question-bank-audit-report.md`
4. Update TASK_TRACKER.md status
5. Show you the results

**You Review, Then:**
```
Great! The audit looks good. Please move to Task 2: Identify Unmapped Questions
```

---

## 🛠️ Cursor Best Practices

### **1. One Task at a Time**
✅ DO: "Work on Task 1"
❌ DON'T: "Do Tasks 1-5"

### **2. Always Validate**
✅ DO: Review outputs before moving forward
❌ DON'T: Let Cursor run through all tasks without checking

### **3. Check the Tracker**
✅ DO: Review TASK_TRACKER.md after each task
❌ DON'T: Lose track of progress

### **4. Save Work**
✅ DO: Commit after each major task
❌ DON'T: Make all changes without commits

### **5. Ask for Reports**
✅ DO: "Show me the audit report"
❌ DON'T: Assume everything worked without checking

---

## 🔍 What to Look For

### **After Task 1 (Audit):**
Check: Does the report show all 267 questions? Are the 107 unmapped identified?

### **After Task 2 (Unmapped):**
Check: Are all unmapped questions listed? Does the count match?

### **After Task 3 (Hierarchy):**
Check: Did Cursor find why only 31 questions appear instead of 160?

### **After Task 4 (Duplicates):**
Check: Are there duplicate IDs across files? Similar text?

### **After Task 5 (Orphans):**
Check: Which orphaned files have unique questions worth keeping?

### **After Task 6 (Mapping):**
Check: Do the mapping suggestions make sense? What's the confidence level?

### **After Task 7 (Merge):**
Check: Did questions merge successfully? Any ID conflicts?

### **After Task 8 (Update Mappings):**
Check: Are all mappings valid? Coverage improved?

### **After Task 9 (Hierarchy):**
Check: Does the new hierarchy show 160+ questions? Coverage at 80%+?

### **After Task 10 (Cleanup):**
Check: Are orphaned files archived? No broken imports?

### **After Task 11 (Integration):**
Check: Does the app load? Do questions display correctly?

### **After Task 12 (Final Report):**
Check: Are all improvements documented? Metrics accurate?

---

## 🚨 Troubleshooting

### **If Cursor Gets Confused:**
```
Please re-read CURSOR_PROMPT_QUESTION_BANK_AUDIT.md, specifically the 
section for Task [NUMBER]. Focus on [SPECIFIC REQUIREMENT].
```

### **If There's a Blocker:**
```
I see you're blocked on Task [NUMBER]. Please:
1. Document the blocker in TASK_TRACKER.md
2. Tell me what information or decision you need from me
3. Suggest potential solutions
```

### **If Output is Wrong:**
```
The output for Task [NUMBER] doesn't match requirements. Please:
1. Re-read the task requirements
2. Check the validation checklist
3. Fix the issues
4. Regenerate the output
```

### **If You Want to Skip a Task:**
```
Let's skip Task [NUMBER] for now and move to Task [NEXT NUMBER].
Please mark Task [NUMBER] as "Blocked" in TASK_TRACKER.md and note 
why we're skipping it.
```

---

## 📊 Progress Tracking

### **Check Progress Anytime:**
```
Please show me:
1. Current status from TASK_TRACKER.md
2. Tasks completed so far
3. Current metrics vs. targets
4. Any blockers
```

### **Get Summary:**
```
Please summarize:
1. What we've accomplished so far
2. What remains to be done
3. Any issues found
4. Estimated completion
```

---

## 🎯 Success Criteria

### **You'll Know You're Done When:**

✅ All 12 tasks marked complete in TASK_TRACKER.md
✅ FINAL_AUDIT_REPORT.md generated
✅ Metrics show:
   - Total questions: 260+
   - Mapped questions: 260+
   - Unmapped questions: 0
   - Skill coverage: 80%+
   - Orphaned files: 0
✅ Application loads and works correctly
✅ All generated files in proper directories

---

## 💡 Pro Tips

### **1. Use Cursor's Context**
Cursor can see all your project files. Reference them:
```
Based on the current questions.json file, [do something]
```

### **2. Ask for Explanations**
```
Before you do Task [NUMBER], explain your approach and ask if it's correct.
```

### **3. Request Incremental Updates**
```
For Task [NUMBER], show me progress after each sub-step.
```

### **4. Save Intermediate Results**
```
After generating the report, save it before moving forward.
```

### **5. Commit Frequently**
```
After completing Task [NUMBER], create a git commit with message:
"Task [NUMBER]: [Task Name] - [Brief description of changes]"
```

---

## 📞 Need Help?

### **If Something Goes Wrong:**
1. Check TASK_TRACKER.md for the current state
2. Review the most recent report in reports/
3. Check if backups were created
4. Tell Cursor to roll back if needed:
   ```
   Something went wrong. Please:
   1. Restore from the backup
   2. Explain what happened
   3. Suggest how to fix it
   ```

### **If You're Stuck:**
1. Pause and review what's been done
2. Check the validation checklist for the current task
3. Ask Cursor to explain what it's doing
4. Consider skipping and coming back later

---

## 🎬 Ready to Start?

### **Copy this to Cursor to begin:**

```
Hi! I need help fixing data integrity issues in my question bank.

Please read these two files:
1. CURSOR_PROMPT_QUESTION_BANK_AUDIT.md
2. TASK_TRACKER.md

After reading, confirm you understand:
- The problem (267 questions, only 31 mapped, 107 unmapped)
- The 12 tasks we need to complete
- How to update TASK_TRACKER.md as you work

Then let's start with Task 1. Ready?
```

---

**Good luck! 🚀 Remember: One task at a time, validate everything, and keep the tracker updated!**
