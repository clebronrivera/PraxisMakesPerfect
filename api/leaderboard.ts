/**
 * Leaderboard: Returns anonymized, aggregated stats for all active users.
 *
 * Any authenticated user can call this endpoint. It uses the service role key
 * to bypass RLS and read cross-user aggregates from user_progress + responses.
 *
 * GET /api/leaderboard
 * Authorization: Bearer <user-jwt>
 *
 * Returns { entries: LeaderboardEntry[], callerUserId: string }
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TOTAL_SKILLS = 45;
const MASTERY_THRESHOLD = 0.80;

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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for leaderboard.');
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

/** Derive initials like "V.R." from a name or email. */
function deriveInitials(displayName?: string | null, email?: string | null): string {
  // Try display name first
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1][0].toUpperCase()}.`;
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return `${parts[0][0].toUpperCase()}.`;
    }
  }

  // Fallback to email
  if (email) {
    const localPart = email.split('@')[0];
    const parts = localPart.split(/[._-]/);
    if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
      return `${parts[0][0].toUpperCase()}.${parts[1][0].toUpperCase()}.`;
    }
    if (localPart.length > 0) {
      return `${localPart[0].toUpperCase()}.`;
    }
  }

  return '?';
}

/** Count how many skills are at or above mastery threshold. */
function countMasteredSkills(skillScores: Record<string, number> | null | undefined): number {
  if (!skillScores || typeof skillScores !== 'object') return 0;
  let count = 0;
  for (const val of Object.values(skillScores)) {
    if (typeof val === 'number' && val >= MASTERY_THRESHOLD) count++;
  }
  return count;
}

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

    // Verify caller identity (any authenticated user, not admin-only)
    const anon = getAnonClient();
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData.user) {
      return json(401, { error: 'Invalid session.' });
    }
    const callerUserId = userData.user.id;

    const svc = getServiceClient();

    // 1) Fetch all users with activity
    const { data: usersData, error: usersError } = await svc
      .from('user_progress')
      .select('user_id, display_name, email, total_questions_seen, skill_scores')
      .gt('total_questions_seen', 0);

    if (usersError) {
      console.error('[leaderboard] user_progress query error:', usersError);
      return json(500, { error: 'Failed to fetch leaderboard data.' });
    }

    if (!usersData || usersData.length === 0) {
      return json(200, { entries: [], callerUserId });
    }

    // 2) Aggregate total engagement time per user from responses
    const { data: timingRows } = await svc
      .from('responses')
      .select('user_id, time_on_item_seconds')
      .gt('time_on_item_seconds', 0);

    const timeTotals: Record<string, number> = {};
    if (timingRows) {
      for (const row of timingRows) {
        if (!row.user_id || row.time_on_item_seconds == null) continue;
        timeTotals[row.user_id] = (timeTotals[row.user_id] || 0) + row.time_on_item_seconds;
      }
    }

    // 3) Build entries
    const entries = usersData.map(u => {
      const mastered = countMasteredSkills(u.skill_scores);
      return {
        userId: u.user_id,
        initials: deriveInitials(u.display_name, u.email),
        questions: u.total_questions_seen || 0,
        time: Math.round((timeTotals[u.user_id] || 0) / 60), // seconds → minutes
        mastery: TOTAL_SKILLS - mastered, // skills remaining
      };
    });

    return json(200, { entries, callerUserId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[leaderboard]', e);
    return json(500, { error: message });
  }
};
