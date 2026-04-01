/**
 * Admin-only: Psychometric item analysis across the full question bank.
 *
 * GET /api/admin-item-analysis
 * Authorization: Bearer <user-jwt>
 *
 * Aggregates all responses by question_id and computes:
 *  - p-value (proportion correct / difficulty)
 *  - discrimination index (point-biserial approximation)
 *  - avg time on item
 *  - distractor frequencies
 *  - auto-generated quality flags
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isAdminEmail } from '../src/config/admin';
import questionsRaw from '../src/data/questions.json';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function getAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase anon credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin-item-analysis.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

interface RawResponse {
  question_id: string;
  skill_id: string | null;
  is_correct: boolean | null;
  selected_answers: string[] | null;
  correct_answers: string[] | null;
  time_on_item_seconds: number | null;
  user_id: string;
}

export interface DistractorDetail {
  freq: number;
  tier: string | null;       // L1 | L2 | L3
  errorType: string | null;  // Conceptual | Procedural | Lexical
  misconception: string | null;
}

export interface ItemStat {
  questionId: string;
  skillId: string | null;
  attempts: number;
  pValue: number;           // proportion correct (0–1)
  discrimination: number;   // approx point-biserial
  avgTime: number | null;   // seconds
  distractorFreqs: Record<string, number>;
  distractorDetails: Record<string, DistractorDetail>; // enriched with tier/errorType/misconception
  flags: string[];
}

// Build a lookup map from UNIQUEID → question object (loaded once at cold-start).
const questionIndex = new Map<string, Record<string, string>>(
  (questionsRaw as Record<string, string>[]).map(q => [q.UNIQUEID, q])
);

export const handler = async (event: {
  httpMethod?: string;
  headers?: Record<string, string>;
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const token = getBearerToken(
      event.headers?.authorization || event.headers?.Authorization
    );
    if (!token) {
      return json(401, { error: 'Missing Authorization Bearer token.' });
    }

    const anon = getAnonClient();
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return json(401, { error: 'Invalid session.' });
    }

    if (!isAdminEmail(userData.user.email)) {
      return json(403, { error: 'Admin only.' });
    }

    const svc = getServiceClient();

    // Fetch all responses (paginate in chunks to handle large datasets)
    const PAGE_SIZE = 5000;
    const allRows: RawResponse[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await svc
        .from('responses')
        .select('question_id, skill_id, is_correct, selected_answers, correct_answers, time_on_item_seconds, user_id')
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('[admin-item-analysis] query error:', error);
        return json(500, { error: 'Failed to fetch responses.', detail: error.message });
      }
      if (!data || data.length === 0) break;
      allRows.push(...(data as RawResponse[]));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allRows.length === 0) {
      return json(200, { items: [], globalAvgTime: null, globalStddev: null });
    }

    // ── Step 1: Per-user total score (for discrimination) ──────────────────
    const userScores: Record<string, { correct: number; total: number }> = {};
    for (const r of allRows) {
      if (!r.user_id) continue;
      if (!userScores[r.user_id]) userScores[r.user_id] = { correct: 0, total: 0 };
      userScores[r.user_id].total += 1;
      if (r.is_correct) userScores[r.user_id].correct += 1;
    }
    // Normalised total score per user (0–1)
    const userScoreNorm: Record<string, number> = {};
    for (const [uid, { correct, total }] of Object.entries(userScores)) {
      userScoreNorm[uid] = total > 0 ? correct / total : 0;
    }

    // ── Step 2: Aggregate per question ────────────────────────────────────
    const qMap = new Map<
      string,
      {
        skillId: string | null;
        correct: number;
        total: number;
        times: number[];
        distractorFreqs: Record<string, number>;
        correctResponderScores: number[];
        incorrectResponderScores: number[];
      }
    >();

    for (const r of allRows) {
      if (!r.question_id) continue;
      if (!qMap.has(r.question_id)) {
        qMap.set(r.question_id, {
          skillId: r.skill_id,
          correct: 0,
          total: 0,
          times: [],
          distractorFreqs: {},
          correctResponderScores: [],
          incorrectResponderScores: []
        });
      }
      const q = qMap.get(r.question_id)!;
      q.total += 1;
      if (r.is_correct) {
        q.correct += 1;
        if (r.user_id && userScoreNorm[r.user_id] != null) {
          q.correctResponderScores.push(userScoreNorm[r.user_id]);
        }
      } else {
        if (r.user_id && userScoreNorm[r.user_id] != null) {
          q.incorrectResponderScores.push(userScoreNorm[r.user_id]);
        }
      }
      if (r.time_on_item_seconds != null && r.time_on_item_seconds > 0) {
        q.times.push(r.time_on_item_seconds);
      }
      // Distractor tracking — only for incorrect answers
      if (!r.is_correct && r.selected_answers && Array.isArray(r.selected_answers)) {
        for (const ans of r.selected_answers) {
          q.distractorFreqs[ans] = (q.distractorFreqs[ans] ?? 0) + 1;
        }
      }
    }

    // ── Step 3: Global timing stats (for outlier flags) ───────────────────
    const allTimes: number[] = [];
    for (const q of qMap.values()) {
      allTimes.push(...q.times);
    }
    const globalAvgTime = allTimes.length > 0
      ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
      : null;
    const globalStddev = globalAvgTime != null && allTimes.length > 1
      ? Math.sqrt(allTimes.reduce((sum, t) => sum + Math.pow(t - globalAvgTime, 2), 0) / allTimes.length)
      : null;

    function avg(arr: number[]): number | null {
      return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    }

    // ── Step 4: Build item stats + flags ─────────────────────────────────
    const items: ItemStat[] = [];
    for (const [questionId, q] of qMap.entries()) {
      const pValue = q.total > 0 ? q.correct / q.total : 0;
      const avgCorrect = avg(q.correctResponderScores);
      const avgIncorrect = avg(q.incorrectResponderScores);
      const discrimination =
        avgCorrect != null && avgIncorrect != null
          ? Math.round((avgCorrect - avgIncorrect) * 100) / 100
          : 0;
      const itemAvgTime =
        q.times.length > 0
          ? Math.round(q.times.reduce((a, b) => a + b, 0) / q.times.length)
          : null;

      const flags: string[] = [];
      if (q.total >= 5) {
        if (pValue > 0.9) flags.push('Too Easy');
        if (pValue < 0.2) flags.push('Too Hard');
        if (discrimination <= 0) flags.push('Low Discrimination');
        if (
          globalAvgTime != null &&
          globalStddev != null &&
          itemAvgTime != null &&
          itemAvgTime > globalAvgTime + 2 * globalStddev
        ) {
          flags.push('Timing Outlier');
        }
      }

      // Build enriched distractor details from questions.json classification data
      const distractorDetails: Record<string, DistractorDetail> = {};
      const qBank = questionIndex.get(questionId);
      for (const [letter, freq] of Object.entries(q.distractorFreqs)) {
        distractorDetails[letter] = {
          freq,
          tier:         qBank ? (qBank[`distractor_tier_${letter}`] || null) : null,
          errorType:    qBank ? (qBank[`distractor_error_type_${letter}`] || null) : null,
          misconception: qBank ? (qBank[`distractor_misconception_${letter}`] || null) : null,
        };
      }

      items.push({
        questionId,
        skillId: q.skillId,
        attempts: q.total,
        pValue: Math.round(pValue * 1000) / 1000,
        discrimination,
        avgTime: itemAvgTime,
        distractorFreqs: q.distractorFreqs,
        distractorDetails,
        flags
      });
    }

    // Sort by most attempts descending
    items.sort((a, b) => b.attempts - a.attempts);

    return json(200, {
      items,
      globalAvgTime: globalAvgTime != null ? Math.round(globalAvgTime) : null,
      globalStddev: globalStddev != null ? Math.round(globalStddev) : null,
      totalResponses: allRows.length
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-item-analysis]', e);
    return json(500, { error: message });
  }
};
