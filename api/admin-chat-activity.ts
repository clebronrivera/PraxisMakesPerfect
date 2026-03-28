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
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isAdminEmail } from '../src/config/admin';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function getAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase anon credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin chat-activity.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
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
  queryStringParameters?: Record<string, string>;
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const token = getBearerToken(
      event.headers?.authorization || event.headers?.Authorization,
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
        return json(500, { error: 'Failed to fetch messages.', detail: msgErr.message });
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
      return json(500, { error: 'Failed to fetch sessions.', detail: sessionsErr.message });
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
