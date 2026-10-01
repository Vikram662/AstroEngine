"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
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
    <article ref={ref} className="rounded-xl border border-line bg-card shadow-xs transition hover:border-accent/40" aria-busy={state.status === "loading"}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 bg-surface-alt/40 rounded-t-xl">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <span>{title}</span>
            {endpoint.kind === "svg" && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20">
                Visual Chart
              </span>
            )}
          </h4>
        </div>
        <StatusPill state={state} />
      </header>
      <div className="p-5">
        {state.status === "done" && !near && <div className="h-24" aria-hidden="true" />}
        {state.status === "done" && near && state.svg && (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="flex justify-center p-3 rounded-lg bg-surface border border-line/60">
            <img src={svgToDataUri(state.svg)} alt={title} className="mx-auto h-auto max-h-[30rem] w-full max-w-lg drop-shadow-xs" />
          </div>
        )}
        {state.status === "done" && near && !state.svg && <DataView value={state.data} />}
        {state.status === "error" && (
          <p role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </p>
        )}
        {(state.status === "queued" || state.status === "loading") && (
          <div className="space-y-2.5 py-4" aria-hidden="true">
            <div className="h-3.5 w-3/4 animate-pulse rounded-md bg-surface-alt" />
            <div className="h-3 w-1/2 animate-pulse rounded-md bg-surface-alt" />
            <div className="h-3 w-2/3 animate-pulse rounded-md bg-surface-alt" />
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

  const [activeGroupId, setActiveGroupId] = useState<string>("charts");

  return (
    <ReportLabelsContext.Provider value={labels}>
      <section ref={rootRef} id="birth-report" lang={lang} aria-labelledby="report-heading" className="border-b border-line bg-surface scroll-mt-4 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* User Profile Banner */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft px-2.5 py-1 rounded-full border border-accent/20">
                  {labels.eyebrow}
                </span>
                <h2 id="report-heading" className="mt-2 text-2xl sm:text-3xl font-black text-ink">
                  {request.name}
                </h2>
              </div>
              <div className="text-xs text-ink-soft">
                <span>{labels.progress(finished, total, failed)}</span>
                <div className="mt-1.5 h-2 w-48 sm:w-64 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div className="p-3 rounded-lg bg-surface border border-line/60">
                <dt className="text-ink-muted text-[11px]">{labels.dob}</dt>
                <dd className="font-bold text-ink text-sm mt-0.5">{request.dob}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-line/60">
                <dt className="text-ink-muted text-[11px]">{labels.tob}</dt>
                <dd className="font-bold text-ink text-sm mt-0.5">{request.tob}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-line/60">
                <dt className="text-ink-muted text-[11px]">{labels.place}</dt>
                <dd className="font-bold text-ink text-sm mt-0.5 truncate">{request.cityName}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-line/60">
                <dt className="text-ink-muted text-[11px]">{labels.coordinates}</dt>
                <dd className="font-bold text-ink text-sm mt-0.5">
                  {request.lat.toFixed(2)}°, {request.lon.toFixed(2)}°
                </dd>
              </div>
            </dl>

            {fatal && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
                <p className="flex items-center gap-2 font-bold">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  {labels.configTitle}
                </p>
                <p>{labels.configHelp}</p>
                <p className="font-mono text-[11px] text-red-700">{fatal}</p>
              </div>
            )}
          </div>

          {!fatal && (
            <div className="space-y-6">
              {/* Modern User-Friendly Tab Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-line">
                {byGroup.map(({ group, endpoints }) => {
                  const done = endpoints.filter((e) => isSettled(states[e.id])).length;
                  const isActive = activeGroupId === group.id;
                  const copy = text.groupText(group.id);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroupId(group.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-accent text-white shadow-xs"
                          : "bg-card border border-line text-ink hover:bg-surface-alt hover:text-ink"
                      }`}
                    >
                      <span>{copy.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-white/20 text-white" : "bg-surface-alt text-ink-muted"}`}>
                        {done}/{endpoints.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Content Area */}
              {byGroup
                .filter(({ group }) => group.id === activeGroupId)
                .map(({ group, endpoints }) => {
                  const copy = text.groupText(group.id);
                  return (
                    <div key={group.id} className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-xl font-extrabold text-ink">
                          {copy.title}
                        </h3>
                        <p className="mt-1 text-xs text-ink-soft">{copy.blurb}</p>
                      </div>

                      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                        {endpoints.map((endpoint) => (
                          <div 
                            key={endpoint.id} 
                            className={
                              endpoint.kind === "svg" 
                                ? "col-span-1" 
                                : (endpoint.kind === "json" && endpoint.id.includes("houses") ? "col-span-1 md:col-span-2" : "col-span-1")
                            }
                          >
                            <EndpointCard
                              endpoint={endpoint}
                              title={text.endpointTitle(endpoint.id)}
                              state={states[endpoint.id] ?? { status: "queued" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              <p className="text-xs text-ink-muted text-center pt-4">{labels.footnote}</p>
            </div>
          )}
        </div>
      </section>
    </ReportLabelsContext.Provider>
  );
}
