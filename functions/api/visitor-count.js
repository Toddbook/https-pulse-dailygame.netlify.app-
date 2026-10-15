import { json } from '../../lib/stripe.js';
import { bump } from '../../lib/counter.js';

// POST -> {total}. Stores one number and nothing about the visitor. Needs a KV binding called COUNTER (optional; the box hides itself without it).
export async function onRequestPost({ env }) {
  try {
    if (!env.COUNTER) return json({ error: 'Counter not set up' }, 503);
    return json({ total: await bump(env.COUNTER) });
  } catch (e) {
    console.error('visitor-count failed:', e.message);
    return json({ error: 'Counter unavailable' }, 503);
  }
}
export const onRequest = () => json({ error: 'POST only' }, 405);
