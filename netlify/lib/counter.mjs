// Adds one to the all-time visit total. The store only needs get(key) and set(key, value).
// Netlify Blobs has no atomic "add one", so two visits at the very same instant can occasionally count as one. That is fine for a vanity number.
export async function bump(store, key = 'total') {
  const current = Number(await store.get(key)) || 0;
  const next = current + 1;
  await store.set(key, String(next));
  return next;
}
