/**
 * Handler-level guard tests for the Netlify function endpoints.
 *
 * Invokes handlers directly with the same event shape Netlify passes, covering
 * the paths that need no Supabase round-trip: missing-auth 401s, input
 * validation 400s, CORS origin reflection, and dormant Stripe responses.
 *
 * (Local `netlify dev` cannot exercise worktree code — the CLI resolves the
 * repo root via the parent's `.git` directory — so these run the handlers
 * in-process instead. Full-stack behavior is verified on deploy previews.)
 */
import { describe, it, expect } from 'vitest';
import { corsHeadersFor, jsonResponder } from '../api/_shared';
import { handler as leaderboard } from '../api/leaderboard';
import { handler as adminListUsers } from '../api/admin-list-users';
import { handler as adminStudentDetail } from '../api/admin-student-detail';
import { handler as adminDeleteUser } from '../api/admin-delete-user';
import { handler as adminChatActivity } from '../api/admin-chat-activity';
import { handler as studyPlanBackground } from '../api/study-plan-background';
import { handler as stripeWebhook } from '../api/stripe-webhook';
import { handler as createCheckoutSession } from '../api/create-checkout-session';

const PROD_ORIGIN = 'https://praxismakesperfect.netlify.app';
const PREVIEW_ORIGIN = 'https://deploy-preview-46--praxismakesperfect.netlify.app';
const EVIL_ORIGIN = 'https://evil.example.com';

describe('CORS origin reflection (corsHeadersFor)', () => {
  it('reflects the production origin', () => {
    const h = corsHeadersFor({ headers: { origin: PROD_ORIGIN } }, 'GET, OPTIONS');
    expect(h['Access-Control-Allow-Origin']).toBe(PROD_ORIGIN);
  });

  it('reflects deploy-preview and localhost origins', () => {
    expect(
      corsHeadersFor({ headers: { origin: PREVIEW_ORIGIN } }, 'GET, OPTIONS')['Access-Control-Allow-Origin'],
    ).toBe(PREVIEW_ORIGIN);
    expect(
      corsHeadersFor({ headers: { origin: 'http://localhost:8888' } }, 'GET, OPTIONS')['Access-Control-Allow-Origin'],
    ).toBe('http://localhost:8888');
  });

  it('omits the header for unknown origins and same-origin requests', () => {
    expect(
      corsHeadersFor({ headers: { origin: EVIL_ORIGIN } }, 'GET, OPTIONS')['Access-Control-Allow-Origin'],
    ).toBeUndefined();
    expect(corsHeadersFor({ headers: {} }, 'GET, OPTIONS')['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('does not reflect a lookalike subdomain on a foreign registrable domain', () => {
    const h = corsHeadersFor(
      { headers: { origin: 'https://praxismakesperfect.netlify.app.evil.example.com' } },
      'GET, OPTIONS',
    );
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('jsonResponder merges extra headers (Retry-After)', () => {
    const json = jsonResponder({ headers: {} }, 'POST, OPTIONS');
    const res = json(429, { error: 'x' }, { 'Retry-After': '60' });
    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBe('60');
  });
});

describe('auth guards — 401 without a Bearer token', () => {
  const cases: Array<[string, (e: never) => Promise<{ statusCode: number; body: string }>, Record<string, unknown>]> = [
    ['leaderboard', leaderboard as never, { httpMethod: 'GET', headers: {} }],
    ['admin-list-users', adminListUsers as never, { httpMethod: 'GET', headers: {} }],
    ['admin-chat-activity', adminChatActivity as never, { httpMethod: 'GET', headers: {} }],
    ['admin-delete-user', adminDeleteUser as never, { httpMethod: 'POST', headers: {}, body: '{}' }],
    ['study-plan-background', studyPlanBackground as never, { httpMethod: 'POST', headers: {}, body: '{}' }],
  ];

  it.each(cases)('%s returns 401', async (_name, fn, event) => {
    const res = await (fn as (e: unknown) => Promise<{ statusCode: number; body: string }>)(event);
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/Bearer token/i);
  });

  it('401 responses to foreign origins carry no CORS header', async () => {
    const res = await leaderboard({ httpMethod: 'GET', headers: { origin: EVIL_ORIGIN } });
    expect(res.statusCode).toBe(401);
    expect((res.headers as Record<string, string>)['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('input validation', () => {
  it('admin-student-detail rejects a malformed userId with 400 before auth', async () => {
    const res = await adminStudentDetail({
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { userId: 'not-a-uuid' },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/valid UUID/);
  });

  it('admin-student-detail rejects a missing userId with 400', async () => {
    const res = await adminStudentDetail({ httpMethod: 'GET', headers: {}, queryStringParameters: null });
    expect(res.statusCode).toBe(400);
  });
});

describe('method + preflight handling', () => {
  it('OPTIONS preflight returns 204 with reflected origin', async () => {
    const res = await leaderboard({ httpMethod: 'OPTIONS', headers: { origin: PROD_ORIGIN } });
    expect(res.statusCode).toBe(204);
    expect((res.headers as Record<string, string>)['Access-Control-Allow-Origin']).toBe(PROD_ORIGIN);
  });

  it('wrong method returns 405', async () => {
    const res = await leaderboard({ httpMethod: 'POST', headers: {} });
    expect(res.statusCode).toBe(405);
  });
});

describe('dormant Stripe endpoints', () => {
  it('stripe-webhook short-circuits with 200 before any processing', async () => {
    const res = await stripeWebhook({ httpMethod: 'POST', headers: {}, body: '{"type":"evil"}' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toMatch(/disabled/i);
  });

  it('create-checkout-session returns 503 while dormant', async () => {
    const res = await createCheckoutSession({ httpMethod: 'POST', headers: {}, body: '{}' });
    expect(res.statusCode).toBe(503);
  });
});
