import { stripe, json, readBody } from '../lib/stripe.mjs';

// POST {plan:'monthly'|'yearly'} -> {url} of a Stripe-hosted checkout page.
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const { plan } = await readBody(req);
  const price = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : '';
  if (!price) return json({ error: 'Unknown plan' }, 400);
  const origin = process.env.SITE_URL || new URL(req.url).origin;
  try {
    const session = await stripe('POST', '/v1/checkout/sessions', {
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
};
