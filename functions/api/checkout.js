import { stripe, json, readBody } from '../../lib/stripe.js';

// Everything the site sells, with prices in pence (GBP). Prices are set here, so nothing needs creating in the Stripe dashboard.
// To change a price, edit it here and in public/index.html. Existing subscribers keep the price they signed up at.
//   unlocks: true for anything that switches PULSE+ on.  back: what the success link adds to the address.
const PLANS = {
  monthly: { name: 'PULSE+ monthly', pence: 199, interval: 'month', unlocks: true, back: 'paid' },
  yearly: { name: 'PULSE+ yearly', pence: 1199, interval: 'year', unlocks: true, back: 'paid', trialDays: 7 },
  forever: { name: 'PULSE+ forever', pence: 1999, unlocks: true, back: 'paid' },
  savers: { name: 'PULSE Streak Saver x3', pence: 99, back: 'savers' },
  tip_small: { name: 'PULSE tip', pence: 99, back: 'thanks' },
  tip_medium: { name: 'PULSE tip', pence: 299, back: 'thanks' },
  tip_large: { name: 'PULSE tip', pence: 499, back: 'thanks' },
};

// POST {plan} -> {url} of a Stripe-hosted checkout page.
export async function onRequestPost({ request, env }) {
  const { plan } = await readBody(request);
  const p = Object.hasOwn(PLANS, plan) ? PLANS[plan] : null;
  if (!p) return json({ error: 'Unknown plan' }, 400);
  const mode = p.interval ? 'subscription' : 'payment';
  const price_data = {
    currency: 'gbp',
    unit_amount: p.pence,
    product_data: { name: p.name },
    recurring: p.interval ? { interval: p.interval } : undefined,
  };
  const origin = new URL(request.url).origin;
  try {
    const session = await stripe(env, 'POST', '/v1/checkout/sessions', {
      mode,
      line_items: [{ price_data, quantity: 1 }],
      // The status check reads this to tell a PULSE+ purchase from a Streak Saver pack or a tip.
      metadata: { plan },
      subscription_data: mode === 'subscription' ? { metadata: { plan }, trial_period_days: p.trialDays } : undefined,
      // A one-off Forever purchase still gets a Stripe customer, so receipts and refunds are easy to find.
      customer_creation: mode === 'payment' && p.unlocks ? 'always' : undefined,
      allow_promotion_codes: p.unlocks ? 'true' : undefined,
      success_url: `${origin}/?${p.back}={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#plans`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout failed:', e.message);
    return json({ error: 'Could not start checkout' }, 502);
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
