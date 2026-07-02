/**
 * POST /api/create-checkout-session
 * Creates a Stripe Checkout session for subscription purchase.
 * Requires authenticated user (Bearer token).
 *
 * Body: { priceId: string }  — Stripe Price ID for monthly or yearly plan
 * Returns: { url: string }   — Stripe Checkout URL to redirect to
 */
import { authenticateUser, jsonResponder, preflightResponse } from './_shared';

const METHODS = 'POST, OPTIONS';

export async function handler(event: { httpMethod: string; headers?: Record<string, string>; body?: string }) {
  const json = jsonResponder(event, METHODS);

  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(event, METHODS);
  }

  // Stripe checkout is dormant — return early without processing.
  // Re-enable when payment infrastructure is ready.
  return json(503, { error: 'Checkout is not currently available' });

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return json(500, { error: 'Stripe not configured' });

    // Auth
    const auth = await authenticateUser(event);
    if (!auth.ok) return json(auth.status, { error: auth.error });
    const user = auth.user;

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
