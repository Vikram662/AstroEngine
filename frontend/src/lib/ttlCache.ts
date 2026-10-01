// Tiny in-process TTL cache for read-mostly configuration (plans, add-on
// catalogue, feature switches) on hot paths. Entries live per server process;
// admin edits therefore take effect within one TTL.
const store = new Map<string, { value: unknown; expires: number }>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  // Collapse concurrent misses into one DB query.
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = loader()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function clearCache(prefix = "") {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
