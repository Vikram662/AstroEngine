export type ReportLang = "hi" | "en";

export interface BirthReportRequest {
  id: number;
  name: string;
  gender: "male" | "female";
  dob: string;
  tob: string;
  cityName: string;
  lat: number;
  lon: number;
  tz: number;
  lang: ReportLang;
}

type DateMode = "birth" | "today";
type Kind = "json" | "svg";

interface ReportContext {
  request: BirthReportRequest;
  today: string;
  year: number;
  age: number;
}

export interface ReportEndpoint {
  id: string;
  group: string;
  title: string;
  path: string;
  kind: Kind;
  dateMode?: DateMode;
  query?: (ctx: ReportContext) => Record<string, string | number>;
}

export interface ReportGroup {
  id: string;
  title: string;
  blurb: string;
}

export const REPORT_GROUPS: ReportGroup[] = [
  { id: "charts", title: "Birth chart and divisional charts", blurb: "Lagna chart, all sixteen vargas, strengths, ashtakvarga, yogas and house predictions." },
  { id: "astronomy", title: "Planetary positions", blurb: "Sidereal positions, house cusps, retrograde status, sun and moon timings, ayanamsa values." },
  { id: "dasha", title: "Dasha periods", blurb: "Vimshottari, Yogini and Jaimini Char dasha timelines for this birth." },
  { id: "dosha", title: "Doshas", blurb: "Manglik, Kaalsarp, Sade Sati, Pitra and Guru Chandal analysis." },
  { id: "panchang", title: "Panchang and muhurat", blurb: "Birth panchang first, then today's choghadiya, hora, bhadra, panchak and muhurats." },
  { id: "horoscope", title: "Horoscope", blurb: "Daily, weekly, monthly and yearly predictions from the moon sign." },
];

const E = (id: string, group: string, title: string, path: string, extra: Partial<ReportEndpoint> = {}): ReportEndpoint => ({
  id,
  group,
  title,
  path,
  kind: "json",
  ...extra,
});

const VARGAS: [string, string][] = [
  ["d1", "D1 Rashi (Lagna)"],
  ["d9", "D9 Navamsha"],
  ["d2", "D2 Hora"],
  ["d3", "D3 Drekkana"],
  ["d4", "D4 Chaturthamsha"],
  ["d7", "D7 Saptamsha"],
  ["d10", "D10 Dashamsha"],
  ["d12", "D12 Dwadashamsha"],
  ["d16", "D16 Shodashamsha"],
  ["d20", "D20 Vimshamsha"],
  ["d24", "D24 Siddhamsha"],
  ["d27", "D27 Bhamsha"],
  ["d30", "D30 Trimshamsha"],
  ["d40", "D40 Khavedamsha"],
  ["d45", "D45 Akshavedamsha"],
  ["d60", "D60 Shashtiamsha"],
];

// Only endpoints whose required input is exactly the form: name, date, time and place of birth.
export const REPORT_ENDPOINTS: ReportEndpoint[] = [
  E("svg-north", "charts", "Lagna chart, North Indian", "/api/v1/parashari/chart/svg", {
    kind: "svg",
    query: () => ({ varga: "D1", chart_style: "NORTH_INDIAN" }),
  }),
  E("svg-south", "charts", "Lagna chart, South Indian", "/api/v1/parashari/chart/svg", {
    kind: "svg",
    query: () => ({ varga: "D1", chart_style: "SOUTH_INDIAN" }),
  }),
  ...VARGAS.map(([code, title]) => E(`parashari-${code}`, "charts", title, `/api/v1/parashari/chart/${code}`)),
  E("bhav-chalit", "charts", "Bhav Chalit", "/api/v1/parashari/chart/bhav-chalit"),
  E("moon-lagna", "charts", "Moon Lagna", "/api/v1/parashari/chart/moon-lagna"),
  E("shadbala", "charts", "Shadbala", "/api/v1/parashari/shadbala/details"),
  E("bhavabala", "charts", "Bhava Bala", "/api/v1/parashari/bhavabala"),
  E("avasthas", "charts", "Avasthas", "/api/v1/parashari/avasthas"),
  E("bhinnashtak", "charts", "Bhinnashtakvarga", "/api/v1/parashari/ashtakvarga/bhinnashtak"),
  E("sarvashtak", "charts", "Sarvashtakvarga", "/api/v1/parashari/ashtakvarga/sarvashtak"),
  E("special-points", "charts", "Special points", "/api/v1/parashari/special-points"),
  E("yogas", "charts", "Yogas", "/api/v1/parashari/yogas/find"),
  E("houses-12", "charts", "Predictions for the 12 houses", "/api/v1/parashari/predictions/12-houses"),

  E("planets", "astronomy", "Planet positions", "/api/v1/core/planets/positions"),
  E("cusps", "astronomy", "House cusps", "/api/v1/core/houses/cusps"),
  E("retrograde", "astronomy", "Retrograde planets", "/api/v1/core/planets/retrograde"),
  E("sun-moon", "astronomy", "Sun and moon timings", "/api/v1/core/sun-moon/timings"),
  E("ayanamsa", "astronomy", "Ayanamsa values", "/api/v1/core/ayanamsa/all"),

  E("dasha-maha", "dasha", "Vimshottari mahadasha", "/api/v1/dasha/vimshottari/mahadasha"),
  E("dasha-current", "dasha", "Current dasha", "/api/v1/dasha/vimshottari/current"),
  E("dasha-yogini", "dasha", "Yogini dasha", "/api/v1/dasha/yogini/complete"),
  E("dasha-char", "dasha", "Jaimini Char dasha", "/api/v1/dasha/char/jaimini"),

  E("manglik", "dosha", "Manglik dosha", "/api/v1/dosha-matching/manglik"),
  E("kalsarpa", "dosha", "Kaalsarp dosha", "/api/v1/dosha-matching/kalsarpa"),
  E("sade-sati", "dosha", "Sade Sati status", "/api/v1/dosha-matching/sade-sati/status", { dateMode: "today" }),
  E("sade-sati-line", "dosha", "Sade Sati timeline", "/api/v1/dosha-matching/sade-sati/timeline"),
  E("pitra", "dosha", "Pitra dosha", "/api/v1/dosha-matching/pitra-dosha"),
  E("guru-chandal", "dosha", "Guru Chandal yoga", "/api/v1/dosha-matching/guru-chandal"),

  E("pan-daily", "panchang", "Birth panchang", "/api/v1/panchang/daily"),
  E("pan-advanced", "panchang", "Advanced birth panchang", "/api/v1/panchang/advanced"),
  E("pan-namakshar", "panchang", "Namakshar", "/api/v1/panchang/namakshar"),
  E("pan-choghadiya", "panchang", "Choghadiya today", "/api/v1/panchang/choghadiya", { dateMode: "today" }),
  E("pan-hora", "panchang", "Hora today", "/api/v1/panchang/hora", { dateMode: "today" }),
  E("pan-bhadra", "panchang", "Bhadra", "/api/v1/panchang/bhadra", { dateMode: "today" }),
  E("pan-panchak", "panchang", "Panchak", "/api/v1/panchang/panchak", { dateMode: "today" }),
  E("pan-month", "panchang", "Monthly calendar", "/api/v1/panchang/monthly-calendar", { dateMode: "today" }),
  E("muh-marriage", "panchang", "Marriage muhurat", "/api/v1/panchang/muhurat/marriage", { dateMode: "today" }),
  E("muh-griha", "panchang", "Griha pravesh muhurat", "/api/v1/panchang/muhurat/griha-pravesh", { dateMode: "today" }),
  E("muh-property", "panchang", "Property and vehicle muhurat", "/api/v1/panchang/muhurat/property-vehicle", { dateMode: "today" }),

  E("hor-daily", "horoscope", "Daily horoscope", "/api/v1/panchang/horoscope/daily", { dateMode: "today" }),
  E("hor-weekly", "horoscope", "Weekly horoscope", "/api/v1/panchang/horoscope/weekly", { dateMode: "today" }),
  E("hor-monthly", "horoscope", "Monthly horoscope", "/api/v1/panchang/horoscope/monthly", { dateMode: "today" }),
  E("hor-yearly", "horoscope", "Yearly horoscope", "/api/v1/panchang/horoscope/yearly", { dateMode: "today" }),
];

export type EndpointState =
  | { status: "queued" }
  | { status: "loading"; attempt: number }
  | { status: "done"; data?: unknown; svg?: string }
  | { status: "error"; message: string };

/** The server itself is not set up to reach the engine; every other call would fail the same way. */
export class ReportConfigError extends Error {}

const CONCURRENCY = 5;
const RETRY_DELAYS_MS = [4000, 9000, 16000];
const RETRYABLE = new Set([429, 502, 503, 504]);

function isoToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function ageFrom(dob: string): number {
  const born = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday = now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return Math.min(120, Math.max(1, age));
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function callEndpoint(
  endpoint: ReportEndpoint,
  ctx: ReportContext,
  signal: AbortSignal,
  onAttempt: (attempt: number) => void,
): Promise<EndpointState> {
  const { request, today } = ctx;
  const payload: Record<string, unknown> = {
    dob: request.dob,
    tob: request.tob,
    lat: request.lat,
    lon: request.lon,
    tz: request.tz,
    lang: request.lang,
  };
  if (endpoint.dateMode === "today") payload.date = today;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    onAttempt(attempt + 1);
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: endpoint.path, payload, queryParams: endpoint.query?.(ctx), method: "POST" }),
        signal,
      });

      if (res.ok) {
        if (endpoint.kind === "svg") {
          const svg = await res.text();
          return svg.includes("<svg") ? { status: "done", svg } : { status: "error", message: "The chart came back empty." };
        }
        const json = (await res.json()) as { data?: unknown };
        return { status: "done", data: json.data ?? json };
      }

      if (RETRYABLE.has(res.status) && attempt < RETRY_DELAYS_MS.length) {
        await wait(RETRY_DELAYS_MS[attempt], signal);
        continue;
      }

      const body = (await res.json().catch(() => ({}))) as { message?: string; detail?: unknown };
      const detail = typeof body.detail === "string" ? body.detail : undefined;
      const message = body.message || detail || `Request failed (${res.status}).`;
      if (res.status === 500 && /not configured/i.test(message)) throw new ReportConfigError(message);
      return { status: "error", message };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (err instanceof ReportConfigError) throw err;
      if (attempt >= RETRY_DELAYS_MS.length) {
        return { status: "error", message: err instanceof Error ? err.message : "Network error." };
      }
      await wait(RETRY_DELAYS_MS[attempt], signal);
    }
  }
  return { status: "error", message: "Request failed." };
}

export interface RunOptions {
  skip?: ReadonlySet<string>;
  onFatal?: (message: string) => void;
}

// Runs every endpoint with a small worker pool so the page fills in progressively and stays under the rate limit.
export async function runBirthReport(
  request: BirthReportRequest,
  signal: AbortSignal,
  onUpdate: (id: string, state: EndpointState) => void,
  options: RunOptions = {},
): Promise<void> {
  const ctx: ReportContext = { request, today: isoToday(), year: new Date().getFullYear(), age: ageFrom(request.dob) };
  const queue = REPORT_ENDPOINTS.filter((endpoint) => !options.skip?.has(endpoint.id));

  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      if (signal.aborted) return;
      const endpoint = next;
      onUpdate(endpoint.id, { status: "loading", attempt: 1 });
      try {
        const result = await callEndpoint(endpoint, ctx, signal, (attempt) => onUpdate(endpoint.id, { status: "loading", attempt }));
        onUpdate(endpoint.id, result);
      } catch (err) {
        if (err instanceof ReportConfigError) {
          queue.length = 0;
          options.onFatal?.(err.message);
        }
        return;
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
