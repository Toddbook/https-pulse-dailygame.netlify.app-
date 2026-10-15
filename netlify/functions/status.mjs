import { stripe, json, readBody, isSessionId } from '../lib/stripe.mjs';

// POST {session_id} -> {active:boolean}. Asks Stripe whether the subscription behind that checkout is paid up right now.
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const { session_id } = await readBody(req);
  if (!isSessionId(session_id)) return json({ active: false, reason: 'invalid' });
  try {
    const s = await stripe('GET', `/v1/checkout/sessions/${session_id}`, { expand: ['subscription'] });
    const sub = s.subscription && typeof s.subscription === 'object' ? s.subscription : null;
    const active = s.mode === 'subscription' && !!sub && (sub.status === 'active' || sub.status === 'trialing');
    return json({ active });
  } catch (e) {
    if (e.status === 404 || e.status === 400) return json({ active: false, reason: 'invalid' });
    console.error('status failed:', e.message);
    return json({ error: 'Could not check' }, 502); // no "active" field, so the site treats it as a network problem
  }
};
