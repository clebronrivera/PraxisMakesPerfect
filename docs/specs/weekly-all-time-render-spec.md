# Weekly vs All-Time Rendering Spec

## 1. Problem Statement

The Praxis Makes Perfect dashboard currently renders both weekly and all-time metrics in parallel with no explicit toggle, creating UX ambiguity. Weekly data is persisted in localStorage under `pmp-daily-q-${userId}-${ymd}` and `pmp-daily-time-${userId}-${ymd}` keys — a fragile, device-bound approach that doesn't sync across login. All-time data comes from Supabase (`user_progress.total_questions_seen`, `skill_scores`, responses table). The leaderboard is all-time only, with no weekly mode. There is no week-over-week delta analysis, no per-domain weekly accuracy trend, and no "week in review" summary that would help students understand whether their weekly engagement was productive. The existing `useWeeklyMomentum` hook computes only question count deltas from localStorage, ignoring accuracy, skill mastery progress, and module engagement — signals that matter far more than raw volume.

## 2. Proposed Data Model

### New Table: `weekly_stats`

```sql
CREATE TABLE IF NOT EXISTS weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso_week_year INTEGER NOT NULL,
  iso_week_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Aggregates (immutable weekly snapshots)
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Array of skill IDs practiced this week (deduplicated)
  skills_practiced INTEGER[] DEFAULT '{}',
  
  -- Array of skill IDs that hit mastery (>= 80%) for the first time this week
  skills_mastered_new INTEGER[] DEFAULT '{}',
  
  -- Array of module IDs completed this week
  modules_completed INTEGER[] DEFAULT '{}',
  
  -- AI tutor engagement
  tutor_sessions INTEGER DEFAULT 0,
  
  -- Weekly accuracy snapshot (JSONB: { skill_id -> accuracy_for_week })
  skill_accuracy_snapshot JSONB DEFAULT '{}',
  
  -- Domain summary (JSONB: { domain_id -> { questions, correct, accuracy } })
  domain_summary JSONB DEFAULT '{}',
  
  -- Trend vs prior week (up | down | same | new)
  momentum_trend TEXT DEFAULT 'new',
  momentum_delta_questions INTEGER DEFAULT 0,
  
  -- Completion metadata
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, iso_week_year, iso_week_number)
);

CREATE INDEX idx_weekly_stats_user_week ON weekly_stats(user_id, iso_week_year, iso_week_number);
```

### Why Not Just Query `responses` at Read Time?

At scale (10k+ responses per user), computing weekly aggregates by filtering and grouping responses on each dashboard load becomes O(n) and blocks the render. By pre-aggregating into `weekly_stats`, we:
- Decouple read latency from response volume (constant-time lookups)
- Simplify leaderboard + dashboard weekly modes (no complex GROUP BY)
- Persist week-over-week deltas without reconstructing from raw data
- Enable efficient historical trend analysis (week 1 → week N)

## 3. Migration Plan: Backfill Existing Users

### Phase 1: Historical Backfill (One-Time)

```sql
-- Migration: 0020_weekly_stats_backfill.sql
WITH response_aggregates AS (
  SELECT
    r.user_id,
    date_trunc('week', r.created_at AT TIME ZONE 'UTC')::DATE AS week_start,
    (date_trunc('week', r.created_at AT TIME ZONE 'UTC') + INTERVAL '6 days')::DATE AS week_end,
    EXTRACT(YEAR FROM r.created_at) AS iso_year,
    EXTRACT(WEEK FROM r.created_at) AS iso_week,
    COUNT(*) AS total_q,
    SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS total_correct,
    SUM(COALESCE(r.time_on_item_seconds, 0)) AS total_time,
    ARRAY_AGG(DISTINCT r.skill_id) FILTER (WHERE r.skill_id IS NOT NULL) AS skills,
    JSONB_OBJECT_AGG(
      r.domain_id::TEXT,
      JSONB_BUILD_OBJECT(
        'questions', COUNT(*),
        'correct', SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END),
        'accuracy', ROUND(
          100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / COUNT(*)::NUMERIC,
          1
        )
      )
    ) AS domain_agg
  FROM responses r
  WHERE r.assessment_type = 'practice'
  GROUP BY r.user_id, iso_year, iso_week, week_start, week_end
)
INSERT INTO weekly_stats (
  user_id, iso_week_year, iso_week_number, start_date, end_date,
  questions_answered, questions_correct, time_spent_seconds,
  skills_practiced, domain_summary, finalized_at
)
SELECT
  user_id, iso_year::INTEGER, iso_week::INTEGER, week_start, week_end,
  total_q, total_correct, total_time,
  skills, domain_agg, NOW()
FROM response_aggregates
ON CONFLICT (user_id, iso_week_year, iso_week_number) DO NOTHING;
```

**Schedule:** Backfill runs once, off-peak. Estimate: ~5–10 seconds for 500 users × 52 weeks of data.

### Phase 2: Incremental Updates

Two write paths:

| Path | When | Method | Trade-off |
|------|------|--------|-----------|
| **Real-time (RPCs)** | On response insert | Postgres function invoked from `responses` trigger | ~0.5s latency, always consistent |
| **Batch nightly** | 12:01am UTC | Scheduled job (Netlify Background Function) | Lower latency cost, eventual consistency (~10min window) |

**Recommendation:** Start with **batch nightly** to avoid trigger overhead during question answering. Upgrade to real-time RPCs if weekly data is needed intra-week.

### Phase 3: Postgres Trigger (Optional, Real-Time)

```sql
CREATE OR REPLACE FUNCTION update_weekly_stats_on_response()
RETURNS TRIGGER AS $$
DECLARE
  iso_year INTEGER;
  iso_week INTEGER;
  week_start DATE;
BEGIN
  SELECT
    EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
    EXTRACT(WEEK FROM NEW.created_at)::INTEGER,
    (DATE_TRUNC('week', NEW.created_at AT TIME ZONE 'UTC'))::DATE
  INTO iso_year, iso_week, week_start;

  INSERT INTO weekly_stats (
    user_id, iso_week_year, iso_week_number, start_date, end_date,
    questions_answered, questions_correct, time_spent_seconds,
    updated_at
  )
  VALUES (
    NEW.user_id, iso_year, iso_week, week_start, week_start + 6,
    1, (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    COALESCE(NEW.time_on_item_seconds, 0), NOW()
  )
  ON CONFLICT (user_id, iso_week_year, iso_week_number) DO UPDATE
  SET
    questions_answered = weekly_stats.questions_answered + 1,
    questions_correct = weekly_stats.questions_correct + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    time_spent_seconds = weekly_stats.time_spent_seconds + COALESCE(NEW.time_on_item_seconds, 0),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_weekly_stats_on_response
AFTER INSERT ON responses
FOR EACH ROW
WHEN (NEW.assessment_type = 'practice')
EXECUTE FUNCTION update_weekly_stats_on_response();
```

**Decision:** Implement trigger only if response insert latency becomes a bottleneck. For now, nightly job is safer.

## 4. New API Endpoints & Hooks

### `api/weekly-stats.ts`

```typescript
/**
 * GET /api/weekly-stats?weeks=4&mode=this|last|all
 * Authorization: Bearer <user-jwt>
 *
 * Returns list of weekly stat snapshots for the authenticated user.
 * - weeks=4: return last 4 weeks (default: 4)
 * - mode=this: return only current week
 * - mode=last: return only last week
 * - mode=all: return all available weeks
 */

export interface WeeklyStatRow {
  iso_week_year: number;
  iso_week_number: number;
  start_date: string; // ISO 8601
  end_date: string;
  questions_answered: number;
  questions_correct: number;
  time_spent_seconds: number;
  accuracy: number; // computed: questions_correct / questions_answered
  skills_practiced: number;
  skills_mastered_new: number[];
  modules_completed: number[];
  tutor_sessions: number;
  domain_summary: Record<number, {
    questions: number;
    correct: number;
    accuracy: number;
  }>;
  momentum_trend: 'up' | 'down' | 'same' | 'new';
  momentum_delta_questions: number;
}

export interface WeeklyStatsResponse {
  weeks: WeeklyStatRow[];
  callerUserId: string;
}
```

**Implementation notes:**
- Uses anon key + user JWT (RLS: `auth.uid() = user_id`)
- No service role needed (read-only, single-user data)
- Gracefully returns empty array if no data yet

### `useWeeklyStats` Hook

```typescript
export interface UseWeeklyStatsResult {
  weeks: WeeklyStatRow[];
  thisWeek: WeeklyStatRow | null;
  lastWeek: WeeklyStatRow | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeeklyStats(
  userId: string | null,
  mode: 'this' | 'last' | 'all' = 'all'
): UseWeeklyStatsResult;
```

**Behavior:**
- Fetches on mount; memoizes result
- Manual refresh via `refresh()` for post-practice updates (bypasses cache)
- Handles missing data gracefully (returns `null` for thisWeek/lastWeek, empty array for weeks)
- Refetch interval: 30 minutes (weekly data doesn't change intra-day until nightly job runs)

## 5. UI Additions

### 5.1 Dashboard Toggle (Weekly / All-Time)

**Location:** `DashboardHome.tsx` header, next to the domain progression bar

**Visual:**
```
[Weekly] [All-Time]  ← Toggle buttons (pill-shaped, blue = active)
```

**State:** Stored in React state (not persisted; defaults to All-Time on load)

**Behavior:**
- **Weekly:** Shows 7-day rolling window from Monday 00:00 UTC to Sunday 23:59 UTC
- **All-Time:** Shows cumulative stats from screener/diagnostic completion

### 5.2 "Week in Review" Card

**Location:** Top of dashboard, below the readiness progress bar

**Show when:**
- It's Sunday 8pm–Monday 11:59pm (prompt user to "Review your week")
- OR user clicks "Week in Review" link on dashboard

**Layout:**

| Stat | Visual |
|------|--------|
| Questions Answered | Large number (e.g., "24") + small label + goal progress bar |
| Accuracy This Week | "72%" accuracy (color-coded: green ≥80%, yellow 60–79%, red <60%) |
| Skills Improved | Count of skills that went from Emerging → Approaching (or → Demonstrating) |
| Skills Slipped | Count of skills that went from Approaching/Demonstrating → lower tier |
| Modules Completed | Count of learning path modules finished |
| Tutor Sessions | Number of AI tutor conversations started |
| Momentum vs Last Week | "↑ 8 more questions" / "↓ 3 fewer questions" / "→ Same as last week" |

**Copy variations:** See section 10.

### 5.3 "This Week vs Last Week" Badge (Per-Domain)

**Location:** Domain card in the "Domains" grid (right side, small badge)

**Appearance:**
```
[Domain Name]
Demonstrating (81%)
↑ +12% vs last week    ← New badge
```

**Logic:**
- Compute domain accuracy for this week from `weekly_stats.domain_summary`
- Compute domain accuracy for last week from last week's `weekly_stats.domain_summary`
- Delta: `thisWeek.accuracy - lastWeek.accuracy`
- Badge color: green (↑), red (↓), grey (→)
- Hide badge if no data for last week

### 5.4 Per-Domain Weekly Accuracy

**Location:** Expandable section in domain card (below the proficiency level)

**Show when:** User clicks "View this week's breakdown" link

**Renders:**
```
Practice Accuracy This Week

Data-Based Decision Making: 75% (18/24)
Consultation & Collaboration: 82% (29/35)
Academic Interventions:       68% (17/25)
Mental & Behavioral Health:   91% (10/11)

Last week: 71% average (shown in smaller text)
```

### 5.5 Leaderboard Weekly Mode

**Location:** Leaderboard popover, next to "Questions Answered" / "Engagement Time" / "Skills to Mastery"

**Add new mode:** "This Week's Questions"

**Implementation:** `api/leaderboard.ts` gains optional query param `?period=all|week`

```typescript
// Existing modes
Questions Answered (all-time)
Engagement Time (all-time)
Skills to Mastery (all-time)

// New mode
This Week's Questions  ← New tab
```

**Data source:** `weekly_stats.questions_answered` for current ISO week

**Metrics:**
| Metric | Definition |
|--------|-----------|
| Questions This Week | SUM of questions_answered for current ISO week |
| Accuracy This Week | SUM(questions_correct) / SUM(questions_answered) for current week |

## 6. Week Boundaries

### Recommendation: ISO 8601 Week (Monday Start)

**Why ISO 8601:**
- Aligns with international standards (and Postgres `EXTRACT(WEEK)`)
- Monday start feels natural for academic/professional contexts (end-of-week Friday reflections)
- Existing `useWeeklyMomentum` hook already uses Monday-start logic

**Week definition:**
- Starts: Monday 00:00 UTC
- Ends: Sunday 23:59 UTC
- Week number: 1–53 (W01 = first week with Thursday in the calendar year)

### Timezone Handling

**Decision: Server-side (UTC) aggregation; client-side display with local interpretation**

| Case | Approach |
|------|----------|
| Dashboard "Week in Review" | Show "Monday, April 21 – Sunday, April 27 (UTC)" as the data boundary. If user is in PT, note that this is "Sunday 5pm PT – Saturday 4pm PT in your time zone." |
| Leaderboard weekly mode | Show "This week's questions (Monday–Sunday UTC)" |
| Weekly nightly job | Always runs at 00:00 UTC, regardless of user locale |

**Rationale:** Aggregating in UTC keeps backfill and incremental updates deterministic. If we tried to bucket by user timezone, backfill would require iterating over each user's timezone, and the nightly job would have to split weeks per user (complex). The tradeoff is acceptable: users care about trends, not exact wall-clock boundaries.

### Rollover Behavior

When a response is inserted at 23:57 UTC (Friday night in US Eastern), it lands in the Postgres week. The nightly job at 00:01 UTC includes it in that week's aggregate. No special handling needed.

## 7. What Metrics Actually Matter

Student engagement and learning progress can't be measured by a single metric. These four capture the full picture:

| Metric | Definition | Why It Matters |
|--------|-----------|----------------|
| **Accuracy This Week** | (correct answers / total answers) × 100 for practice questions | Accuracy ≥60% → learning is happening. <60% → skill gaps or rushing. Trending up week-over-week means targeted practice is working. |
| **Skills Improved This Week** | Count of skills that crossed a proficiency threshold (Emerging→Approaching, Approaching→Demonstrating) for the first time this week | Mastery is the goal. One skill improving is worth 10 practice questions. Shows momentum in the direction that matters. |
| **Volume Consistency** | Questions answered this week vs last week (momentum delta) | Consistency predicts long-term retention better than binge-and-crash. A student who answers 15 Qs/week, every week, will master more than one who does 50 one week and 0 the next. |
| **Domain Balance** | Spread of practice across domains (e.g., not all Qs in one domain) | Students tend to gravitate toward their strength areas and avoid weaker domains. A balanced practice week (questions across all 4 domains) is healthier than a lopsided week. |

**These four together create the "productive week" narrative:**
- High accuracy + skill improvement = learning is working
- Consistent volume + balanced domains = sustainable pace
- Low accuracy or no improvement = time to adjust strategy (study guide? tutor? skip heuristics?)

## 8. Non-Goals

- **Heatmaps of daily practice** (too granular; localStorage is already fragile)
- **Week-over-week trends beyond ±2 weeks** (backlog for a future "Trends" dashboard tab)
- **Timezone-aware week boundaries per user** (server-side UTC wins on simplicity)
- **Real-time weekly leaderboard** (finalized once nightly; acceptable latency)
- **Weekly goals or "challenge" badges** (separate product roadmap item)
- **Weekly study plan regeneration** (out of scope; study plans are multi-week)
- **Redemption rounds per-week tracking** (redemption is a separate persistence mechanism)

## 9. Risk & Rollout

### Feature Flag

Add to `src/config/featureFlags.ts`:

```typescript
export const FEATURE_WEEKLY_STATS = (
  process.env.VITE_FEATURE_WEEKLY_STATS === 'true' ||
  import.meta.env.VITE_FEATURE_WEEKLY_STATS === 'true'
);
```

**When enabled:**
- Dashboard shows Weekly/All-Time toggle (defaults to All-Time)
- "Week in Review" card is visible
- Leaderboard gains "This Week's Questions" mode
- Per-domain weekly accuracy badge appears

**When disabled:**
- UI renders all-time mode only
- localStorage weekly data is still tracked (no breaking change)
- No leaderboard weekly mode

### Measurement

**Use Supabase logs + localStorage diagnostics:**

1. **Weekly stats table row count** — Should grow by ~(active users per week) rows. If no growth, backfill/nightly job has failed.
2. **Toggle click counts** — Instrument `setToggleMode('weekly')` calls. Target: >20% of daily dashboard visitors click it.
3. **"Week in Review" card impression + CTA** — If <5% of users see it or click "View details," it's not discoverable.
4. **Leaderboard weekly mode adoption** — If <10% of leaderboard opens switch to weekly mode, it's not a valued feature.

**Fallback if aggregation job fails:**
- Leaderboard weekly mode shows "Data unavailable — check back tomorrow"
- Dashboard toggle is hidden
- App continues with all-time data only
- Alert sent to ops (Sentry / Slack)

### Gradual Rollout

1. **Day 1:** Enable for 10% of users (seed via URL param `?weekly_stats=true` for QA)
2. **Day 3:** Measure adoption; expand to 50% if >10% toggle click rate
3. **Day 7:** Full rollout; retire feature flag

## 10. Concrete Copy Suggestions

### "Week in Review" Card Copy

#### State 1: Great Week (Accuracy ≥80%, Skills Improved ≥1, Volume ≥15 Qs)

**Variation A (Energetic):**
> "🚀 **Crushing it this week!** You answered 24 questions with 82% accuracy and mastered 1 new skill. Keep this momentum going!"

**Variation B (Steady):**
> "📈 **Strong week.** You've answered 24 questions across all 4 domains with consistent 82% accuracy. 1 skill reached Demonstrating level."

**Variation C (Data-Focused):**
> "✓ **This week:** 24 Qs, 82% accuracy, 1 skill to Demonstrating, +8 vs last week. You're on track."

---

#### State 2: Mixed Week (Accuracy 60–79%, No New Skills, Volume 10–20 Qs)

**Variation A (Balanced):**
> "📊 **Solid week.** 18 questions answered, 71% accuracy. You're building consistency — keep practicing weaker domains to break through to 80%."

**Variation B (Actionable):**
> "⚡ **Room to improve.** You answered 18 questions this week (same as last week) with 71% accuracy. Try the Study Guide for your Emerging skills to close gaps."

**Variation C (Neutral):**
> "**This week:** 18 Qs, 71% accuracy, 0 skills advanced. Focus on quality over volume next week — aim for 80%+ on one domain."

---

#### State 3: Rough Week (Accuracy <60%, No Volume, or First Week)

**Variation A (Encouraging):**
> "🌱 **Getting started.** 8 questions answered with 54% accuracy. That's normal early on. Use the Study Guide to target your Emerging skills before more practice."

**Variation B (Diagnostic):**
> "📍 **Slow week.** 8 questions answered, 54% accuracy. You might be rushing (slow down!) or hitting new content. Review the Study Guide suggestions for your struggling skills."

**Variation C (Supportive):**
> "**First week?** That's great you're here. You've answered 8 questions — aim for 15–20 next week, and focus on accuracy over speed. The Study Guide is your best friend."

---

#### Empty State (No Data Yet)

> "No practice yet this week. Start answering questions to see your weekly summary here."

---

### Domain Card "This Week vs Last Week" Badge Copy

```
Domain Name
Demonstrating (81%)
↑ +14 pp vs last week   ← Badge with icon + number

// Hover tooltip
"Last week: 67% accuracy (18/27)"
"This week: 81% accuracy (21/26)"
```

---

### Leaderboard Weekly Mode Header

```
THIS WEEK'S QUESTIONS
1. M.S.     24 questions
2. J.L.     22 questions
3. R.K.     19 questions
...

Last updated: 1 minute ago (from nightly job run)
```

---

## 11. Implementation Checklist

- [ ] Create `weekly_stats` table + indexes (migration `0020_weekly_stats_backfill.sql`)
- [ ] Backfill historical data for existing users
- [ ] Create nightly aggregation job (`api/weekly-stats-batch.ts`, Netlify Background Function)
- [ ] Create `api/weekly-stats.ts` endpoint + RLS policy
- [ ] Create `useWeeklyStats` hook
- [ ] Update `DashboardHome.tsx` with toggle + "Week in Review" card
- [ ] Add per-domain weekly accuracy badge + per-domain breakdown section
- [ ] Add weekly mode to leaderboard (`api/leaderboard.ts?period=week`)
- [ ] Add feature flag + instrument toggle/card clicks
- [ ] Update `docs/HOW_THE_APP_WORKS.md` if weekly metrics become user-facing marketing copy
- [ ] Rollout testing: Confirm nightly job runs and data populates correctly

---

## 12. Success Metrics (Post-Launch)

- ✓ Weekly stats table grows by ≥80% of active users per week within first 7 days
- ✓ Dashboard weekly/all-time toggle receives ≥15% click-through from visitors
- ✓ "Week in Review" card is seen by ≥40% of users on Monday mornings
- ✓ Leaderboard weekly mode is used by ≥10% of leaderboard viewers
- ✓ Zero data gaps in nightly job for 30 consecutive days
- ✓ Dashboard load time with weekly stats <50ms slower than all-time only
