/**
 * Admin-only: Fetch all response rows for a single user.
 *
 * GET /api/admin-student-detail?userId=<uuid>
 * Authorization: Bearer <user-jwt>
 *
 * Returns the raw responses array so the client can aggregate
 * domain/skill breakdowns, session timelines, and time distributions.
 */
import {
  UUID_RE,
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
  queryStringParameters?: Record<string, string> | null;
}) => {
  const json = jsonResponder(event, METHODS);

  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(event, METHODS);
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const targetUserId = event.queryStringParameters?.userId;
  if (!targetUserId || !UUID_RE.test(targetUserId)) {
    return json(400, { error: 'userId must be a valid UUID.' });
  }

  try {
    const auth = await authenticateAdmin(event);
    if (!auth.ok) return json(auth.status, { error: auth.error });

    const svc = getServiceClient('admin-student-detail');
    const { data: responses, error: respErr } = await svc
      .from('responses')
      .select(
        'question_id, skill_id, domain_id, assessment_type, is_correct, confidence, ' +
        'time_on_item_seconds, selected_answers, correct_answers, session_id, created_at, ' +
        'is_followup, cognitive_complexity, skill_question_index'
      )
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (respErr) {
      return json(500, { error: logAndGenericError('admin-student-detail', 'Failed to fetch responses.', respErr) });
    }

    return json(200, { responses: responses || [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-student-detail]', e);
    return json(500, { error: message });
  }
};
