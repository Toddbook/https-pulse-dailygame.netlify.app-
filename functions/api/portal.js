import { stripe, json, readBody, isSessionId } from '../../lib/stripe.js';

// POST {session_id} -> {url} of Stripe's page where the customer can cancel, change card or see invoices.
export async function onRequestPost({ request, env }) {
  const { session_id } = await readBody(request);
  if (!isSessionId(session_id)) return json({ error: 'Invalid' }, 400);
  const origin = new URL(request.url).origin;
  try {
    const s = await stripe(env, 'GET', `/v1/checkout/sessions/${session_id}`);
    if (!s.customer) return json({ error: 'No customer' }, 404);
    const p = await stripe(env, 'POST', '/v1/billing_portal/sessions', { customer: s.customer, return_url: origin + '/' });
    return json({ url: p.url });
  } catch (e) {
    console.error('portal failed:', e.message);
    return json({ error: 'Could not open portal' }, 502);
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
