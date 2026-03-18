/**
 * Netlify Background Function — suffix "-background" tells Netlify to:
 *   1. Return HTTP 202 Accepted to the caller immediately.
 *   2. Continue running this handler to completion (up to 15 min).
 *
 * Flow:
 *   Client  →  POST /api/study-plan-background  →  202
 *   Function → calls Claude → saves full StudyPlanDocument to study_plans
 *   Client  →  polls supabase study_plans WHERE created_at > requestedAt
 *            → when row appears, reads plan_document and renders the plan
 */
import { createClient } from '@supabase/supabase-js';
import {
  STUDY_PLAN_API_VERSION,
  StudyPlanApiRequestSchema
} from '../src/types/studyPlanApi';

const MODEL = 'claude-sonnet-4-20250514';

// ─── Helpers shared with study-plan.ts ────────────────────────────────────────

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body)
  };
}

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, serviceKey);
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// ─── Inline content parser (mirrors parseStudyPlanContent in studyPlanService) ─

function asObject(v: unknown, p: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`Invalid field: ${p}`);
  return v as Record<string, unknown>;
}
function asString(v: unknown, p: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Invalid field: ${p}`);
  return v.trim();
}
function asNumber(v: unknown, p: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`Invalid field: ${p}`);
  return v;
}
function asNullableNumber(v: unknown, p: string): number | null {
  if (v === null || v === undefined) return null;
  return asNumber(v, p);
}
function asStringArray(v: unknown, p: string): string[] {
  if (!Array.isArray(v)) throw new Error(`Invalid field: ${p}`);
  return v.map((item, i) => asString(item, `${p}[${i}]`));
}
function extractJsonObject(content: string): string {
  const stripped = content.trim()
    .replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) throw new Error('No valid JSON in response.');
  return stripped.slice(first, last + 1);
}

function parseStudyPlanContent(rawContent: string) {
  const parsed = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;
  const summary = asObject(parsed.summary, 'summary');

  const domainAnalysis   = Array.isArray(parsed.domainAnalysis)    ? parsed.domainAnalysis    : null;
  const prioritySkills   = Array.isArray(parsed.prioritySkills)    ? parsed.prioritySkills    : null;
  const vocabularyGaps   = Array.isArray(parsed.vocabularyGaps)    ? parsed.vocabularyGaps    : null;
  const foundationalReview = Array.isArray(parsed.foundationalReview) ? parsed.foundationalReview : [];
  const studyResources   = Array.isArray(parsed.studyResources)    ? parsed.studyResources    : [];
  const studyPlan        = Array.isArray(parsed.studyPlan)          ? parsed.studyPlan          : null;
  const weeklySchedule   = Array.isArray(parsed.weeklySchedule)    ? parsed.weeklySchedule    : null;

  if (!domainAnalysis || !prioritySkills || !vocabularyGaps || !studyPlan || !weeklySchedule) {
    throw new Error('Response is missing one or more required sections.');
  }

  return {
    summary: {
      readiness:    asString(summary.readiness,    'summary.readiness'),
      overview:     asString(summary.overview,     'summary.overview'),
      nextBestMove: asString(summary.nextBestMove, 'summary.nextBestMove')
    },
    domainAnalysis: domainAnalysis.map((item: unknown, i: number) => {
      const s = asObject(item, `domainAnalysis[${i}]`);
      return {
        domainId:   asNumber(s.domainId,   `domainAnalysis[${i}].domainId`),
        domainName: asString(s.domainName, `domainAnalysis[${i}].domainName`),
        score:      asNullableNumber(s.score, `domainAnalysis[${i}].score`),
        analysis:   asString(s.analysis,   `domainAnalysis[${i}].analysis`),
        nextSteps:  asStringArray(s.nextSteps, `domainAnalysis[${i}].nextSteps`)
      };
    }),
    prioritySkills: prioritySkills.map((item: unknown, i: number) => {
      const s = asObject(item, `prioritySkills[${i}]`);
      const urgency = asString(s.urgency, `prioritySkills[${i}].urgency`);
      if (urgency !== 'high' && urgency !== 'medium' && urgency !== 'low')
        throw new Error(`Invalid urgency at prioritySkills[${i}]`);
      return {
        skillId:   asString(s.skillId,   `prioritySkills[${i}].skillId`),
        skillName: asString(s.skillName, `prioritySkills[${i}].skillName`),
        reason:    asString(s.reason,    `prioritySkills[${i}].reason`),
        urgency
      };
    }),
    vocabularyGaps: vocabularyGaps.map((item: unknown, i: number) => {
      const s = asObject(item, `vocabularyGaps[${i}]`);
      return {
        term:         asString(s.term,         `vocabularyGaps[${i}].term`),
        meaning:      asString(s.meaning,      `vocabularyGaps[${i}].meaning`),
        whyItMatters: asString(s.whyItMatters, `vocabularyGaps[${i}].whyItMatters`)
      };
    }),
    foundationalReview: foundationalReview.map((item: unknown, i: number) => {
      const s = asObject(item, `foundationalReview[${i}]`);
      return {
        skillId:       asString(s.skillId,       `foundationalReview[${i}].skillId`),
        skillName:     asString(s.skillName,     `foundationalReview[${i}].skillName`),
        whyNow:        asString(s.whyNow,        `foundationalReview[${i}].whyNow`),
        reviewActions: asStringArray(s.reviewActions, `foundationalReview[${i}].reviewActions`)
      };
    }),
    studyResources: studyResources.map((item: unknown, i: number) => {
      const s = asObject(item, `studyResources[${i}]`);
      return {
        title:        asString(s.title,        `studyResources[${i}].title`),
        resourceType: asString(s.resourceType, `studyResources[${i}].resourceType`),
        focusArea:    asString(s.focusArea,    `studyResources[${i}].focusArea`),
        whyItHelps:   asString(s.whyItHelps,   `studyResources[${i}].whyItHelps`),
        action:       asString(s.action,       `studyResources[${i}].action`)
      };
    }),
    masteryChecklist: [] as any[],       // filled by caller from preComputedAddons
    finalAssessmentGate: null as any,    // filled by caller from preComputedAddons
    studyPlan: studyPlan.map((item: unknown, i: number) => {
      const s = asObject(item, `studyPlan[${i}]`);
      return {
        phase:   asString(s.phase,   `studyPlan[${i}].phase`),
        goal:    asString(s.goal,    `studyPlan[${i}].goal`),
        actions: asStringArray(s.actions, `studyPlan[${i}].actions`)
      };
    }),
    weeklySchedule: weeklySchedule.map((item: unknown, i: number) => {
      const s = asObject(item, `weeklySchedule[${i}]`);
      return {
        day:             asString(s.day,             `weeklySchedule[${i}].day`),
        durationMinutes: asNumber(s.durationMinutes, `weeklySchedule[${i}].durationMinutes`),
        focus:           asString(s.focus,           `weeklySchedule[${i}].focus`),
        tasks:           asStringArray(s.tasks,      `weeklySchedule[${i}].tasks`)
      };
    })
  };
}

// ─── Background handler ────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
  if (event.httpMethod !== 'POST')    return json(405, { error: 'POST only.' });

  try {
    const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
    const idToken = getBearerToken(authHeader);
    if (!idToken) return json(401, { error: 'Missing authentication token.' });

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(idToken);
    if (authError || !user) {
      console.error('[study-plan-background] Auth error:', authError);
      return json(401, { error: 'Invalid authentication token.' });
    }

    const rawBody = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    const requestBody = StudyPlanApiRequestSchema.parse(JSON.parse(rawBody));
    if (user.id !== requestBody.userId) return json(403, { error: 'User mismatch.' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured.');

    // ── Call Claude (this is why we're a background function) ──────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        temperature: 0.2,
        messages: [{ role: 'user', content: requestBody.prompt }]
      })
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

    // ── Parse + build complete StudyPlanDocument ───────────────────────────────
    const parsedPlan = parseStudyPlanContent(rawContent);
    const addons = requestBody.preComputedAddons;
    const plan = {
      ...parsedPlan,
      masteryChecklist:   addons?.masteryChecklist   ?? [],
      finalAssessmentGate: addons?.finalAssessmentGate ?? null
    };

    const studyPlanDocument = {
      plan,
      generatedAt:   new Date().toISOString(),
      model:         MODEL,
      sourceSummary: requestBody.sourceSummary,
      apiVersion:    STUDY_PLAN_API_VERSION
    };

    // ── Persist — client polls study_plans for this row ───────────────────────
    const { error: insertErr } = await supabase
      .from('study_plans')
      .insert([{ user_id: user.id, plan_document: studyPlanDocument }]);

    if (insertErr) {
      console.error('[study-plan-background] Insert error:', insertErr);
    } else {
      console.log(`[study-plan-background] Plan saved for user ${user.id}`);
    }

    // Return value is ignored by Netlify for background functions (202 was already sent)
    return json(200, { ok: true });

  } catch (error) {
    console.error('[study-plan-background] Unhandled error:', error);
    return json(500, { error: error instanceof Error ? error.message : 'Generation failed.' });
  }
};
