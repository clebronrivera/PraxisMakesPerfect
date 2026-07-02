/**
 * Admin-only: Delete all application data for a given user.
 *
 * This removes rows from every user-scoped table (responses, user_progress,
 * study_plans, module tracking, feedback, reports, notes, focus items).
 * It does NOT delete the auth.users row — that requires the Supabase Admin API
 * with the JWT service role key, which should be done from the Supabase Dashboard.
 *
 * Requires Netlify env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 * and SUPABASE_SERVICE_ROLE_KEY.
 */
import {
  UUID_RE,
  authenticateAdmin,
  getServiceClient,
  jsonResponder,
  preflightResponse,
} from './_shared';

const METHODS = 'POST, OPTIONS';

// Tables that have a user_id column and should be cleaned
const USER_TABLES = [
  'responses',
  'user_progress',
  'study_plans',
  'module_visit_sessions',
  'section_interactions',
  'learning_path_progress',
  'beta_feedback',
  'question_reports',
  'assessment_reset_archive',
  'module_notes',
  'focus_item_checks',
  'focus_item_seen_at',
];

export const handler = async (event: {
  httpMethod?: string;
  headers?: Record<string, string>;
  body?: string;
}) => {
  const json = jsonResponder(event, METHODS);

  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(event, METHODS);
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const auth = await authenticateAdmin(event);
    if (!auth.ok) return json(auth.status, { error: auth.error });

    // ── Parse body ──────────────────────────────────────────────────────────
    const body = event.body ? JSON.parse(event.body) : {};
    const targetUserId =
      typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';

    if (!targetUserId || !UUID_RE.test(targetUserId)) {
      return json(400, { error: 'targetUserId must be a valid UUID.' });
    }

    // ── Delete from all user-scoped tables ──────────────────────────────────
    const svc = getServiceClient('admin operations');
    const results: Record<string, number> = {};

    for (const table of USER_TABLES) {
      try {
        // figure out the user_id column name — assessment_reset_archive uses target_user_id
        const userCol = table === 'assessment_reset_archive' ? 'target_user_id' : 'user_id';

        const { count, error } = await svc
          .from(table)
          .delete({ count: 'exact' })
          .eq(userCol, targetUserId);

        if (error) {
          // Table might not exist yet (migration not applied) — log and continue
          console.warn(`[admin-delete-user] ${table}: ${error.message}`);
          results[table] = -1;
        } else {
          results[table] = count ?? 0;
        }
      } catch (err) {
        console.warn(`[admin-delete-user] ${table}: ${err}`);
        results[table] = -1;
      }
    }

    const totalDeleted = Object.values(results).filter(n => n > 0).reduce((a, b) => a + b, 0);

    return json(200, {
      ok: true,
      targetUserId,
      totalDeletedRows: totalDeleted,
      tableResults: results,
      note: 'Auth account not deleted — use Supabase Dashboard → Authentication → Users to remove the login.'
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-delete-user]', e);
    return json(500, { error: message });
  }
};
