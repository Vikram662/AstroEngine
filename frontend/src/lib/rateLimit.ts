// Small in-memory sliding-window limiter. Per-process only: behind several
// instances the effective limit is multiplied, so use a shared store
// (Redis) if you scale horizontally.
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 50_000
  ) {}

  /** Records a hit and returns true if the caller is over the limit. */
  hit(key: string): boolean {
    const now = Date.now();
    this.sweep(now);
    const recent = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return true;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return false;
  }

  /** Read-only check (does not record a hit). */
  isLimited(key: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    return recent.length >= this.limit;
  }

  reset(key: string) {
    this.hits.delete(key);
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs && this.hits.size < this.maxKeys) return;
    this.lastSweep = now;
    for (const [k, ts] of this.hits) {
      if (!ts.some((t) => now - t < this.windowMs)) this.hits.delete(k);
    }
    if (this.hits.size >= this.maxKeys) this.hits.clear(); // hard cap: never grow unbounded
  }
}
