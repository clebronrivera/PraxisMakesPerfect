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
import { createClient } from '@supabase/supabase-js';
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema
} from '../src/types/studyPlanApi';

const MODEL = 'claude-sonnet-4-20250514';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

// Auth verification: uses the anon key — supabase.auth.getUser(jwt) just calls
// /auth/v1/user with the user's Bearer token and does not require service role.
// DB write: uses the user's own JWT so RLS (auth.uid() = user_id) is satisfied.
// Service role key is NOT required for either operation.
function getAnonClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey     = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getUserClient(userJwt: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey     = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth:   { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

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

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only.' });

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
    const idToken    = getBearerToken(authHeader);
    if (!idToken) return json(401, { error: 'Missing authentication token.' });

    const anonClient = getAnonClient();
    const { data: { user }, error: authError } = await anonClient.auth.getUser(idToken);
    if (authError || !user) {
      console.error('[study-plan-background] Auth error:', authError);
      return json(401, { error: 'Invalid authentication token.' });
    }

    // ── Parse request ────────────────────────────────────────────────────────
    const rawBody     = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const requestBody = StudyPlanApiRequestSchema.parse(JSON.parse(rawBody));
    if (user.id !== requestBody.userId) return json(403, { error: 'User mismatch.' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    // ── Call Claude ──────────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
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
    });

    const anthropicBody = await anthropicRes.json().catch(() => null);
    if (!anthropicRes.ok) {
      console.error('[study-plan-background] Anthropic error:', anthropicBody);
      return json(502, { error: 'Upstream AI call failed.' });
    }

    const rawContent: string = Array.isArray(anthropicBody?.content)
      ? anthropicBody.content
          .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
          .map((b: any) => b.text)
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
    // Use user-scoped client so RLS policy (auth.uid() = user_id) is satisfied.
    const userClient = getUserClient(idToken);
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
