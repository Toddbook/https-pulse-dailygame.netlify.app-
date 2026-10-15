import { stripe, json, readBody } from '../../lib/stripe.js';

// POST {plan:'monthly'|'yearly'} -> {url} of a Stripe-hosted checkout page.
export async function onRequestPost({ request, env }) {
  const { plan } = await readBody(request);
  const price = plan === 'yearly' ? env.STRIPE_PRICE_YEARLY : plan === 'monthly' ? env.STRIPE_PRICE_MONTHLY : '';
  if (!price) return json({ error: 'Unknown plan' }, 400);
  const origin = new URL(request.url).origin;
  try {
    const session = await stripe(env, 'POST', '/v1/checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      // The yearly plan gets the 7-day free trial; monthly does not.
      subscription_data: plan === 'yearly' ? { trial_period_days: 7 } : undefined,
      allow_promotion_codes: 'true',
      success_url: `${origin}/?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#plans`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout failed:', e.message);
    // TEMPORARY diagnostics: say which account the key belongs to and which prices it can see. Remove once checkout works.
    let extra = '';
    try {
      const key = String(env.STRIPE_SECRET_KEY || '');
      const list = await stripe(env, 'GET', '/v1/prices', { limit: 5, active: 'true' });
      const ids = (list.data || []).map((p) => p.id).join(', ') || 'none';
      extra = ` | key account ${key.slice(8, 24)} | prices it can see: ${ids}`;
    } catch (e2) {
      extra = ` | could not list prices: ${String(e2.message || '').slice(0, 80)}`;
    }
    return json({ error: 'Could not start checkout', detail: (String(e.message || '') + extra).slice(0, 500) }, 502);
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
