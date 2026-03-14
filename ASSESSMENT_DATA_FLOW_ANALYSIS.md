# Assessment Data Flow Analysis

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. This document remains authoritative for assessment and report persistence risks unless superseded by current code and newer changelog entries.

## Current Setup Overview

### 1. **Assessment Completion Tracking**

**Location:** Firestore `users/{uid}` document

**Fields:**
- `preAssessmentComplete: boolean` - Tracks if pre-assessment (practice assessment) is completed
- `fullAssessmentComplete: boolean` - Tracks if full assessment is completed
- `preAssessmentQuestionIds: string[]` - Question IDs used in pre-assessment
- `fullAssessmentQuestionIds: string[]` - Question IDs used in full assessment

**Code Location:** 
- Set in `App.tsx` lines 293-322 (`handlePreAssessmentComplete`)
- Set in `App.tsx` lines 324-350 (`handleFullAssessmentComplete`)
- Stored via `useFirebaseProgress.ts` hook

### 2. **Response Data Storage**

**Location:** Firestore `users/{uid}/responses` subcollection

**Structure:** Each response document contains:
```typescript
{
  questionId: string;
  skillId?: string;
  domainId?: number;
  assessmentType: 'diagnostic' | 'full' | 'practice';
  sessionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  timeSpent: number;
  timestamp: number;
  selectedAnswer?: string;
  distractorPatternId?: string;
  createdAt: Timestamp;
}
```

**Code Location:** 
- Logged via `logResponse()` function in `useFirebaseProgress.ts` (lines 194-214)
- Called during assessment in `PreAssessment.tsx` (line 200) and `FullAssessment.tsx`

### 3. **Preventing Retakes**

**Current Implementation:**
- ✅ **Pre-Assessment:** UI checks `profile.preAssessmentComplete` 
  - If `true`, the "Start New" button is hidden (line 569 in `App.tsx`)
  - User cannot retake pre-assessment once completed
  
- ⚠️ **Full Assessment:** Currently ALWAYS available
  - Button is always shown regardless of `fullAssessmentComplete` status (line 622 in `App.tsx`)
  - Users CAN retake full assessment even after completion

**Code Location:**
- `App.tsx` lines 569-602 (pre-assessment conditional rendering)
- `App.tsx` lines 622-635 (full assessment - always available)

### 4. **Report Access After Completion**

**Current State:** ❌ **NOT IMPLEMENTED**

**Problem:**
- Reports are only shown immediately after completion via component state (`lastAssessmentResponses`)
- Data is stored in Firestore but NOT retrieved to rebuild reports
- If user refreshes page or logs out/in, report data is lost
- No UI to view past assessment results

**Code Location:**
- Reports displayed in `App.tsx` lines 762-806 (`score-report` mode)
- Uses `lastAssessmentResponses` state (line 764) which is only set during completion
- No Firestore query to retrieve past responses

### 5. **Data Flow Summary**

```
Assessment Taken
    ↓
Responses logged to Firestore (users/{uid}/responses)
    ↓
Assessment completion handler called
    ↓
Profile updated (preAssessmentComplete: true)
    ↓
Responses stored in component state (lastAssessmentResponses)
    ↓
Report shown immediately
    ↓
[User logs out/refreshes]
    ↓
Report data LOST (not retrievable)
```

## Issues Identified

### Issue 1: Reports Not Persisted/Retrievable
- **Problem:** Assessment reports cannot be viewed after page refresh or re-login
- **Impact:** Users lose access to their assessment results and feedback
- **Solution Needed:** Query Firestore responses subcollection to rebuild reports

### Issue 2: Full Assessment Can Be Retaken
- **Problem:** Full assessment button is always available, even after completion
- **Impact:** Users can retake full assessment (may or may not be desired)
- **Solution Needed:** Add conditional check similar to pre-assessment

### Issue 3: No Historical Report View
- **Problem:** No way to view past assessment results
- **Impact:** Users cannot review previous assessment performance
- **Solution Needed:** Add "View Past Reports" feature that queries Firestore

## Recommended Solutions

### Solution 1: Retrieve Responses from Firestore for Reports
Create a function to query `users/{uid}/responses` subcollection filtered by:
- `assessmentType: 'diagnostic'` for pre-assessment
- `assessmentType: 'full'` for full assessment
- Order by `timestamp` or `createdAt`

### Solution 2: Store Assessment Metadata
Add to user profile:
- `lastPreAssessmentSessionId: string` - Session ID of last completed pre-assessment
- `lastFullAssessmentSessionId: string` - Session ID of last completed full assessment
- `lastPreAssessmentCompletedAt: Timestamp` - When pre-assessment was completed
- `lastFullAssessmentCompletedAt: Timestamp` - When full assessment was completed

### Solution 3: Add Report Retrieval Function
Create `getAssessmentResponses(sessionId: string)` function that:
1. Queries responses subcollection filtered by `sessionId`
2. Retrieves question details from question IDs
3. Rebuilds `UserResponse[]` array
4. Returns data for ScoreReport component

### Solution 4: Add "View Report" Button
On home screen, if assessment is completed:
- Show "View Last Pre-Assessment Report" button
- Show "View Last Full Assessment Report" button
- These buttons retrieve and display past reports

## Firestore Structure

```
users/
  {uid}/
    - preAssessmentComplete: boolean
    - fullAssessmentComplete: boolean
    - preAssessmentQuestionIds: string[]
    - fullAssessmentQuestionIds: string[]
    - domainScores: {...}
    - skillScores: {...}
    - lastSession: {...}
    responses/  (subcollection)
      {responseId}/
        - questionId: string
        - assessmentType: 'diagnostic' | 'full' | 'practice'
        - sessionId: string
        - isCorrect: boolean
        - confidence: 'low' | 'medium' | 'high'
        - timeSpent: number
        - timestamp: number
        - selectedAnswer?: string
        - createdAt: Timestamp
```

## Next Steps

1. ✅ **Verify:** Check Firestore console to confirm data structure matches
2. 🔧 **Implement:** Add function to retrieve responses from Firestore
3. 🔧 **Implement:** Store last assessment session IDs in user profile
4. 🔧 **Implement:** Add "View Report" buttons on home screen
5. 🔧 **Fix:** Prevent full assessment retake if `fullAssessmentComplete: true`
6. ✅ **Test:** Verify reports are accessible after logout/login
