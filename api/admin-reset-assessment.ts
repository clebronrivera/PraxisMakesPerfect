/**
 * Admin-only: archive then delete screener or full/diagnostic responses for a user,
 * rebuild aggregates from remaining `responses`, and persist global_scores.
 *
 * Requires Netlify env: VITE_SUPABASE_URL (or SUPABASE_URL), VITE_SUPABASE_ANON_KEY,
 * and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isAdminEmail } from '../src/config/admin';
import { calculateAndSaveGlobalScoresWithClient } from '../src/utils/globalScoreCalculator';
import {
  replaySkillAndDomainScoresFromResponses,
  type ResponseRowForReplay
} from '../src/utils/rebuildProgressFromResponses';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin reset.');
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

function assessmentTypesForScope(scope: 'screener' | 'full_diagnostic'): string[] {
  if (scope === 'screener') return ['screener'];
  // 'adaptive' must be included — adaptive diagnostic responses are stored with
  // assessment_type='adaptive' and must be cleared along with full/diagnostic rows.
  return ['full', 'diagnostic', 'adaptive'];
}

function patchLastSession(
  lastSession: unknown,
  scope: 'screener' | 'full_diagnostic'
): unknown | null {
  if (!lastSession || typeof lastSession !== 'object') return lastSession as null | undefined;
  const mode = (lastSession as { mode?: string }).mode;
  if (scope === 'screener' && mode === 'screener') return null;
  if (scope === 'full_diagnostic' && (mode === 'full' || mode === 'diagnostic' || mode === 'adaptive')) return null;
  return lastSession;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const handler = async (event: { httpMethod?: string; headers?: Record<string, string>; body?: string }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const token = getBearerToken(event.headers?.authorization || event.headers?.Authorization);
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

    const actorEmail = userData.user.email;
    const body = event.body ? JSON.parse(event.body) : {};
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';
    const scope = body.scope as 'screener' | 'full_diagnostic';

    if (!targetUserId || !UUID_RE.test(targetUserId)) {
      return json(400, { error: 'targetUserId must be a valid UUID.' });
    }

    if (scope !== 'screener' && scope !== 'full_diagnostic') {
      return json(400, { error: 'scope must be "screener" or "full_diagnostic".' });
    }

    const svc = getServiceClient();
    const types = assessmentTypesForScope(scope);

    const { data: progressRow, error: progressErr } = await svc
      .from('user_progress')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (progressErr) {
      console.error('[admin-reset-assessment] user_progress load:', progressErr);
      return json(500, { error: 'Failed to load user progress.' });
    }

    // Archive still records an empty snapshot if the learner has no row yet (edge case).

    const { data: toRemove, error: fetchErr } = await svc
      .from('responses')
      .select('*')
      .eq('user_id', targetUserId)
      .in('assessment_type', types);

    if (fetchErr) {
      console.error('[admin-reset-assessment] responses fetch:', fetchErr);
      return json(500, { error: 'Failed to load responses to remove.' });
    }

    const rows = toRemove || [];
    const ids = rows.map((r: { id: string }) => r.id).filter(Boolean);

    const { error: archiveErr } = await svc.from('assessment_reset_archive').insert([
      {
        target_user_id: targetUserId,
        actor_email: actorEmail,
        scope,
        user_progress_snapshot: progressRow ?? {},
        responses_archived: rows,
        response_count: rows.length
      }
    ]);

    if (archiveErr) {
      console.error('[admin-reset-assessment] archive insert:', archiveErr);
      return json(500, { error: 'Failed to write archive row.', detail: archiveErr.message });
    }

    if (ids.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { error: delErr } = await svc.from('responses').delete().in('id', chunk);
        if (delErr) {
          console.error('[admin-reset-assessment] delete:', delErr);
          return json(500, { error: 'Failed to delete responses.', detail: delErr.message });
        }
      }
    }

    const { data: remaining, error: remErr } = await svc
      .from('responses')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (remErr) {
      console.error('[admin-reset-assessment] remaining fetch:', remErr);
      return json(500, { error: 'Failed to load remaining responses.' });
    }

    const replayRows: ResponseRowForReplay[] = (remaining || []).map((r: Record<string, unknown>) => ({
      skill_id: (r.skill_id as string) || null,
      domain_id: r.domain_id as number | null,
      domain_ids: r.domain_ids,
      is_correct: Boolean(r.is_correct),
      confidence: (r.confidence as string) || null,
      question_id: String(r.question_id ?? ''),
      time_on_item_seconds: r.time_on_item_seconds as number | null,
      time_spent: r.time_spent as number | null,
      created_at: r.created_at as string | undefined
    }));

    const { skillScores, domainScores } = replaySkillAndDomainScoresFromResponses(replayRows);

    const { count: totalQuestionsSeen } = await svc
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    const { count: practiceResponseCount } = await svc
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('assessment_type', 'practice');

    const { data: practiceRecent } = await svc
      .from('responses')
      .select('question_id, created_at')
      .eq('user_id', targetUserId)
      .eq('assessment_type', 'practice')
      .order('created_at', { ascending: false })
      .limit(40);

    const recentPracticeIds = Array.from(
      new Set((practiceRecent || []).map((r: { question_id: string }) => r.question_id).filter(Boolean))
    ).slice(0, 30);

    const globalResult = await calculateAndSaveGlobalScoresWithClient(svc, targetUserId);

    const updatePayload: Record<string, unknown> = {
      user_id: targetUserId,
      global_scores: globalResult,
      skill_scores: skillScores,
      domain_scores: domainScores,
      weakest_domains: [],
      factual_gaps: [],
      error_patterns: [],
      total_questions_seen: totalQuestionsSeen ?? 0,
      practice_response_count: practiceResponseCount ?? 0,
      recent_practice_question_ids: recentPracticeIds,
      updated_at: new Date().toISOString()
    };

    if (progressRow) {
      updatePayload.last_session =
        progressRow.last_session != null
          ? patchLastSession(progressRow.last_session, scope)
          : progressRow.last_session;
    }

    if (scope === 'screener') {
      updatePayload.screener_complete = false;
      updatePayload.screener_results = {};
      updatePayload.screener_item_ids = [];
      updatePayload.last_screener_session_id = null;
    }

    if (scope === 'full_diagnostic') {
      updatePayload.full_assessment_complete = false;
      updatePayload.diagnostic_complete = false;
      updatePayload.adaptive_diagnostic_complete = false;
      updatePayload.diagnostic_question_ids = [];
      updatePayload.last_diagnostic_session_id = null;
      updatePayload.full_assessment_question_ids = [];
      updatePayload.pre_assessment_question_ids = [];
      updatePayload.last_full_assessment_session_id = null;
    }

    const upsertRow = { ...(progressRow || {}), ...updatePayload, user_id: targetUserId };
    const { error: upErr } = await svc.from('user_progress').upsert(upsertRow, { onConflict: 'user_id' });

    if (upErr) {
      console.error('[admin-reset-assessment] user_progress upsert:', upErr);
      return json(500, { error: 'Failed to update user progress.', detail: upErr.message });
    }

    return json(200, {
      ok: true,
      scope,
      targetUserId,
      deletedResponseCount: ids.length,
      archivedResponseCount: rows.length,
      globalReadiness: globalResult.globalReadiness
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[admin-reset-assessment]', e);
    return json(500, { error: message });
  }
};
