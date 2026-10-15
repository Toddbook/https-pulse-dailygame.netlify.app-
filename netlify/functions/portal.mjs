import { stripe, json, readBody, isSessionId } from '../lib/stripe.mjs';

// POST {session_id} -> {url} of Stripe's page where the customer can cancel, change card or see invoices.
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const { session_id } = await readBody(req);
  if (!isSessionId(session_id)) return json({ error: 'Invalid' }, 400);
  const origin = process.env.SITE_URL || new URL(req.url).origin;
  try {
    const s = await stripe('GET', `/v1/checkout/sessions/${session_id}`);
    if (!s.customer) return json({ error: 'No customer' }, 404);
    const p = await stripe('POST', '/v1/billing_portal/sessions', { customer: s.customer, return_url: origin + '/' });
    return json({ url: p.url });
  } catch (e) {
    console.error('portal failed:', e.message);
    return json({ error: 'Could not open portal' }, 502);
  }
};
