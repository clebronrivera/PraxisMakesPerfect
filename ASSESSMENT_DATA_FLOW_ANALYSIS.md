# Assessment Data Flow Analysis

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. Updated on 2026-03-18 to reflect the Supabase-backed assessment flow now used in the live app.

## Current Setup Overview

### 1. Assessment Completion Tracking

**Location:** Supabase `user_progress` row for the signed-in user

**Key fields:**
- `screener_complete`
- `full_assessment_complete`
- `screener_item_ids`
- `full_assessment_question_ids`
- `last_screener_session_id`
- `last_full_assessment_session_id`
- `last_session`
- `domain_scores`
- `skill_scores`

**Code anchors:**
- `App.tsx` assessment completion handlers
- `src/hooks/useFirebaseProgress.ts` (`saveProfile`, `updateProfile`, `updateLastSession`)

### 2. Response Data Storage

**Location:** Supabase `responses` table

**Structure:** Each response row includes the current assessment metadata needed to rebuild reports:

```typescript
{
  user_id: string;
  session_id: string;
  question_id: string;
  skill_id?: string;
  domain_id?: number;
  domain_ids?: number[];
  assessment_type: 'screener' | 'full' | 'practice' | 'diagnostic';
  is_correct: boolean;
  confidence: 'low' | 'medium' | 'high';
  time_spent: number;
  selected_answers: string[];
  correct_answers: string[];
  distractor_pattern_id?: string;
  created_at: string;
}
```

**Code anchors:**
- `src/hooks/useFirebaseProgress.ts` (`logResponse`, `saveScreenerResponse`)
- `src/components/ScreenerAssessment.tsx`
- `src/components/FullAssessment.tsx`
- `src/components/PracticeSession.tsx`

### 3. Report Retrieval After Completion

**Current state:** Implemented

Reports are no longer limited to in-memory completion state. The app now:
- stores response events in `responses`
- stores the latest relevant session IDs in `user_progress`
- rebuilds reports with `getAssessmentResponses(sessionId, assessmentTypes, questions)`
- falls back to `getLatestAssessmentResponses(assessmentTypes, questions)` if a saved session pointer is stale

**Code anchors:**
- `src/hooks/useFirebaseProgress.ts` (`getAssessmentResponses`, `getLatestAssessmentResponses`)
- `App.tsx` (`handleViewReport`)

### 4. Data Flow Summary

```text
Assessment taken
    ↓
Responses inserted into Supabase `responses`
    ↓
Profile/session metadata upserted into `user_progress`
    ↓
Completion handler stores current responses in local state
    ↓
Report shown immediately
    ↓
[User refreshes or returns later]
    ↓
App rebuilds the report from Supabase responses
```

## Current Risks And Watch Items

### 1. Legacy hook naming

- `src/hooks/useFirebaseProgress.ts` is still the active hook name even though it is fully Supabase-backed.
- This is a compatibility name, not evidence of active Firebase runtime usage.

### 2. Archived short-assessment compatibility

- The profile still carries some compatibility fields for older short-assessment data (`diagnostic_complete`, `last_pre_assessment_session_id`, related timestamps).
- These support legacy report recovery but should not be treated as the active product model.

### 3. Practice dual-write complexity

- Practice writes to both the shared `responses` table and `practice_responses`.
- `responses` is the table currently used for report rebuilding and downstream analytics.
- `practice_responses` remains underused and should be revisited before adding more practice-specific reporting.

## Recommended Verification Points

1. Confirm new assessment/report features continue to derive from `responses` rather than cached profile summaries.
2. Keep session-pointer recovery (`getLatestAssessmentResponses`) in place when changing report-loading logic.
3. Update this document whenever assessment persistence or report reconstruction changes materially.
4. Cross-check `docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md` before changing schema, auth wiring, or table ownership.
