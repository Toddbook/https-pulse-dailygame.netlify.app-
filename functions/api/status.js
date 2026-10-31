import { stripe, json, readBody, isSessionId } from '../../lib/stripe.js';

// POST {session_id} -> {active, plan, paid}
//   active: PULSE+ should be on right now (a paid-up subscription, or a Forever purchase that was not refunded).
//   plan:   what was bought in that checkout (monthly, yearly, forever, savers, tip_small, ...).
//   paid:   a one-off purchase (Forever, Streak Savers or a tip) was paid and not refunded.
export async function onRequestPost({ request, env }) {
  const { session_id } = await readBody(request);
  if (!isSessionId(session_id)) return json({ active: false, reason: 'invalid' });
  try {
    const s = await stripe(env, 'GET', `/v1/checkout/sessions/${session_id}`, { expand: ['subscription', 'payment_intent.latest_charge'] });
    const plan = (s.metadata && s.metadata.plan) || (s.mode === 'subscription' ? 'subscription' : '');
    if (s.mode === 'subscription') {
      const sub = s.subscription && typeof s.subscription === 'object' ? s.subscription : null;
      return json({ active: !!sub && (sub.status === 'active' || sub.status === 'trialing'), plan });
    }
    const charge = s.payment_intent && s.payment_intent.latest_charge;
    const paid = s.mode === 'payment' && s.payment_status === 'paid' && !(charge && typeof charge === 'object' && charge.refunded);
    return json({ active: paid && plan === 'forever', plan, paid });
  } catch (e) {
    if (e.status === 404 || e.status === 400) return json({ active: false, reason: 'invalid' });
    console.error('status failed:', e.message);
    return json({ error: 'Could not check' }, 502); // no "active" field, so the site treats it as a network problem
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
