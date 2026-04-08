/**
 * Admin-only: Fetch all response rows for a single user.
 *
 * GET /api/admin-student-detail?userId=<uuid>
 * Authorization: Bearer <user-jwt>
 *
 * Returns the raw responses array so the client can aggregate
 * domain/skill breakdowns, session timelines, and time distributions.
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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin-student-detail.');
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
  queryStringParameters?: Record<string, string> | null;
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const targetUserId = event.queryStringParameters?.userId;
  if (!targetUserId) {
    return json(400, { error: 'Missing required query param: userId' });
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

    // Run responses + user_progress queries in parallel.
    // user_progress provides baseline_snapshot for the Growth Since Diagnostic panel.
    const [responsesResult, progressResult] = await Promise.all([
      svc
        .from('responses')
        .select(
          'question_id, skill_id, domain_id, assessment_type, is_correct, confidence, ' +
          'time_on_item_seconds, selected_answers, correct_answers, session_id, created_at, ' +
          'is_followup, cognitive_complexity, skill_question_index'
        )
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true }),
      svc
        .from('user_progress')
        .select(
          'baseline_snapshot, skill_scores, ' +
          'post_assessment_snapshot, post_assessment_completed_at'
        )
        .eq('user_id', targetUserId)
        .maybeSingle(),
    ]);

    if (responsesResult.error) {
      console.error('[admin-student-detail] responses query error:', responsesResult.error);
      return json(500, { error: 'Failed to fetch responses.', detail: responsesResult.error.message });
    }

    if (progressResult.error) {
      // Non-fatal — drawer can still render responses without the growth panel.
      console.warn('[admin-student-detail] user_progress query error:', progressResult.error);
    }

    return json(200, {
      responses: responsesResult.data || [],
      progress: progressResult.data || null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-student-detail]', e);
    return json(500, { error: message });
  }
};
