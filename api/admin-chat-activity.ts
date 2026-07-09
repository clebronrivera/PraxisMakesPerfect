/**
 * Admin-only: View AI Tutor chat sessions and messages.
 *
 * GET /api/admin-chat-activity
 *   → Returns latest 200 sessions with user info and aggregate stats
 *
 * GET /api/admin-chat-activity?sessionId=<uuid>
 *   → Returns full conversation for one session
 *
 * Authorization: Bearer <user-jwt>
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
  queryStringParameters?: Record<string, string>;
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

    const svc = getServiceClient('admin chat-activity');
    const sessionId = event.queryStringParameters?.sessionId;

    // ── Single session detail ─────────────────────────────────────────────
    if (sessionId) {
      const { data: session, error: sessErr } = await svc
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessErr || !session) {
        return json(404, { error: 'Session not found.' });
      }

      // Get user display name
      const { data: userProgress } = await svc
        .from('user_progress')
        .select('preferred_display_name, full_name')
        .eq('user_id', session.user_id)
        .single();

      const { data: messages, error: msgErr } = await svc
        .from('chat_messages')
        .select('id, role, content, assistant_intent, artifact_type, artifact_payload, quiz_question_id, quiz_skill_id, page_context, metadata, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (msgErr) {
        return json(500, { error: logAndGenericError('admin-chat-activity', 'Failed to fetch messages.', msgErr) });
      }

      return json(200, {
        session: {
          ...session,
          displayName: userProgress?.preferred_display_name || userProgress?.full_name || null,
        },
        messages: messages || [],
      });
    }

    // ── Session list ──────────────────────────────────────────────────────
    const { data: sessions, error: sessionsErr } = await svc
      .from('chat_sessions')
      .select('id, user_id, title, session_type, message_count, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (sessionsErr) {
      return json(500, { error: logAndGenericError('admin-chat-activity', 'Failed to fetch sessions.', sessionsErr) });
    }

    if (!sessions || sessions.length === 0) {
      return json(200, { sessions: [] });
    }

    // Get user display names
    const userIds = [...new Set(sessions.map(s => s.user_id))];
    const { data: userRows } = await svc
      .from('user_progress')
      .select('user_id, preferred_display_name, full_name')
      .in('user_id', userIds);

    const userNames: Record<string, string> = {};
    for (const row of userRows || []) {
      userNames[row.user_id] = row.preferred_display_name || row.full_name || row.user_id.slice(0, 8);
    }

    // Get artifact counts per session
    const sessionIds = sessions.map(s => s.id);
    const { data: artifactRows } = await svc
      .from('chat_messages')
      .select('session_id, artifact_type')
      .in('session_id', sessionIds)
      .not('artifact_type', 'is', null);

    const artifactCounts: Record<string, number> = {};
    for (const row of artifactRows || []) {
      artifactCounts[row.session_id] = (artifactCounts[row.session_id] || 0) + 1;
    }

    const enriched = sessions.map(s => ({
      ...s,
      displayName: userNames[s.user_id] || s.user_id.slice(0, 8),
      artifactCount: artifactCounts[s.id] || 0,
    }));

    return json(200, { sessions: enriched });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-chat-activity]', e);
    return json(500, { error: message });
  }
};
