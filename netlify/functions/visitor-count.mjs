import { getStore } from '@netlify/blobs';
import { json } from '../lib/stripe.mjs';
import { bump } from '../lib/counter.mjs';

// POST -> {total}. Stores one number and nothing about the visitor (no IP address, no ID, no user agent).
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const store = getStore({ name: 'pulse-counter', consistency: 'strong' });
    return json({ total: await bump(store) });
  } catch (e) {
    console.error('visitor-count failed:', e.message);
    return json({ error: 'Counter unavailable' }, 503);
  }
};
