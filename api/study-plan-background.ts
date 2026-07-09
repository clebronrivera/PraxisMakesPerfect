/**
 * Netlify Background Function — study-plan-background
 *
 * Returns HTTP 202 immediately. Continues running (up to 15 min) to:
 *   1. Call Claude with the pre-built prompt (synthesized from preprocessed inputs)
 *   2. Parse the v2 StudyPlanDocument from the response
 *   3. Save the complete document to study_plans (client polls for it)
 *
 * The client (studyPlanService.ts) builds the prompt using the deterministic
 * preprocessing layer, then sends it here. Claude's job is synthesis only.
 */
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema
} from '../src/types/studyPlanApi';
import {
  STUDY_PLAN_FAILURE_COOLDOWN_MS,
  authenticateUser,
  fetchWithTimeout,
  getUserClient,
  isAbortError,
  jsonResponder,
  preflightResponse,
  slidingWindowVerdict,
} from './_shared';

// Overridable via env so a retired/rotated model can be swapped without a code deploy.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const METHODS = 'POST, OPTIONS';

// Generous — synthesis of a 12k-token plan takes minutes, but a hung upstream
// must not pin the background function for its full 15-minute budget.
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000;

// Auth verification: uses the anon key — supabase.auth.getUser(jwt) just calls
// /auth/v1/user with the user's Bearer token and does not require service role.
// DB write: uses the user's own JWT so RLS (auth.uid() = user_id) is satisfied.
// Service role key is NOT required for either operation.

// ─── Minimal v2 parser (validates enough to be safe, stores full document) ────
// The full strict parser lives in studyPlanService.ts.
// Here we just need to confirm the response has a parseable JSON structure
// and the required top-level sections before persisting.

function extractJsonObject(content: string): string {
  const stripped = content.trim()
    .replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = stripped.indexOf('{');
  const last  = stripped.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) throw new Error('No valid JSON in response.');
  return stripped.slice(first, last + 1);
}

const REQUIRED_V2_SECTIONS = [
  'readinessSnapshot',
  'dataInterpretation',
  'priorityClusters',
  'domainStudyMaps',
  'vocabulary',
  'casePatterns',
  'weeklyStudyPlan',
  'tacticalInstructions',
  'checkpointLogic',
] as const;

function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return false;
  return true;
}

function parseAndValidateV2(rawContent: string): Record<string, unknown> {
  const jsonStr = extractJsonObject(rawContent);
  const parsed  = JSON.parse(jsonStr) as Record<string, unknown>;

  for (const section of REQUIRED_V2_SECTIONS) {
    if (!(section in parsed)) {
      throw new Error(`Missing required section: ${section}`);
    }
    if (!isNonEmpty(parsed[section])) {
      throw new Error(`Section "${section}" is structurally empty (null, empty string, empty array, or empty object)`);
    }
  }

  return parsed;
}

// ─── Background handler ───────────────────────────────────────────────────────

export const handler = async (event: { httpMethod?: string; headers?: Record<string, string>; body?: string | Record<string, unknown> }) => {
  const json = jsonResponder(event, METHODS);

  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(event, METHODS);
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only.' });

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const auth = await authenticateUser(event);
    if (!auth.ok) return json(auth.status, { error: auth.error });
    const user = auth.user;
    const idToken = auth.token;

    // ── Parse request ────────────────────────────────────────────────────────
    const rawBody     = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const requestBody = StudyPlanApiRequestSchema.parse(JSON.parse(rawBody));
    if (user.id !== requestBody.userId) return json(403, { error: 'User mismatch.' });

    // ── Server-side rate limit: 1 successful generation per 7 days ──────────
    // Mirrors the client-side check in studyPlanService.ts but enforced on the
    // server so a direct JWT-authed call cannot bypass it and run up Claude
    // spend. Critically, filter to *successful* plans only — the function also
    // writes failure rows (plan_document.error === true), and those must not
    // block a user for a week.
    const userClient = getUserClient(idToken);
    const oneWeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRows } = await userClient
      .from('study_plans')
      .select('created_at, plan_document')
      .eq('user_id', user.id)
      .gt('created_at', oneWeekAgoIso)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentSuccess = (recentRows ?? []).find(row => {
      const doc = row.plan_document as Record<string, unknown> | null;
      return doc != null && doc.error !== true && doc.schemaVersion === '2';
    });

    if (recentSuccess) {
      const nextAvailableMs = new Date(recentSuccess.created_at as string).getTime()
        + 7 * 24 * 60 * 60 * 1000;
      const retryAfterSec = Math.max(1, Math.ceil((nextAvailableMs - Date.now()) / 1000));
      return json(
        429,
        { error: 'Study guide already generated this week.', retryAfterSec },
        { 'Retry-After': String(retryAfterSec) },
      );
    }

    // ── Failure cooldown: min 15 minutes between attempts after a failure ───
    // Failed generations deliberately do NOT count toward the 7-day rule (a
    // failure must not lock a user out for a week), which would otherwise
    // leave failures completely unthrottled — each one still spends Claude
    // tokens. Require a short gap after the most recent failure row instead.
    const failureTimestamps = (recentRows ?? [])
      .filter(row => (row.plan_document as Record<string, unknown> | null)?.error === true)
      .map(row => new Date(row.created_at as string).getTime());

    const cooldown = slidingWindowVerdict(Date.now(), failureTimestamps, 1, STUDY_PLAN_FAILURE_COOLDOWN_MS);
    if (cooldown.blocked) {
      return json(
        429,
        {
          error: 'The last generation attempt failed a few minutes ago. Please wait a bit before retrying.',
          retryAfterSec: cooldown.retryAfterSec,
        },
        { 'Retry-After': String(cooldown.retryAfterSec) },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    // ── Call Claude ──────────────────────────────────────────────────────────
    let anthropicRes: Response;
    try {
      anthropicRes = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key':    apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      MODEL,
          max_tokens: 12000,  // v2 schema is larger — raised from 8000
          temperature: 0.2,
          messages: [{ role: 'user', content: requestBody.prompt }],
        }),
      }, CLAUDE_TIMEOUT_MS);
    } catch (fetchErr) {
      if (isAbortError(fetchErr)) {
        console.error('[study-plan-background] Anthropic call timed out after', CLAUDE_TIMEOUT_MS, 'ms');
        return json(504, { error: 'Upstream AI call timed out.' });
      }
      throw fetchErr;
    }

    const anthropicBody = await anthropicRes.json().catch(() => null);
    if (!anthropicRes.ok) {
      console.error('[study-plan-background] Anthropic error:', anthropicBody);
      return json(502, { error: 'Upstream AI call failed.' });
    }

    const rawContent: string = Array.isArray(anthropicBody?.content)
      ? anthropicBody.content
          .filter((b: { type?: string; text?: string }) => b?.type === 'text' && typeof b.text === 'string')
          .map((b: { text: string }) => b.text)
          .join('\n')
      : '';

    if (!rawContent) return json(502, { error: 'Empty AI response.' });

    // ── Parse and validate v2 structure ─────────────────────────────────────
    const parsedPlan = parseAndValidateV2(rawContent);
    const addons     = requestBody.preComputedAddons;

    // Assemble the complete StudyPlanDocumentV2 to persist
    const studyPlanDocument = {
      schemaVersion: '2',
      ...parsedPlan,
      generatedAt:      new Date().toISOString(),
      model:            MODEL,
      sourceSummary:    requestBody.sourceSummary,
      studyConstraints: addons?.studyConstraints ?? null,
      apiVersion:       STUDY_PLAN_API_VERSION,
    };

    // ── Persist ──────────────────────────────────────────────────────────────
    // Uses the user-scoped client created above (RLS: auth.uid() = user_id).
    const { error: insertErr } = await userClient
      .from('study_plans')
      .insert([{ user_id: user.id, plan_document: studyPlanDocument }]);

    if (insertErr) {
      console.error('[study-plan-background] Insert error:', insertErr);
      // Persist a failure record so the client can detect it during polling
      try {
        await userClient.from('study_plans').insert([{
          user_id: user.id,
          plan_document: { error: true, errorMessage: insertErr.message, failedAt: new Date().toISOString() },
        }]);
      } catch (failRecordErr) {
        console.error('[study-plan-background] Could not write failure record:', failRecordErr);
      }
      return json(500, { error: 'Failed to save study plan.' });
    }

    console.log(`[study-plan-background] v2 plan saved for user ${user.id}`);
    return json(200, { ok: true });

  } catch (error) {
    console.error('[study-plan-background] Unhandled error:', error);
    return json(500, {
      error: error instanceof Error ? error.message : 'Generation failed.',
    });
  }
};
