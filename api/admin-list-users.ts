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
import {
  authenticateAdmin,
  getServiceClient,
  jsonResponder,
  logAndGenericError,
  preflightResponse,
} from './_shared';

const METHODS = 'GET, OPTIONS';

export const handler = async (event: {
  httpMethod?: string;
  headers?: Record<string, string>;
}) => {
  const json = jsonResponder(event, METHODS);

  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(event, METHODS);
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const auth = await authenticateAdmin(event);
    if (!auth.ok) return json(auth.status, { error: auth.error });

    const svc = getServiceClient('admin list-users');
    const { data: usersData, error: usersError } = await svc
      .from('user_progress')
      .select('*')
      .order('updated_at', { ascending: false });

    if (usersError) {
      return json(500, { error: logAndGenericError('admin-list-users', 'Failed to fetch users.', usersError) });
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
