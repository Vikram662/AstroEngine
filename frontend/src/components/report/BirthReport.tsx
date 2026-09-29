"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import {
  REPORT_ENDPOINTS,
  REPORT_GROUPS,
  runBirthReport,
  type BirthReportRequest,
  type EndpointState,
  type ReportEndpoint,
  type ReportLang,
} from "@/lib/birthReport";
import { getReportText, type ReportLabels } from "@/lib/reportText";
import { DataView } from "./DataView";
import { ReportLabelsContext, useReportLabels } from "./ReportLabelsContext";

type StateMap = Record<string, EndpointState>;
type ByLang = Partial<Record<ReportLang, StateMap>>;

const initialStates = (): StateMap => Object.fromEntries(REPORT_ENDPOINTS.map((e) => [e.id, { status: "queued" } as EndpointState]));

const isSettled = (s: EndpointState | undefined) => s?.status === "done" || s?.status === "error";

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function StatusPill({ state }: { state: EndpointState }) {
  const labels = useReportLabels();
  if (state.status === "done") return <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft">{labels.loaded}</span>;
  if (state.status === "error") return <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">{labels.failed}</span>;
  if (state.status === "loading")
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {state.attempt > 1 ? labels.retry(state.attempt - 1) : labels.loading}
      </span>
    );
  return <span className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-ink-muted">{labels.waiting}</span>;
}

let observerProbe: Promise<boolean> | null = null;

// A real browser fires an observer's first callback straight away; if it stays silent, do not rely on it.
function intersectionObserverWorks(): Promise<boolean> {
  if (!observerProbe) {
    observerProbe = new Promise((resolve) => {
      if (typeof IntersectionObserver === "undefined") return resolve(false);
      const probe = new IntersectionObserver(() => {
        resolve(true);
        probe.disconnect();
      });
      probe.observe(document.body);
      setTimeout(() => resolve(false), 600);
    });
  }
  return observerProbe;
}

function useNearViewport<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void intersectionObserverWorks().then((works) => {
      if (cancelled) return;
      if (!works) {
        // Without a working observer, mount cards gradually instead of all at once.
        timer = setTimeout(() => setNear(true), Math.random() * 2500);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setNear(true);
            observer?.disconnect();
          }
        },
        { rootMargin: "800px 0px" },
      );
      observer.observe(node);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [near]);

  return [ref, near];
}

function EndpointCard({ endpoint, title, state }: { endpoint: ReportEndpoint; title: string; state: EndpointState }) {
  const [ref, near] = useNearViewport<HTMLElement>();
  return (
    <article ref={ref} className="rounded-lg border border-line bg-card" aria-busy={state.status === "loading"}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          <p className="truncate font-mono text-[11px] text-ink-muted">POST {endpoint.path}</p>
        </div>
        <StatusPill state={state} />
      </header>
      <div className="p-4">
        {state.status === "done" && !near && <div className="h-24" aria-hidden="true" />}
        {state.status === "done" && near && state.svg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={svgToDataUri(state.svg)} alt={title} className="mx-auto h-auto max-h-[28rem] w-full max-w-md" />
        )}
        {state.status === "done" && near && !state.svg && <DataView value={state.data} />}
        {state.status === "error" && (
          <p role="alert" className="flex items-start gap-2 text-xs text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </p>
        )}
        {(state.status === "queued" || state.status === "loading") && (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-alt" />
          </div>
        )}
      </div>
    </article>
  );
}

interface BirthReportProps {
  request: BirthReportRequest;
  /** Language the data is fetched in. Changing it re-runs the report; finished languages stay cached. */
  lang: ReportLang;
}

export function BirthReport({ request, lang }: BirthReportProps) {
  const text = useMemo(() => getReportText(lang), [lang]);
  const labels: ReportLabels = text.labels;

  const [byLang, setByLang] = useState<ByLang>({});
  const [fatal, setFatal] = useState<string | null>(null);
  const [rerun, setRerun] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const cache = useRef<{ requestId: number; data: ByLang }>({ requestId: -1, data: {} });
  const scrolledFor = useRef(-1);

  useEffect(() => {
    if (scrolledFor.current !== request.id) {
      scrolledFor.current = request.id;
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [request.id]);

  useEffect(() => {
    if (cache.current.requestId !== request.id) cache.current = { requestId: request.id, data: {} };
    const existing = cache.current.data[lang] ?? initialStates();
    cache.current.data[lang] = existing;

    const controller = new AbortController();
    const skip = new Set(Object.entries(existing).filter(([, s]) => s.status === "done").map(([id]) => id));

    void Promise.resolve().then(() => {
      setFatal(null);
      setByLang({ ...cache.current.data });
      if (skip.size === REPORT_ENDPOINTS.length) return;
      runBirthReport(
        { ...request, lang },
        controller.signal,
        (id, next) => {
          const bucket = cache.current.data[lang];
          if (!bucket || cache.current.requestId !== request.id) return;
          cache.current.data[lang] = { ...bucket, [id]: next };
          setByLang({ ...cache.current.data });
        },
        { skip, onFatal: (message) => setFatal(message) },
      ).catch(() => undefined);
    });

    return () => controller.abort();
  }, [request, lang, rerun]);

  const states: StateMap = byLang[lang] ?? initialStates();
  const values = Object.values(states);
  const finished = values.filter(isSettled).length;
  const failed = values.filter((s) => s.status === "error").length;
  const total = REPORT_ENDPOINTS.length;
  const percent = Math.round((finished / total) * 100);

  const byGroup = useMemo(
    () => REPORT_GROUPS.map((group) => ({ group, endpoints: REPORT_ENDPOINTS.filter((e) => e.group === group.id) })),
    [],
  );

  const retryFailed = () => {
    const bucket = cache.current.data[lang];
    if (bucket) {
      cache.current.data[lang] = Object.fromEntries(
        Object.entries(bucket).map(([id, state]) => [id, state.status === "done" ? state : ({ status: "queued" } as EndpointState)]),
      );
    }
    setRerun((n) => n + 1);
  };

  return (
    <ReportLabelsContext.Provider value={labels}>
      <section ref={rootRef} id="birth-report" lang={lang} aria-labelledby="report-heading" className="border-b border-line bg-surface-alt scroll-mt-4">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{labels.eyebrow}</p>
            <h2 id="report-heading" className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
              {request.name}
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-ink-muted">{labels.dob}</dt>
                <dd className="font-semibold tabular-nums text-ink">{request.dob}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{labels.tob}</dt>
                <dd className="font-semibold tabular-nums text-ink">{request.tob}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{labels.place}</dt>
                <dd className="font-semibold text-ink">{request.cityName}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{labels.coordinates}</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {request.lat.toFixed(4)}, {request.lon.toFixed(4)} (UTC{request.tz >= 0 ? "+" : ""}
                  {request.tz})
                </dd>
              </div>
            </dl>

            {fatal ? (
              <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="flex items-center gap-2 font-semibold">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  {labels.configTitle}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed">{labels.configHelp}</p>
                <p className="mt-2 font-mono text-[11px] text-red-700">{fatal}</p>
              </div>
            ) : (
              <div className="mt-5" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>{labels.progress(finished, total, failed)}</span>
                  <span className="tabular-nums">{percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
                </div>
                {finished === total && failed > 0 && (
                  <button
                    type="button"
                    onClick={retryFailed}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {labels.rerun}
                  </button>
                )}
                <p className="mt-3 text-[11px] text-ink-muted">{labels.langNote}</p>
              </div>
            )}
          </div>

          {!fatal && (
            <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
              <nav aria-label={labels.sections} className="lg:sticky lg:top-4 lg:self-start">
                <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                  {byGroup.map(({ group, endpoints }) => {
                    const done = endpoints.filter((e) => isSettled(states[e.id])).length;
                    return (
                      <li key={group.id} className="shrink-0">
                        <a
                          href={`#report-${group.id}`}
                          className="flex items-center justify-between gap-3 rounded-md border border-line bg-card px-3 py-2 text-xs font-medium text-ink hover:border-accent lg:border-transparent lg:bg-transparent lg:hover:bg-card"
                        >
                          <span>{text.groupText(group.id).title}</span>
                          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                            {done}/{endpoints.length}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="min-w-0 space-y-12">
                {byGroup.map(({ group, endpoints }) => {
                  const copy = text.groupText(group.id);
                  return (
                    <section key={group.id} id={`report-${group.id}`} aria-labelledby={`report-${group.id}-title`} className="scroll-mt-4">
                      <h3 id={`report-${group.id}-title`} className="font-display text-xl font-semibold text-ink">
                        {copy.title}
                      </h3>
                      <p className="mt-1 text-sm text-ink-soft">{copy.blurb}</p>
                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {endpoints.map((endpoint) => (
                          <div key={endpoint.id} className={endpoint.kind === "json" && endpoint.group === "charts" ? "xl:col-span-2" : ""}>
                            <EndpointCard
                              endpoint={endpoint}
                              title={text.endpointTitle(endpoint.id)}
                              state={states[endpoint.id] ?? { status: "queued" }}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}

                <p className="border-t border-line pt-5 text-xs text-ink-muted">{labels.footnote}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </ReportLabelsContext.Provider>
  );
}
