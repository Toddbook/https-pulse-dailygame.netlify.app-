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
    return json({ error: 'Could not start checkout' }, 502);
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
