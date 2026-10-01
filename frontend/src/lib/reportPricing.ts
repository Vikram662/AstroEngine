import { REPORT_ENDPOINTS } from "@/lib/pdfEngine";

/**
 * Pay-per-report pricing. Each report type has its own price (INR, GST-inclusive,
 * Rs 4 - Rs 12) defined once in REPORT_ENDPOINTS.creditsCost and used everywhere:
 * the dashboard, the calculators page and the public API.
 */
export function reportPriceForPath(path: string): number | null {
  const hit = Object.values(REPORT_ENDPOINTS).find((r) => r.path === path);
  return hit ? hit.creditsCost : null;
}

/** Polling and downloading a report you already paid for never costs anything. */
export function isFreePdfEndpoint(path: string): boolean {
  return /^\/api\/v1\/pdf\/(?:status|download)\/[A-Za-z0-9_-]+$/.test(path) || path === "/api/v1/pdf/jobs";
}

/** Price table for display (docs, pricing page, dashboard). */
export function reportPriceList(): Array<{ type: string; path: string; price: number }> {
  const seen = new Set<string>();
  const list: Array<{ type: string; path: string; price: number }> = [];
  for (const r of Object.values(REPORT_ENDPOINTS)) {
    if (seen.has(r.backendType)) continue;
    seen.add(r.backendType);
    list.push({ type: r.backendType, path: r.path, price: r.creditsCost });
  }
  return list;
}
