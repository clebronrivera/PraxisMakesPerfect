/**
 * Shared helpers for the Netlify function endpoints in api/.
 *
 * NOT a function itself — it exports no handler, so Netlify does not expose it
 * as an endpoint (same pattern as parseClaude.ts). Every endpoint imports its
 * Supabase client factories, auth guards, CORS/JSON response helpers, and
 * rate-limit window math from here instead of carrying its own copy.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { isAdminEmail } from '../src/config/admin';

// ─── CORS / JSON responses ────────────────────────────────────────────────────
//
// The app always calls /api/* same-origin (relative paths, rewritten by
// netlify.toml), so cross-origin browser access is only legitimate from our own
// deploys (production, deploy previews, branch deploys) and local dev. Reflect
// the request origin when it matches; otherwise omit the CORS header entirely —
// same-origin requests don't need one, and third-party origins get nothing.
const ALLOWED_ORIGIN_RE =
  /^(https:\/\/([a-z0-9-]+--)?praxismakesperfect\.netlify\.app|http:\/\/localhost:\d+)$/;

export interface FunctionEvent {
  httpMethod?: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string> | null;
  body?: string;
}

export function corsHeadersFor(
  event: Pick<FunctionEvent, 'headers'>,
  methods: string,
): Record<string, string> {
  const origin = event.headers?.origin || event.headers?.Origin;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': methods,
  };
  if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export type JsonResponder = (
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
) => { statusCode: number; headers: Record<string, string>; body: string };

/** Per-request JSON responder carrying the CORS headers for this event. */
export function jsonResponder(
  event: Pick<FunctionEvent, 'headers'>,
  methods: string,
): JsonResponder {
  const headers = corsHeadersFor(event, methods);
  return (statusCode, body, extraHeaders) => ({
    statusCode,
    headers: extraHeaders ? { ...headers, ...extraHeaders } : headers,
    body: JSON.stringify(body),
  });
}

export function preflightResponse(event: Pick<FunctionEvent, 'headers'>, methods: string) {
  return { statusCode: 204, headers: corsHeadersFor(event, methods), body: '' };
}

// ─── Supabase clients ─────────────────────────────────────────────────────────

const CLIENT_OPTS = { auth: { persistSession: false, autoRefreshToken: false } };

export function getAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase anon credentials not configured.');
  return createClient(supabaseUrl, anonKey, CLIENT_OPTS);
}

/** Service-role client — bypasses RLS. `scope` names the caller for the error message. */
export function getServiceClient(scope: string): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY is required for ${scope}.`);
  }
  return createClient(supabaseUrl, serviceKey, CLIENT_OPTS);
}

/** User-scoped client — carries the caller's JWT so RLS (auth.uid() = user_id) applies. */
export function getUserClient(userJwt: string): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase anon credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    ...CLIENT_OPTS,
  });
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

export function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

export type AuthResult =
  | { ok: true; user: User; token: string }
  | { ok: false; status: number; error: string };

/** Verify the Bearer JWT and resolve the calling user. */
export async function authenticateUser(event: Pick<FunctionEvent, 'headers'>): Promise<AuthResult> {
  const token = getBearerToken(event.headers?.authorization || event.headers?.Authorization);
  if (!token) return { ok: false, status: 401, error: 'Missing Authorization Bearer token.' };

  const anon = getAnonClient();
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return { ok: false, status: 401, error: 'Invalid session.' };

  return { ok: true, user: data.user, token };
}

/** Verify the Bearer JWT AND that the caller is on the admin allowlist. */
export async function authenticateAdmin(event: Pick<FunctionEvent, 'headers'>): Promise<AuthResult> {
  const result = await authenticateUser(event);
  if (!result.ok) return result;
  if (!result.user.email || !isAdminEmail(result.user.email)) {
    return { ok: false, status: 403, error: 'Admin only.' };
  }
  return result;
}

// ─── Error hygiene ────────────────────────────────────────────────────────────

/**
 * Log the full upstream error server-side; return only a generic message for
 * the client. Supabase errors can name tables/columns — that detail belongs in
 * function logs, not in HTTP responses.
 */
export function logAndGenericError(scope: string, publicMessage: string, error: unknown): string {
  console.error(`[${scope}]`, publicMessage, error);
  return publicMessage;
}

// ─── Upstream fetch with timeout ──────────────────────────────────────────────

/** fetch() that aborts after `timeoutMs` so a hung upstream can't pin the function. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}

// ─── Validation ───────────────────────────────────────────────────────────────

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Rate-limit window math (pure — unit-tested in tests/apiRateLimits.test.ts) ──

export interface RateLimitVerdict {
  blocked: boolean;
  /** Seconds until the earliest event exits the window (≥ 1 when blocked). */
  retryAfterSec: number;
}

/**
 * Sliding-window limit: blocked when `timestampsMs` already contains `limit`
 * or more events inside the trailing `windowMs`. Retry-After is when the
 * oldest in-window event ages out.
 */
export function slidingWindowVerdict(
  nowMs: number,
  timestampsMs: number[],
  limit: number,
  windowMs: number,
): RateLimitVerdict {
  const cutoff = nowMs - windowMs;
  const inWindow = timestampsMs.filter(t => t > cutoff);
  if (inWindow.length < limit) return { blocked: false, retryAfterSec: 0 };
  const oldest = Math.min(...inWindow);
  return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000)) };
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** AI Tutor: per-user message budget (user-role messages, all sessions). */
export const TUTOR_RATE_LIMITS = { perHour: 40, perDay: 200 } as const;

/** Study plans: min gap between generation *attempts* after a failure. */
export const STUDY_PLAN_FAILURE_COOLDOWN_MS = 15 * 60 * 1000;

/** Combined hour+day tutor verdict from the user's message timestamps (last 24h). */
export function tutorRateLimitVerdict(nowMs: number, messageTimestampsMs: number[]): RateLimitVerdict {
  const hour = slidingWindowVerdict(nowMs, messageTimestampsMs, TUTOR_RATE_LIMITS.perHour, HOUR_MS);
  const day = slidingWindowVerdict(nowMs, messageTimestampsMs, TUTOR_RATE_LIMITS.perDay, DAY_MS);
  if (!hour.blocked && !day.blocked) return { blocked: false, retryAfterSec: 0 };
  return { blocked: true, retryAfterSec: Math.max(hour.retryAfterSec, day.retryAfterSec) };
}
