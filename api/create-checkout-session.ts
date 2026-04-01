/**
 * POST /api/create-checkout-session
 * Creates a Stripe Checkout session for subscription purchase.
 * Requires authenticated user (Bearer token).
 *
 * Body: { priceId: string }  — Stripe Price ID for monthly or yearly plan
 * Returns: { url: string }   — Stripe Checkout URL to redirect to
 */
import { createClient } from '@supabase/supabase-js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function getAnonClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase credentials not configured.');
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

export async function handler(event: { httpMethod: string; headers?: Record<string, string>; body?: string }) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return json(500, { error: 'Stripe not configured' });

    // Auth
    const token = getBearerToken(event.headers?.authorization || event.headers?.Authorization);
    if (!token) return json(401, { error: 'Missing authorization' });

    const anon = getAnonClient();
    const { data: { user }, error: authErr } = await anon.auth.getUser(token);
    if (authErr || !user) return json(401, { error: 'Invalid session' });

    // Parse request
    const { priceId } = JSON.parse(event.body || '{}');
    if (!priceId) return json(400, { error: 'priceId required' });

    // Determine success/cancel URLs
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';

    // Create Stripe Checkout Session via API (no SDK dependency)
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${siteUrl}?subscription=success`);
    params.append('cancel_url', `${siteUrl}?subscription=canceled`);
    params.append('customer_email', user.email || '');
    params.append('client_reference_id', user.id);
    params.append('metadata[user_id]', user.id);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error('[create-checkout-session] Stripe error:', session);
      return json(502, { error: 'Failed to create checkout session' });
    }

    return json(200, { url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return json(500, { error: 'Internal server error' });
  }
}
