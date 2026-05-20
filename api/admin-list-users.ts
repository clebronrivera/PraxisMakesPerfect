/**
 * Admin-only: List all users with their progress data.
 *
 * The client-side admin dashboard can't see other users' rows because RLS
 * restricts user_progress to auth.uid() = user_id. This endpoint uses the
 * service role key to bypass RLS and return all rows.
 *
 * GET /api/admin-list-users
 * Authorization: Bearer <user-jwt>
 *
 * Returns JSON array of user_progress rows.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isAdminEmail } from '../src/config/admin';

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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin list-users.');
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
    const { data: usersData, error: usersError } = await svc
      .from('user_progress')
      .select('*')
      .order('updated_at', { ascending: false });

    if (usersError) {
      console.error('[admin-list-users] query error:', usersError);
      return json(500, { error: 'Failed to fetch users.', detail: usersError.message });
    }

    // Aggregate avg time per question per user from responses table.
    // Also: count adaptive responses per user so we can flag users with
    // saved adaptive progress but no `last_session` pointer (the
    // "orphaned" state — see App.tsx hasOrphanedAdaptive). These users
    // can still resume via the Supabase reconstruction path, but the
    // admin needs visibility into who they are.
    const { data: timingRows } = await svc
      .from('responses')
      .select('user_id, time_on_item_seconds, assessment_type')
      .gt('time_on_item_seconds', 0);

    const timingStats: Record<string, number> = {};
    const adaptiveCounts: Record<string, number> = {};
    if (timingRows && timingRows.length > 0) {
      const sums: Record<string, { total: number; count: number }> = {};
      for (const row of timingRows) {
        if (!row.user_id) continue;
        if (row.time_on_item_seconds != null) {
          if (!sums[row.user_id]) sums[row.user_id] = { total: 0, count: 0 };
          sums[row.user_id].total += row.time_on_item_seconds;
          sums[row.user_id].count += 1;
        }
        if (row.assessment_type === 'adaptive') {
          adaptiveCounts[row.user_id] = (adaptiveCounts[row.user_id] ?? 0) + 1;
        }
      }
      for (const [uid, { total, count }] of Object.entries(sums)) {
        timingStats[uid] = Math.round(total / count);
      }
    }

    // The timing query above filters `time_on_item_seconds > 0`, which may
    // miss adaptive responses that were saved before timing instrumentation
    // landed. Re-count adaptive responses with no time filter so the
    // "orphaned" flag is computed against the canonical row count.
    const { data: adaptiveRows } = await svc
      .from('responses')
      .select('user_id')
      .eq('assessment_type', 'adaptive');
    if (adaptiveRows && adaptiveRows.length > 0) {
      const counts: Record<string, number> = {};
      for (const row of adaptiveRows) {
        if (!row.user_id) continue;
        counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
      }
      for (const [uid, n] of Object.entries(counts)) {
        adaptiveCounts[uid] = n;
      }
    }

    return json(200, { users: usersData || [], timingStats, adaptiveCounts });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-list-users]', e);
    return json(500, { error: message });
  }
};
