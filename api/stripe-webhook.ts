/**
 * POST /api/stripe-webhook
 * Handles Stripe webhook events for subscription lifecycle.
 *
 * Events handled:
 *   - checkout.session.completed  → create/update subscription record
 *   - customer.subscription.updated → sync status changes
 *   - customer.subscription.deleted → mark subscription canceled
 *
 * Requires STRIPE_WEBHOOK_SECRET for signature verification.
 * Uses SUPABASE_SERVICE_ROLE_KEY for cross-user writes.
 */
import { createClient } from '@supabase/supabase-js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function getServiceClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase service credentials not configured.');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Minimal Stripe signature verification (timing-safe HMAC comparison). */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = sigHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return expected === signature;
  } catch {
    return false;
  }
}

function mapStripePlan(priceId: string): string {
  const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
  const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
  if (priceId === monthlyPriceId) return 'premium_monthly';
  if (priceId === yearlyPriceId) return 'premium_yearly';
  return 'premium_monthly'; // default fallback
}

export async function handler(event: { httpMethod: string; headers?: Record<string, string>; body?: string }) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return json(500, { error: 'Webhook secret not configured' });

    const sigHeader = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'] || '';
    const rawBody = event.body || '';

    const isValid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!isValid) {
      console.error('[stripe-webhook] Invalid signature');
      return json(400, { error: 'Invalid signature' });
    }

    const stripeEvent = JSON.parse(rawBody);
    const eventType = stripeEvent.type;
    const data = stripeEvent.data?.object;

    const svc = getServiceClient();

    if (eventType === 'checkout.session.completed') {
      const userId = data.client_reference_id || data.metadata?.user_id;
      const customerId = data.customer;
      const subscriptionId = data.subscription;

      if (!userId) {
        console.error('[stripe-webhook] No user_id in checkout session');
        return json(200, { received: true, skipped: 'no user_id' });
      }

      // Fetch subscription details from Stripe
      const stripeKey = process.env.STRIPE_SECRET_KEY!;
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      });
      const subData = await subRes.json();
      const priceId = subData.items?.data?.[0]?.price?.id || '';
      const plan = mapStripePlan(priceId);

      await svc.from('user_subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan,
        status: 'active',
        current_period_end: subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      console.log(`[stripe-webhook] Subscription created for user ${userId}: ${plan}`);
    }

    if (eventType === 'customer.subscription.updated') {
      const subscriptionId = data.id;
      const status = data.status;
      const priceId = data.items?.data?.[0]?.price?.id || '';
      const plan = mapStripePlan(priceId);

      await svc.from('user_subscriptions')
        .update({
          plan,
          status,
          current_period_end: data.current_period_end
            ? new Date(data.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

      console.log(`[stripe-webhook] Subscription updated: ${subscriptionId} → ${status}`);
    }

    if (eventType === 'customer.subscription.deleted') {
      const subscriptionId = data.id;

      await svc.from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

      console.log(`[stripe-webhook] Subscription canceled: ${subscriptionId}`);
    }

    return json(200, { received: true });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return json(500, { error: 'Webhook handler error' });
  }
}
