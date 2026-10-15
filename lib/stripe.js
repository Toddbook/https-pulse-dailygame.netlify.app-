// Tiny Stripe helper. Talks to Stripe's REST API directly, so there is nothing to install.
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Turns {a:{b:1}, c:[x]} into Stripe's a[b]=1&c[0]=x form encoding.
export function encode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const name = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? encode(item, `${name}[${i}]`, out) : out.append(`${name}[${i}]`, String(item))));
    else if (typeof v === 'object') encode(v, name, out);
    else out.append(name, String(v));
  }
  return out;
}

export async function stripe(env, method, path, params) {
  const key = env.STRIPE_SECRET_KEY || '';
  if (!/^(sk|rk)_(test|live)_/.test(key)) throw new Error('STRIPE_SECRET_KEY is missing or not a secret/restricted key');
  const base = env.STRIPE_API_BASE || 'https://api.stripe.com';
  const url = base + path + (method === 'GET' && params ? '?' + encode(params).toString() : '');
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' ? encode(params || {}).toString() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Stripe error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export function isSessionId(id) {
  return typeof id === 'string' && /^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id);
}
